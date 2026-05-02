import asyncio
import websockets
import os
import json
from dotenv import load_dotenv

load_dotenv('frontend/.env')

async def test():
    ws_url = f'{os.getenv("VITE_AZURE_REALTIME_ENDPOINT")}?api-version={os.getenv("VITE_AZURE_REALTIME_API_VERSION")}&deployment={os.getenv("VITE_AZURE_REALTIME_DEPLOYMENT")}&api-key={os.getenv("VITE_AZURE_REALTIME_API_KEY")}'
    print('Connecting to', ws_url)
    async with websockets.connect(ws_url) as ws:
        print('Connected!')
        await ws.send(json.dumps({'type': 'session.update', 'session': {'instructions': 'Say hi'}}))
        res = await ws.recv()
        print('Response:', res)

asyncio.run(test())
