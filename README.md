# Meeting Intelligence System

A FastAPI backend that processes meeting transcripts and extracts:
- summaries
- action items
- decisions

## Features
- Upload meeting text
- Analyze using local LLM (Mistral via Ollama)
- Retrieve structured results

## Run locally

cd backend
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
http://127.0.0.1:8000/docs#/