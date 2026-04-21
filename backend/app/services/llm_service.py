import requests
import json
import re

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

    raw = response.json()["response"]

    # extract JSON safely
    match = re.search(r"\{.*\}", raw, re.DOTALL)

    if not match:
        return {
            "summary" : "Parsing failed",
            "action_items" : [],
            "decisions" : []
        }
    
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return {
            "summary" : "Invalid JSON from model",
            "action_items" : [],
            "decisions" : []
        }