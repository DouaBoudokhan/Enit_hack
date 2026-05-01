import re


def normalize_azure_endpoint(endpoint: str) -> str:
    endpoint = (endpoint or "").strip().rstrip("/")
    if not endpoint:
        return ""

    match = re.match(r"^https?://([^.]+)\.cognitiveservices\.azure\.com$", endpoint)
    if match:
        return f"https://{match.group(1)}.openai.azure.com"

    return endpoint
