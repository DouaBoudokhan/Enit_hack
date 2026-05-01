import asyncio
import logging
import sys
from pathlib import Path

# Add current dir to sys.path
sys.path.append(str(Path(__file__).parent))

from scraper import capture_instagram_post

logging.basicConfig(level=logging.INFO)

async def test():
    url = "https://www.instagram.com/reel/DWzMQt6jHay/"
    print(f"Testing scraper with URL: {url}")
    try:
        res = capture_instagram_post(url)
        print(f"Success! Base64 length: {len(res)}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test())
