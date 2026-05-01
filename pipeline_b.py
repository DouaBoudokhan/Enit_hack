"""
Pipeline B — standalone product matching module (no CrewAI).
Finds the top 3 best-matching influencers from pre-scraped records.
"""

import base64
import json
import math
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import AzureOpenAI

from azure_config import normalize_azure_endpoint

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "influencers_scraped.json"
DOMAINS_CACHE_FILE = BASE_DIR / "data" / "domains_cache.json"


def _get_client() -> AzureOpenAI:
    """Create an AzureOpenAI client."""
    return AzureOpenAI(
        azure_endpoint=normalize_azure_endpoint(os.environ["AZURE_OPENAI_ENDPOINT"]),
        api_key=os.environ["AZURE_OPENAI_API_KEY"],
        api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    )


def _load_influencers() -> list[dict]:
    """Load all influencer records."""
    if not DATA_FILE.exists():
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


def _load_domains_cache() -> dict:
    """Load the domains cache."""
    if not DOMAINS_CACHE_FILE.exists():
        return {}
    with open(DOMAINS_CACHE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_domains_cache(cache: dict) -> None:
    """Save the domains cache."""
    DOMAINS_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DOMAINS_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def _infer_domain_for_influencer(client: AzureOpenAI, influencer: dict) -> dict:
    """
    Call GPT-4o to infer domain profile from an influencer's posts.
    Returns {"primary": "...", "secondary": ["...", ...]}
    """
    deployment = os.environ["AZURE_OPENAI_DEPLOYMENT_NAME"]
    enriched_texts = []
    for post in influencer.get("posts", [])[:10]:
        ec = post.get("enriched_content", "")
        if ec:
            enriched_texts.append(ec)

    if not enriched_texts:
        return {"primary": "unknown", "secondary": []}

    numbered = "\n".join(f"{i+1}. {t}" for i, t in enumerate(enriched_texts))
    prompt = f"""Analyze these {len(enriched_texts)} social media posts from influencer "{influencer.get('name', '')}" (category: {influencer.get('category', 'Unknown')}) and determine their content domain profile.

Posts:
{numbered}

Return ONLY a JSON object with:
- "primary": the single most dominant content niche (e.g. fashion, beauty, lifestyle, food, travel, fitness, tech, entertainment, family, culture)
- "secondary": array of up to 3 other relevant niches

Return only valid JSON, no markdown."""

    response = client.chat.completions.create(
        model=deployment,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=200,
    )

    text = response.choices[0].message.content.strip()
    try:
        # Try to parse JSON from response
        if text.startswith("```"):
            import re
            match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", text)
            if match:
                text = match.group(1).strip()
        return json.loads(text)
    except json.JSONDecodeError:
        return {"primary": "unknown", "secondary": []}


def _ensure_domains_cached(client: AzureOpenAI, influencers: list[dict]) -> dict:
    """
    Ensure all influencers have their domains cached.
    Returns the full domains cache.
    """
    cache = _load_domains_cache()
    updated = False

    for inf in influencers:
        handle = inf.get("handle", "")
        if handle and handle not in cache:
            domain = _infer_domain_for_influencer(client, inf)
            cache[handle] = domain
            updated = True

    if updated:
        _save_domains_cache(cache)

    return cache


def _describe_product_image(client: AzureOpenAI, image_path: str) -> str:
    """Call GPT-4o Vision to describe a product image."""
    deployment = os.environ["AZURE_OPENAI_DEPLOYMENT_NAME"]

    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    # Determine mime type
    ext = Path(image_path).suffix.lower()
    mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
    mime_type = mime_map.get(ext, "image/jpeg")

    response = client.chat.completions.create(
        model=deployment,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Describe this product in 2-3 sentences. Focus on what the product is, its category, target audience, and key features visible in the image.",
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{image_data}"},
                    },
                ],
            }
        ],
        max_tokens=300,
    )
    return response.choices[0].message.content.strip()


def _compute_cqs_b(influencer: dict, domains_cache: dict, product_niche: str) -> float:
    """
    Compute CQS_B for an influencer based on static fields.
    """
    # Platform score: we only have Instagram data, so default to 0.6
    platform_score = 0.6

    # Reach score: normalize follower_count on log scale
    # 16.7M → 1.0, 100K → 0.4
    follower_count = influencer.get("follower_count", 0)
    if follower_count <= 0:
        reach_score = 0.0
    else:
        # log(100_000) ≈ 11.51, log(16_700_000) ≈ 16.63
        log_followers = math.log(follower_count)
        log_min = math.log(100_000)   # 11.51
        log_max = math.log(16_700_000)  # 16.63
        # Linear interpolation: 100K→0.4, 16.7M→1.0
        if log_followers <= log_min:
            reach_score = 0.4
        elif log_followers >= log_max:
            reach_score = 1.0
        else:
            reach_score = 0.4 + (log_followers - log_min) / (log_max - log_min) * 0.6

    # Category bonus
    handle = influencer.get("handle", "")
    domain = domains_cache.get(handle, {})
    primary = domain.get("primary", "").lower()
    secondary = [s.lower() for s in domain.get("secondary", [])]
    product_niche_lower = product_niche.lower() if product_niche else ""

    category_bonus = 0.0
    if product_niche_lower and (
        product_niche_lower == primary
        or product_niche_lower in secondary
        or influencer.get("category", "").lower() == product_niche_lower
    ):
        category_bonus = 0.1

    cqs_b = (platform_score * 0.3 + reach_score * 0.5 + category_bonus * 0.2) * 100
    return round(cqs_b, 1)


