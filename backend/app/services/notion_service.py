from notion_client import Client
import os
from dotenv import load_dotenv
import dateparser

load_dotenv()

notion = Client(auth=os.getenv("NOTION_API_KEY"))
DATABASE_ID = os.getenv("NOTION_DATABASE_ID")


def convert_to_date(value):
    if not value:
        return None

    parsed = dateparser.parse(value, settings={"PREFER_DATES_FROM": "future"})
    if not parsed:
        return None

    return parsed.date().isoformat()


def send_tasks_to_notion(tasks):
    for task in tasks:

        task_name = task.get("task") or "Untitled"
        owner = task.get("owner") or ""
        deadline = convert_to_date(task.get("deadline"))
        status = task.get("status") or "Pending"

        properties = {
            "Task": {
                "title": [
                    {
                        "text": {
                            "content": task_name
                        }
                    }
                ]
            },
            "Owner": {
                "rich_text": [
                    {
                        "text": {
                            "content": owner
                        }
                    }
                ]
            },
            "Status": {
                "select": {
                    "name": status
                }
            }
        }

        if deadline:
            properties["Deadline"] = {
                "date": {
                    "start": deadline
                }
            }

        notion.pages.create(
            parent={"database_id": DATABASE_ID},
            properties=properties
        )