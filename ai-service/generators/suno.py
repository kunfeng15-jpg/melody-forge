import httpx
import asyncio
import os
from typing import Optional, Dict, Any

class SunoGenerator:
    def __init__(self):
        self.api_base = os.getenv("SUNO_API_BASE", "https://api.suno.ai")
        self.api_key = os.getenv("SUNO_API_KEY", "")
        self.timeout = 300

    async def generate(
        self,
        theme: str,
        mood: Optional[str] = None,
        genre: Optional[str] = None,
        duration: int = 30,
        custom_lyrics: Optional[str] = None,
    ) -> Dict[str, Any]:
        prompt = f"A song about {theme}"
        if mood:
            prompt += f", with a {mood} mood"
        if genre:
            prompt += f", in {genre} style"

        style_prompt = f"{genre or 'pop'}, {mood or 'emotional'}, high quality production"

        payload = {
            "prompt": prompt,
            "style": style_prompt,
            "title": f"{theme.title()} Song",
            "make_instrumental": custom_lyrics is None,
            "wait_audio": True,
        }

        if custom_lyrics:
            payload["lyrics"] = custom_lyrics

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_base}/generate",
                    json=payload,
                    headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {},
                )
                response.raise_for_status()
                data = response.json()

                return {
                    "success": True,
                    "audio_url": data.get("audio_url"),
                    "title": data.get("title", payload["title"]),
                    "lyrics": data.get("lyrics", ""),
                    "engine_used": "suno",
                }

        except httpx.HTTPStatusError as e:
            return {
                "success": False,
                "error": f"Suno API error: {e.response.status_code} - {e.response.text}",
                "engine_used": "suno",
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Suno generation failed: {str(e)}",
                "engine_used": "suno",
            }

    async def is_available(self) -> bool:
        if not self.api_key:
            return False
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{self.api_base}/health")
                return response.status_code == 200
        except:
            return False
