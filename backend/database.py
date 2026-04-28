"""
Database helpers for the Hospital backend.
Thin wrapper around the shared hospital.db used by the MCP tools.
"""

import os
import sqlite3

DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "aitool",
    "hospital.db",
)


def get_db():
    """Return a sqlite3 connection with row_factory set to Row."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
