from fastapi import FastAPI
from pydantic import BaseModel

from app.services.llm_service import analyze_text
from app.services.storage import save_result, get_result

from uuid import uuid4

app = FastAPI()

# 👇 Your input schema
class TranscriptInput(BaseModel):
    text: str

class UploadInput(BaseModel):
    text: str

class AnalyzeInput(BaseModel):
    meeting_id: str

# 👇 Test route
@app.get("/")
def root():
    return {"message": "Meeting AI is alive"}

# 👇 Your new endpoint
@app.post("/analyze")
def analyze_transcript(input: AnalyzeInput):
    data = get_result(input.meeting_id)

    if not data:
        return {"error": "Meeting not found"}

    result = analyze_text(data["text"])

    save_result(input.meeting_id, {
        "status": "analyzed",
        "result": result
    })

    return {"message": "Analysis complete"}

@app.post("/upload")
def upload_meeting(input: UploadInput):
    meeting_id = str(uuid4())

    save_result(meeting_id, {
        "text": input.text,
        "status": "uploaded"
    })

    return {"meeting_id": meeting_id}

@app.get("/results/{meeting_id}")
def get_results(meeting_id: str):
    data = get_result(meeting_id)

    if not data:
        return {"error": "Meeting not found"}

    return data