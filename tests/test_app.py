import os
import sys
import pytest

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from app import app

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

def test_chat_endpoint(client):
    response = client.post('/chat', json={'message': 'hi'})
    assert response.status_code == 200
    assert response.get_json() == {'response': 'You said: hi'}
