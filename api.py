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
from fastapi.responses import Response, RedirectResponse
import httpx
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

def _load_pulse_dataset() -> list[dict]:
    """Load the pulse dataset from sm_crew/data for profile info."""
    pulse_file = BASE_DIR / "sm_crew" / "data" / "pulse_final_dataset.json"
    if not pulse_file.exists():
        return []
    try:
        with open(pulse_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _parse_report_md(content: str, handle: str, pulse_data: list[dict]) -> dict:
    """Parse a report .md file into structured metrics."""
    parsed = {}
    
    # --- Sentiment ---
    sent_match = re.search(
        r'Positif:\s*\*\*([0-9.]+)%?\*\*\s*\|\s*N[ée]gatif:\s*\*\*([0-9.]+)%?\*\*\s*\|\s*Indiff[ée]rent:\s*\*\*([0-9.]+)%?\*\*',
        content
    )
    if sent_match:
        parsed["sentiment"] = {
            "positive": float(sent_match.group(1)),
            "negative": float(sent_match.group(2)),
            "neutral": float(sent_match.group(3)),
        }
    
    # --- Quality ---
    qual_match = re.search(r'Qualit.*?Conversation.*?\*\*\s*\*?\*?([0-9.]+)/10\*\*', content)
    if qual_match:
        parsed["avg_quality"] = float(qual_match.group(1))
    
    # --- Per-post breakdown ---
    post_lines = re.findall(r'(\d+)\)\s*([0-9.]+)%\s*/\s*([0-9.]+)%\s*/\s*([0-9.]+)%\s*[—-]+\s*([0-9.]+)/10', content)
    parsed["posts_analyzed"] = len(post_lines) if post_lines else 10
    if post_lines:
        parsed["per_post"] = [
            {
                "post": int(p[0]),
                "positive": float(p[1]),
                "negative": float(p[2]),
                "neutral": float(p[3]),
                "quality": float(p[4])
            }
            for p in post_lines
        ]
    
    # --- Toxicity (derive from negative sentiment) ---
    if "sentiment" in parsed:
        parsed["toxicity_rate"] = round(parsed["sentiment"]["negative"], 1)
    
    # --- Audience health ---
    pos = parsed.get("sentiment", {}).get("positive", 0)
    if pos >= 80:
        parsed["audience_health"] = "Healthy"
    elif pos >= 60:
        parsed["audience_health"] = "Moderate"
    else:
        parsed["audience_health"] = "Needs attention"
    
    # languages will be computed from actual comments in the pulse dataset section below
    parsed["languages"] = []
    
    # --- Themes / Niches ---
    themes = []
    theme_patterns = [
        (r'[Bb]eaut[ée]|[Mm]akeup|[Cc]osm[ée]t', "Beauty"),
        (r'[Ff]ashion|[Mm]ode|[Tt]enue|[Oo]utfit|[Ss]tyle|[Rr]obe|[Jj]ebba', "Fashion"),
        (r'[Ll]ifestyle|[Ff]eel.good', "Lifestyle"),
        (r'[Cc]ultur|[Pp]atrimoine|[Tt]radition|[Ff]iert[ée]', "Culture"),
        (r'[Hh]umour|[Cc]om[ée]d|[Ss]arcas', "Comedy"),
        (r'[Cc]in[ée]ma|[Ff]ilm|[Ss][ée]rie|[Aa]ct', "Entertainment"),
        (r'[Ss]piritual|[Pp]ri[èe]re|[Éé]motion|[Nn]ostalgi', "Spirituality"),
        (r'[Tt]ravel|[Vv]oyage', "Travel"),
    ]
    for pattern, label in theme_patterns:
        if re.search(pattern, content) and label not in themes:
            themes.append(label)
    
    parsed["primary_niche"] = themes[0] if themes else "Lifestyle"
    parsed["secondary_niches"] = themes[1:4] if len(themes) > 1 else ["Lifestyle"]
    
    # --- Profile data from pulse dataset ---
    clean_handle = handle.rstrip("_").lower()
    for item in pulse_data:
        profile = item.get("profile", {})
        ds_handle = profile.get("username", "").rstrip("_").lower()
        if clean_handle == ds_handle or clean_handle in ds_handle or ds_handle in clean_handle:
            parsed["followers"] = profile.get("followers", 0)
            parsed["full_name"] = profile.get("full_name", "")
            parsed["bio"] = profile.get("bio", "")
            
            # Count total comments analyzed from posts
            total_comments = 0
            total_likes = 0
            total_posts = len(item.get("posts", []))
            
            # Format performance: Image vs Reel/Video
            image_posts = {"likes": [], "comments": [], "quality": []}
            reel_posts = {"likes": [], "comments": [], "quality": []}
            
            for idx, post in enumerate(item.get("posts", [])):
                total_comments += len(post.get("comments", []))
                total_likes += post.get("likes", 0)
                
                post_type = (post.get("type", "") or "").lower()
                per_post_quality = 0
                if "per_post" in parsed and idx < len(parsed["per_post"]):
                    per_post_quality = parsed["per_post"][idx]["quality"]
                
                post_data = {
                    "likes": post.get("likes", 0),
                    "comments": post.get("comments_count", len(post.get("comments", []))),
                    "quality": per_post_quality,
                }
                
                if post_type in ("video", "reel", "reels", "sidecar"):
                    reel_posts["likes"].append(post_data["likes"])
                    reel_posts["comments"].append(post_data["comments"])
                    reel_posts["quality"].append(post_data["quality"])
                else:
                    image_posts["likes"].append(post_data["likes"])
                    image_posts["comments"].append(post_data["comments"])
                    image_posts["quality"].append(post_data["quality"])
            
            parsed["comments_analyzed"] = total_comments
            parsed["total_likes"] = total_likes
            parsed["total_posts"] = total_posts
            
            # Engagement rate
            if parsed["followers"] > 0 and total_posts > 0:
                avg_likes = total_likes / total_posts
                parsed["engagement_rate"] = round((avg_likes / parsed["followers"]) * 100, 1)
            
            # Build format performance
            def _fmt(data):
                n = len(data["likes"])
                if n == 0:
                    return None
                return {
                    "likes": round(sum(data["likes"]) / n),
                    "comments": round(sum(data["comments"]) / n),
                    "quality": f"{round(sum(data['quality']) / n, 1)}/10" if any(data["quality"]) else "N/A",
                    "count": n,
                }
            
            fmt_image = _fmt(image_posts)
            fmt_reel = _fmt(reel_posts)
            if fmt_image or fmt_reel:
                parsed["formats"] = {}
                if fmt_image:
                    parsed["formats"]["casual"] = fmt_image
                if fmt_reel:
                    parsed["formats"]["reel"] = fmt_reel
            
            # --- Compute real language percentages from comments ---
            arabic_re = re.compile(r'[\u0600-\u06FF]')
            french_words = {'je','tu','il','elle','nous','vous','est','les','des','une','dans',
                           'pour','avec','pas','qui','mais','tres','trop','belle','bravo',
                           'magnifique','superbe','bonne','beau','amour','coeur','adore'}
            emoji_only_re = re.compile(
                r'^[\U0001F300-\U0001FAFF\U00002702-\U000027B0\U0000FE00-\U0000FE0F\U0000200D\s'
                r'\u2764\uFE0F\U0001F525\U0001F60D\U0001F970\U0001F499\U0001F90D\u2728'
                r'\U0001F495\U0001F497\U0001F64F\U0001F62D\U0001F602\U0001F97A\U0001F44F'
                r'\U0001F4AF\U0001FAF6\U0001F929\U0001F62E]+$'
            )
            lang_counts = {"Emoji only": 0, "Darija": 0, "French": 0, "English": 0}
            lang_total = 0
            for post in item.get("posts", []):
                for c in post.get("comments", []):
                    text = (c.get("text", "") or "").strip()
                    if not text:
                        continue
                    lang_total += 1
                    has_arabic = bool(arabic_re.search(text))
                    words = set(text.lower().split())
                    has_french = bool(words & french_words)
                    is_emoji = bool(emoji_only_re.match(text))
                    
                    if is_emoji:
                        lang_counts["Emoji only"] += 1
                    elif has_arabic:
                        lang_counts["Darija"] += 1
                    elif has_french:
                        lang_counts["French"] += 1
                    else:
                        lang_counts["English"] += 1
            
            if lang_total > 0:
                sorted_langs = sorted(lang_counts.items(), key=lambda x: -x[1])
                parsed["languages"] = [
                    {
                        "name": name,
                        "pct": round(cnt / lang_total * 100),
                        "opacity": round(0.85 - i * 0.15, 2),
                    }
                    for i, (name, cnt) in enumerate(sorted_langs)
                    if cnt > 0
                ]
            
            break
    
    # --- NPS (derive from sentiment) ---
    if "sentiment" in parsed:
        s = parsed["sentiment"]
        parsed["nps"] = round(s["positive"] - s["negative"])
    
    # --- CQS (Community Quality Score) ---
    # Formula: Sentiment(×0.3) + Engagement(×0.2) + Authenticité(×0.3) − Toxicité(×0.2)
    if "sentiment" in parsed:
        sentiment_score = parsed["sentiment"]["positive"]  # 0-100
        engagement_score = min((parsed.get("engagement_rate", 0) / 5) * 100, 100)  # normalize: 5% = 100
        authenticity_score = (parsed.get("avg_quality", 5) / 10) * 100  # quality 0-10 → 0-100
        toxicity_score = parsed["sentiment"]["negative"]  # 0-100
        
        parsed["cqs"] = round(
            sentiment_score * 0.3 + engagement_score * 0.2 + authenticity_score * 0.3 - toxicity_score * 0.2,
            1
        )
    
    return parsed


@app.get("/api/reports")
def get_reports():
    """Scan sm_crew for *_report.md, parse metrics, and return structured data."""
    reports_dir = BASE_DIR / "sm_crew"
    reports = []
    pulse_data = _load_pulse_dataset()
    
    if reports_dir.exists():
        for file_path in reports_dir.glob("*_report.md"):
            try:
                handle = file_path.name.replace("_report.md", "")
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                parsed = _parse_report_md(content, handle, pulse_data)
                
                # Build display name
                name = parsed.get("full_name") or handle.replace(".", " ").replace("_", " ").title()
                
                reports.append({
                    "id": handle,
                    "name": name,
                    "content": content,
                    "parsed": parsed
                })
            except Exception as e:
                logger.error(f"Failed to read report {file_path}: {e}")
                
    return {"reports": reports}


# ─── Product Match ───

class ProductMatchRequest(BaseModel):
    description: str | None = None
    image_base64: str | None = None


# Keywords associated with product categories for matching
_PRODUCT_KEYWORDS = {
    "skincare": ["skincare", "skin", "cream", "serum", "moisturizer", "beauty", "cosmetic", "organic", "natural", "glow", "anti-aging", "sunscreen", "cleanser", "face", "routine"],
    "fashion": ["fashion", "clothing", "wear", "dress", "outfit", "style", "apparel", "collection", "designer", "shoes", "accessory", "jewelry", "luxury", "brand", "couture", "vêtement", "mode", "robe", "tenue"],
    "food": ["food", "restaurant", "cuisine", "recipe", "cooking", "chef", "organic", "healthy", "diet", "nutrition", "meal", "snack", "drink", "beverage", "café", "alimentation", "nourriture"],
    "tech": ["tech", "technology", "app", "software", "gadget", "phone", "computer", "digital", "ai", "innovation", "smart", "device", "electronic"],
    "fitness": ["fitness", "gym", "workout", "exercise", "sport", "health", "wellness", "yoga", "training", "supplement", "protein", "muscle"],
    "travel": ["travel", "tourism", "hotel", "destination", "voyage", "flight", "adventure", "explore", "booking", "resort"],
    "entertainment": ["entertainment", "film", "movie", "music", "show", "series", "cinema", "concert", "festival", "théâtre", "spectacle"],
    "culture": ["culture", "tradition", "heritage", "patrimoine", "art", "museum", "history", "identité", "tunisie", "tunisia", "arabic"],
    "lifestyle": ["lifestyle", "life", "daily", "routine", "home", "décor", "interior", "family", "feel-good", "bien-être", "vie"],
    "baby": ["baby", "kids", "children", "parenting", "maternité", "bébé", "enfant", "jouet", "toy"],
    "automotive": ["car", "auto", "vehicle", "driving", "voiture", "automobile"],
    "medical": ["medical", "health", "doctor", "nurse", "hospital", "clinic", "stethoscope", "medicine", "pharmacy", "care", "wellness", "veterinarian"],
}

# Map from product categories to influencer niches for affinity scoring
_CATEGORY_NICHE_AFFINITY = {
    "skincare": {"Beauty": 1.0, "Lifestyle": 0.7, "Fashion": 0.5, "Spirituality": 0.2},
    "fashion": {"Fashion": 1.0, "Beauty": 0.6, "Lifestyle": 0.7, "Culture": 0.3, "Entertainment": 0.3},
    "food": {"Lifestyle": 0.8, "Culture": 0.5, "Travel": 0.4, "Comedy": 0.2},
    "tech": {"Entertainment": 0.5, "Lifestyle": 0.3, "Comedy": 0.2},
    "fitness": {"Lifestyle": 0.8, "Beauty": 0.4, "Fashion": 0.3},
    "travel": {"Travel": 1.0, "Lifestyle": 0.7, "Culture": 0.5, "Entertainment": 0.3},
    "entertainment": {"Entertainment": 1.0, "Comedy": 0.8, "Culture": 0.5, "Lifestyle": 0.4},
    "culture": {"Culture": 1.0, "Spirituality": 0.7, "Lifestyle": 0.5, "Entertainment": 0.4},
    "lifestyle": {"Lifestyle": 1.0, "Beauty": 0.6, "Fashion": 0.6, "Spirituality": 0.4, "Culture": 0.4},
    "baby": {"Lifestyle": 0.7, "Culture": 0.3},
    "automotive": {"Lifestyle": 0.3, "Entertainment": 0.2},
    "medical": {"Lifestyle": 0.2, "Culture": 0.1},
}


def _detect_product_categories(description: str) -> dict[str, float]:
    """Detect product categories from description text. Returns {category: confidence}."""
    desc_lower = description.lower()
    scores = {}
    for category, keywords in _PRODUCT_KEYWORDS.items():
        hits = sum(1 for kw in keywords if kw in desc_lower)
        if hits > 0:
            scores[category] = min(hits / 3, 1.0)  # normalize
    
    # If no category matched, default to lifestyle
    if not scores:
        scores["lifestyle"] = 0.5
    
    return scores


def _score_influencer_match(parsed: dict, product_categories: dict[str, float], description: str) -> dict:
    """Score how well an influencer matches a product based on their report data."""
    primary_niche = parsed.get("primary_niche", "")
    secondary_niches = parsed.get("secondary_niches", [])
    all_niches = [primary_niche] + secondary_niches
    
    # 1. Niche affinity score (0-100)
    niche_score = 0
    for cat, cat_conf in product_categories.items():
        affinity_map = _CATEGORY_NICHE_AFFINITY.get(cat, {})
        for niche in all_niches:
            aff = affinity_map.get(niche, 0)
            niche_score = max(niche_score, aff * cat_conf * 100)
    
    # 2. Audience health bonus (0-15)
    health = parsed.get("audience_health", "")
    health_bonus = 15 if health == "Healthy" else (8 if health == "Moderate" else 0)
    
    # 3. Engagement bonus (0-15)
    engagement = parsed.get("engagement_rate", 0)
    engagement_bonus = min(engagement * 3, 15)
    
    # 4. Sentiment bonus (0-10)
    sentiment = parsed.get("sentiment", {})
    sent_bonus = min(sentiment.get("positive", 0) / 10, 10)
    
    # 5. Content keyword overlap (0-10) — check if product keywords appear in the .md content
    content = parsed.get("_content", "").lower()
    desc_words = set(description.lower().split())
    content_words = set(content.split())
    overlap = len(desc_words & content_words)
    content_bonus = min(overlap * 2, 10)
    
    # If the niche match is very low, do not grant massive bonuses
    bonus_multiplier = max(niche_score / 100, 0.15)  # Max 15% of bonus applies if niche is 0
    
    # Base niche is weighted heavily
    total = round(niche_score * 0.7 + (health_bonus + engagement_bonus + sent_bonus + content_bonus) * bonus_multiplier, 1)
    
    # Hard cap for terrible fits to prevent inflated scores
    if niche_score < 20:
        total = min(total, 25)
        
    total = min(total, 100)
    
    return {
        "score": total,
        "niche_score": round(niche_score, 1),
        "health_bonus": round(health_bonus, 1),
        "engagement_bonus": round(engagement_bonus, 1),
    }


async def _analyze_image_with_vision(image_base64: str) -> str:
    """Use Groq's llama-4-scout vision model to describe a product image."""
    groq_api_key = os.environ.get("GROQ_API_KEY", "")
    
    if not groq_api_key:
        logger.warning("GROQ_API_KEY not configured. Using mock image analysis for demo purposes.")
        # Return a mock description so the demo works without API keys
        return "A trendy black sports shoe or sneaker designed for active lifestyles and athletic performance. Ideal for a fitness and fashion-conscious audience."
    
    from openai import AsyncOpenAI
    client = AsyncOpenAI(
        api_key=groq_api_key,
        base_url="https://api.groq.com/openai/v1"
    )
    
    response = await client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text", 
                        "text": "Analyze the attached image and describe the product concisely in 2-3 sentences. Focus strictly on the following: 1. The exact type of product depicted. 2. The primary target audience or demographic. 3. The precise product category it falls under (e.g., medical, tech, skincare, fashion, lifestyle, automotive). Do not include extraneous details."
                    },
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                ]
            }
        ],
        max_tokens=200,
    )
    
    return response.choices[0].message.content or "A consumer product."


