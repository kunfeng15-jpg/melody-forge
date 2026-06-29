from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Literal
import uvicorn
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from generators.engine_manager import EngineManager
from database import playlists as playlist_db
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

class PlaylistRequest(BaseModel):
    name: str
    description: Optional[str] = None
    cover_url: Optional[str] = None

class PlaylistUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None

class PlaylistSongRequest(BaseModel):
    song_id: int
    position: Optional[int] = None

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

@app.get("/playlists")
async def get_playlists():
    return playlist_db.get_all_playlists()

@app.post("/playlists")
async def create_playlist(request: PlaylistRequest):
    playlist_id = playlist_db.create_playlist(
        name=request.name,
        description=request.description,
        cover_url=request.cover_url,
    )
    playlist = playlist_db.get_playlist(playlist_id, include_songs=False)
    return playlist

@app.get("/playlists/{playlist_id}")
async def get_playlist(playlist_id: int):
    playlist = playlist_db.get_playlist(playlist_id)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist

@app.put("/playlists/{playlist_id}")
async def update_playlist(playlist_id: int, request: PlaylistUpdateRequest):
    playlist = playlist_db.update_playlist(
        playlist_id=playlist_id,
        name=request.name,
        description=request.description,
        cover_url=request.cover_url,
    )
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist

@app.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: int):
    success = playlist_db.delete_playlist(playlist_id)
    if not success:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"success": success}

@app.post("/playlists/{playlist_id}/songs")
async def add_song_to_playlist(playlist_id: int, request: PlaylistSongRequest):
    success = playlist_db.add_song_to_playlist(
        playlist_id=playlist_id,
        song_id=request.song_id,
        position=request.position,
    )
    if not success:
        raise HTTPException(status_code=404, detail="Playlist or song not found")
    return {"success": success}

@app.delete("/playlists/{playlist_id}/songs/{song_id}")
async def remove_song_from_playlist(playlist_id: int, song_id: int):
    success = playlist_db.remove_song_from_playlist(playlist_id, song_id)
    if not success:
        raise HTTPException(status_code=404, detail="Playlist song not found")
    return {"success": success}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
