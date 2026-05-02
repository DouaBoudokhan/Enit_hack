import os
from dotenv import load_dotenv
from sm_crew.src.sm_crew.crew import PostAnalysisCrew

def test_crew_py():
    load_dotenv()
    print("=== Testing crew.py (PostAnalysisCrew) ===")
    
    try:
        crew = PostAnalysisCrew().crew()
        result = crew.kickoff(inputs={
            "influencer_name": "Oumaima Hamdouni",
            "post_caption": "Superbe journée à Sidi Bou Said !",
            "comments_data": "Magnifique! | J'adore | C'est où?"
        })
        print("\n✅ SUCCESS!")
        print(result)
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    test_crew_py()
