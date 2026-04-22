from app.db import get_connection
from datetime import datetime

def save_action_items(meeting_id, action_items):
    conn = get_connection()
    cursor = conn.cursor()

    for item in action_items:
        cursor.execute("""
        INSERT INTO action_items (meeting_id, task, owner, deadline, status)
        VALUES (?, ?, ?, ?, ?)
        """, (
            meeting_id,
            item.get("task"),
            item.get("owner"),
            item.get("deadline"),
            "pending",
        ))

    conn.commit()
    conn.close()