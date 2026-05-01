"""
Scraper module — the only place where Apify is called.
Called by the top-level router before any crew is initialized.
"""

import json
import os
import re
import time
from pathlib import Path

import requests
from openai import AzureOpenAI

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_FILE = BASE_DIR / "data" / "influencers_scraped.json"

APIFY_RUN_URL = "https://api.apify.com/v2/acts/apify~instagram-scraper/runs"
APIFY_POLL_INTERVAL = 5  # seconds


def _get_azure_client() -> AzureOpenAI:
    """Return an AzureOpenAI client configured from environment variables."""
    return AzureOpenAI(
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        api_key=os.environ["AZURE_OPENAI_API_KEY"],
        api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    )


def _load_data() -> list[dict]:
    """Load the influencer data file."""
    if not DATA_FILE.exists():
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


def _save_data(data: list[dict]) -> None:
    """Save the influencer data file."""
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _find_existing(data: list[dict], handle: str) -> dict | None:
    """Check if the handle already exists in the scraped data."""
    handle_lower = handle.lower().strip().lstrip("@")
    for record in data:
        if record.get("handle", "").lower() == handle_lower:
            return record
    return None


def _extract_handle_from_url(url: str) -> str:
    """Extract Instagram handle from a profile URL."""
    # Match patterns like instagram.com/username or instagram.com/p/username
    match = re.search(r"instagram\.com/([A-Za-z0-9_.]+)", url)
    if match:
        return match.group(1)
    # Fallback: last path segment
    parts = url.rstrip("/").split("/")
    return parts[-1] if parts else url


def _extract_post_id(post_url: str) -> str:
    """Extract post ID from Instagram post URL."""
    match = re.search(r"/p/([A-Za-z0-9_-]+)", post_url)
    if match:
        return match.group(1)
    match = re.search(r"/reel/([A-Za-z0-9_-]+)", post_url)
    if match:
        return match.group(1)
    parts = post_url.rstrip("/").split("/")
    return parts[-1] if parts else post_url


def _generate_visual_description(client: AzureOpenAI, image_url: str, is_video: bool) -> str:
    """Call GPT-4o Vision to generate a one-sentence visual description."""
    deployment = os.environ["AZURE_OPENAI_DEPLOYMENT_NAME"]
    prefix = "[Reel] " if is_video else ""
    try:
        response = client.chat.completions.create(
            model=deployment,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Describe this image in one concise sentence. Focus on what is visually depicted — people, setting, objects, colors, and mood.",
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": image_url},
                        },
                    ],
                }
            ],
            max_tokens=150,
        )
        description = response.choices[0].message.content.strip()
        return f"{prefix}{description}"
    except Exception as e:
        return f"{prefix}Visual description unavailable: {e}"


def _run_apify_scraper(handle: str) -> dict:
    """
    Call Apify Instagram Scraper, poll until done, return the raw dataset items.
    """
    api_key = os.environ["APIFY_API_KEY"]
    headers = {"Content-Type": "application/json"}
    params = {"token": api_key}

    payload = {
        "directUrls": [f"https://www.instagram.com/{handle}/"],
        "resultsType": "posts",
        "resultsLimit": 10,
        "addParentData": True,
    }

    # Start the run
    resp = requests.post(APIFY_RUN_URL, json=payload, params=params, headers=headers, timeout=60)
    resp.raise_for_status()
    run_data = resp.json()["data"]
    run_id = run_data["id"]

    # Poll until finished
    status_url = f"https://api.apify.com/v2/actor-runs/{run_id}"
    while True:
        time.sleep(APIFY_POLL_INTERVAL)
        status_resp = requests.get(status_url, params={"token": api_key}, timeout=30)
        status_resp.raise_for_status()
        status = status_resp.json()["data"]["status"]
        if status == "SUCCEEDED":
            break
        if status in ("FAILED", "ABORTED", "TIMED-OUT"):
            raise RuntimeError(f"Apify run {run_id} ended with status: {status}")

    # Fetch dataset items
    dataset_id = run_data["defaultDatasetId"]
    items_url = f"https://api.apify.com/v2/datasets/{dataset_id}/items"
    items_resp = requests.get(items_url, params={"token": api_key, "format": "json"}, timeout=60)
    items_resp.raise_for_status()
    return items_resp.json()


