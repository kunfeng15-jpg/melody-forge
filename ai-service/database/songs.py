import json
import sqlite3
from typing import List, Optional, Dict, Any
from .db import get_db

def create_song(
    title: str,
    artist: str = 'AI Generated',
    album: Optional[str] = None,
    genre: Optional[str] = None,
    mood: Optional[str] = None,
    duration: int = 0,
    file_path: str = '',
    cover_url: Optional[str] = None,
    lyrics: Optional[str] = None,
    is_ai_generated: bool = True,
    generation_params: Optional[Dict] = None,
) -> int:
    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT INTO songs (title, artist, album, genre, mood, duration, file_path, cover_url, lyrics, is_ai_generated, generation_params)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (title, artist, album, genre, mood, duration, file_path, cover_url, lyrics, is_ai_generated, json.dumps(generation_params) if generation_params else None),
        )
        conn.commit()
        return cursor.lastrowid

def get_song(song_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM songs WHERE id = ?", (song_id,)).fetchone()
        return dict(row) if row else None

def get_all_songs() -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM songs ORDER BY created_at DESC").fetchall()
        return [dict(row) for row in rows]

def get_songs_by_genre(genre: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM songs WHERE genre = ? ORDER BY created_at DESC", (genre,)).fetchall()
        return [dict(row) for row in rows]

def get_songs_by_mood(mood: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM songs WHERE mood = ? ORDER BY created_at DESC", (mood,)).fetchall()
        return [dict(row) for row in rows]

def delete_song(song_id: int) -> bool:
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM songs WHERE id = ?", (song_id,))
        conn.commit()
        return cursor.rowcount > 0

def add_to_favorites(song_id: int) -> bool:
    with get_db() as conn:
        try:
            conn.execute("INSERT INTO favorites (song_id) VALUES (?)", (song_id,))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False

def remove_from_favorites(song_id: int) -> bool:
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM favorites WHERE song_id = ?", (song_id,))
        conn.commit()
        return cursor.rowcount > 0

def get_favorites() -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("""
            SELECT s.* FROM songs s
            JOIN favorites f ON s.id = f.song_id
            ORDER BY f.favorited_at DESC
        """).fetchall()
        return [dict(row) for row in rows]

def record_play_history(song_id: int, duration_played: int = 0):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO play_history (song_id, duration_played) VALUES (?, ?)",
            (song_id, duration_played),
        )
        conn.commit()

def get_play_history(limit: int = 50) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("""
            SELECT s.*, h.played_at, h.duration_played
            FROM play_history h
            JOIN songs s ON h.song_id = s.id
            ORDER BY h.played_at DESC
            LIMIT ?
        """, (limit,)).fetchall()
        return [dict(row) for row in rows]
