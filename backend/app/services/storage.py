storage = {}

def save_result(meeting_id: str, data: dict):
    storage[meeting_id] = data

def get_result(meeting_id: str):
    return storage.get(meeting_id)