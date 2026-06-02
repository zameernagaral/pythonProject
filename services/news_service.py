"""
News Service — Fetches articles from NewsAPI.org

Refactored from the original fetch_news.py CLI script.
Now supports pagination, sorting, and proper error handling
for use as a web API backend.
"""

import os
import requests


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
NEWSAPI_BASE_URL = "https://newsapi.org/v2/everything"
DEFAULT_PAGE_SIZE = 12  # Number of articles per page


def get_news(query: str, sort_by: str = "popularity", page: int = 1, page_size: int = DEFAULT_PAGE_SIZE) -> dict:
    """
    Fetch news articles from NewsAPI.

    Args:
        query:     Search keyword(s), e.g. "technology"
        sort_by:   One of "relevancy", "popularity", "publishedAt"
        page:      Page number (1-indexed)
        page_size: Number of results per page (max 100 on free tier)

    Returns:
        dict with keys: status, totalResults, articles, error (if any)
    """
    api_key = os.getenv("NEWSAPI_KEY")

    if not api_key:
        return {
            "status": "error",
            "error": "NEWSAPI_KEY environment variable is not set. "
                     "Please add it to your .env file.",
            "totalResults": 0,
            "articles": [],
        }

    params = {
        "q": query,
        "sortBy": sort_by,
        "page": page,
        "pageSize": page_size,
        "apiKey": api_key,
    }

    try:
        response = requests.get(NEWSAPI_BASE_URL, params=params, timeout=10)
        data = response.json()

        # NewsAPI returns status "ok" on success
        if data.get("status") != "ok":
            return {
                "status": "error",
                "error": data.get("message", "Unknown error from NewsAPI"),
                "totalResults": 0,
                "articles": [],
            }

        # Clean up articles — some fields can be None
        articles = []
        for article in data.get("articles", []):
            articles.append({
                "title": article.get("title") or "Untitled",
                "description": article.get("description") or "",
                "url": article.get("url") or "#",
                "urlToImage": article.get("urlToImage") or "",
                "source": (article.get("source") or {}).get("name", "Unknown"),
                "author": article.get("author") or "Unknown",
                "publishedAt": article.get("publishedAt") or "",
            })

        return {
            "status": "ok",
            "totalResults": data.get("totalResults", 0),
            "articles": articles,
        }

    except requests.exceptions.Timeout:
        return {
            "status": "error",
            "error": "Request to NewsAPI timed out. Please try again.",
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
