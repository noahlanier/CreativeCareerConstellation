import os
from flask import Flask, request, jsonify, render_template
import json
import requests

try:
    import openai
except Exception:
    openai = None

app = Flask(__name__)

# Initialize APIs if available
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
if openai and OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

HF_API_TOKEN = os.environ.get('HF_API_TOKEN')
HF_MODEL = os.environ.get('HF_MODEL', 'google/flan-t5-small')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/constellation')
def constellation_page():
    return render_template('constellation.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    """Endpoint to proxy conversation to an AI service."""
    data = request.get_json(force=True)
    messages = data.get('messages', [])

    if openai and OPENAI_API_KEY:
        system_prompt = (
            "You are a friendly career advisor helping children create a"
            " 'creative career constellation'. When a child shares an interest,"
            " respond in JSON with keys 'careers', 'skills', and 'question'."
            " Keep lists short."
        )
        openai_messages = [{"role": "system", "content": system_prompt}] + messages
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=openai_messages,
                max_tokens=200,
            )
            reply_content = response.choices[0].message["content"]
            return jsonify({"reply": reply_content})
        except Exception as e:
            return jsonify({"error": f"Error contacting OpenAI: {e}"}), 502

    elif HF_API_TOKEN:
        prompt = (
            "You are a friendly career advisor helping children create a "
            "'creative career constellation'. When a child shares an interest, "
            "respond in JSON with keys 'careers', 'skills', and 'question'. "
            "Keep lists short.\n"
        )
        for m in messages:
            role = m.get('role')
            content = m.get('content')
            prompt += f"{role}: {content}\n"
        headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
        try:
            r = requests.post(
                f"https://api-inference.huggingface.co/models/{HF_MODEL}",
                headers=headers,
                json={"inputs": prompt},
                timeout=30,
            )
            if r.status_code == 200:
                data = r.json()
                if isinstance(data, list) and data:
                    reply_content = data[0].get("generated_text", "")
                else:
                    reply_content = json.dumps(data)
                return jsonify({"reply": reply_content})
            else:
                return jsonify({"error": f"HuggingFace API error {r.status_code}"}), 502
        except Exception as e:
            return jsonify({"error": f"Error contacting HuggingFace: {e}"}), 502

    else:
        # Offline fallback
        reply_content = json.dumps({
            "careers": ["Filmmaker", "Actor"],
            "skills": ["camera operation", "storytelling"],
            "question": "What else do you enjoy?"
        })
        return jsonify({"reply": reply_content})



if __name__ == '__main__':
    app.run(debug=True)
