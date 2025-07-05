import os
import sys
from types import SimpleNamespace
import pytest

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
import frontend
from app import app

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

class MockResponse:
    def __init__(self, data):
        self._data = data
    def raise_for_status(self):
        pass
    def json(self):
        return self._data

def test_frontend_integration(client, monkeypatch):
    def fake_post(url, json):
        resp = client.post('/chat', json=json)
        return MockResponse(resp.get_json())
    monkeypatch.setattr(frontend.requests, 'post', fake_post)
    resp = frontend.send_message('http://localhost:5000', 'hello')
    assert resp == 'You said: hello'