async def _discover_influencers_via_ai(description: str, product_categories: dict) -> list[dict]:
    """Use Azure OpenAI GPT to discover top Tunisian influencers for a product."""
    from openai import AsyncAzureOpenAI
    
    endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT", "").rstrip("/")
    api_key = os.environ.get("AZURE_OPENAI_API_KEY", "")
    deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-5.2-chat")
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2025-04-01-preview")
    
    if not endpoint or not api_key:
        logger.warning("Azure OpenAI not configured, skipping AI discovery")
        return []
    
    top_cats = sorted(product_categories.keys(), key=lambda c: product_categories[c], reverse=True)[:3]
    cats_label = ", ".join(top_cats)
    
    client = AsyncAzureOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version=api_version,
    )
    
    prompt = f"""You are a Tunisian influencer marketing expert. The user is looking for the best Tunisian influencers to promote a product.

Product / Description: "{description}"
Detected categories: {cats_label}

Find 4-5 real, well-known Tunisian influencers on Instagram and/or TikTok who would be relevant for this type of product. Choose REAL influencers who are actually popular in Tunisia.

CRITICAL RULES:
1. Do NOT mention "oumaima.hamrouni_" or "samiramagroun" — they are already in our database.
2. GENDER RELEVANCE: If the product is clearly for MEN (men's clothing, men's grooming, etc.), suggest MALE influencers only. If the product is for WOMEN (makeup, women's fashion, etc.), suggest FEMALE influencers. If the product is gender-neutral, mix both.
3. PRIORITIZE these known Tunisian influencers when they match the category:
   - Makeup / Beauty: Sarra Cherif (does makeup tutorials), Ons Hm
   - Men's clothing / Men's fashion: Hamma Stories, Mehdi Mzeh, Mourad Rouge
   Only include them if they are relevant to the product. You may add other real Tunisian influencers too.

Respond ONLY with a valid JSON array, no markdown, no ```json, just raw JSON:
[
  {{
    "name": "Full Name",
    "instagram_handle": "@instagram_handle",
    "tiktok_handle": "@tiktok_handle or null if no TikTok",
    "instagram_followers": 150000,
    "tiktok_followers": 200000,
    "category": "Beauty",
    "reason": "Short explanation in English of why this influencer is relevant (1-2 sentences max)"
  }}
]

Use realistic follower estimates. If unsure about TikTok, set to null."""

    try:
        response = await client.chat.completions.create(
            model=deployment,
            messages=[{"role": "user", "content": prompt}],
            max_completion_tokens=1500,
        )
        
        raw = response.choices[0].message.content or "[]"
        # Clean up: strip markdown code fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()
        
        discovered = json.loads(raw)
        if not isinstance(discovered, list):
            return []
        
        # Normalize and validate each entry
        results = []
        for d in discovered[:5]:
            results.append({
                "name": d.get("name", "Unknown"),
                "handle": d.get("instagram_handle", "@unknown"),
                "tiktok_handle": d.get("tiktok_handle"),
                "initials": "".join(w[0] for w in d.get("name", "U").split() if w)[:2].upper(),
                "category": d.get("category", "Lifestyle"),
                "instagram_followers": d.get("instagram_followers", 0),
                "tiktok_followers": d.get("tiktok_followers", 0),
                "reason": d.get("reason", "Relevant influencer for your product."),
                "has_audit": False,
                "domain": [d.get("category", "Lifestyle")],
            })
        
        return results
    except Exception as e:
        logger.error(f"AI influencer discovery failed: {e}")
        return []


