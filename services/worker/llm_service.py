import httpx

OLLAMA_URL = "http://ollama:11434/api/generate"

class LLMProcessor:
    @staticmethod
    def get_summary(text: str):
        if not text or len(text) < 20:
            return "Text too short for summary."

        prompt = f"Summarize this document text in one short sentence: {text[:2000]}"
        
        try:
            response = httpx.post(
                OLLAMA_URL,
                json={"model": "tinyllama", "prompt": prompt, "stream": False},
                timeout=60.0
            )
            return response.json().get("response", "Could not generate summary.")
        except Exception as e:
            return f"LLM Error: {str(e)}"