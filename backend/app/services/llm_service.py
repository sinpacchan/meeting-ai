import requests

def analyze_text(text: str):
    prompt = f"""
You are an assistant that extracts structured information from meeting transcripts.

Return JSON with:
- summary (short)
- action_items (list of objects with task, owner, deadline if mentioned)
- decisions (list)

Transcript:
{text}
"""

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "mistral",
            "prompt": prompt,
            "stream": False
        }
    )

    return response.json()["response"]