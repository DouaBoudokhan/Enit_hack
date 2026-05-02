from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import httpx
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/proxy-image")
async def proxy_image(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/webp,image/apng,image/,/*;q=0.8",
        "Referer": "https://www.instagram.com/",
    }

    try:
        # Fetch the entire image into memory first, then return it
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(url, headers=headers, follow_redirects=True)
            if r.status_code != 200:
                raise HTTPException(status_code=r.status_code, detail="Image fetch failed")

            content = r.content  # Read fully into memory
            media_type = r.headers.get("content-type", "image/jpeg")

        from fastapi.responses import Response
        return Response(content=content, media_type=media_type)

    except httpx.ReadError as e:
        raise HTTPException(status_code=502, detail=f"Read error fetching image: {str(e)}")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Timeout fetching image")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/api/reports")
def get_reports():
    reports = []
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # List of known report files
    files = ["oumaima.hamrouni__report.md", "samiramagroun_report.md"]
    
    for filename in files:
        file_path = os.path.join(current_dir, filename)
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                
            # Extract basic info like name from filename
            name = filename.replace("_report.md", "").replace("__report.md", "").replace(".", " ").title()
            
            reports.append({
                "id": filename,
                "name": name,
                "content": content
            })
            
    return {"reports": reports}

@app.get("/api/analyzed-posts")
def list_analyzed_posts():
    import glob
    import json
    current_dir = os.path.dirname(os.path.abspath(__file__))
    analysis_dir = os.path.join(current_dir, "post_analysis")
    results = []
    
    if os.path.exists(analysis_dir):
        for root, dirs, files in os.walk(analysis_dir):
            for file in files:
                if file.endswith(".json"):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            results.append(data)
                    except Exception as e:
                        pass
                        
    return sorted(results, key=lambda x: (x.get("influencer", ""), x.get("post_index", 0)))

