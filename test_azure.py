import os
import requests
import json
from azure_config import normalize_azure_endpoint

api_key = os.environ.get("AZURE_OPENAI_API_KEY") or os.environ.get("AZURE_API_KEY")
raw_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT") or os.environ.get("AZURE_API_BASE")
deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-realtime")
api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-10-01-preview")

if not raw_endpoint or not api_key:
    raise RuntimeError(
        "Missing Azure config. Set AZURE_OPENAI_ENDPOINT (or AZURE_API_BASE) "
        "and AZURE_OPENAI_API_KEY (or AZURE_API_KEY)."
    )

endpoint = f"{normalize_azure_endpoint(raw_endpoint)}/openai/deployments/{deployment}/chat/completions?api-version={api_version}"

headers = {
    "Content-Type": "application/json",
    "api-key": api_key
}

payload = {
    "messages": [
        {"role": "user", "content": "Hello, are you functional?"}
    ],
    "max_tokens": 10
}

try:
    print("Testing Chat Completions endpoint...")
    response = requests.post(endpoint, headers=headers, json=payload)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
