import os
import sys
from dotenv import load_dotenv
from sm_crew.src.sm_crew.voice_crew import VoiceInvestigationCrew

def test_crew():
    load_dotenv()
    print("=== Standalone Voice Crew Test ===")
    print(f"Model from ENV: {os.environ.get('model')}")
    print(f"Base from ENV: {os.environ.get('AZURE_API_BASE')}")
    
    try:
        print("\nInitializing Crew...")
        crew_instance = VoiceInvestigationCrew()
        crew = crew_instance.crew()
        
        print("Kicking off investigation...")
        result = crew.kickoff(inputs={
            "influencer_name": "Oumaima Hamdouni",
            "specific_query": "Analyse générale"
        })
        
        print("\n✅ SUCCESS!")
        print("-" * 30)
        print(result)
        print("-" * 30)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_crew()
