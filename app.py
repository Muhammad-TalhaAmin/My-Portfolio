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
import json
from dotenv import load_dotenv
import requests
from flask import send_from_directory
from services.chatbot import service as chatbot
from services.chatbot import router as knowledge_router

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
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    app.config["TURNSTILE_SECRET_KEY"] = os.getenv("TURNSTILE_SECRET_KEY")
    app.config["ADMIN_EMAIL"] = os.getenv("ADMIN_EMAIL")
    app.config["ADMIN_PASSWORD"] = os.getenv("ADMIN_PASSWORD")
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"],
    )
    app.config["SQLALCHEMY_DATABASE_URI"] = (
    os.getenv("DATABASE_URI")
    or f"sqlite:///{os.path.join(app.instance_path, "portfolio.db")}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    os.makedirs(app.instance_path, exist_ok=True)
    db.init_app(app)
    migrate.init_app(app, db)
    with app.app_context():
        db.create_all()
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
    @app.route("/.well-known/security.txt")
    def security():
        return send_from_directory(".well-known", "security.txt")
    @app.route("/robots.txt")
    def robots():
        return send_from_directory(app.static_folder, "robots.txt")
    @app.route("/sitemap.xml")
    def sitemap():
        return send_from_directory(app.static_folder, "sitemap.xml")
    @app.route("/humans.txt")
    def humans():
        return send_from_directory(app.static_folder, "humans.txt")
    @app.route("/manifest.webmanifest")
    def manifest():
        return send_from_directory(app.static_folder, "manifest.webmanifest")
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
    @app.errorhandler(404)
    def not_found(error):
        return render_template("404.html"), 404

    @app.errorhandler(500)
    def server_error(error):
        return render_template("500.html"), 500
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

    # Chatbot route (Python service -> Groq)
    @app.route("/api/chat", methods=["POST"])
    def chat_proxy():
        payload = request.get_json(silent=True)
        app.logger.info("POST /api/chat received")

        if not payload or "message" not in payload:
            app.logger.error("Invalid /api/chat body")
            return jsonify({"error": "Invalid request body"}), 400

        message = payload.get("message")
        history = payload.get("history", [])

        validation_error = chatbot.validate_message(message)
        if validation_error:
            return jsonify({"error": validation_error}), 400

        trimmed_message = message.strip()
        safe_history = chatbot.sanitize_history(history)
        wants_stream = (
            request.args.get("stream") == "1"
            or request.headers.get("Accept") == "text/event-stream"
        )

        context = ""
        try:
            context = knowledge_router.build_context(trimmed_message, safe_history)
        except Exception:
            # Missing/unreadable knowledge files shouldn't crash the request —
            # fall back to the model's general knowledge only.
            app.logger.exception("Knowledge load error")

        system_prompt = chatbot.build_system_prompt(context)

        # Default JSON path — preserves the original response contract for any
        # caller that doesn't explicitly ask for a stream.
        if not wants_stream:
            try:
                reply = chatbot.ask_ai(system_prompt, trimmed_message, safe_history)
                return jsonify({"reply": reply})
            except chatbot.ChatbotError as err:
                app.logger.exception("Chat error: %s", err.message)
                return jsonify({"error": err.message}), 502
            except Exception:
                app.logger.exception("Chat error")
                return jsonify({"error": chatbot.DEFAULT_ERROR_MESSAGE}), 502

        # Streaming (SSE) path — tokens are forwarded to the browser so the
        # chat widget can render them as they arrive.
        def stream():
            try:
                for token in chatbot.stream_ai(
                    system_prompt, trimmed_message, safe_history
                ):
                    yield f"data: {json.dumps({'token': token})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            except chatbot.ChatbotError as err:
                app.logger.exception(
                    "Streaming error: %s", err.message, exc_info=err.__cause__
                )
                yield f"data: {json.dumps({'error': err.message})}\n\n"
            except Exception:
                app.logger.exception("Streaming error")
                yield f"data: {json.dumps({'error': chatbot.DEFAULT_ERROR_MESSAGE})}\n\n"

        return Response(
            stream(),
            mimetype="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    return app

app = create_app()

if __name__ == "__main__":
    app.run()
    