def _match_all_influencers(
    client: AzureOpenAI,
    product_description: str,
    influencers: list[dict],
    domains_cache: dict,
) -> list[dict]:
    """
    Build a single prompt to score all influencers against the product.
    Returns list of dicts with match_percentage and fit_reason per influencer.
    """
    deployment = os.environ["AZURE_OPENAI_DEPLOYMENT_NAME"]

    # Build influencer profiles for the prompt
    profiles = []
    for inf in influencers:
        handle = inf.get("handle", "")
        domain = domains_cache.get(handle, {"primary": "unknown", "secondary": []})
        profiles.append(
            f"- {inf.get('name', handle)} (@{handle}): "
            f"Category={inf.get('category', 'Unknown')}, "
            f"Followers={inf.get('follower_count', 0):,}, "
            f"Primary niche={domain.get('primary', 'unknown')}, "
            f"Secondary niches={', '.join(domain.get('secondary', []))}"
        )

    profiles_text = "\n".join(profiles)

    prompt = f"""You are a brand-influencer matching expert. Given this product description and these influencer profiles, score each influencer's fit from 0-100 and provide a one-sentence fit reason for each.

PRODUCT DESCRIPTION:
{product_description}

INFLUENCER PROFILES:
{profiles_text}

Reason comparatively across all influencers. Consider how well each influencer's content domain, category, and audience align with the product.

Return ONLY a JSON array where each element has:
- "handle": the influencer's handle
- "match_percentage": integer 0-100
- "fit_reason": one sentence
- "product_niche": the primary product niche you identified (same for all entries)

Return only valid JSON, no markdown."""

    response = client.chat.completions.create(
        model=deployment,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1000,
    )

    text = response.choices[0].message.content.strip()

    # Parse JSON
    import re
    if text.startswith("```"):
        fence_match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", text)
        if fence_match:
            text = fence_match.group(1).strip()

    try:
        results = json.loads(text)
        if isinstance(results, list):
            return results
    except json.JSONDecodeError:
        # Try to find array in text
        bracket_match = re.search(r"\[[\s\S]*\]", text)
        if bracket_match:
            try:
                return json.loads(bracket_match.group(0))
            except json.JSONDecodeError:
                pass

    return []


def match_product(product_input: str) -> list[dict]:
    """
    Main entry point for Pipeline B.

    Args:
        product_input: either a text description or a file path to a product image

    Returns:
        Top 3 influencer matches with scores and reasons
    """
    load_dotenv()
    client = _get_client()

    # Determine if input is an image path or text
    input_path = Path(product_input)
    if input_path.exists() and input_path.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
        product_description = _describe_product_image(client, str(input_path))
    else:
        product_description = product_input

    # Load influencers
    influencers = _load_influencers()
    if not influencers:
        return []

    # Ensure domains are cached
    domains_cache = _ensure_domains_cached(client, influencers)

    # Get LLM match scores for all influencers
    match_results = _match_all_influencers(client, product_description, influencers, domains_cache)

    # Extract product niche from first result
    product_niche = ""
    if match_results:
        product_niche = match_results[0].get("product_niche", "")

    # Build result records
    results = []
    match_by_handle = {m.get("handle", "").lower(): m for m in match_results}

    for inf in influencers:
        handle = inf.get("handle", "")
        match_data = match_by_handle.get(handle.lower(), {})
        domain = domains_cache.get(handle, {"primary": "unknown", "secondary": []})
        cqs_b = _compute_cqs_b(inf, domains_cache, product_niche)

        results.append({
            "name": inf.get("name", handle),
            "handle": handle,
            "category": inf.get("category", "Unknown"),
            "profile_url": inf.get("profile_url", ""),
            "image_url": inf.get("image_url", ""),
            "follower_count": inf.get("follower_count", 0),
            "inferred_domain": domain,
            "match_percentage": match_data.get("match_percentage", 0),
            "CQS_B": cqs_b,
            "fit_reason": match_data.get("fit_reason", "No match data available."),
        })

    # Sort by match_percentage descending, return top 3
    results.sort(key=lambda x: x["match_percentage"], reverse=True)
    return results[:3]


if __name__ == "__main__":
    load_dotenv()
    import sys

    if len(sys.argv) > 1:
        result = match_product(sys.argv[1])
    else:
        result = match_product("Premium skincare brand targeting young women in Tunisia")

    print(json.dumps(result, indent=2, ensure_ascii=False))
