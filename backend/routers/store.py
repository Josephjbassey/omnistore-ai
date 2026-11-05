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
from backend.omnistore.store_db import (
    get_inventory,
    get_inventory_item,
    get_store,
    delete_inventory_item,
    list_stores,
    upsert_inventory,
    upsert_inventory_item,
    upsert_store,
)

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


# ─── Inventory Item CRUD (auth + ownership required) ────────────────────────

def _require_owner(slug: str, credentials: HTTPAuthorizationCredentials):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    token_payload = decode_access_token(credentials.credentials)
    if not token_payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = get_user_by_id(token_payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user_owns_store(user["id"], slug):
        raise HTTPException(status_code=403, detail="You do not own this store")
    return user


class InventoryItemRequest(BaseModel):
    item_id: str
    name: str
    category: str
    suggested_price: float
    estimated_quantity: int = 1
    description: str = ""
    image_segment_id: str = ""
    image_url: Optional[str] = None


@router.get(
    "/{slug}/inventory/{item_id}",
    summary="Get a single inventory item (public)",
)
async def get_single_inventory_item(slug: str, item_id: str):
    if not check_rate_limit(identifier=f"store:inventory:get:{slug}:{item_id}"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    item = get_inventory_item(slug, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


@router.put(
    "/{slug}/inventory/{item_id}",
    summary="Create or update a single inventory item (auth + ownership)",
)
async def put_single_inventory_item(
    slug: str,
    item_id: str,
    payload: InventoryItemRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    _require_owner(slug, credentials)
    if not check_rate_limit(identifier=f"store:inventory:put:{slug}"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    item = {
        "item_id": item_id,
        "name": payload.name,
        "category": payload.category,
        "suggested_price": payload.suggested_price,
        "estimated_quantity": payload.estimated_quantity,
        "description": payload.description,
        "image_segment_id": payload.image_segment_id,
        "image_url": payload.image_url,
    }
    saved = upsert_inventory_item(slug, item)
    return saved


@router.delete(
    "/{slug}/inventory/{item_id}",
    summary="Delete a single inventory item (auth + ownership)",
)
async def delete_single_inventory_item(
    slug: str,
    item_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    _require_owner(slug, credentials)
    if not check_rate_limit(identifier=f"store:inventory:delete:{slug}"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    deleted = delete_inventory_item(slug, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return {"slug": slug, "item_id": item_id, "status": "deleted"}