@app.post("/api/product-match")
async def product_match(request: ProductMatchRequest):
    """Match a product description (or image) against audited influencers + AI-discovered ones."""
    
    description = request.description or ""
    
    # If image provided and no description, analyze the image
    if request.image_base64 and not description.strip():
        try:
            description = await _analyze_image_with_vision(request.image_base64)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Vision analysis failed: {e}")
            raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")
    
    if not description.strip():
        raise HTTPException(status_code=400, detail="Please provide a product description or upload an image.")
    
    # Detect product categories
    product_categories = _detect_product_categories(description)
    top_cats = sorted(product_categories.keys(), key=lambda c: product_categories[c], reverse=True)
    top_cat_label = top_cats[0].capitalize() if top_cats else "lifestyle"
    
    # ══════════════════════════════════════════════════════════
    # 1. AUDITED influencers (Samira & Oumaima — from local reports)
    # ══════════════════════════════════════════════════════════
    reports_dir = BASE_DIR / "sm_crew"
    pulse_data = _load_pulse_dataset()
    audited_matches = []
    
    if reports_dir.exists():
        for file_path in reports_dir.glob("*_report.md"):
            try:
                handle = file_path.name.replace("_report.md", "")
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                parsed = _parse_report_md(content, handle, pulse_data)
                parsed["_content"] = content
                
                scoring = _score_influencer_match(parsed, product_categories, description)
                
                name = parsed.get("full_name") or handle.replace(".", " ").replace("_", " ").title()
                if "|" in name:
                    name = name.split("|")[0].strip()
                
                all_niches = [parsed.get("primary_niche", "Lifestyle")] + parsed.get("secondary_niches", [])
                
                # Generate reason
                score = round(scoring["score"])
                niche = parsed.get("primary_niche", "Lifestyle").lower()
                if score >= 70:
                    reason = (f"{name}'s {niche} content and engaged audience "
                              f"({parsed.get('sentiment', {}).get('positive', 0):.0f}% positive sentiment) "
                              f"make them an excellent fit for a {top_cat_label} product.")
                elif score >= 50:
                    reason = (f"{name}'s {niche} audience has good overlap with the {top_cat_label} space, "
                              f"offering moderate brand alignment and visibility.")
                else:
                    reason = (f"{name} primarily creates {niche} content. "
                              f"Limited thematic overlap with {top_cat_label} but their engaged audience can still provide reach.")
                
                audited_matches.append({
                    "name": name,
                    "handle": f"@{handle}",
                    "tiktok_handle": None,
                    "initials": "".join(w[0] for w in name.split() if w)[:2].upper(),
                    "category": parsed.get("primary_niche", "Lifestyle"),
                    "match": score,
                    "cqs": parsed.get("cqs", 0),
                    "domain": all_niches[:3],
                    "followers": parsed.get("followers", 0),
                    "instagram_followers": parsed.get("followers", 0),
                    "tiktok_followers": 0,
                    "engagement_rate": parsed.get("engagement_rate", 0),
                    "sentiment_positive": parsed.get("sentiment", {}).get("positive", 0),
                    "reason": reason,
                    "has_audit": True,
                    "best": False,
                })
            except Exception as e:
                logger.error(f"Failed to process {file_path} for matching: {e}")
    
    # Sort audited by score
    audited_matches.sort(key=lambda x: x["match"], reverse=True)
    if audited_matches and audited_matches[0]["match"] >= 50:
        audited_matches[0]["best"] = True
    
    # ══════════════════════════════════════════════════════════
    # 2. AI-DISCOVERED influencers (via Azure GPT)
    # ══════════════════════════════════════════════════════════
    discovered = await _discover_influencers_via_ai(description, product_categories)
    
    # ══════════════════════════════════════════════════════════
    # 3. Merge: audited first, then discovered
    # ══════════════════════════════════════════════════════════
    all_matches = audited_matches + discovered
    
    return {
        "description": description,
        "categories": product_categories,
        "matches": all_matches,
    }


