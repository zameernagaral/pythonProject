import requests

def get_news(query):
    api_key = "7380129f93a840c2b272006b0839a4f6"

    url = "https://newsapi.org/v2/everything"
    
    params = {
        "q": query,
        "sortBy": "popularity",
        "apiKey": api_key
    }

    response = requests.get(url, params=params)
    data = response.json()

    return data.get("articles", [])
