from fetch_news import get_news
from ui import display_news

query = input("What news are you interested in?: ")

articles = get_news(query)

display_news(articles)
