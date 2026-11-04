"""
OmniStore AI — Store & Inventory API Router.
Public read access (no signup required). Write access requires auth + ownership.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional

from backend.omnistore.auth_db import (
    check_rate_limit,
    get_user_stores,
    user_owns_store,
    add_store_owner,
    decode_access_token,
    get_user_by_id,
)
from backend.omnistore.store_db import get_inventory, get_store, list_stores, upsert_inventory, upsert_store

router = APIRouter(prefix="/api/v1/store", tags=["Store & Inventory"])

security = HTTPBearer(auto_error=False)


class PublishRequest(BaseModel):
    store_title: str = "Untitled Store"
    currency: str = "NGN"
    location: str = ""
    whatsapp_number: Optional[str] = None
    category: Optional[str] = None
    inventory: list[dict] = []


class StoreResponse(BaseModel):
    slug: str
    store_title: str
    currency: str
    location: str
    whatsapp_number: Optional[str] = None
    category: Optional[str] = None
    created_at: str
    updated_at: str
    inventory: list[dict]


@router.get("/{slug}", summary="Get a published store by slug (public, no signup)")
async def get_public_store(slug: str):
    if not check_rate_limit(identifier=f"store:get:{slug}"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    store = get_store(slug)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    inventory = get_inventory(slug)
    return {
        "slug": store["slug"],
        "store_title": store["store_title"],
        "currency": store["currency"],
        "location": store["location"],
        "whatsapp_number": store["whatsapp_number"],
        "category": store["category"],
        "created_at": store["created_at"],
        "updated_at": store["updated_at"],
        "inventory": inventory,
    }


@router.get("", summary="List all public stores")
async def list_public_stores():
    if not check_rate_limit(identifier="store:list"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    return {"stores": list_stores()}


@router.post("/{slug}/publish", summary="Publish/save a scanned store (requires auth)")
async def publish_store(
    slug: str,
    payload: PublishRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required to publish")
    token_payload = decode_access_token(credentials.credentials)
    if not token_payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = get_user_by_id(token_payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user_owns_store(user["id"], slug):
        add_store_owner(user["id"], slug, role="owner")

    if not check_rate_limit(identifier=f"store:publish:{slug}"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    upsert_store(
        slug=slug,
        store_title=payload.store_title,
        currency=payload.currency,
        location=payload.location,
        whatsapp_number=payload.whatsapp_number,
        category=payload.category,
    )
    if payload.inventory:
        upsert_inventory(slug, payload.inventory)
    return {"slug": slug, "status": "published"}


@router.get("/my/stores", summary="List stores owned by current user (requires auth)")
async def list_my_stores(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    from backend.routers.auth import decode_access_token, get_user_by_id

    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"stores": get_user_stores(user["id"])}
