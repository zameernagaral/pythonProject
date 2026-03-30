import requests
# newsapi website
# https://newsapi.org/
query=input("what news are u intrested today?:")
api_key="7380129f93a840c2b272006b0839a4f6"
# api_key=input("enter API KEY:") # 7380129f93a840c2b272006b0839a4f6
url=f"https://newsapi.org/v2/everything?q={query}
&from=2026-03-12&to=2026-03-12&sortBy=popularity&apiKey={api_key}"
print(url)
r=requests.get(url)
data=r.json()
news_articles=data["articles"]
for index, article in enumerate(news_articles):
print(index+1,article["title"],"\n", article["url"])
print("\n-------------------------------------------------------\n")
