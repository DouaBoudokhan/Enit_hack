"""
Simplified Instagram scraper to guarantee a working screenshot.
Uses a direct Playwright call without complex stealth or loop nesting.
"""

import asyncio
import base64
import logging
import os
from pathlib import Path
import concurrent.futures

logger = logging.getLogger(__name__)

async def _capture_async(url: str, session_id: str = None) -> bytes:
    from playwright.async_api import async_playwright
    
    is_tiktok = "tiktok.com" in url
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)
        # Use mobile-like viewport for better Reels/TikTok capture
        context = await browser.new_context(
            viewport={"width": 450, "height": 900},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1"
        )
        
        # Add session cookie if available (Instagram only)
        if session_id and "instagram.com" in url:
            await context.add_cookies([{
                "name": "sessionid",
                "value": session_id,
                "domain": ".instagram.com",
                "path": "/",
                "httpOnly": True,
                "secure": True
            }])
            
        page = await context.new_page()
        
        # Try to navigate
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            # Give it time to load dynamic content
            if is_tiktok:
                # TikTok often has a modal/overlay
                await page.wait_for_timeout(8000)
            else:
                await page.wait_for_timeout(5000)
        except Exception as e:
            logger.error(f"Navigation failed: {e}")
            
        # Take the screenshot
        screenshot = await page.screenshot(type="png", full_page=False)
        
        # Save debug file
        with open("debug_last_capture.png", "wb") as f:
            f.write(screenshot)
            
        await browser.close()
        return screenshot

def capture_instagram_post(url: str) -> str:
    session_id = os.environ.get("INSTAGRAM_SESSION_ID")
    
    # We use a ThreadPoolExecutor to run the async code in a clean loop
    # This avoids "loop already running" errors from FastAPI/Uvicorn
    with concurrent.futures.ThreadPoolExecutor() as executor:
        def task():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(_capture_async(url, session_id))
            finally:
                loop.close()
        
        png_bytes = executor.submit(task).result()
        
    return base64.b64encode(png_bytes).decode("utf-8")
