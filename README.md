# Creative Career Constellation

A simple browser game where kids explore career interests. Type an activity you enjoy, and the page suggests careers and skills, adding them as nodes to a D3.js "constellation" graph.

This repository now ships as a static website. No Python or servers required.

## How to play (static)
- Open `index.html` in your browser, or host the folder with any static host.
- Click "Start exploring", type an activity (e.g., "I like drawing"), and watch nodes appear.

Files:
- `index.html`: Landing page
- `constellation.html`: Game page
- `static/js/constellation.js`: Client-only logic (D3 rendering + simple suggestion engine)
- `static/`: Static assets

## Run locally
Option 1: Open from disk
- Double-click `index.html` or open it via your browser's File → Open.

Option 2: Quick local static server
```bash
# any of these works
python3 -m http.server 8000          # if Python is available
npx serve . --listen 8000            # if Node is available
# then visit http://localhost:8000/
```

## Deploy
You can deploy to any static host (GitHub Pages, Netlify, Vercel, S3, Cloudflare Pages).
- For GitHub Pages, push to a repo and enable Pages with the root as the site. Entry file is `index.html`.

## About suggestions
Previously, the app proxied to OpenAI/Hugging Face via Flask. To make the site static, `static/js/constellation.js` now includes a tiny in-browser rule-based suggester. You can expand the rules or integrate a hosted API if desired.

## Legacy backend (optional)
The old Flask app remains in the repo (`app.py`, `templates/`). You can ignore it for static hosting. If you want to run it:
```bash
pip install -r requirements.txt
python app.py
```
Then visit `http://localhost:5000/`.
