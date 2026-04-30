def display_news(articles):
    for i, article in enumerate(articles):
        print(f"\n{i+1}. {article['title']}")
        
        if article['description']:
            print(article['description'])
        
        print("-" * 50)
