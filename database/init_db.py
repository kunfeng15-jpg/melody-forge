import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'melodyforge.db')

def init_database():
    conn = sqlite3.connect(DB_PATH)
    with open(os.path.join(os.path.dirname(__file__), 'schema.sql'), 'r') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

if __name__ == '__main__':
    init_database()
