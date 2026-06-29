from typing import Optional, Dict, Any
from .suno import SunoGenerator

try:
    from .musicgen import MusicGenGenerator
    MUSICGEN_AVAILABLE = True
except ImportError:
    MUSICGEN_AVAILABLE = False
    MusicGenGenerator = None

class EngineManager:
    def __init__(self):
        self.suno = SunoGenerator()
        self.musicgen = MusicGenGenerator() if MUSICGEN_AVAILABLE else None

    async def generate(
        self,
        theme: str,
        mood: Optional[str] = None,
        genre: Optional[str] = None,
        duration: int = 30,
        preferred_engine: Optional[str] = "suno",
    ) -> Dict[str, Any]:
        engines = []
        if preferred_engine == "suno":
            engines = [self.suno, self.musicgen] if self.musicgen else [self.suno]
        else:
            engines = [self.musicgen, self.suno] if self.musicgen else [self.suno]

        last_error = None
        for engine in engines:
            if engine and await engine.is_available():
                result = await engine.generate(
                    theme=theme,
                    mood=mood,
                    genre=genre,
                    duration=duration,
                )
                if result["success"]:
                    return result
                last_error = result.get("error")

        return {
            "success": False,
            "error": f"All engines failed. Last error: {last_error}",
            "engine_used": "none",
        }

    async def get_status(self) -> Dict[str, Any]:
        return {
            "suno": await self.suno.is_available(),
            "musicgen": await self.musicgen.is_available() if self.musicgen else False,
            "device_info": self.musicgen.get_device_info() if self.musicgen else {"device": "unavailable", "model_size": "none"},
        }
