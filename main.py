from fetch_news import get_news
from ui import display_news

category = input("Enter category (technology/sports/business): ")

articles = get_news(category)

display_news(articles)
