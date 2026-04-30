import json

def save_bookmark(article):
    with open("bookmarks.json", "a") as f:
        json.dump(article, f)
        f.write("\n")
