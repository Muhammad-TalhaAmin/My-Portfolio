from datetime import datetime,timezone
from flask import Flask, app, jsonify, render_template, request, redirect, url_for, Blueprint, Response, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField
from wtforms.validators import DataRequired, Email, Length
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
from flask_talisman import Talisman
import os
from dotenv import load_dotenv
import subprocess
import atexit
import time
import requests
logging.basicConfig(
    filename="portfolio.log",
    level=logging.INFO
)
load_dotenv()
db=SQLAlchemy()
migrate=Migrate()
class ContactMessage(db.Model):
    __tablename__ = "contact_messages"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(30), nullable=False)
    email = db.Column(db.String(40), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    message = db.Column(db.String(250), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda:datetime.now(timezone.utc))
class ContactForm(FlaskForm):
    name = StringField("Name", validators=[DataRequired(message="Please Enter Your Name"), Length(max=30, message="Name must be less than 30 characters")])
    email = StringField("Email", validators=[DataRequired(), Email(message="Please Enter a valid Email"), Length(max=40, message="Email must be less than 40 characters")])
    subject = StringField("Subject", validators=[DataRequired(message="Please Enter Subject"), Length(max=100, message="Subject must be less than 100 characters")])
    message = TextAreaField("Message", validators=[DataRequired(message="Please Enter Your Message"), Length(max=250, min=10, message="Message must be between 10 and 250 characters")])
def create_app() -> Flask:
    app = Flask(__name__, template_folder="templates", static_folder="static",instance_relative_config=True)
    app.config["CHATBOT_API_URL"] = os.getenv(
        "CHATBOT_API_URL", "http://localhost:3001/api/chat"
    )
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    app.config["TURNSTILE_SECRET_KEY"] = os.getenv("TURNSTILE_SECRET_KEY")
    app.config["ADMIN_EMAIL"] = os.getenv("ADMIN_EMAIL")
    app.config["ADMIN_PASSWORD"] = os.getenv("ADMIN_PASSWORD")
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"],
    )
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(app.instance_path, 'portfolio.db')}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    os.makedirs(app.instance_path, exist_ok=True)
    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)
    csp = {
    "default-src": ["'self'"],
    "script-src": [
        "'self'",
        "'unsafe-inline'",
        "https://challenges.cloudflare.com",
    ],
    "style-src": [
        "'self'",
        "'unsafe-inline'",
    ],
    "frame-src": [
        "'self'",
        "https://challenges.cloudflare.com",
    ],
    "connect-src": [
        "'self'",
        "https://challenges.cloudflare.com",
    ],
    "img-src": [
        "'self'",
        "data:",
        "https:",
    ],
    "font-src": [
        "'self'",
        "data:",
    ],
    }
    Talisman(
        app,
        force_https = os.getenv("FLASK_ENV") == "production",
        content_security_policy=csp,
    )

    # Home route
    @app.route("/")
    @app.route("/index.html")
    def home():
        return render_template("index.html")

    # About route
    @app.route("/about")
    @app.route("/about.html")
    def about():
        return render_template("about.html")

    # Projects route
    @app.route("/projects")
    @app.route("/projects.html")
    def projects():
        return render_template("projects.html")

    # Contact route with rate limiting
    @app.route("/contact", methods=["GET", "POST"])
    @app.route("/contact.html", methods=["GET", "POST"])
    @limiter.limit("5 per minute", methods=["POST"])
    def contact():
        form = ContactForm()

        if form.validate_on_submit():

            
            # Get Turnstile token
            token = request.form.get("cf-turnstile-response")
            
            # Verify with Cloudflare
            response = requests.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={
                    "secret": app.config["TURNSTILE_SECRET_KEY"],
                    "response": token,
                },
            )

     
            result = response.json()
            if not result.get("success"):
                form.message.errors.append("Turnstile verification failed. Please try again.")
                return render_template("contact.html", form=form)

            contact=ContactMessage(
                name=form.name.data,
                email=form.email.data,
                subject=form.subject.data,
                message=form.message.data
            )
            db.session.add(contact)
            db.session.commit()
            app.logger.info(
                "Contact form submitted - Name: %s, Email: %s",
                form.name.data,
                form.email.data,
            )

            return redirect(url_for("contact", success=1))

        return render_template("contact.html", form=form)
    # Admin login
    @app.route("/admin/login", methods=["GET", "POST"])
    def admin_login():
        if session.get("admin_logged_in"):
            return redirect(url_for("admin_messages"))

        error = None
        if request.method == "POST":
            email = request.form.get("email", "").strip()
            password = request.form.get("password", "")
            if email == app.config["ADMIN_EMAIL"] and password == app.config["ADMIN_PASSWORD"]:
                session["admin_logged_in"] = True
                session.permanent = True
                return redirect(url_for("admin_messages"))
            else:
                error = "Invalid email or password."
        return render_template("admin_login.html", error=error)

    # Admin messages dashboard
    @app.route("/admin/messages")
    def admin_messages():
        if not session.get("admin_logged_in"):
            return redirect(url_for("admin_login"))

        messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
        return render_template("admin_messages.html", messages=messages)

    # Admin logout
    @app.route("/admin/logout")
    def admin_logout():
        session.pop("admin_logged_in", None)
        return redirect(url_for("admin_login"))

    # Chatbot proxy route
    @app.route("/api/chat", methods=["POST"])
    def chat_proxy():
        payload = request.get_json(silent=True)
        app.logger.info("POST /api/chat received")

        if not payload or "message" not in payload:
            app.logger.error("Invalid /api/chat body: %s", payload)
            return jsonify({"error": "Invalid request body"}), 400

        upstream_payload = {
            "message": payload["message"],
            "history": payload.get("history", []),
        }

        # Ask the Node service to stream the reply back as SSE so the
        # browser can render it token-by-token instead of waiting for the
        # full response to be generated.
        try:
            upstream = requests.post(
                app.config["CHATBOT_API_URL"],
                json=upstream_payload,
                params={"stream": "1"},
                headers={"Accept": "text/event-stream"},
                stream=True,
                timeout=(5, 60),
            )
        except requests.exceptions.RequestException as err:
            app.logger.exception("Chatbot service unavailable: %r", err)
            return jsonify({"error": "Chatbot service unavailable"}), 502

        if upstream.status_code >= 400:
            app.logger.error(
                "Chatbot upstream error: status=%s", upstream.status_code
            )
            try:
                error_body = upstream.json()
            except ValueError:
                error_body = {"error": f"Chatbot upstream error: {upstream.status_code}"}
            upstream.close()
            return jsonify(error_body), upstream.status_code

        def relay():
            try:
                for chunk in upstream.iter_content(chunk_size=None):
                    if chunk:
                        yield chunk
            except requests.exceptions.RequestException as err:
                app.logger.exception("Streaming interrupted: %r", err)
            finally:
                upstream.close()

        return Response(
            relay(),
            mimetype="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    return app
chatbot_process = subprocess.Popen(
    ["npm", "start"],
    cwd="chatbot",
    shell=True
)

# Give the chatbot a few seconds to start
time.sleep(3)

# Stop the chatbot when Flask exits
atexit.register(chatbot_process.terminate)
app = create_app()

if __name__ == "__main__":
    app.run()
    