# Creative Career Constellation

This project provides a simple web application that helps children explore career interests. Users chat with an AI assistant about activities they enjoy. The assistant replies with short suggestions for careers and skills in JSON format. Each suggestion becomes a node in a constellation visualised with D3.js.

When the page loads, a root node labelled **"Interest"** is created automatically. Each interest you add becomes a node connected to this root, forming a visual constellation of career ideas.

Static assets live in `static/`. The main logic for building the graph is in `static/js/constellation.js`.

## Running
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Set either `HF_API_TOKEN` for the free Hugging Face Inference API (and
   optionally `HF_MODEL` to choose a model) or `OPENAI_API_KEY` if you want to
   use OpenAI's API instead.
3. Start the development server:
   ```bash
   python app.py
   ```
4. Open `http://localhost:5000` in your browser.

If no API token is provided, the app falls back to basic demo suggestions.

## Development Setup
Install dependencies and run tests:

```bash
pip install -r requirements.txt
pytest
```
