"""
ENIT HACK — Streamlit UI
AI-powered influencer intelligence platform for the North African market.
"""

import json
import sys
import tempfile
from pathlib import Path

import streamlit as st
from dotenv import load_dotenv

# Ensure project root is on path
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from main import run

load_dotenv()

# ───────────────────────── Page Config ─────────────────────────
st.set_page_config(
    layout="wide",
    page_title="ENIT HACK",
    page_icon="🎯",
    initial_sidebar_state="expanded",
)

# ───────────────────────── Custom CSS (Dark Theme) ─────────────────────────
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

    /* Global dark theme */
    .stApp {
        background: linear-gradient(135deg, #0a0a1a 0%, #0d1117 40%, #161b22 100%);
        font-family: 'Inter', sans-serif;
    }

    /* Sidebar styling */
    section[data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
        border-right: 1px solid rgba(88, 166, 255, 0.1);
    }
    section[data-testid="stSidebar"] .stRadio label {
        color: #e6edf3 !important;
        font-weight: 500;
    }

    /* Hero header */
    .hero-header {
        text-align: center;
        padding: 2rem 0 1rem 0;
        background: linear-gradient(135deg, rgba(88, 166, 255, 0.05) 0%, rgba(136, 87, 255, 0.05) 100%);
        border-radius: 16px;
        border: 1px solid rgba(88, 166, 255, 0.08);
        margin-bottom: 2rem;
    }
    .hero-header h1 {
        background: linear-gradient(135deg, #58a6ff, #8857ff, #da70d6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.8rem;
        font-weight: 900;
        letter-spacing: -1px;
        margin-bottom: 0.3rem;
    }
    .hero-header p {
        color: #8b949e;
        font-size: 1.05rem;
        font-weight: 400;
    }

    /* Profile card */
    .profile-card {
        background: linear-gradient(135deg, rgba(22, 27, 34, 0.9) 0%, rgba(13, 17, 23, 0.95) 100%);
        border: 1px solid rgba(88, 166, 255, 0.12);
        border-radius: 20px;
        padding: 2rem;
        margin: 1rem 0;
        backdrop-filter: blur(20px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(88, 166, 255, 0.05);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .profile-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(88, 166, 255, 0.08), inset 0 1px 0 rgba(88, 166, 255, 0.1);
    }

    /* Metric cards */
    .metric-card {
        background: rgba(22, 27, 34, 0.8);
        border: 1px solid rgba(88, 166, 255, 0.08);
        border-radius: 14px;
        padding: 1.2rem;
        text-align: center;
        transition: all 0.3s ease;
    }
    .metric-card:hover {
        border-color: rgba(88, 166, 255, 0.2);
        background: rgba(22, 27, 34, 0.95);
    }
    .metric-value {
        font-size: 2rem;
        font-weight: 800;
        margin: 0.3rem 0;
    }
    .metric-label {
        color: #8b949e;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    /* CQS colors */
    .cqs-green { color: #3fb950; text-shadow: 0 0 20px rgba(63, 185, 80, 0.3); }
    .cqs-yellow { color: #d29922; text-shadow: 0 0 20px rgba(210, 153, 34, 0.3); }
    .cqs-red { color: #f85149; text-shadow: 0 0 20px rgba(248, 81, 73, 0.3); }

    /* Badge styles */
    .badge {
        display: inline-block;
        padding: 0.3rem 0.9rem;
        border-radius: 20px;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }
    .badge-healthy {
        background: rgba(63, 185, 80, 0.12);
        color: #3fb950;
        border: 1px solid rgba(63, 185, 80, 0.25);
    }
    .badge-moderate {
        background: rgba(210, 153, 34, 0.12);
        color: #d29922;
        border: 1px solid rgba(210, 153, 34, 0.25);
    }
    .badge-at-risk {
        background: rgba(248, 81, 73, 0.12);
        color: #f85149;
        border: 1px solid rgba(248, 81, 73, 0.25);
    }
    .badge-high {
        background: rgba(88, 166, 255, 0.12);
        color: #58a6ff;
        border: 1px solid rgba(88, 166, 255, 0.25);
    }
    .badge-medium {
        background: rgba(136, 87, 255, 0.12);
        color: #8857ff;
        border: 1px solid rgba(136, 87, 255, 0.25);
    }
    .badge-low {
        background: rgba(139, 148, 158, 0.12);
        color: #8b949e;
        border: 1px solid rgba(139, 148, 158, 0.25);
    }

    /* Domain tags */
    .domain-tag {
        display: inline-block;
        padding: 0.25rem 0.7rem;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 600;
        margin: 0.15rem;
        background: rgba(136, 87, 255, 0.1);
        color: #c4a0ff;
        border: 1px solid rgba(136, 87, 255, 0.2);
    }
    .domain-tag.primary {
        background: rgba(88, 166, 255, 0.15);
        color: #79c0ff;
        border: 1px solid rgba(88, 166, 255, 0.3);
    }

    /* Language pills */
    .lang-pill {
        display: inline-block;
        padding: 0.2rem 0.6rem;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 500;
        margin: 0.1rem;
        background: rgba(22, 27, 34, 0.9);
        color: #e6edf3;
        border: 1px solid rgba(88, 166, 255, 0.1);
    }

    /* Progress bar override */
    .stProgress > div > div > div > div {
        background: linear-gradient(90deg, #58a6ff, #8857ff) !important;
        border-radius: 10px;
    }

    /* Influencer image */
    .influencer-img {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        border: 3px solid rgba(88, 166, 255, 0.3);
        object-fit: cover;
        box-shadow: 0 4px 20px rgba(88, 166, 255, 0.15);
    }

    /* Match card for Pipeline B */
    .match-card {
        background: linear-gradient(135deg, rgba(22, 27, 34, 0.9) 0%, rgba(13, 17, 23, 0.95) 100%);
        border: 1px solid rgba(136, 87, 255, 0.12);
        border-radius: 20px;
        padding: 1.5rem;
        text-align: center;
        transition: all 0.3s ease;
        height: 100%;
    }
    .match-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(136, 87, 255, 0.1);
        border-color: rgba(136, 87, 255, 0.25);
    }

    /* Fit reason */
    .fit-reason {
        background: rgba(88, 166, 255, 0.05);
        border-left: 3px solid #58a6ff;
        padding: 0.8rem 1rem;
        border-radius: 0 8px 8px 0;
        color: #c9d1d9;
        font-size: 0.9rem;
        font-style: italic;
        margin-top: 0.8rem;
    }

    /* Hide default streamlit elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    /* Input styling */
    .stTextInput > div > div > input,
    .stTextArea > div > div > textarea {
        background: rgba(22, 27, 34, 0.8) !important;
        border: 1px solid rgba(88, 166, 255, 0.15) !important;
        color: #e6edf3 !important;
        border-radius: 10px !important;
        font-family: 'Inter', sans-serif !important;
    }
    .stTextInput > div > div > input:focus,
    .stTextArea > div > div > textarea:focus {
        border-color: rgba(88, 166, 255, 0.4) !important;
        box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1) !important;
    }

    /* Button styling */
    .stButton > button {
        background: linear-gradient(135deg, #58a6ff, #8857ff) !important;
        color: white !important;
        border: none !important;
        border-radius: 10px !important;
        font-weight: 600 !important;
        font-family: 'Inter', sans-serif !important;
        padding: 0.5rem 2rem !important;
        transition: all 0.3s ease !important;
    }
    .stButton > button:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 20px rgba(88, 166, 255, 0.3) !important;
    }

    /* Download button styling */
    .stDownloadButton > button {
        background: rgba(63, 185, 80, 0.15) !important;
        color: #3fb950 !important;
        border: 1px solid rgba(63, 185, 80, 0.3) !important;
        border-radius: 10px !important;
        font-weight: 600 !important;
    }
    .stDownloadButton > button:hover {
        background: rgba(63, 185, 80, 0.25) !important;
    }
</style>
""", unsafe_allow_html=True)


# ───────────────────────── Helper Functions ─────────────────────────

def get_cqs_color_class(cqs: float) -> str:
    """Return CSS class based on CQS value."""
    if cqs > 70:
        return "cqs-green"
    elif cqs >= 40:
        return "cqs-yellow"
    else:
        return "cqs-red"


def get_health_badge_class(health: str) -> str:
    """Return badge CSS class for audience health."""
    h = health.lower()
    if h == "healthy":
        return "badge-healthy"
    elif h == "moderate":
        return "badge-moderate"
    else:
        return "badge-at-risk"


def get_engagement_badge_class(depth: str) -> str:
    """Return badge CSS class for engagement depth."""
    d = depth.lower()
    if d == "high":
        return "badge-high"
    elif d == "medium":
        return "badge-medium"
    else:
        return "badge-low"


def format_followers(count: int) -> str:
    """Format follower count for display."""
    if count >= 1_000_000:
        return f"{count / 1_000_000:.1f}M"
    elif count >= 1_000:
        return f"{count / 1_000:.1f}K"
    return str(count)


def display_cqs_metric(label: str, value: float):
    """Display a CQS metric with color coding."""
    color_class = get_cqs_color_class(value)
    if value > 70:
        st.success(f"**{label}:** {value:.1f}")
    elif value >= 40:
        st.warning(f"**{label}:** {value:.1f}")
    else:
        st.error(f"**{label}:** {value:.1f}")


def render_domain_tags(domain: dict) -> str:
    """Render domain tags as HTML."""
    primary = domain.get("primary", "unknown")
    secondary = domain.get("secondary", [])
    tags = f'<span class="domain-tag primary">{primary}</span>'
    for s in secondary:
        tags += f' <span class="domain-tag">{s}</span>'
    return tags


def render_language_pills(languages: list) -> str:
    """Render language pills as HTML."""
    pills = ""
    for lang in languages:
        pills += f'<span class="lang-pill">{lang}</span> '
    return pills


# ───────────────────────── Profile Card Display (Pipeline A) ─────────────────────────

def display_profile_card(result: dict):
    """Display the full influencer profile card from Pipeline A."""
    st.markdown('<div class="profile-card">', unsafe_allow_html=True)

    # Top section: image + basic info
    col_img, col_info = st.columns([1, 3])

    with col_img:
        image_url = result.get("image_url", "")
        if image_url:
            st.markdown(
                f'<img src="{image_url}" class="influencer-img" alt="Profile">',
                unsafe_allow_html=True,
            )
        else:
            st.markdown("🧑‍💼", unsafe_allow_html=True)

    with col_info:
        name = result.get("name", "Unknown")
        handle = result.get("handle", "")
        category = result.get("category", "")
        followers = result.get("follower_count", 0)

        st.markdown(f"### {name}")
        st.markdown(f"**@{handle}** · {category} · **{format_followers(followers)}** followers")

        # Domain tags
        domain = result.get("inferred_domain", {})
        if domain:
            st.markdown(render_domain_tags(domain), unsafe_allow_html=True)

    st.markdown("---")

    # Metrics row
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        cqs = result.get("CQS", 0)
        display_cqs_metric("🎯 CQS", cqs)

    with col2:
        health = result.get("audience_health", "Unknown")
        badge_class = get_health_badge_class(health)
        st.markdown(
            f'**Audience Health**<br><span class="badge {badge_class}">{health}</span>',
            unsafe_allow_html=True,
        )

    with col3:
        depth = result.get("engagement_depth", "Unknown")
        badge_class = get_engagement_badge_class(depth)
        st.markdown(
            f'**Engagement Depth**<br><span class="badge {badge_class}">{depth}</span>',
            unsafe_allow_html=True,
        )

    with col4:
        toxicity = result.get("toxicity_rate", 0)
        total_comments = result.get("total_comments_analyzed", 0)
        st.metric("Toxicity Rate", f"{toxicity:.1%}")
        st.caption(f"{total_comments} comments analyzed")

    # Languages
    languages = result.get("top_languages", [])
    if languages:
        st.markdown("**Top Languages**")
        st.markdown(render_language_pills(languages), unsafe_allow_html=True)

    # Match percentage (only if present)
    match_pct = result.get("match_percentage")
    if match_pct is not None and match_pct is not False:
        st.markdown("---")
        st.markdown("**🤝 Brand Match**")
        st.progress(int(match_pct) / 100)
        st.markdown(f"**{match_pct}%** match score")

        fit_reason = result.get("fit_reason", "")
        if fit_reason:
            st.markdown(
                f'<div class="fit-reason">💡 {fit_reason}</div>',
                unsafe_allow_html=True,
            )

    st.markdown('</div>', unsafe_allow_html=True)


# ───────────────────────── Match Cards Display (Pipeline B) ─────────────────────────

def display_match_cards(results: list[dict]):
    """Display top 3 influencer match cards from Pipeline B."""
    if not results:
        st.warning("No matches found. Make sure influencer data exists.")
        return

    cols = st.columns(min(len(results), 3))

    for idx, (col, result) in enumerate(zip(cols, results[:3])):
        with col:
            st.markdown('<div class="match-card">', unsafe_allow_html=True)

            # Rank badge
            rank_emoji = ["🥇", "🥈", "🥉"][idx] if idx < 3 else f"#{idx+1}"
            st.markdown(f"### {rank_emoji}")

            # Image
            image_url = result.get("image_url", "")
            if image_url:
                st.markdown(
                    f'<img src="{image_url}" class="influencer-img" alt="Profile">',
                    unsafe_allow_html=True,
                )

            # Info
            name = result.get("name", "Unknown")
            category = result.get("category", "")
            followers = result.get("follower_count", 0)

            st.markdown(f"**{name}**")
            st.caption(f"{category} · {format_followers(followers)} followers")

            # Domain tags
            domain = result.get("inferred_domain", {})
            if domain:
                st.markdown(render_domain_tags(domain), unsafe_allow_html=True)

            st.markdown("")

            # Match percentage
            match_pct = result.get("match_percentage", 0)
            st.markdown(f"**Match: {match_pct}%**")
            st.progress(int(match_pct) / 100)

            # CQS_B
            cqs_b = result.get("CQS_B", 0)
            display_cqs_metric("CQS", cqs_b)

            # Fit reason
            fit_reason = result.get("fit_reason", "")
            if fit_reason:
                st.markdown(
                    f'<div class="fit-reason">💡 {fit_reason}</div>',
                    unsafe_allow_html=True,
                )

            st.markdown('</div>', unsafe_allow_html=True)


# ───────────────────────── Sidebar ─────────────────────────

with st.sidebar:
    st.markdown("## 🎯 ENIT HACK")
    st.markdown("AI-Powered Influencer Intelligence")
    st.markdown("---")

    mode = st.radio(
        "Select Mode",
        ["🔍 Smart Search", "🔗 Paste URL", "🛍️ Product Match"],
        index=0,
        key="mode_selector",
    )

    st.markdown("---")
    st.markdown(
        '<p style="color: #8b949e; font-size: 0.75rem;">Built for the North African market<br>Tunisia focus 🇹🇳</p>',
        unsafe_allow_html=True,
    )


# ───────────────────────── Header ─────────────────────────

st.markdown("""
<div class="hero-header">
    <h1>ENIT HACK</h1>
    <p>AI-Powered Influencer Intelligence Platform for North Africa</p>
</div>
""", unsafe_allow_html=True)


# ───────────────────────── Main Content ─────────────────────────

if mode == "🔍 Smart Search":
    st.markdown("### 🔍 Smart Search")
    st.markdown("Search for an influencer by name and get a full analysis.")

    col_input1, col_input2 = st.columns(2)
    with col_input1:
        search_name = st.text_input(
            "Influencer Name",
            placeholder="e.g., Dorra Zarrouk",
            key="search_name",
        )
    with col_input2:
        search_product = st.text_input(
            "Product Description (optional)",
            placeholder="e.g., Premium skincare brand targeting young women",
            key="search_product",
        )

    if st.button("🚀 Analyze", key="search_btn", use_container_width=True):
        if not search_name:
            st.error("Please enter an influencer name.")
        else:
            with st.spinner("🔄 Analyzing influencer..."):
                try:
                    result = run(
                        mode="search",
                        name=search_name,
                        product_description=search_product,
                    )
                    st.session_state["last_result"] = result
                    display_profile_card(result)

                    # Export button
                    st.markdown("---")
                    st.download_button(
                        label="📥 Export Results as JSON",
                        data=json.dumps(result, indent=2, ensure_ascii=False),
                        file_name="enit_hack_results.json",
                        mime="application/json",
                        key="export_search",
                    )
                except Exception as e:
                    st.error(f"Error: {e}")

elif mode == "🔗 Paste URL":
    st.markdown("### 🔗 Paste URL")
    st.markdown("Paste an Instagram profile URL for full analysis.")

    col_input1, col_input2 = st.columns(2)
    with col_input1:
        url_input = st.text_input(
            "Instagram Profile URL",
            placeholder="https://www.instagram.com/username/",
            key="url_input",
        )
    with col_input2:
        url_product = st.text_input(
            "Product Description (optional)",
            placeholder="e.g., Premium skincare brand targeting young women",
            key="url_product",
        )

    if st.button("🚀 Analyze", key="url_btn", use_container_width=True):
        if not url_input:
            st.error("Please enter an Instagram profile URL.")
        else:
            with st.spinner("🔄 Analyzing influencer..."):
                try:
                    result = run(
                        mode="url",
                        profile_url=url_input,
                        product_description=url_product,
                    )
                    st.session_state["last_result"] = result
                    display_profile_card(result)

                    # Export button
                    st.markdown("---")
                    st.download_button(
                        label="📥 Export Results as JSON",
                        data=json.dumps(result, indent=2, ensure_ascii=False),
                        file_name="enit_hack_results.json",
                        mime="application/json",
                        key="export_url",
                    )
                except Exception as e:
                    st.error(f"Error: {e}")

elif mode == "🛍️ Product Match":
    st.markdown("### 🛍️ Product Match")
    st.markdown("Find the best influencer matches for your product.")

    input_type = st.radio(
        "Input Type",
        ["📝 Text Description", "🖼️ Upload Image"],
        horizontal=True,
        key="product_input_type",
    )

    product_input_value = None

    if input_type == "📝 Text Description":
        product_text = st.text_area(
            "Product Description",
            placeholder="Describe your product, brand, or campaign...",
            height=120,
            key="product_text",
        )
        if product_text:
            product_input_value = product_text

    else:
        uploaded_file = st.file_uploader(
            "Upload Product Image",
            type=["jpg", "jpeg", "png"],
            key="product_image",
        )
        if uploaded_file:
            st.image(uploaded_file, caption="Uploaded product image", width=300)
            # Save to temp file
            suffix = Path(uploaded_file.name).suffix
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
            tmp.write(uploaded_file.getbuffer())
            tmp.close()
            product_input_value = tmp.name

    if st.button("🚀 Find Matches", key="product_btn", use_container_width=True):
        if not product_input_value:
            st.error("Please provide a product description or upload an image.")
        else:
            with st.spinner("🔄 Finding best matches..."):
                try:
                    results = run(mode="product", product_input=product_input_value)
                    st.session_state["last_result"] = results
                    display_match_cards(results)

                    # Export button
                    st.markdown("---")
                    st.download_button(
                        label="📥 Export Results as JSON",
                        data=json.dumps(results, indent=2, ensure_ascii=False),
                        file_name="enit_hack_results.json",
                        mime="application/json",
                        key="export_product",
                    )
                except Exception as e:
                    st.error(f"Error: {e}")
