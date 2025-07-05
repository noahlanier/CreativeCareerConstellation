import os

import openai
from flask import Blueprint, jsonify, render_template, request

bp = Blueprint("routes", __name__)

SYSTEM_PROMPT = (
    "You are a friendly vocational-guidance assistant. "
    "When the child says something they enjoy, "
    "reply with encouraging text AND, in back-ticks, "
    "a chain of up to three levels of related nodes for our constellation graph. "
    "Return no markdown other than the back-ticked node labels."
)


@bp.route("/")
def index():
    return render_template("index.html")


@bp.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True) or {}
    messages = data.get("messages", [])
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return jsonify({"reply": "OpenAI API key missing"})
    openai.api_key = api_key
    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
            max_tokens=200,
        )
        reply = resp.choices[0].message["content"]
        return jsonify({"reply": reply})
    except Exception as e:  # pragma: no cover - network errors
        return jsonify({"error": str(e)}), 502
