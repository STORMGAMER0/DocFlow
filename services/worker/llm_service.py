import httpx

OLLAMA_URL = "http://localhost:11434/api/generate"

class LLMProcessor:
    @staticmethod
    def get_summary(text: str):
        if not text or len(text) < 20:
            return "Text too short for summary."

        prompt = f"Summarize this document text in 10 words: {text[:250]}"
        
        try:
            response = httpx.post(
                OLLAMA_URL,
                json={"model": "tinyllama", "prompt": prompt, "stream": False},
                timeout=180.0
            )
            return response.json().get("response", "Could not generate summary.")
        except httpx.TimeoutException:
            return "Summary generation timed out"
        except Exception as e:
            return f"Summary unavailable: {str(e)}"