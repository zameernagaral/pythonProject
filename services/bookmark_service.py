"""
Bookmark Service — Persists bookmarked articles to a JSON file.

Enhanced from the original features.py which only appended
newline-delimited JSON. This version uses a proper JSON array
and supports add / remove / get-all / deduplicate operations.
"""

import json
import os

# Path to the bookmarks file (relative to project root)
BOOKMARKS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "bookmarks.json")


def _read_bookmarks() -> list:
    """Read all bookmarks from the JSON file."""
    if not os.path.exists(BOOKMARKS_FILE):
        return []

    try:
        with open(BOOKMARKS_FILE, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if not content:
                return []
            return json.loads(content)
    except (json.JSONDecodeError, IOError):
        return []


def _write_bookmarks(bookmarks: list) -> None:
    """Write the full bookmarks list to the JSON file."""
    with open(BOOKMARKS_FILE, "w", encoding="utf-8") as f:
        json.dump(bookmarks, f, indent=2, ensure_ascii=False)


def get_bookmarks() -> list:
    """Return all saved bookmarks."""
    return _read_bookmarks()


def add_bookmark(article: dict) -> dict:
    """
    Add an article to bookmarks. Deduplicates by URL.

    Args:
        article: dict with at least 'url' and 'title' keys

    Returns:
        dict with 'success' bool and 'message' string
    """
    bookmarks = _read_bookmarks()

    # Check for duplicate by URL
    url = article.get("url", "")
    if any(b.get("url") == url for b in bookmarks):
        return {"success": False, "message": "Article already bookmarked"}

    bookmarks.append({
        "title": article.get("title", "Untitled"),
        "description": article.get("description", ""),
        "url": url,
        "urlToImage": article.get("urlToImage", ""),
        "source": article.get("source", "Unknown"),
        "author": article.get("author", "Unknown"),
        "publishedAt": article.get("publishedAt", ""),
    })

    _write_bookmarks(bookmarks)
    return {"success": True, "message": "Article bookmarked successfully"}


def remove_bookmark(url: str) -> dict:
    """
    Remove a bookmark by its URL.

    Args:
        url: The article URL to remove

    Returns:
        dict with 'success' bool and 'message' string
    """
    bookmarks = _read_bookmarks()
    original_count = len(bookmarks)

    bookmarks = [b for b in bookmarks if b.get("url") != url]

    if len(bookmarks) == original_count:
        return {"success": False, "message": "Bookmark not found"}

    _write_bookmarks(bookmarks)
    return {"success": True, "message": "Bookmark removed successfully"}
