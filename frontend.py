import requests

def send_message(base_url: str, message: str) -> str:
    resp = requests.post(f"{base_url}/chat", json={"message": message})
    resp.raise_for_status()
    data = resp.json()
    return data.get('response', '')

if __name__ == '__main__':
    import sys
    base = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5000'
    print(send_message(base, 'Hello'))
