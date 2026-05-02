import os
import asyncio
import websockets
import json
import urllib.parse
from azure_config import normalize_azure_endpoint

realtime_endpoint = (os.environ.get("AZURE_OPENAI_REALTIME_ENDPOINT") or "").strip().rstrip("/")
if not realtime_endpoint:
    raw_base = os.environ.get("AZURE_OPENAI_ENDPOINT") or os.environ.get("AZURE_API_BASE") or ""
    normalized_base = normalize_azure_endpoint(raw_base)
    realtime_endpoint = f"{normalized_base}/openai/realtime" if normalized_base else ""

if realtime_endpoint.startswith("https://"):
    endpoint = f"wss://{realtime_endpoint.removeprefix('https://')}"
elif realtime_endpoint.startswith("http://"):
    endpoint = f"ws://{realtime_endpoint.removeprefix('http://')}"
else:
    endpoint = realtime_endpoint

api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-10-01-preview")
deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-realtime")
api_key = os.environ.get("AZURE_OPENAI_API_KEY") or os.environ.get("AZURE_API_KEY")

if not endpoint or not api_key:
    raise RuntimeError(
        "Missing Azure realtime config. Set AZURE_OPENAI_REALTIME_ENDPOINT (or AZURE_OPENAI_ENDPOINT/AZURE_API_BASE) "
        "and AZURE_OPENAI_API_KEY (or AZURE_API_KEY)."
    )

url = f"{endpoint}?api-version={api_version}&deployment={deployment}"

async def test_realtime():
    headers = {
        "api-key": api_key
    }
    
    print(f"Connecting to {url}...")
    try:
        async with websockets.connect(url, additional_headers=headers) as websocket:
            print("Connected! Sending a session update...")
            
            # Send an initial event to verify interaction
            init_event = {
                "type": "session.update",
                "session": {
                    "instructions": "You are a helpful assistant. Reply with exactly 'Yes, I am working'."
                }
            }
            await websocket.send(json.dumps(init_event))
            
            msg_event = {
                "type": "conversation.item.create",
                "item": {
                    "type": "message",
                    "role": "user",
                    "content": [{"type": "input_text", "text": "Are you functional?"}]
                }
            }
            await websocket.send(json.dumps(msg_event))
            
            commit_event = {
                "type": "response.create"
            }
            await websocket.send(json.dumps(commit_event))
            
            print("Events sent. Waiting for response...")
            
            # Listen for a few events
            for _ in range(15):
                response = await websocket.recv()
                data = json.loads(response)
                print(f"Received event: {data['type']}")
                if data['type'] == 'response.text.done':
                    print(f"\n=> AI Response text: {data['text']}\n")
                    break
                elif data['type'] == 'error':
                    print(f"\n=> Error: {data['error']}\n")
                    break
                    
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_realtime())
