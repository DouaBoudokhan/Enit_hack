#!/usr/bin/env python
import sys
import warnings
import json
import asyncio
import os
from pathlib import Path

from datetime import datetime

from sm_crew.crew import PostAnalysisCrew, InfluencerReportCrew

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

async def process_influencer(item):
    profile = item.get("profile", {})
    influencer_name = profile.get("username", "Unknown")
    posts = item.get("posts", [])
    
    if not posts:
        return
        
    print(f"\n--- Démarrage de l'analyse pour {influencer_name} ({len(posts)} posts) ---")
    
    post_inputs = []
    for post in posts:
        comments = [c.get("text") for c in post.get("comments", []) if c.get("text")]
        if comments:
            post_inputs.append({
                "influencer_name": influencer_name,
                "post_caption": post.get("caption", "Sans légende"),
                "comments_data": "\n".join([f"- {c}" for c in comments]),
                "post_metadata": {
                    "id": post.get("id"),
                    "url": post.get("url"),
                    "display_url": post.get("display_url"),
                    "type": post.get("type"),
                    "timestamp": post.get("timestamp"),
                    "likes": post.get("likes"),
                    "comments_count": post.get("comments_count"),
                }
            })
            
    if not post_inputs:
        return

    # 1. Analyse post par post (en parallèle)
    tasks = []
    for inp in post_inputs:
        crew_instance = PostAnalysisCrew().crew()
        tasks.append(crew_instance.kickoff_async(inputs=inp))
        
    print(f"Lancement de {len(tasks)} tâches d'analyse de posts pour {influencer_name}...")
    post_results = await asyncio.gather(*tasks)
    
    # 2. Agrégation des résumés et sauvegarde individuelle structurée
    output_dir = Path("post_analysis") / influencer_name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    summaries = []
    for i, res in enumerate(post_results):
        # Pour l'agrégation finale (Markdown)
        post_summary_content = f"### Résumé du Post {i+1}\nLégende : {post_inputs[i]['post_caption']}\n\nRésultat de l'analyse :\n{res.raw}\n"
        summaries.append(post_summary_content)
        
        # Pour l'interface (JSON) : Méta-données + Analyse
        meta = post_inputs[i]["post_metadata"]
        json_data = {
            "influencer": influencer_name,
            "post_index": i + 1,
            "id": meta.get("id"),
            "url": meta.get("url"),
            "display_url": meta.get("display_url"),
            "type": meta.get("type"),
            "timestamp": meta.get("timestamp"),
            "likes": meta.get("likes"),
            "comments_count": meta.get("comments_count"),
            "caption": post_inputs[i]["post_caption"],
            "analysis_result": res.raw
        }
        
        # Enregistrer le résumé du post en JSON
        post_filename = output_dir / f"post_{i+1}.json"
        with open(post_filename, "w", encoding="utf-8") as f:
            json.dump(json_data, f, ensure_ascii=False, indent=4)
            
    all_post_summaries = "\n---\n".join(summaries)
    
    # 3. Rapport final global
    print(f"Génération du rapport global pour {influencer_name}...")
    report_crew = InfluencerReportCrew().crew()
    final_result = report_crew.kickoff(inputs={
        "influencer_name": influencer_name,
        "post_summaries": all_post_summaries
    })
    
    # Sauvegarde
    output_filename = f"{influencer_name}_report.md"
    with open(output_filename, "w", encoding="utf-8") as out_file:
        out_file.write(final_result.raw)
    
    print(f"Rapport sauvegardé : {output_filename}")


async def run_all_async():
    # Load dataset
    data_file = Path(__file__).parent.parent.parent / "data" / "pulse_final_dataset.json"
    with open(data_file, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    print(f"Dataset chargé avec {len(dataset)} influenceurs.")

    # Process all influencers sequentially to avoid completely overwhelming the API
    # But for each influencer, posts are processed in parallel
    for item in dataset:
        await process_influencer(item)
        
    print("\nToutes les analyses sont terminées !")

def run():
    """
    Run the crew asynchronously for all influencers.
    """
    asyncio.run(run_all_async())

def train():
    """
    Train the crew for a given number of iterations.
    """
    inputs = {
        "influencer_name": "Sample Influencer",
        "comments_data": "- great post!\n- bad post..."
    }
    try:
        SmCrew().crew().train(n_iterations=int(sys.argv[1]), filename=sys.argv[2], inputs=inputs)
    except Exception as e:
        raise Exception(f"An error occurred while training the crew: {e}")

def replay():
    """
    Replay the crew execution from a specific task.
    """
    try:
        SmCrew().crew().replay(task_id=sys.argv[1])
    except Exception as e:
        raise Exception(f"An error occurred while replaying the crew: {e}")

def test():
    """
    Test the crew execution and returns the results.
    """
    inputs = {
        "influencer_name": "Sample Influencer",
        "comments_data": "- great post!\n- bad post..."
    }
    try:
        SmCrew().crew().test(n_iterations=int(sys.argv[1]), eval_llm=sys.argv[2], inputs=inputs)
    except Exception as e:
        raise Exception(f"An error occurred while testing the crew: {e}")
