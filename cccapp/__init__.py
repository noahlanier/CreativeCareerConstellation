from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS


def create_app():
    load_dotenv()
    app = Flask(__name__, template_folder="../templates", static_folder="../static")
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from .routes import bp

    app.register_blueprint(bp)
    return app
