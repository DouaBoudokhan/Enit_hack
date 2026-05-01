"""
Top-level router — main.py
Three modes: search, url, product.
"""

import json
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

# Ensure src is on the path
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from src.scraper import get_influencer, _load_data, _extract_handle_from_url
from src.mycrew.main import run_pipeline_a
from pipeline_b import match_product


def _fuzzy_match_handle(name: str, data: list[dict]) -> str | None:
    """
    Fuzzy-match a name string against handles and names in the data.
    Returns the best matching handle, or None.
    """
    name_lower = name.lower().strip()

    # Exact handle match
    for record in data:
        if record.get("handle", "").lower() == name_lower:
            return record["handle"]

    # Exact name match
    for record in data:
        if record.get("name", "").lower() == name_lower:
            return record["handle"]

    # Partial match in name
    for record in data:
        rec_name = record.get("name", "").lower()
        if name_lower in rec_name or rec_name in name_lower:
            return record["handle"]

    # Partial match in handle
    for record in data:
        rec_handle = record.get("handle", "").lower()
        if name_lower in rec_handle or rec_handle in name_lower:
            return record["handle"]

    # Split name into parts and check each
    name_parts = name_lower.split()
    for record in data:
        rec_name = record.get("name", "").lower()
        rec_handle = record.get("handle", "").lower()
        for part in name_parts:
            if len(part) > 2 and (part in rec_name or part in rec_handle):
                return record["handle"]

    return None


def run(mode: str, **kwargs) -> dict | list[dict]:
    """
    Main router function.

    Args:
        mode: "search", "url", or "product"
        **kwargs:
            - name: str (for mode="search")
            - profile_url: str (for mode="url")
            - product_input: str (for mode="product")
            - product_description: str (optional, for mode="search" and "url")

    Returns:
        Structured result dict (Pipeline A) or list of dicts (Pipeline B)
    """
    load_dotenv()

    if mode == "search":
        name = kwargs.get("name", "")
        product_description = kwargs.get("product_description", "")

        if not name:
            raise ValueError("Name is required for search mode")

        data = _load_data()
        handle = _fuzzy_match_handle(name, data)

        if not handle:
            # Try using the name directly as a handle
            handle = name.lower().strip().replace(" ", "_")

        influencer_data = get_influencer(handle)
        result = run_pipeline_a(influencer_data, product_description)
        return result

    elif mode == "url":
        profile_url = kwargs.get("profile_url", "")
        product_description = kwargs.get("product_description", "")

        if not profile_url:
            raise ValueError("Profile URL is required for URL mode")

        handle = _extract_handle_from_url(profile_url)
        influencer_data = get_influencer(handle, profile_url=profile_url)
        result = run_pipeline_a(influencer_data, product_description)
        return result

    elif mode == "product":
        product_input = kwargs.get("product_input", "")

        if not product_input:
            raise ValueError("Product input is required for product mode")

        results = match_product(product_input)
        return results

    else:
        raise ValueError(f"Unknown mode: {mode}. Use 'search', 'url', or 'product'.")


if __name__ == "__main__":
    load_dotenv()

    # Simple CLI for testing
    print("ENIT_HACK — AI Influencer Intelligence Platform")
    print("Modes: search, url, product")
    mode = input("Enter mode: ").strip().lower()

    if mode == "search":
        name = input("Enter influencer name: ").strip()
        product = input("Enter product description (optional): ").strip()
        result = run(mode="search", name=name, product_description=product)
    elif mode == "url":
        url = input("Enter Instagram profile URL: ").strip()
        product = input("Enter product description (optional): ").strip()
        result = run(mode="url", profile_url=url, product_description=product)
    elif mode == "product":
        product = input("Enter product description or image path: ").strip()
        result = run(mode="product", product_input=product)
    else:
        print(f"Unknown mode: {mode}")
        sys.exit(1)

    print("\n--- Result ---\n")
    print(json.dumps(result, indent=2, ensure_ascii=False))
