import json,os,secrets
from urllib import error as urllib_error
from urllib import request as urllib_request
import subprocess,atexit,time
from flask import Flask, jsonify, render_template, request,flash, redirect, url_for
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField
from wtforms.validators import DataRequired, Email, Length
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
from flask_talisman import Talisman

logging.basicConfig(
    filename="portfolio.log",
    level=logging.INFO
)

class ContactForm(FlaskForm):
    name = StringField("Name", validators=[DataRequired(message="Please Enter Your Name"),Length(max=30,message="Name must be less than 30 characters")])
    email = StringField("Email",validators=[DataRequired(),Email(message="Please Enter a valid Email"),Length(max=40,message="Email must be less than 40 characters")])
    subject = StringField("Subject",validators=[DataRequired(message="Please  Enter Subject"),Length(max=100,message="Subject must be less than 100 characters")])
    message = TextAreaField("Message",validators=[DataRequired(message="Please Enter Your Message"),Length(max=250,min=10,message="Message must be between 10 and 250 characters")])

def create_app() -> Flask:
    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.config["CHATBOT_API_URL"] = os.getenv(
        "CHATBOT_API_URL", "http://localhost:3001/api/chat"
    )
    app.config["SECRET_KEY"] = secrets.token_hex(16)  # For CSRF protection in forms
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"],
    )
    limiter.init_app(app)
    Talisman(app, force_https= not app.debug)

    # Keep route registration simple now; this structure is ready for future blueprints
    # (e.g., auth/database modules) without changing current behavior.
    @app.route("/")
    @app.route("/index.html")
    def home():
        return render_template("index.html")

    @app.route("/about")
    @app.route("/about.html")
    def about():
        return render_template("about.html")

    @app.route("/projects")
    @app.route("/projects.html")
    def projects():
        return render_template("projects.html")
    @app.route("/contact.html",methods=["GET", "POST"])
    @app.route("/contact", methods=["GET", "POST"])
    @limiter.limit("5 per minute",methods=["POST"])
    def contact():
        form=ContactForm()
        if form.validate_on_submit():

            name = form.name.data
            email = form.email.data
            subject = form.subject.data
            message = form.message.data

            print(name)
            print(email)
            print(subject)
            print(message)

            return redirect(url_for("contact",success=1))

        return render_template("contact.html",form=form)
        
    @app.route("/api/chat", methods=["POST"])
    def chat_proxy():
        payload = request.get_json(silent=True)
        app.logger.info("POST /api/chat received")
        print("[chat_proxy] POST /api/chat received", flush=True)
        if not payload or "message" not in payload:
            app.logger.error("Invalid /api/chat body: %s", payload)
            print(f"[chat_proxy] Invalid body: {payload}", flush=True)
            return jsonify({"error": "Invalid request body"}), 400

        data = json.dumps({"message": payload["message"]}).encode("utf-8")
        proxy_request = urllib_request.Request(
            app.config["CHATBOT_API_URL"],
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        proxyless_opener = urllib_request.build_opener(urllib_request.ProxyHandler({}))

        try:
            with proxyless_opener.open(proxy_request, timeout=30) as response:
                raw_body = response.read().decode("utf-8")
                status_code = response.getcode()
        except urllib_error.HTTPError as err:
            upstream_body = err.read().decode("utf-8", errors="replace")
            app.logger.exception(
                "Chatbot upstream HTTP error: status=%s reason=%s body=%s",
                err.code,
                err.reason,
                upstream_body,
            )
            print(
                f"[chat_proxy] Upstream HTTPError: status={err.code} reason={err.reason} body={upstream_body}",
                flush=True,
            )
            return jsonify({"error": f"Chatbot upstream error: {err.code}"}), 502
        except urllib_error.URLError as err:
            app.logger.exception("Chatbot service unavailable: %r", err.reason)
            print(f"[chat_proxy] URLError: {err!r}", flush=True)
            return jsonify({"error": "Chatbot service unavailable"}), 502

        try:
            response_payload = json.loads(raw_body)
        except json.JSONDecodeError:
            app.logger.exception("Invalid JSON from chatbot service: %s", raw_body)
            print(f"[chat_proxy] JSONDecodeError. raw_body={raw_body}", flush=True)
            return jsonify({"error": "Invalid response from chatbot service"}), 502

        return jsonify(response_payload), status_code

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
    print("Before App.run")
    app.run(debug=True)
    print("After App.run")