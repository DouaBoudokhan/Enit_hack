"""
Pipeline A entry point.
Accepts influencer_data dict and product_description string,
runs the CrewAI crew, parses and returns the structured result.
"""

import json
import re

from dotenv import load_dotenv

from src.mycrew.crew import create_crew


def _extract_json(text: str) -> dict:
    """
    Extract a JSON object from LLM output text.
    Handles markdown code fences and extra surrounding text.
    """
    # Try to find JSON in code fences first
    fence_match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", text)
    if fence_match:
        text = fence_match.group(1).strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find the first { ... } block
    brace_match = re.search(r"\{[\s\S]*\}", text)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass

    # Return raw text wrapped in a dict as fallback
    return {"raw_output": text}


def run_pipeline_a(influencer_data: dict, product_description: str = "") -> dict:
    """
    Run Pipeline A (CrewAI crew) for a single influencer.

    Args:
        influencer_data: Full influencer record dict from scraper
        product_description: Optional product description string

    Returns:
        Structured result dict with profile card and optional match data
    """
    load_dotenv()

    crew = create_crew()

    inputs = {
        "influencer_data": json.dumps(influencer_data, ensure_ascii=False, indent=2),
        "product_description": product_description or "",
    }

    result = crew.kickoff(inputs=inputs)

    # Parse the raw output
    raw_output = str(result)
    parsed = _extract_json(raw_output)

    # If the result contains both profile and match data, merge them
    if "match_percentage" in parsed and "CQS" in parsed:
        return parsed

    # If we got a profile card, check if match was also produced
    if "CQS" in parsed:
        profile_card = parsed
        # Match data might be in the raw output as a separate JSON
        if product_description:
            # Try to find match data after the profile card
            all_json_blocks = re.findall(r"\{[^{}]*\}", raw_output)
            for block in all_json_blocks:
                try:
                    candidate = json.loads(block)
                    if "match_percentage" in candidate:
                        profile_card["match_percentage"] = candidate["match_percentage"]
                        profile_card["fit_reason"] = candidate.get("fit_reason", "")
                        break
                except json.JSONDecodeError:
                    continue
        return profile_card

    return parsed


if __name__ == "__main__":
    load_dotenv()
    import sys

    # Quick test
    test_data = {
        "name": "Test",
        "handle": "test",
        "category": "Test",
        "profile_url": "",
        "image_url": "",
        "follower_count": 1000,
        "bio": "Test bio",
        "posts": [],
    }
    result = run_pipeline_a(test_data, "Test product")
    print(json.dumps(result, indent=2, ensure_ascii=False))