def _build_record(handle: str, raw_items: list[dict], client: AzureOpenAI) -> dict:
    """
    Build a full influencer record from raw Apify dataset items.
    """
    # Extract profile-level metadata from the first item that has it
    bio = ""
    follower_count = 0
    name = handle
    profile_url = f"https://www.instagram.com/{handle}/"
    image_url = ""

    for item in raw_items:
        owner = item.get("ownerUsername", "") or ""
        if owner.lower() == handle.lower() or not owner:
            bio = item.get("caption", bio) if not bio else bio
        # Try to get profile info from parent data
        if "profilePicUrl" in item:
            image_url = item["profilePicUrl"]
        if "ownerFullName" in item and item["ownerFullName"]:
            name = item["ownerFullName"]
        if "followersCount" in item:
            follower_count = item["followersCount"]
        # Some scrapers put profile data differently
        if "biography" in item:
            bio = item["biography"]

    posts = []
    for item in raw_items[:10]:
        post_url = item.get("url") or item.get("postUrl") or ""
        post_id = _extract_post_id(post_url) if post_url else item.get("id", "")
        display_url = item.get("displayUrl", "") or item.get("imageUrl", "")
        video_url = item.get("videoUrl", "")
        is_video = bool(video_url) or item.get("type") == "Video" or item.get("isVideo", False)
        media_type = "video" if is_video else "image"
        caption = item.get("caption", "") or ""
        likes = item.get("likesCount", 0) or 0
        comments_count = item.get("commentsCount", 0) or 0

        # Generate visual description
        visual_image_url = display_url or video_url
        if visual_image_url:
            visual_desc = _generate_visual_description(client, visual_image_url, is_video)
        else:
            visual_desc = "[Reel] No visual available" if is_video else "No visual available"

        enriched_content = f"{caption} Visual description: {visual_desc}" if caption else f"Visual description: {visual_desc}"

        # Process comments
        raw_comments = item.get("latestComments", []) or item.get("comments", []) or []
        cleaned_comments = []
        for c in raw_comments:
            owner_data = c.get("owner", {}) or {}
            cleaned_comments.append({
                "id": c.get("id", ""),
                "text": c.get("text", ""),
                "ownerUsername": c.get("ownerUsername", "") or owner_data.get("username", ""),
                "timestamp": c.get("timestamp", ""),
                "repliesCount": c.get("repliesCount", 0) or 0,
                "likesCount": c.get("likesCount", 0) or 0,
                "owner": {
                    "is_private": owner_data.get("is_private", False) or owner_data.get("isPrivate", False),
                    "is_verified": owner_data.get("is_verified", False) or owner_data.get("isVerified", False),
                    "username": owner_data.get("username", "") or c.get("ownerUsername", ""),
                },
            })

        posts.append({
            "post_id": post_id,
            "post_url": post_url,
            "media_type": media_type,
            "enriched_content": enriched_content,
            "likes_count": likes,
            "comments_count": comments_count,
            "comments": cleaned_comments,
        })

    record = {
        "name": name,
        "handle": handle,
        "category": "Uncategorized",
        "profile_url": profile_url,
        "image_url": image_url,
        "follower_count": follower_count,
        "bio": bio,
        "posts": posts,
    }
    return record


def get_influencer(handle: str, profile_url: str | None = None) -> dict:
    """
    Main entry point for the scraper module.
    1. Load existing data
    2. Check if handle exists → return if found
    3. Otherwise scrape via Apify, build record, append to file, return
    """
    handle = handle.lower().strip().lstrip("@")
    data = _load_data()

    # Check cache
    existing = _find_existing(data, handle)
    if existing:
        return existing

    # Scrape via Apify
    client = _get_azure_client()
    raw_items = _run_apify_scraper(handle)

    if not raw_items:
        raise ValueError(f"No data returned from Apify for handle: {handle}")

    record = _build_record(handle, raw_items, client)

    # Append to data file
    data.append(record)
    _save_data(data)

    return record
