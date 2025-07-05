import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from types import SimpleNamespace

import openai
import pytest

from cccapp import create_app


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setattr(
        openai.ChatCompletion,
        "create",
        lambda **kwargs: SimpleNamespace(
            choices=[SimpleNamespace(message={"content": "hi"})]
        ),
    )
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_index(client):
    resp = client.get("/")
    assert resp.status_code == 200


def test_chat(client):
    resp = client.post("/api/chat", json={"messages": []})
    assert resp.status_code == 200
    assert resp.get_json() == {"reply": "hi"}
