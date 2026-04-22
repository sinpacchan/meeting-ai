import sqlite3
from datetime import datetime

DB_NAME = "tasks.db"

def get_connection():
    return sqlite3.connect(DB_NAME)