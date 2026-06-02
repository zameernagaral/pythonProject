import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_news(query):
    # Fetch GNEWS_API_KEY from .env
    api_key = os.getenv("GNEWS_API_KEY")
    if not api_key:
        print("Warning: GNEWS_API_KEY environment variable is not set in your .env file.")
        return []

    url = "https://gnews.io/api/v4/search"
    
    params = {
        "q": query,
        "sortby": "relevance",
        "apikey": api_key,
        "lang": "en"
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if "errors" in data:
            print(f"GNews Error: {data.get('errors')}")
            return []

        # Map 'image' to 'urlToImage' for backward compatibility if needed
        articles = data.get("articles", [])
        for article in articles:
            article["urlToImage"] = article.get("image") or ""
            
        return articles
    except Exception as e:
        print(f"Error fetching news: {e}")
        return []
