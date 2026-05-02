import asyncio
import httpx
import threading

async def run_investigate():
    async with httpx.AsyncClient(timeout=120) as client:
        print('Starting investigate...')
        res = await client.post('http://localhost:8000/api/investigate-influencer', json={'influencer_name': 'test', 'specific_query': 'test'})
        print('Investigate done:', res.status_code)

async def run_sse():
    async with httpx.AsyncClient(timeout=120) as client:
        print('Starting SSE...')
        async with client.stream('GET', 'http://localhost:8000/api/investigate-logs') as response:
            async for line in response.aiter_lines():
                if line.startswith('data:'):
                    print('SSE:', line)

async def main():
    task1 = asyncio.create_task(run_sse())
    await asyncio.sleep(1)
    task2 = asyncio.create_task(run_investigate())
    await task2
    task1.cancel()

asyncio.run(main())
