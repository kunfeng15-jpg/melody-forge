from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Literal
import uvicorn
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from generators.engine_manager import EngineManager
from database import songs as song_db

app = FastAPI(title="MelodyForge AI Service", version="0.1.0")
engine_manager = EngineManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    theme: str
    mood: Optional[str] = None
    genre: Optional[str] = None
    duration: Optional[int] = 30
    engine: Optional[Literal["suno", "musicgen"]] = "suno"

class GenerateResponse(BaseModel):
    success: bool
    audio_url: Optional[str] = None
    title: Optional[str] = None
    lyrics: Optional[str] = None
    engine_used: str
    error: Optional[str] = None

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "melodyforge-ai"}

@app.get("/status")
async def get_status():
    return await engine_manager.get_status()

@app.post("/generate", response_model=GenerateResponse)
async def generate_song(request: GenerateRequest):
    result = await engine_manager.generate(
        theme=request.theme,
        mood=request.mood,
        genre=request.genre,
        duration=request.duration,
        preferred_engine=request.engine,
    )
    return GenerateResponse(**result)

@app.get("/songs")
async def get_songs():
    return song_db.get_all_songs()

@app.get("/favorites")
async def get_favorites():
    return song_db.get_favorites()

@app.post("/favorites")
async def add_favorite(song_id: int):
    success = song_db.add_to_favorites(song_id)
    return {"success": success}

@app.delete("/favorites/{song_id}")
async def remove_favorite(song_id: int):
    success = song_db.remove_from_favorites(song_id)
    return {"success": success}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
