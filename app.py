"""
News Aggregator — Flask Application

Main entry point for the web application. Serves the frontend
and exposes REST API endpoints for news search and bookmarks.

Routes:
    GET  /                → Serve the main HTML page
    GET  /api/news        → Search news articles (query params: q, sort, page)
    GET  /api/bookmarks   → List all bookmarked articles
    POST /api/bookmarks   → Add a new bookmark
    DELETE /api/bookmarks → Remove a bookmark by URL
"""

import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import our services
from services.news_service import get_news
from services.bookmark_service import get_bookmarks, add_bookmark, remove_bookmark

# ---------------------------------------------------------------------------
# App Initialization
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)  # Allow cross-origin requests during development


# ---------------------------------------------------------------------------
# Page Routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    """Serve the main frontend page."""
    return render_template("index.html")


# ---------------------------------------------------------------------------
# News API Routes
# ---------------------------------------------------------------------------
@app.route("/api/news", methods=["GET"])
def api_news():
    """
    Search for news articles.

    Query Parameters:
        q    (required): Search keyword(s)
        sort (optional): Sort order — relevancy | popularity | publishedAt
        page (optional): Page number (default 1)

    Returns:
        JSON with status, totalResults, and articles array
    """
    query = request.args.get("q", "").strip()

    if not query:
        return jsonify({
            "status": "error",
            "error": "Please provide a search query (q parameter)",
            "totalResults": 0,
            "articles": [],
        }), 400

    sort_by = request.args.get("sort", "relevance")
    page = request.args.get("page", 1, type=int)

    result = get_news(query=query, sort_by=sort_by, page=page)

    if result["status"] == "error":
        return jsonify(result), 502  # Upstream error

    return jsonify(result)


# ---------------------------------------------------------------------------
# Bookmark API Routes
# ---------------------------------------------------------------------------
@app.route("/api/bookmarks", methods=["GET"])
def api_get_bookmarks():
    """Return all saved bookmarks as JSON."""
    bookmarks = get_bookmarks()
    return jsonify({"bookmarks": bookmarks, "count": len(bookmarks)})


@app.route("/api/bookmarks", methods=["POST"])
def api_add_bookmark():
    """
    Add an article to bookmarks.

    Request Body (JSON):
        title, description, url, urlToImage, source, author, publishedAt
    """
    data = request.get_json()

    if not data or not data.get("url"):
        return jsonify({"success": False, "message": "Article URL is required"}), 400

    result = add_bookmark(data)
    status_code = 201 if result["success"] else 409  # 409 = Conflict (duplicate)
    return jsonify(result), status_code


@app.route("/api/bookmarks", methods=["DELETE"])
def api_remove_bookmark():
    """
    Remove a bookmark by URL.

    Request Body (JSON):
        url: The URL of the article to remove
    """
    data = request.get_json()

    if not data or not data.get("url"):
        return jsonify({"success": False, "message": "Article URL is required"}), 400

    result = remove_bookmark(data["url"])
    status_code = 200 if result["success"] else 404
    return jsonify(result), status_code


# ---------------------------------------------------------------------------
# Run the Development Server
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Render sets the PORT env variable; fall back to 5001 for local dev
    port = int(os.environ.get("PORT", 5001))
    print("\n🗞️  News Aggregator is running!")
    print(f"   Open http://localhost:{port} in your browser\n")
    app.run(debug=True, host="0.0.0.0", port=port)
