import torch
import torchaudio
import os
from typing import Optional, Dict, Any

class MusicGenGenerator:
    def __init__(self, model_size: str = "small"):
        self.model_size = model_size
        self.model = None
        self.device = self._get_device()
        self.output_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'generated')
        os.makedirs(self.output_dir, exist_ok=True)

    def _get_device(self) -> str:
        try:
            if torch.backends.mps.is_available():
                return "mps"
            elif torch.cuda.is_available():
                return "cuda"
        except:
            pass
        return "cpu"

    def _load_model(self):
        if self.model is None:
            try:
                from audiocraft.models import MusicGen
                print(f"Loading MusicGen {self.model_size} on {self.device}...")
                self.model = MusicGen.get_pretrained(self.model_size, device=self.device)
            except ImportError:
                raise ImportError("audiocraft not installed. Run: pip install audiocraft")

    async def generate(
        self,
        theme: str,
        mood: Optional[str] = None,
        genre: Optional[str] = None,
        duration: int = 30,
    ) -> Dict[str, Any]:
        try:
            self._load_model()

            prompt = f"{theme}"
            if mood:
                prompt += f", {mood} mood"
            if genre:
                prompt += f", {genre} music"

            self.model.set_generation_params(
                duration=duration,
                top_k=250,
                top_p=0.95,
                temperature=1.0,
            )

            descriptions = [prompt]
            wav = self.model.generate(descriptions)

            filename = f"generated_{theme.replace(' ', '_')}_{duration}s.wav"
            filepath = os.path.join(self.output_dir, filename)

            from audiocraft.data.audio import audio_write
            audio_write(
                filepath.replace('.wav', ''),
                wav[0].cpu(),
                self.model.sample_rate,
                format="wav",
            )

            return {
                "success": True,
                "audio_url": filepath,
                "title": f"{theme.title()} ({duration}s)",
                "lyrics": "",
                "engine_used": "musicgen",
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"MusicGen generation failed: {str(e)}",
                "engine_used": "musicgen",
            }

    async def is_available(self) -> bool:
        try:
            self._load_model()
            return True
        except:
            return False

    def get_device_info(self) -> Dict[str, str]:
        return {
            "device": self.device,
            "model_size": self.model_size,
        }
