"""
News Service — Fetches articles from GNews API (gnews.io)

Switched from NewsAPI.org (localhost-only on free tier) to GNews API
which allows production deployment on the free plan.

GNews Free Tier: 100 requests/day, works from any server.
"""

import os
import requests


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
GNEWS_BASE_URL = "https://gnews.io/api/v4/search"
DEFAULT_PAGE_SIZE = 12  # Number of articles per page


def get_news(query: str, sort_by: str = "relevance", page: int = 1, page_size: int = DEFAULT_PAGE_SIZE) -> dict:
    """
    Fetch news articles from GNews API.

    Args:
        query:     Search keyword(s), e.g. "technology"
        sort_by:   One of "relevance", "publishedAt"
        page:      Page number (1-indexed)
        page_size: Number of results per page (max 100 on free tier)

    Returns:
        dict with keys: status, totalResults, articles, error (if any)
    """
    api_key = os.getenv("GNEWS_API_KEY")

    if not api_key:
        return {
            "status": "error",
            "error": "GNEWS_API_KEY environment variable is not set. "
                     "Please add it to your .env file.",
            "totalResults": 0,
            "articles": [],
        }

    # GNews Free Tier Limitation:
    # Sorting by "relevance" ranks articles of all time. Since the Free plan restricts
    # access to articles newer than 30 days, sorting by relevance results in GNews returning
    # 0 articles (as the top relevant articles are older than 30 days and get stripped by their server).
    # To ensure the user always gets results, we force sorting by "publishedAt" (Newest First).
    sort_by = "publishedAt"

    params = {
        "q": query,
        "sortby": sort_by,
        "page": page,
        "max": page_size,
        "apikey": api_key,
        "lang": "en",
    }

    try:
        response = requests.get(GNEWS_BASE_URL, params=params, timeout=10)
        data = response.json()

        # GNews returns a dictionary with 'errors' key on failure
        if "errors" in data:
            errors = data.get("errors")
            if isinstance(errors, list):
                err_msg = ", ".join(errors)
            elif isinstance(errors, dict):
                err_msg = ", ".join([f"{k}: {v}" for k, v in errors.items()])
            else:
                err_msg = str(errors)

            return {
                "status": "error",
                "error": f"Error from GNews API: {err_msg}",
                "totalResults": 0,
                "articles": [],
            }

        # Clean up articles and map GNews format to NewsAPI-compatible format
        # GNews uses 'image' instead of 'urlToImage'
        # GNews uses 'totalArticles' instead of 'totalResults'
        articles = []
        for article in data.get("articles", []):
            articles.append({
                "title": article.get("title") or "Untitled",
                "description": article.get("description") or "",
                "url": article.get("url") or "#",
                "urlToImage": article.get("image") or "",
                "source": (article.get("source") or {}).get("name", "Unknown"),
                "author": "Unknown",  # GNews doesn't provide author field
                "publishedAt": article.get("publishedAt") or "",
            })

        return {
            "status": "ok",
            "totalResults": data.get("totalArticles", 0),
            "articles": articles,
        }

    except requests.exceptions.Timeout:
        return {
            "status": "error",
            "error": "Request to GNews API timed out. Please try again.",
            "totalResults": 0,
            "articles": [],
        }
    except requests.exceptions.RequestException as exc:
        return {
            "status": "error",
            "error": f"Network error: {str(exc)}",
            "totalResults": 0,
            "articles": [],
        }
