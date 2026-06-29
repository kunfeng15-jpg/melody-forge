from typing import Any, Dict, List, Optional

from .db import get_db


def create_playlist(
    name: str,
    description: Optional[str] = None,
    cover_url: Optional[str] = None,
) -> int:
    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT INTO playlists (name, description, cover_url)
            VALUES (?, ?, ?)
            """,
            (name, description, cover_url),
        )
        conn.commit()
        return cursor.lastrowid


def get_playlist(playlist_id: int, include_songs: bool = True) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM playlists WHERE id = ?", (playlist_id,)).fetchone()
        if not row:
            return None

        playlist = dict(row)
        if include_songs:
            rows = conn.execute(
                """
                SELECT s.*, ps.position, ps.added_at
                FROM playlist_songs ps
                JOIN songs s ON s.id = ps.song_id
                WHERE ps.playlist_id = ?
                ORDER BY ps.position ASC, ps.added_at ASC
                """,
                (playlist_id,),
            ).fetchall()
            playlist["songs"] = [dict(row) for row in rows]

        return playlist


def get_all_playlists() -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT p.*, COUNT(ps.song_id) AS song_count
            FROM playlists p
            LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id
            GROUP BY p.id
            ORDER BY p.created_at DESC
            """
        ).fetchall()
        return [dict(row) for row in rows]


def update_playlist(
    playlist_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    cover_url: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    fields = []
    values: List[Any] = []

    if name is not None:
        fields.append("name = ?")
        values.append(name)
    if description is not None:
        fields.append("description = ?")
        values.append(description)
    if cover_url is not None:
        fields.append("cover_url = ?")
        values.append(cover_url)

    if not fields:
        return get_playlist(playlist_id, include_songs=False)

    values.append(playlist_id)
    with get_db() as conn:
        cursor = conn.execute(
            f"UPDATE playlists SET {', '.join(fields)} WHERE id = ?",
            values,
        )
        conn.commit()
        if cursor.rowcount == 0:
            return None

    return get_playlist(playlist_id, include_songs=False)


def delete_playlist(playlist_id: int) -> bool:
    with get_db() as conn:
        conn.execute("DELETE FROM playlist_songs WHERE playlist_id = ?", (playlist_id,))
        cursor = conn.execute("DELETE FROM playlists WHERE id = ?", (playlist_id,))
        conn.commit()
        return cursor.rowcount > 0


def add_song_to_playlist(
    playlist_id: int,
    song_id: int,
    position: Optional[int] = None,
) -> bool:
    with get_db() as conn:
        playlist = conn.execute("SELECT id FROM playlists WHERE id = ?", (playlist_id,)).fetchone()
        song = conn.execute("SELECT id FROM songs WHERE id = ?", (song_id,)).fetchone()

        if not playlist or not song:
            return False

        if position is None:
            row = conn.execute(
                "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM playlist_songs WHERE playlist_id = ?",
                (playlist_id,),
            ).fetchone()
            position = row["next_position"]

        conn.execute(
            """
            INSERT INTO playlist_songs (playlist_id, song_id, position)
            VALUES (?, ?, ?)
            ON CONFLICT(playlist_id, song_id) DO UPDATE SET position = excluded.position
            """,
            (playlist_id, song_id, position),
        )
        conn.commit()
        return True


def remove_song_from_playlist(playlist_id: int, song_id: int) -> bool:
    with get_db() as conn:
        cursor = conn.execute(
            "DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
            (playlist_id, song_id),
        )
        conn.commit()
        return cursor.rowcount > 0
