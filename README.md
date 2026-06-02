# 📰 NewsFlow — Personalized News Aggregator

A modern, full-stack web application that lets you search, browse, and bookmark news articles from around the world. Built with Flask and vanilla HTML/CSS/JS.

![Python](https://img.shields.io/badge/Python-3.9+-blue)
![Flask](https://img.shields.io/badge/Flask-3.1-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- 🔍 **Search** — Find news articles on any topic
- 📑 **Bookmarks** — Save articles for later reading (persisted)
- 🔄 **Sort** — By popularity, relevance, or date
- 📱 **Responsive** — Works on desktop, tablet, and mobile
- 🌙 **Dark Mode** — Stunning glassmorphism dark theme
- ⚡ **Fast** — Skeleton loading, pagination, smooth animations

## 📁 Project Structure

```
pythonProject/
├── app.py                  # Flask entry point & API routes
├── services/
│   ├── __init__.py
│   ├── news_service.py     # NewsAPI integration
│   └── bookmark_service.py # Bookmark CRUD logic
├── static/
│   ├── css/style.css       # Dark glassmorphism theme
│   └── js/app.js           # Frontend application logic
├── templates/
│   └── index.html          # Main HTML page
├── .env                    # API key (not in git)
├── .env.example            # Template for .env
├── .gitignore
├── requirements.txt
└── README.md
```

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.9 or higher
- A [NewsAPI](https://newsapi.org) API key (free tier available)

### 2. Install Dependencies

```bash
cd pythonProject
pip install -r requirements.txt
```

### 3. Configure API Key

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your NewsAPI key
# NEWSAPI_KEY=your_key_here
```

### 4. Run the Application

```bash
python app.py
```

Open **http://localhost:5001** in your browser.

## 🧪 Testing

### Test API Endpoints

```bash
# Search news
curl "http://localhost:5001/api/news?q=technology"

# Add a bookmark
curl -X POST -H "Content-Type: application/json" \
  -d '{"title":"Test","url":"https://example.com"}' \
  http://localhost:5001/api/bookmarks

# Get bookmarks
curl http://localhost:5001/api/bookmarks

# Remove a bookmark
curl -X DELETE -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' \
  http://localhost:5001/api/bookmarks
```

### Test in Browser
1. Open http://localhost:5001
2. Search for any topic (e.g., "AI", "sports", "climate")
3. Click the bookmark icon on any article
4. Open the Bookmarks drawer from the navbar
5. Remove a bookmark from the drawer

## 🚢 Deployment

### Render (Recommended)
1. Push code to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `gunicorn app:app`
5. Add `NEWSAPI_KEY` in Environment Variables
6. Add `gunicorn` to requirements.txt for production

### Railway
1. Connect your GitHub repo at [Railway](https://railway.app)
2. Add `NEWSAPI_KEY` environment variable
3. Railway auto-detects Python and deploys

> **Note**: NewsAPI free tier only works from `localhost`. You'll need a paid plan for production deployment.

## 🛠 Tech Stack

| Layer    | Technology    |
|----------|--------------|
| Backend  | Flask 3.1    |
| Frontend | HTML/CSS/JS  |
| API      | NewsAPI.org  |
| Fonts    | Inter, Outfit |
| Design   | Glassmorphism |

## 📝 License

MIT — use freely for learning and personal projects.