@app.get("/api/analyzed-posts")
def list_analyzed_posts():
    """Return all pre-analyzed post results from sm_crew/post_analysis"""
    import glob
    analysis_dir = BASE_DIR / "sm_crew" / "post_analysis"
    results = []
    
    if analysis_dir.exists():
        for file_path in analysis_dir.glob("*/*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    results.append(data)
            except Exception as e:
                logger.error(f"Failed to read {file_path}: {e}")
                
    return sorted(results, key=lambda x: (x.get("influencer", ""), x.get("post_index", 0)))



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
                    "display_url": post.get("display_url"),
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
    """Analyze a post live using Apify (comments) + Groq Llama Scout (visual analysis)."""
    import asyncio
    from apify_client import ApifyClient as ApifyClientSync

    logger = logging.getLogger(__name__)

    # ── Extract handle from URL ──
    handle_match = re.search(r"(?:instagram\.com|tiktok\.com)/@?([A-Za-z0-9_.]+)", post_url)
    handle = handle_match.group(1) if handle_match else "unknown"
    if handle in ("p", "reel", "tv", "stories", "reels", "video"):
        handle = "unknown"

    # Clean URL — strip query params for Apify
    clean_url = post_url.split("?")[0]

    # ══════════════════════════════════════════════════════
    # Step 1: Scrape comments from Instagram via Apify
    # ══════════════════════════════════════════════════════
    apify_token = os.environ.get("APIFY_API_KEY", "") or os.environ.get("APIFY_API_TOKEN", "")
    
    scraped_comments = []
    post_metadata = {}
    display_url = ""
    apify_client = None
    
    if apify_token:
        apify_client = ApifyClientSync(apify_token)
        try:
            logger.info(f"[APIFY] Scraping comments for {clean_url}")
            
            run_input = {
                "directUrls": [clean_url],
                "resultsLimit": 50,
            }
            
            # Run synchronously in a thread to avoid blocking the event loop
            run = await asyncio.to_thread(
                apify_client.actor("SbK00X0JYCPblD2wp").call,
                run_input=run_input,
            )
            
            items = list(apify_client.dataset(run["defaultDatasetId"]).iterate_items())
            logger.info(f"[APIFY] Scraped {len(items)} comments")
            
            for i, item in enumerate(items):
                scraped_comments.append({
                    "id": item.get("id", f"apify_{i}"),
                    "text": item.get("text", ""),
                    "ownerUsername": item.get("ownerUsername", "user"),
                    "owner": {"username": item.get("ownerUsername", "user")},
                    "likesCount": item.get("likesCount", 0),
                    "repliesCount": item.get("repliesCount", 0),
                    "timestamp": item.get("timestamp", ""),
                })
                
        except Exception as e:
            logger.error(f"[APIFY] Comment scraping failed: {e}")
    else:
        logger.warning("[APIFY] No APIFY_API_KEY found in environment")

    # ══════════════════════════════════════════════════════
    # Step 2: Try to get post details via Apify Instagram Post Scraper
    # ══════════════════════════════════════════════════════
    media_type = "image"
    
    if apify_client:
        try:
            logger.info(f"[APIFY] Fetching post details for {clean_url}")
            run_input_post = {
                "directUrls": [clean_url],
                "resultsLimit": 1,
            }
            run_post = await asyncio.to_thread(
                apify_client.actor("shu8hvrXbJbY3Eb9W").call,
                run_input=run_input_post,
            )
            post_items = list(apify_client.dataset(run_post["defaultDatasetId"]).iterate_items())
            
            if post_items:
                post_data = post_items[0]
                post_metadata = {
                    "likes_count": post_data.get("likesCount", 0),
                    "comments_count": post_data.get("commentsCount", 0),
                    "caption": post_data.get("caption", ""),
                    "timestamp": post_data.get("timestamp", ""),
                }
                display_url = post_data.get("displayUrl", "") or post_data.get("imageUrl", "")
                
                owner = post_data.get("ownerUsername", "") or post_data.get("ownerFullName", "")
                if owner and handle == "unknown":
                    handle = owner
                
                post_type = str(post_data.get("type", "Image")).lower()
                if "video" in post_type or "reel" in post_type:
                    media_type = "video"
                
                logger.info(f"[APIFY] Post: {post_metadata.get('likes_count')} likes, type={media_type}")
                
        except Exception as e:
            logger.error(f"[APIFY] Post detail fetch failed: {e}")

    # ══════════════════════════════════════════════════════
    # Step 3: Analyze the post image/thumbnail with Groq Llama Scout
    # ══════════════════════════════════════════════════════
    visual_description = ""
    content_type = "Lifestyle"
    groq_api_key = os.environ.get("GROQ_API_KEY", "")
    
    if display_url and groq_api_key:
        try:
            logger.info("[GROQ] Analyzing post visual content")
            
            async with httpx.AsyncClient(timeout=15.0) as http_client:
                img_resp = await http_client.get(display_url, headers={
                    "User-Agent": "Mozilla/5.0",
                    "Referer": "https://www.instagram.com/",
                })
                if img_resp.status_code == 200:
                    image_b64 = base64.b64encode(img_resp.content).decode("utf-8")
                    
                    from openai import AsyncOpenAI
                    groq_client = AsyncOpenAI(
                        api_key=groq_api_key,
                        base_url="https://api.groq.com/openai/v1",
                    )
                    
                    vision_resp = await groq_client.chat.completions.create(
                        model="meta-llama/llama-4-scout-17b-16e-instruct",
                        messages=[{
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Analyze this Instagram post image for a Brand Manager. Describe: 1. What the image shows (people, products, scenery). 2. The content category (Beauty, Fashion, Comedy, Lifestyle, Food, Travel, etc). 3. Brand potential -- what types of brands would benefit from this content? Answer in 3-4 concise sentences."
                                },
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}}
                            ]
                        }],
                        max_tokens=300,
                    )
                    visual_description = vision_resp.choices[0].message.content or ""
                    
                    desc_lower = visual_description.lower()
                    if any(w in desc_lower for w in ["beauty", "makeup", "skincare", "cosmetic"]):
                        content_type = "Beauty"
                    elif any(w in desc_lower for w in ["fashion", "outfit", "dress", "clothing", "style"]):
                        content_type = "Fashion"
                    elif any(w in desc_lower for w in ["comedy", "funny", "humor", "laugh"]):
                        content_type = "Comedy"
                    elif any(w in desc_lower for w in ["food", "cooking", "recipe", "restaurant"]):
                        content_type = "Food"
                    elif any(w in desc_lower for w in ["travel", "beach", "tourism", "destination"]):
                        content_type = "Travel"
                    
                    logger.info(f"[GROQ] Visual analysis complete: {content_type}")
        except Exception as e:
            logger.error(f"[GROQ] Visual analysis failed: {e}")
    
    if not visual_description and post_metadata.get("caption"):
        visual_description = f"Post caption: {post_metadata['caption'][:500]}"

    # ══════════════════════════════════════════════════════
    # Step 4: Analyze scraped comments using the pipeline's Agent Persona
    # ══════════════════════════════════════════════════════
    from azure_config import normalize_azure_endpoint
    raw_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT") or os.environ.get("AZURE_API_BASE", "")
    endpoint = normalize_azure_endpoint(raw_endpoint)
    api_key = os.environ.get("AZURE_OPENAI_API_KEY") or os.environ.get("AZURE_API_KEY", "")
    raw_model = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME") or os.environ.get("model", "gpt-5.2-chat")
    deployment = raw_model.replace("azure/", "")
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION") or os.environ.get("AZURE_API_VERSION", "2025-04-01-preview")

    sentiment_data = {"positive": 0, "neutral": 100, "negative": 0, "avg_quality": 5, "toxicity_rate": 0, "total_comments": len(scraped_comments)}
    context_insight = f"Instagram post by @{handle}. {len(scraped_comments)} comments were analyzed."
    
    if scraped_comments and endpoint and api_key:
        try:
            logger.info("[AGENT] Running pipeline Comment Analyst Agent on scraped comments")
            
            # Use the agent persona from sm_crew/src/sm_crew/config/post_agents.yaml
            system_prompt = f"""Role: Data Analyst Senior en Intelligence Artificielle & Réseaux Sociaux (Spécialité Maghreb)
Goal: Extraire des signaux clairs, objectifs et quantifiables (sentiments et qualité) à partir d'un échantillon de commentaires bruts pour l'influenceur @{handle}.
Backstory: Vous possédez plus de 10 ans d'expérience en NLP appliqué aux réseaux sociaux. Vous êtes bilingue et maîtrisez parfaitement les subtilités du dialecte tunisien (Darja), de l'Arabizi (franco-arabe) et la culture pop maghrébine (bad buzz, réputations des influenceurs). Vous savez lire entre les lignes. Votre jugement est purement analytique et impartial."""

            comments_payload = [{"id": c["id"], "owner": c["ownerUsername"], "text": c["text"]} for c in scraped_comments]

            user_prompt = f"""CONTEXTE : Vous évaluez l'engagement d'une publication de l'influenceur(se) @{handle} dont la légende est : "{post_metadata.get('caption', '')}".
            
VOICI LES COMMENTAIRES :
{json.dumps(comments_payload, ensure_ascii=False)}

OBJECTIFS D'ANALYSE :
1. Sentiment Global : Calculez les pourcentages stricts (positive, negative, neutral) basés sur les commentaires fournis. (Somme = 100).
2. Qualité de conversation globale : Attribuez une note moyenne sur 10 (avg_quality).
3. Justification : Une brève explication analytique (context_insight) s'appuyant sur les expressions utilisées ET la réputation de l'influenceur.
4. Évaluation individuelle : Pour CHAQUE commentaire, déterminez son sentiment (positive/negative/neutral) et sa qualité (1-10).

RÈGLES STRICTES ET CONTEXTE TUNISIEN :
- Utilisez vos connaissances sur la réputation de @{handle} (ex: controverses, bad buzz, historique).
- DÉTECTION DU SARCASME : Si un(e) influenceur(se) controversé(e) publie du contenu inattendu (ex: religieux) et que les commentaires contiennent "😂", "نهار تصالي و نهر تعاري", ou "واخيرا تابت", c'est de la moquerie et de l'hypocrisie dénoncée. Ce sentiment DOIT être classé "negative" (et non neutral ou positive).
- Un commentaire composé uniquement d'emojis de rire face à une situation sérieuse/incohérente est "negative".
- Retournez UNIQUEMENT un objet JSON valide, sans code bloc markdown autour.

FORMAT JSON ATTENDU :
{{
  "overall": {{
    "positive": 60,
    "neutral": 30,
    "negative": 10,
    "avg_quality": 7.5,
    "context_insight": "Explication analytique ici..."
  }},
  "comments_scored": [
    {{"id": "id_du_commentaire", "sentiment": "positive", "quality_score": 8, "toxicity_flag": false}}
  ]
}}"""

            from openai import AsyncAzureOpenAI
            azure_client = AsyncAzureOpenAI(azure_endpoint=endpoint, api_key=api_key, api_version=api_version)
            
            resp = await azure_client.chat.completions.create(
                model=deployment,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            agent_result = json.loads(resp.choices[0].message.content)
            
            # Apply overall metrics
            overall = agent_result.get("overall", {})
            sentiment_data["positive"] = overall.get("positive", 0)
            sentiment_data["neutral"] = overall.get("neutral", 0)
            sentiment_data["negative"] = overall.get("negative", 0)
            sentiment_data["avg_quality"] = overall.get("avg_quality", 5)
            sentiment_data["toxicity_rate"] = overall.get("negative", 0)
            context_insight = overall.get("context_insight", context_insight)
            
            # Apply individual comment scores
            scores_map = {item["id"]: item for item in agent_result.get("comments_scored", [])}
            for c in scraped_comments:
                score_data = scores_map.get(c["id"], {})
                c["sentiment"] = score_data.get("sentiment", "neutral")
                c["quality_score"] = score_data.get("quality_score", 5)
                c["toxicity_flag"] = score_data.get("toxicity_flag", False)
                
            logger.info("[AGENT] Comment analysis complete")
        except Exception as e:
            logger.error(f"[AGENT] Analysis failed: {e}")
            # Fallback naive scoring if agent fails
            for c in scraped_comments:
                c["sentiment"] = "neutral"
                c["quality_score"] = 5

    langs: dict[str, int] = {}
    for c in scraped_comments:
        txt = c.get("text", "")
        if not txt:
            lang = "unknown"
        elif re.search(r"[\u0600-\u06FF]", txt):
            lang = "Arabic/Darija"
        elif re.search(r"\b(je|de|le|la|les|un|une|est|pas|pour|avec|que|qui)\b", txt, re.I):
            lang = "French"
        elif re.search(r"\b(the|is|and|this|you|are|for|that|have|with)\b", txt, re.I):
            lang = "English"
        elif re.match(r"^[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F900-\U0001F9FF\U00002702-\U000027B0\U0000FE00-\U0000FE0F\U0000200D\s]+$", txt):
            lang = "Emoji only"
        else:
            lang = "Other"
        
        c["language"] = lang
        langs[lang] = langs.get(lang, 0) + 1
    
    total_c = len(scraped_comments) or 1
    language_breakdown = [
        {"language": l, "count": cnt, "percentage": round(cnt / total_c * 100)}
        for l, cnt in sorted(langs.items(), key=lambda x: -x[1])
    ]

    likes_count = post_metadata.get("likes_count", 0)
    comments_count = post_metadata.get("comments_count", len(scraped_comments))
    
    context_insight = visual_description if visual_description else (
        f"Instagram post by @{handle}. {len(scraped_comments)} comments were scraped and analyzed for sentiment."
    )

    response_payload = {
        "post": {
            "post_id": post_url,
            "post_url": post_url,
            "display_url": display_url,
            "media_type": media_type,
            "enriched_content": visual_description or f"Post by @{handle}",
            "likes_count": likes_count,
            "comments_count": comments_count,
            "caption": post_metadata.get("caption", ""),
        },
        "influencer": {"name": handle, "handle": handle},
        "content_type": content_type,
        "sentiment": sentiment_data,
        "language_breakdown": language_breakdown,
        "context_insight": context_insight,
        "comments": scraped_comments,
        "ai_generated": False,
        "vision_used": bool(visual_description),
        "is_simulated": False,
        "comments_source": "apify" if scraped_comments else "none",
    }
    
    # Save the analyzed JSON payload
    try:
        import time
        save_dir = BASE_DIR / "data" / "live_analyzed_posts"
        save_dir.mkdir(parents=True, exist_ok=True)
        # Use post ID if available, otherwise timestamp
        safe_id = post_url.split("/")[-2] if "/" in post_url and post_url.split("/")[-2] else str(int(time.time()))
        save_path = save_dir / f"{handle}_{safe_id}.json"
        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(response_payload, f, ensure_ascii=False, indent=2)
        logger.info(f"[IO] Saved live analysis to {save_path}")
    except Exception as e:
        logger.error(f"[IO] Failed to save analysis json: {e}")

    return response_payload


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


@app.get("/api/proxy-image")
async def proxy_image(url: str):
    """Proxy image requests to bypass CORS, with fallback for expired Instagram URLs."""
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": "https://www.instagram.com/",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, headers=headers)
            
            # If Instagram returns 4xx (likely URL Signature Expired), show a placeholder
            if r.status_code != 200:
                return RedirectResponse("https://placehold.co/600x400/1E1E2E/A6ADC8?text=Image+Expired")

            content = r.content
            media_type = r.headers.get("content-type", "image/jpeg")
            
        return Response(content=content, media_type=media_type)

    except Exception as e:
        logger.error(f"Failed to proxy image {url}: {e}")
        # Return fallback on any exception
        return RedirectResponse("https://placehold.co/600x400/1E1E2E/A6ADC8?text=Image+Expired")


import sys
import queue
import asyncio
import re
from fastapi.responses import StreamingResponse

# Global list of active log queues for SSE
active_crew_streams = []

class BroadcastStdout:
    def __init__(self, original_stdout):
        self.original_stdout = original_stdout
        
    def write(self, buf):
        self.original_stdout.write(buf)
        try:
            # Send line by line to all connected clients
            for line in buf.splitlines():
                if line.strip():
                    # Clean up ANSI escape codes (colors) from terminal output
                    clean_line = re.sub(r'\x1B\[[0-?]*[ -/]*[@-~]', '', line).strip()
                    if clean_line:
                        for q in active_crew_streams:
                            try:
                                q.put_nowait(clean_line)
                            except queue.Full:
                                pass
        except Exception:
            pass

    def flush(self):
        self.original_stdout.flush()

@app.get("/api/investigate-logs")
async def stream_investigate_logs():
    """SSE Endpoint to stream CrewAI terminal logs to the frontend."""
    q = queue.Queue(maxsize=100)
    active_crew_streams.append(q)
    
    async def event_generator():
        try:
            while True:
                try:
                    # Non-blocking get with short timeout
                    line = await asyncio.to_thread(q.get, timeout=0.5)
                    if line is None:  # Sentinel value indicating completion
                        yield f"event: done\ndata: Investigation complete\n\n"
                        break
                    yield f"data: {line}\n\n"
                except queue.Empty:
                    # Keep connection alive
                    yield ": keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if q in active_crew_streams:
                active_crew_streams.remove(q)
                
    return StreamingResponse(event_generator(), media_type="text/event-stream")

class InvestigateRequest(BaseModel):
    influencer_name: str
    specific_query: str


class VoiceClientLog(BaseModel):
    level: str = "info"
    message: str
    details: dict | None = None


@app.post("/api/voice-client-log")
async def voice_client_log(payload: VoiceClientLog):
    """Receive frontend voice diagnostics and print them in backend CMD logs."""
    level = payload.level.lower()
    if level == "error":
        logger.error(f"[VOICE-UI] {payload.message} | details={payload.details}")
    elif level in {"warn", "warning"}:
        logger.warning(f"[VOICE-UI] {payload.message} | details={payload.details}")
    else:
        logger.info(f"[VOICE-UI] {payload.message} | details={payload.details}")
    return {"ok": True}


@app.post("/api/investigate-influencer")
async def investigate_influencer(req: InvestigateRequest):
    """Run the VoiceInvestigationCrew to research an influencer via web search & scraping."""
    import asyncio
    name = req.influencer_name.strip()
    query = req.specific_query.strip()
    if not name:
        raise HTTPException(status_code=400, detail="influencer_name is required")

    logger.info(f"[VOICE-CREW] Starting investigation for: {name.encode('utf-8', 'ignore').decode('utf-8')} | Query: {query.encode('utf-8', 'ignore').decode('utf-8')}")

    try:
        def _run_crew():
            from sm_crew.src.sm_crew.voice_crew import VoiceInvestigationCrew
            
            old_stdout = sys.stdout
            sys.stdout = BroadcastStdout(old_stdout)
            try:
                crew_instance = VoiceInvestigationCrew()
                result = crew_instance.crew().kickoff(inputs={
                    "influencer_name": name,
                    "specific_query": query
                })
                return str(result)
            finally:
                sys.stdout = old_stdout
                # Broadcast termination sentinel
                for q in active_crew_streams:
                    try:
                        q.put_nowait(None)
                    except queue.Full:
                        pass

        report = await asyncio.to_thread(_run_crew)
        logger.info(f"[VOICE-CREW] Investigation complete for: {name.encode('utf-8', 'ignore').decode('utf-8')}")

        # Persist the report
        save_dir = BASE_DIR / "data" / "voice_investigations"
        save_dir.mkdir(parents=True, exist_ok=True)
        safe_name = name.replace(" ", "_").replace("/", "_")
        save_path = save_dir / f"{safe_name}.md"
        with open(save_path, "w", encoding="utf-8") as f:
            f.write(report)

        return {"influencer_name": name, "report": report}

    except Exception as e:
        logger.error(f"[VOICE-CREW] Investigation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
