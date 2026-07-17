import json
import os
from urllib import error as urllib_error
from urllib import request as urllib_request

from flask import Flask, jsonify, render_template, request


def create_app() -> Flask:
    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.config["CHATBOT_API_URL"] = os.getenv(
        "CHATBOT_API_URL", "http://localhost:3001/api/chat"
    )

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

    @app.route("/contact")
    @app.route("/contact.html")
    def contact():
        return render_template("contact.html")

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


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
