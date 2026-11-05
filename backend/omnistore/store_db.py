"""
OmniStore AI — Persistent Database Layer.
PostgreSQL/Neon by default (DATABASE_URL); SQLite fallback for local dev.
"""
from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Optional, List, Dict

DB_PATH = Path(__file__).resolve().parent.parent / "omnistore.db"


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")


USE_POSTGRES = get_database_url().startswith(("postgresql://", "postgres://"))


def _placeholders(count: int) -> str:
    """Return %s (Postgres) or ? (SQLite) placeholders."""
    return ", ".join(["%s"] * count) if USE_POSTGRES else ", ".join(["?"] * count)


@contextmanager
def get_conn():
    """Yield a database connection with row factory."""
    if USE_POSTGRES:
        import psycopg2
        from psycopg2.extras import RealDictCursor

        conn = psycopg2.connect(get_database_url(), cursor_factory=RealDictCursor)
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


def init_db() -> None:
    """Create tables if they don't exist."""
    if USE_POSTGRES:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS stores (
                        slug           TEXT PRIMARY KEY,
                        store_title    TEXT NOT NULL,
                        currency       TEXT NOT NULL DEFAULT 'NGN',
                        location       TEXT NOT NULL,
                        whatsapp_number TEXT,
                        category       TEXT,
                        created_at     TIMESTAMP DEFAULT NOW(),
                        updated_at     TIMESTAMP DEFAULT NOW()
                    );
                    """
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS inventory_items (
                        id               SERIAL PRIMARY KEY,
                        store_slug       TEXT NOT NULL,
                        item_id          TEXT NOT NULL,
                        name             TEXT NOT NULL,
                        category         TEXT,
                        suggested_price  REAL,
                        estimated_quantity INTEGER DEFAULT 1,
                        description      TEXT,
                        image_segment_id TEXT,
                        image_url        TEXT,
                        bbox             TEXT,
                        confidence       REAL,
                        label            TEXT,
                        area             INTEGER,
                        created_at       TIMESTAMP DEFAULT NOW(),
                        FOREIGN KEY (store_slug) REFERENCES stores(slug) ON DELETE CASCADE,
                        UNIQUE (store_slug, item_id)
                    );
                    """
                )
                cur.execute(
                    "CREATE INDEX IF NOT EXISTS idx_inventory_store "
                    "ON inventory_items(store_slug);"
                )
    else:
        with get_conn() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS stores (
                    slug           TEXT PRIMARY KEY,
                    store_title    TEXT NOT NULL,
                    currency       TEXT NOT NULL DEFAULT 'NGN',
                    location       TEXT NOT NULL,
                    whatsapp_number TEXT,
                    category       TEXT,
                    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS inventory_items (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    store_slug       TEXT NOT NULL,
                    item_id          TEXT NOT NULL,
                    name             TEXT NOT NULL,
                    category         TEXT,
                    suggested_price  REAL,
                    estimated_quantity INTEGER DEFAULT 1,
                        description      TEXT,
                        image_segment_id TEXT,
                        image_url        TEXT,
                        bbox             TEXT,
                        confidence       REAL,
                        label            TEXT,
                        area             INTEGER,
                        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (store_slug) REFERENCES stores(slug) ON DELETE CASCADE,
                        UNIQUE (store_slug, item_id)
                );

                CREATE INDEX IF NOT EXISTS idx_inventory_store ON inventory_items(store_slug);
                """
            )


def upsert_store(
    slug: str,
    store_title: str,
    currency: str,
    location: str,
    whatsapp_number: Optional[str] = None,
    category: Optional[str] = None,
) -> None:
    if USE_POSTGRES:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO stores (slug, store_title, currency, location, whatsapp_number, category, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT(slug) DO UPDATE SET
                        store_title = EXCLUDED.store_title,
                        currency = EXCLUDED.currency,
                        location = EXCLUDED.location,
                        whatsapp_number = EXCLUDED.whatsapp_number,
                        category = EXCLUDED.category,
                        updated_at = NOW()
                    """,
                    (slug, store_title, currency, location, whatsapp_number, category),
                )
    else:
        with get_conn() as conn:
            conn.execute(
                """
                INSERT INTO stores (slug, store_title, currency, location, whatsapp_number, category, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(slug) DO UPDATE SET
                    store_title = excluded.store_title,
                    currency = excluded.currency,
                    location = excluded.location,
                    whatsapp_number = excluded.whatsapp_number,
                    category = excluded.category,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (slug, store_title, currency, location, whatsapp_number, category),
            )


def upsert_inventory(store_slug: str, items: List[Dict[str, Any]]) -> None:
    if USE_POSTGRES:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM inventory_items WHERE store_slug = %s", (store_slug,)
                )
                for item in items:
                    cur.execute(
                        """
                        INSERT INTO inventory_items
                            (store_slug, item_id, name, category, suggested_price,
                             estimated_quantity, description, image_segment_id, image_url,
                             bbox, confidence, label, area)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            store_slug,
                            item.get("item_id", ""),
                            item.get("name", ""),
                            item.get("category", ""),
                            item.get("suggested_price", 0),
                            item.get("estimated_quantity", 1),
                            item.get("description", ""),
                            item.get("image_segment_id", ""),
                            item.get("image_url", ""),
                            json.dumps(item.get("bbox")) if item.get("bbox") else None,
                            item.get("confidence"),
                            item.get("label", ""),
                            item.get("area"),
                        ),
                    )
    else:
        with get_conn() as conn:
            conn.execute("DELETE FROM inventory_items WHERE store_slug = ?", (store_slug,))
            for item in items:
                conn.execute(
                    """
                    INSERT INTO inventory_items
                        (store_slug, item_id, name, category, suggested_price,
                         estimated_quantity, description, image_segment_id, image_url,
                         bbox, confidence, label, area)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        store_slug,
                        item.get("item_id", ""),
                        item.get("name", ""),
                        item.get("category", ""),
                        item.get("suggested_price", 0),
                        item.get("estimated_quantity", 1),
                        item.get("description", ""),
                        item.get("image_segment_id", ""),
                        item.get("image_url", ""),
                        json.dumps(item.get("bbox")) if item.get("bbox") else None,
                        item.get("confidence"),
                        item.get("label", ""),
                        item.get("area"),
                    ),
                )


def get_store(slug: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        if USE_POSTGRES:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM stores WHERE slug = %s", (slug,))
                row = cur.fetchone()
        else:
            row = conn.execute(
                "SELECT * FROM stores WHERE slug = ?", (slug,)
            ).fetchone()
        if not row:
            return None
        return dict(row)


def get_inventory(store_slug: str) -> List[Dict[str, Any]]:
    with get_conn() as conn:
        if USE_POSTGRES:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT * FROM inventory_items WHERE store_slug = %s ORDER BY item_id",
                    (store_slug,),
                )
                rows = cur.fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM inventory_items WHERE store_slug = ? ORDER BY item_id",
                (store_slug,),
            ).fetchall()
        return [dict(r) for r in rows]


def list_stores() -> List[Dict[str, Any]]:
    with get_conn() as conn:
        if USE_POSTGRES:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM stores ORDER BY updated_at DESC")
                rows = cur.fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM stores ORDER BY updated_at DESC"
            ).fetchall()
        return [dict(r) for r in rows]


# ─── Individual Inventory Item CRUD ─────────────────────────────────────────

def get_inventory_item(store_slug: str, item_id: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        if USE_POSTGRES:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT * FROM inventory_items WHERE store_slug = %s AND item_id = %s",
                    (store_slug, item_id),
                )
                row = cur.fetchone()
        else:
            row = conn.execute(
                "SELECT * FROM inventory_items WHERE store_slug = ? AND item_id = ?",
                (store_slug, item_id),
            ).fetchone()
        return dict(row) if row else None


def upsert_inventory_item(
    store_slug: str, item: Dict[str, Any]
) -> Dict[str, Any]:
    """Create or update a single inventory item. Returns the saved item dict."""
    item_id = item.get("item_id", "")
    existing = get_inventory_item(store_slug, item_id)

    if USE_POSTGRES:
        with get_conn() as conn:
            with conn.cursor() as cur:
                if existing:
                    cur.execute(
                        """
                        UPDATE inventory_items
                        SET name = %s, category = %s, suggested_price = %s,
                            estimated_quantity = %s, description = %s,
                            image_segment_id = %s, image_url = %s,
                            bbox = %s, confidence = %s, label = %s, area = %s
                        WHERE store_slug = %s AND item_id = %s
                        RETURNING id, store_slug, item_id, name, category,
                                  suggested_price, estimated_quantity, description,
                                  image_segment_id, image_url, bbox, confidence,
                                  label, area, created_at
                        """,
                        (
                            item.get("name", ""),
                            item.get("category", ""),
                            item.get("suggested_price", 0),
                            item.get("estimated_quantity", 1),
                            item.get("description", ""),
                            item.get("image_segment_id", ""),
                            item.get("image_url", ""),
                            json.dumps(item.get("bbox")) if item.get("bbox") else None,
                            item.get("confidence"),
                            item.get("label", ""),
                            item.get("area"),
                            store_slug,
                            item_id,
                        ),
                    )
                else:
                    cur.execute(
                        """
                        INSERT INTO inventory_items
                            (store_slug, item_id, name, category, suggested_price,
                             estimated_quantity, description, image_segment_id, image_url,
                             bbox, confidence, label, area)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id, store_slug, item_id, name, category,
                                  suggested_price, estimated_quantity, description,
                                  image_segment_id, image_url, bbox, confidence,
                                  label, area, created_at
                        """,
                        (
                            store_slug,
                            item_id,
                            item.get("name", ""),
                            item.get("category", ""),
                            item.get("suggested_price", 0),
                            item.get("estimated_quantity", 1),
                            item.get("description", ""),
                            item.get("image_segment_id", ""),
                            item.get("image_url", ""),
                            json.dumps(item.get("bbox")) if item.get("bbox") else None,
                            item.get("confidence"),
                            item.get("label", ""),
                            item.get("area"),
                        ),
                    )
                row = cur.fetchone()
    else:
        with get_conn() as conn:
            if existing:
                conn.execute(
                    """
                    UPDATE inventory_items
                    SET name = ?, category = ?, suggested_price = ?,
                        estimated_quantity = ?, description = ?,
                        image_segment_id = ?, image_url = ?,
                        bbox = ?, confidence = ?, label = ?, area = ?
                    WHERE store_slug = ? AND item_id = ?
                    """,
                    (
                        item.get("name", ""),
                        item.get("category", ""),
                        item.get("suggested_price", 0),
                        item.get("estimated_quantity", 1),
                        item.get("description", ""),
                        item.get("image_segment_id", ""),
                        item.get("image_url", ""),
                        json.dumps(item.get("bbox")) if item.get("bbox") else None,
                        item.get("confidence"),
                        item.get("label", ""),
                        item.get("area"),
                        store_slug,
                        item_id,
                    ),
                )
            else:
                conn.execute(
                    """
                    INSERT INTO inventory_items
                        (store_slug, item_id, name, category, suggested_price,
                         estimated_quantity, description, image_segment_id, image_url,
                         bbox, confidence, label, area)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        store_slug,
                        item_id,
                        item.get("name", ""),
                        item.get("category", ""),
                        item.get("suggested_price", 0),
                        item.get("estimated_quantity", 1),
                        item.get("description", ""),
                        item.get("image_segment_id", ""),
                        item.get("image_url", ""),
                        json.dumps(item.get("bbox")) if item.get("bbox") else None,
                        item.get("confidence"),
                        item.get("label", ""),
                        item.get("area"),
                    ),
                )
            row = conn.execute(
                "SELECT * FROM inventory_items WHERE store_slug = ? AND item_id = ?",
                (store_slug, item_id),
            ).fetchone()
    return dict(row)


def delete_inventory_item(store_slug: str, item_id: str) -> bool:
    """Delete a single inventory item. Returns True if a row was deleted."""
    with get_conn() as conn:
        if USE_POSTGRES:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM inventory_items WHERE store_slug = %s AND item_id = %s",
                    (store_slug, item_id),
                )
                deleted = cur.rowcount
        else:
            cur = conn.execute(
                "DELETE FROM inventory_items WHERE store_slug = ? AND item_id = ?",
                (store_slug, item_id),
            )
            deleted = cur.rowcount
    return deleted > 0
