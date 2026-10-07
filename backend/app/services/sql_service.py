import sqlite3
import uuid
from typing import Any


SQL_SESSIONS: dict[str, sqlite3.Connection] = {}


def create_sql_session() -> str:
    session_id = str(uuid.uuid4())

    connection = sqlite3.connect(":memory:")
    connection.row_factory = sqlite3.Row

    SQL_SESSIONS[session_id] = connection

    return session_id


def execute_sql(
    session_id: str,
    query: str,
) -> dict[str, Any]:

    query = query.strip()

    if not query:
        return {
            "success": False,
            "error": "SQL query cannot be empty.",
        }

    connection = SQL_SESSIONS.get(session_id)

    if connection is None:
        return {
            "success": False,
            "error": "SQL session has expired. Please create a new session.",
        }

    try:
        cursor = connection.cursor()

        statements = [
            statement.strip()
            for statement in query.split(";")
            if statement.strip()
        ]

        if not statements:
            return {
                "success": False,
                "error": "No SQL statement found.",
            }

        last_statement = statements[-1]

        # Execute all statements.
        for statement in statements:
            cursor.execute(statement)

        connection.commit()

        # Return rows for SELECT queries.
        if last_statement.lower().startswith("select"):
            cursor.execute(last_statement)

            rows = cursor.fetchall()

            columns = [
                description[0]
                for description in cursor.description
            ]

            return {
                "success": True,
                "columns": columns,
                "rows": [
                    [row[column] for column in columns]
                    for row in rows
                ],
                "row_count": len(rows),
            }

        return {
            "success": True,
            "columns": [],
            "rows": [],
            "message": "SQL executed successfully.",
        }

    except sqlite3.Error as error:
        connection.rollback()

        return {
            "success": False,
            "error": str(error),
        }


def close_sql_session(session_id: str) -> None:

    connection = SQL_SESSIONS.pop(
        session_id,
        None,
    )

    if connection:
        connection.close()
def get_tables(session_id: str) -> dict[str, Any]:
    connection = SQL_SESSIONS.get(session_id)

    if connection is None:
        return {
            "success": False,
            "error": "SQL session has expired.",
            "tables": [],
        }

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%'
            ORDER BY name
            """
        )

        tables = [
            row[0]
            for row in cursor.fetchall()
        ]

        return {
            "success": True,
            "tables": tables,
        }

    except sqlite3.Error as error:
        return {
            "success": False,
            "error": str(error),
            "tables": [],
        }
def get_table_columns(
    session_id: str,
    table_name: str,
) -> dict[str, Any]:

    connection = SQL_SESSIONS.get(session_id)

    if connection is None:
        return {
            "success": False,
            "error": "SQL session has expired.",
            "columns": [],
        }

    try:
        # Prevent unsafe table-name injection.
        if not table_name.replace("_", "").isalnum():
            return {
                "success": False,
                "error": "Invalid table name.",
                "columns": [],
            }

        cursor = connection.cursor()

        cursor.execute(
            f'PRAGMA table_info("{table_name}")'
        )

        rows = cursor.fetchall()

        columns = [
            {
                "name": row[1],
                "type": row[2],
                "primary_key": bool(row[5]),
            }
            for row in rows
        ]

        return {
            "success": True,
            "table": table_name,
            "columns": columns,
        }

    except sqlite3.Error as error:
        return {
            "success": False,
            "error": str(error),
            "columns": [],
        }