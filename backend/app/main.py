from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from datetime import datetime
from uuid import uuid4

from app.services.llm_service import analyze_text
from app.services.storage import save_result, get_result
from app.services.tasks import save_action_items
from app.db import get_connection

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    save_action_items(input.meeting_id, result.get("action_items", []))

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

@app.get("/tasks/{meeting_id}")
def get_tasks(meeting_id: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, task, owner, deadline, status, created_at
    FROM action_items
    WHERE meeting_id = ?
    """, (meeting_id,))

    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "task": r[1],
            "owner": r[2],
            "deadline": r[3],
            "status": r[4],
            "created_at": r[5]
        }
        for r in rows
    ]

@app.post("/tasks/{task_id}/complete")
def mark_done(task_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    UPDATE action_items
    SET status = 'done'
    WHERE id = ?
    """, (task_id,))

    conn.commit()
    conn.close()

    return {"message": "Task marked as done"}