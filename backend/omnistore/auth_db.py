"""
OmniStore AI — Multi-tenant Auth & RBAC.
Users, roles, store ownership, sessions, and rate limits.
PostgreSQL/Neon by default (DATABASE_URL); SQLite fallback for local dev.
"""
from __future__ import annotations

import hashlib
import os
import sqlite3
import time
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional, List, Dict

from jose import JWTError, jwt

DB_PATH = Path(__file__).resolve().parent.parent / "omnistore.db"

SECRET_KEY = os.getenv("OMNISTORE_SECRET_KEY", hashlib.sha256(os.urandom(32)).hexdigest())
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "60"))

USE_POSTGRES = os.getenv("DATABASE_URL", "").startswith(("postgresql://", "postgres://"))


def _placeholders(count: int) -> str:
    return ", ".join(["%s"] * count) if USE_POSTGRES else ", ".join(["?"] * count)


@contextmanager
def get_conn():
    if USE_POSTGRES:
        import psycopg2
        from psycopg2.extras import RealDictCursor

        conn = psycopg2.connect(os.getenv("DATABASE_URL"), cursor_factory=RealDictCursor)
        conn.autocommit = True
        try:
            yield conn
        finally:
            conn.close()
    else:
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


def init_auth_db() -> None:
    """Create auth tables if they don't exist."""
    if USE_POSTGRES:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS users (
                        id              TEXT PRIMARY KEY,
                        email           TEXT UNIQUE NOT NULL,
                        password_hash   TEXT NOT NULL,
                        full_name       TEXT,
                        role            TEXT NOT NULL DEFAULT 'merchant',
                        is_active       INTEGER NOT NULL DEFAULT 1,
                        created_at      TIMESTAMP DEFAULT NOW(),
                        updated_at      TIMESTAMP DEFAULT NOW()
                    );
                    """
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS store_ownership (
                        id          SERIAL PRIMARY KEY,
                        user_id     TEXT NOT NULL,
                        store_slug  TEXT NOT NULL,
                        role        TEXT NOT NULL DEFAULT 'owner',
                        created_at  TIMESTAMP DEFAULT NOW(),
                        UNIQUE(user_id, store_slug),
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    );
                    """
                )
                cur.execute(
                    "CREATE INDEX IF NOT EXISTS idx_store_ownership_user "
                    "ON store_ownership(user_id);"
                )
                cur.execute(
                    "CREATE INDEX IF NOT EXISTS idx_store_ownership_store "
                    "ON store_ownership(store_slug);"
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS user_sessions (
                        id           TEXT PRIMARY KEY,
                        user_id      TEXT NOT NULL,
                        token_hash   TEXT NOT NULL,
                        expires_at   TIMESTAMP NOT NULL,
                        created_at   TIMESTAMP DEFAULT NOW(),
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    );
                    """
                )
                cur.execute(
                    "CREATE INDEX IF NOT EXISTS idx_user_sessions_user "
                    "ON user_sessions(user_id);"
                )
                cur.execute(
                    "CREATE INDEX IF NOT EXISTS idx_user_sessions_token "
                    "ON user_sessions(token_hash);"
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS rate_limits (
                        id         SERIAL PRIMARY KEY,
                        identifier TEXT NOT NULL,
                        time_window     TEXT NOT NULL,
                        count      INTEGER NOT NULL DEFAULT 1,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW(),
                        UNIQUE(identifier, time_window)
                    );
                    """
                )
                cur.execute(
                    "CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier "
                    "ON rate_limits(identifier);"
                )
    else:
        with get_conn() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id              TEXT PRIMARY KEY,
                    email           TEXT UNIQUE NOT NULL,
                    password_hash   TEXT NOT NULL,
                    full_name       TEXT,
                    role            TEXT NOT NULL DEFAULT 'merchant',
                    is_active       INTEGER NOT NULL DEFAULT 1,
                    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS store_ownership (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id     TEXT NOT NULL,
                    store_slug  TEXT NOT NULL,
                    role        TEXT NOT NULL DEFAULT 'owner',
                    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, store_slug),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_store_ownership_user ON store_ownership(user_id);
                CREATE INDEX IF NOT EXISTS idx_store_ownership_store ON store_ownership(store_slug);

                CREATE TABLE IF NOT EXISTS user_sessions (
                    id           TEXT PRIMARY KEY,
                    user_id      TEXT NOT NULL,
                    token_hash   TEXT NOT NULL,
                    expires_at   TIMESTAMP NOT NULL,
                    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
                CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);

                CREATE TABLE IF NOT EXISTS rate_limits (
                    id         INTEGER PRIMARY KEY AUTOINCREMENT,
                    identifier TEXT NOT NULL,
                    time_window     TEXT NOT NULL,
                    count      INTEGER NOT NULL DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(identifier, time_window)
                );

                CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
                """
            )


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    return hashlib.sha256(password.encode()).hexdigest() == password_hash


def create_access_token(user_id: str, email: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": now.timestamp(),
        "exp": expire.timestamp(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(user_id: str, token: str) -> None:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_hash = hash_token(token)
    if USE_POSTGRES:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (%s, %s, %s, %s)",
                    (token_hash[:16], user_id, token_hash, expires_at.isoformat()),
                )
    else:
        with get_conn() as conn:
            conn.execute(
                "INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
                (token_hash[:16], user_id, token_hash, expires_at.isoformat()),
            )


def get_user_by_email(email: str) -> Optional[dict[str, Any]]:
    with get_conn() as conn:
        if USE_POSTGRES:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM users WHERE email = %s", (email,))
                row = cur.fetchone()
        else:
            row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id: str) -> Optional[dict[str, Any]]:
    with get_conn() as conn:
        if USE_POSTGRES:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
                row = cur.fetchone()
        else:
            row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None


def create_user(email: str, password: str, full_name: str, role: str = "merchant") -> dict[str, Any]:
    user_id = hashlib.sha256(f"{email}{time.time()}".encode()).hexdigest()[:16]
    if USE_POSTGRES:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO users (id, email, password_hash, full_name, role) VALUES (%s, %s, %s, %s, %s)",
                    (user_id, email, hash_password(password), full_name, role),
                )
    else:
        with get_conn() as conn:
            conn.execute(
                "INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)",
                (user_id, email, hash_password(password), full_name, role),
            )
    return get_user_by_id(user_id)


def authenticate_user(email: str, password: str) -> Optional[dict[str, Any]]:
    user = get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    if not user["is_active"]:
        return None
    return user


def get_user_stores(user_id: str) -> List[dict[str, Any]]:
    with get_conn() as conn:
        if USE_POSTGRES:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT s.* FROM stores s
                    JOIN store_ownership so ON s.slug = so.store_slug
                    WHERE so.user_id = %s
                    ORDER BY so.created_at DESC
                    """,
                    (user_id,),
                )
                rows = cur.fetchall()
        else:
            rows = conn.execute(
                """
                SELECT s.* FROM stores s
                JOIN store_ownership so ON s.slug = so.store_slug
                WHERE so.user_id = ?
                ORDER BY so.created_at DESC
                """,
                (user_id,),
            ).fetchall()
        return [dict(r) for r in rows]


