import json, sys
sys.stdout.reconfigure(encoding='utf-8')

# Check the actual scraped data for all comments
data = json.load(open('data/influencers_scraped.json', 'r', encoding='utf-8'))
for inf in data:
    handle = inf.get('handle', '')
    print(f"\n=== {handle} ===")
    for i, post in enumerate(inf.get('posts', [])):
        comments = post.get('comments', [])
        print(f"\n  Post {i+1}: {post.get('post_url','')[:60]} | {len(comments)} comments")
        for c in comments[:3]:
            print(f"    sentiment={c.get('sentiment','NONE')} quality={c.get('quality_score','NONE')} lang={c.get('language','NONE')} text={c.get('text','')[:80]}")
