"""
ENIT HACK — FastAPI backend.
Serves influencer data and sentiment analysis endpoints.
"""

import json
import os
import sys
import re
import logging
import base64
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncAzureOpenAI

from azure_config import normalize_azure_endpoint

# Setup file logging to debug 500 errors
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("api_debug.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "influencers_scraped.json"

sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "src"))

app = FastAPI(title="ENIT HACK API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Data helpers ───

def _load_influencers() -> list[dict]:
    if not DATA_FILE.exists():
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


def _find_post(post_url: str) -> tuple[dict | None, dict | None]:
    """Find a post by URL across all influencers. Returns (influencer, post)."""
    influencers = _load_influencers()
    for inf in influencers:
        for post in inf.get("posts", []):
            pid = post.get("post_id", "")
            purl = post.get("post_url", "")
            if post_url in purl or post_url in pid or pid in post_url:
                return inf, post
    return None, None


def _analyze_comments(comments: list[dict]) -> dict:
    """Compute sentiment breakdown from pre-labeled comments."""
    total = len(comments)
    if total == 0:
        return {"positive": 0, "neutral": 0, "negative": 0, "avg_quality": 0, "toxicity_rate": 0, "total_comments": 0}

    pos = sum(1 for c in comments if c.get("sentiment") == "positive")
    neg = sum(1 for c in comments if c.get("sentiment") == "negative")
    neu = total - pos - neg
    avg_q = sum(c.get("quality_score", 5) for c in comments) / total
    tox = sum(1 for c in comments if c.get("toxicity_flag")) / total

    return {
        "positive": round(pos / total * 100),
        "neutral": round(neu / total * 100),
        "negative": round(neg / total * 100),
        "avg_quality": round(avg_q, 1),
        "toxicity_rate": round(tox * 100, 1),
        "total_comments": total,
    }


def _detect_content_type(post: dict) -> str:
    """Detect content type from enriched content."""
    content = (post.get("enriched_content") or "").lower()
    if any(w in content for w in ["humour", "comedy", "comique", "drôle", "funny", "hhhh"]):
        return "Comedy / Humor"
    if any(w in content for w in ["beauty", "makeup", "maquillage", "skincare", "cosmét"]):
        return "Beauty / Makeup"
    if any(w in content for w in ["fashion", "mode", "outfit", "tenue", "style"]):
        return "Fashion / Style"
    if any(w in content for w in ["behind the scene", "tournage", "coulisse"]):
        return "Behind the Scenes"
    if any(w in content for w in ["family", "famille", "aïd", "eid", "fête"]):
        return "Family / Personal"
    if any(w in content for w in ["collaboration", "collab", "brand", "marque", "sponsor"]):
        return "Brand Collaboration"
    if any(w in content for w in ["travel", "voyage", "sidi bou", "carthage"]):
        return "Travel / Culture"
    if any(w in content for w in ["get ready", "grwm", "transformation"]):
        return "GRWM / Transformation"
    return "Lifestyle"


def _generate_context_insight(post: dict, sentiment: dict, content_type: str) -> str:
    """Generate a contextual insight about why comments behave this way."""
    media = post.get("media_type", "image")
    pos = sentiment["positive"]

    insights = {
        "Comedy / Humor": f"This comedy {'reel' if media == 'video' else 'post'} generates {pos}% positive reactions — typical for humor content. Emoji-heavy and short Darija reactions dominate, reflecting genuine amusement from the Tunisian audience.",
        "Beauty / Makeup": f"Beauty content attracts {pos}% positive sentiment with high-quality engagement. Comments are action-oriented (asking for product names, tutorials) showing real purchase intent.",
        "Fashion / Style": f"Fashion posts generate {pos}% positive reactions with a mix of aspirational comments and product inquiries. The community shows genuine interest in the creator's style choices.",
        "Behind the Scenes": f"Behind-the-scenes content from TV productions generates {pos}% positive sentiment. Fans express anticipation and loyalty, with high engagement depth and nostalgia-driven comments.",
        "Family / Personal": f"Personal/family content receives {pos}% positive sentiment with warm, prayer-based blessings in Darija and Arabic — a culturally authentic engagement pattern in Tunisian social media.",
        "Brand Collaboration": f"Sponsored content maintains {pos}% positive sentiment. While some cynicism appears ({sentiment['negative']}% negative), genuine product interest ('j'ai commandé') demonstrates effective influence.",
        "Travel / Culture": f"Travel content showcasing Tunisian landmarks generates {pos}% positive reactions with strong national pride. Comments mix Darija, French, and emoji — typical multilingual Tunisian engagement.",
        "GRWM / Transformation": f"Transformation content generates {pos}% positive reactions with high-quality engagement. Comments show genuine admiration and product curiosity, reflecting strong audience trust.",
    }

    return insights.get(content_type, f"This post generates {pos}% positive reactions from the community.")


# ─── Request models ───

class PostAnalysisRequest(BaseModel):
    post_url: str


class ProductMatchRequest(BaseModel):
    description: str


# ─── Endpoints ───

@app.get("/api/influencers")
def list_influencers():
    influencers = _load_influencers()
    return [
        {
            "name": inf.get("name"),
            "handle": inf.get("handle"),
            "category": inf.get("category"),
            "follower_count": inf.get("follower_count"),
            "instagram": inf.get("profile_url"),
            "tiktok": inf.get("tiktok_url", ""),
            "post_count": len(inf.get("posts", [])),
        }
        for inf in influencers
    ]


@app.get("/api/influencer/{handle}")
def get_influencer(handle: str):
    influencers = _load_influencers()
    for inf in influencers:
        if inf.get("handle", "").lower() == handle.lower():
            return inf
    raise HTTPException(404, f"Influencer '{handle}' not found")


@app.get("/api/posts")
def list_posts():
    """List all posts across all influencers with their IDs."""
    influencers = _load_influencers()
    posts = []
    for inf in influencers:
        for post in inf.get("posts", []):
            posts.append({
                "post_id": post.get("post_id"),
                "post_url": post.get("post_url"),
                "media_type": post.get("media_type"),
                "likes_count": post.get("likes_count"),
                "comments_count": post.get("comments_count"),
                "influencer_name": inf.get("name"),
                "influencer_handle": inf.get("handle"),
            })
    return posts


@app.post("/api/analyze-post")
async def analyze_post(req: PostAnalysisRequest):
    """Analyze comments on a specific post — cached or live via AI Agent."""
    try:
        inf, post = _find_post(req.post_url)

        if post:
            # ... cached logic ...
            comments = post.get("comments", [])
            sentiment = _analyze_comments(comments)
            content_type = _detect_content_type(post)
            insight = _generate_context_insight(post, sentiment, content_type)

            langs: dict[str, int] = {}
            for c in comments:
                lang = c.get("language", "unknown")
                langs[lang] = langs.get(lang, 0) + 1
            total = len(comments) or 1
            language_breakdown = [
                {"language": lang, "count": count, "percentage": round(count / total * 100)}
                for lang, count in sorted(langs.items(), key=lambda x: -x[1])
            ]

            return {
                "post": {
                    "post_id": post.get("post_id"),
                    "post_url": post.get("post_url"),
                    "media_type": post.get("media_type"),
                    "enriched_content": post.get("enriched_content"),
                    "likes_count": post.get("likes_count"),
                    "comments_count": post.get("comments_count"),
                },
                "influencer": {
                    "name": inf.get("name") if inf else "Unknown",
                    "handle": inf.get("handle") if inf else "",
                },
                "content_type": content_type,
                "sentiment": sentiment,
                "language_breakdown": language_breakdown,
                "context_insight": insight,
                "comments": comments,
            }

        # ── Live path ──
        return await _analyze_live_post_async(req.post_url)
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        logger.error(f"FATAL API ERROR: {error_detail}")
        return {"error": str(e), "detail": error_detail, "post_url": req.post_url}


async def _analyze_live_post_async(post_url: str) -> dict:
    """Analyze a post live using Vision AI. Fully async."""
    from scraper import _capture_async

    logger = logging.getLogger(__name__)

    endpoint = normalize_azure_endpoint(os.environ.get("AZURE_OPENAI_ENDPOINT", ""))
    api_key = os.environ.get("AZURE_OPENAI_API_KEY", "")
    deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-5.2-chat")
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2025-04-01-preview")

    client = AsyncAzureOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version=api_version,
    )

    handle_match = re.search(r"(?:instagram\.com|tiktok\.com)/@?([A-Za-z0-9_.]+)", post_url)
    handle = handle_match.group(1) if handle_match else "unknown"
    if handle in ("p", "reel", "tv", "stories", "reels", "video"):
        handle = "unknown"

    # ── Step 1: Async Screenshot ──
    screenshot_b64 = None
    try:
        session_id = os.environ.get("INSTAGRAM_SESSION_ID")
        logger.info(f"📸 Capturing screenshot of {post_url}")
        png_bytes = await _capture_async(post_url, session_id)
        screenshot_b64 = base64.b64encode(png_bytes).decode("utf-8")
        logger.info("✅ Screenshot captured successfully")
    except Exception as e:
        logger.error(f"❌ Screenshot failed: {e}")

    # ── Step 2: Vision Prompt ──
    vision_prompt = """Analyze this social media post for a Brand Manager. 
Identify the 'ROI Sentiment' based on the content type:

1. **Content Intent**: Is this Humor/Comedy, Fashion, or Lifestyle? 
2. **Contextual Sentiment**: 
   - If COMEDY: Treat laughter (HAHAHA, Hhhh, 😂, hhh) as HIGHLY POSITIVE.
   - If FASHION: Treat product questions (where from? price?) as HIGHLY POSITIVE.
3. **Identity**: Extract the creator username.
4. **Metrics**: Extract Likes and Comments.

Return ONLY valid JSON:
{
  "media_type": "video" or "image",
  "enriched_content": "detailed visual description and brand fit",
  "content_type": "Comedy/Fashion/Beauty/Lifestyle",
  "likes_count": number,
  "comments_count": number,
  "creator_handle": "username",
  "context_insight": "Cultural ROI analysis: Why this worked (or didn't) for a brand",
  "comments": [
    {
      "text": "comment text",
      "ownerUsername": "username",
      "sentiment": "positive/negative/neutral",
      "language": "Darija/French/etc",
      "quality_score": 1-10
    }
  ]
}"""

    fallback_prompt = f"The live screenshot failed for {post_url} (@{handle}). Simulate a realistic analysis for a Brand. Return ONLY valid JSON."

    try:
        if screenshot_b64:
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": vision_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{screenshot_b64}", "detail": "high"}},
                    ],
                }
            ]
        else:
            messages = [{"role": "user", "content": fallback_prompt}]

        response = await client.chat.completions.create(
            model=deployment,
            messages=messages,
            max_completion_tokens=4000,
        )
        text = response.choices[0].message.content.strip()
        if text.startswith("```"):
            fence = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", text)
            if fence: text = fence.group(1).strip()
        data = json.loads(text)
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        return {"error": str(e), "post_url": post_url}

    try:
        # Helper to avoid React "Objects as children" crash
        def to_str(val):
            if isinstance(val, dict): return " | ".join(f"{k}: {v}" for k, v in val.items())
            if isinstance(val, list): return ", ".join(map(str, val))
            return str(val or "")

        enriched = data.get("enriched_content", "")
        if isinstance(enriched, dict):
            summary = enriched.get("caption_summary") or enriched.get("description") or ""
            enriched = f"{summary}\n\nThemes: {to_str(enriched.get('themes', []))}"
        else:
            enriched = to_str(enriched)

        final_handle = data.get("creator_handle", handle)
        if not final_handle or final_handle == "unknown": final_handle = handle

        comments = data.get("comments", [])
        if not isinstance(comments, list): comments = []
        
        # Standardize comments safely
        safe_comments = []
        for i, c in enumerate(comments):
            if not isinstance(c, dict): continue
            c["id"] = f"v_{i}"
            c["likesCount"] = c.get("likesCount", 0)
            c["repliesCount"] = c.get("repliesCount", 0)
            c["owner"] = {"username": to_str(c.get("ownerUsername", "user"))}
            safe_comments.append(c)

        sentiment = _analyze_comments(safe_comments)
        
        langs: dict[str, int] = {}
        for c in safe_comments:
            l = to_str(c.get("language", "unknown"))
            langs[l] = langs.get(l, 0) + 1
        total = len(safe_comments) or 1
        language_breakdown = [
            {"language": l, "count": cnt, "percentage": round(cnt/total*100)}
            for l, cnt in sorted(langs.items(), key=lambda x: -x[1])
        ]

        return {
            "post": {
                "post_id": post_url,
                "post_url": post_url,
                "media_type": to_str(data.get("media_type", "image")),
                "enriched_content": enriched,
                "likes_count": data.get("likes_count", 0),
                "comments_count": data.get("comments_count", 0),
            },
            "influencer": {"name": to_str(final_handle), "handle": to_str(final_handle)},
            "content_type": to_str(data.get("content_type", "Lifestyle")),
            "sentiment": sentiment,
            "language_breakdown": language_breakdown,
            "context_insight": to_str(data.get("context_insight", "")),
            "comments": safe_comments,
            "ai_generated": True,
            "vision_used": screenshot_b64 is not None,
            "is_simulated": screenshot_b64 is None
        }
    except Exception as e:
        logger.error(f"Data processing failed: {e}")
        return {"error": f"Parsing Error: {str(e)}", "post_url": post_url}


@app.post("/api/match-product")
def match_product_endpoint(req: ProductMatchRequest):
    """Find best influencer matches for a product description."""
    try:
        from pipeline_b import match_product
        results = match_product(req.description)
        return {"matches": results}
    except Exception as e:
        # Fallback: return mock ranking based on database
        influencers = _load_influencers()
        fallback = []
        for inf in influencers:
            fallback.append({
                "name": inf.get("name"),
                "handle": inf.get("handle"),
                "category": inf.get("category"),
                "follower_count": inf.get("follower_count"),
                "match_percentage": 75,
                "fit_reason": "Based on audience profile and content domain analysis.",
            })
        return {"matches": fallback, "fallback": True, "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