def user_owns_store(user_id: str, store_slug: str) -> bool:
    with get_conn() as conn:
        if USE_POSTGRES:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT 1 FROM store_ownership WHERE user_id = %s AND store_slug = %s",
                    (user_id, store_slug),
                )
                row = cur.fetchone()
        else:
            row = conn.execute(
                "SELECT 1 FROM store_ownership WHERE user_id = ? AND store_slug = ?",
                (user_id, store_slug),
            ).fetchone()
        return row is not None


def add_store_owner(user_id: str, store_slug: str, role: str = "owner") -> None:
    if USE_POSTGRES:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO store_ownership (user_id, store_slug, role) VALUES (%s, %s, %s) ON CONFLICT (user_id, store_slug) DO NOTHING",
                    (user_id, store_slug, role),
                )
    else:
        with get_conn() as conn:
            conn.execute(
                "INSERT OR IGNORE INTO store_ownership (user_id, store_slug, role) VALUES (?, ?, ?)",
                (user_id, store_slug, role),
            )


def check_rate_limit(identifier: str, window_seconds: int = None, max_requests: int = None) -> bool:
    """Returns True if request is allowed, False if rate limited."""
    window_seconds = window_seconds or RATE_LIMIT_WINDOW_SECONDS
    max_requests = max_requests or RATE_LIMIT_MAX_REQUESTS
    window_key = str(int(time.time() // window_seconds))
    identifier_key = f"{identifier}:{window_key}"

    with get_conn() as conn:
        if USE_POSTGRES:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT count, updated_at FROM rate_limits WHERE identifier = %s",
                    (identifier_key,),
                )
                row = cur.fetchone()
        else:
            row = conn.execute(
                "SELECT count, updated_at FROM rate_limits WHERE identifier = ?",
                (identifier_key,),
            ).fetchone()
        now = int(time.time())
        if row:
            count = row["count"]
            if count >= max_requests:
                return False
            if USE_POSTGRES:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE rate_limits SET count = count + 1, updated_at = %s WHERE identifier = %s",
                        (now, identifier_key),
                    )
            else:
                conn.execute(
                    "UPDATE rate_limits SET count = count + 1, updated_at = ? WHERE identifier = ?",
                    (now, identifier_key),
                )
        else:
            if USE_POSTGRES:
                with conn.cursor() as cur:
                    cur.execute(
                        "INSERT INTO rate_limits (identifier, time_window, count, created_at, updated_at) VALUES (%s, %s, 1, %s, %s)",
                        (identifier_key, window_key, now, now),
                    )
            else:
                conn.execute(
                    "INSERT INTO rate_limits (identifier, time_window, count, created_at, updated_at) VALUES (?, ?, 1, ?, ?)",
                    (identifier_key, window_key, now, now),
                )
        return True


def cleanup_old_rate_limits() -> None:
    with get_conn() as conn:
        if USE_POSTGRES:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM rate_limits WHERE updated_at < %s",
                    (int(time.time()) - 86400,),
                )
        else:
            conn.execute(
                "DELETE FROM rate_limits WHERE updated_at < ?",
                (int(time.time()) - 86400,),
            )
