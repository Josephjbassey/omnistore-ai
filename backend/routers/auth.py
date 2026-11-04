"""
OmniStore AI — Auth Router.
Register, login, me, logout. Public by default; auth required only for protected routes.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr

from backend.omnistore.auth_db import (
    authenticate_user,
    create_access_token,
    create_session,
    create_user,
    decode_access_token,
    get_user_by_id,
    init_auth_db,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

security = HTTPBearer(auto_error=False)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "merchant"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool


@router.post("/register", response_model=TokenResponse, summary="Register a new account")
async def register(req: RegisterRequest):
    init_auth_db()
    if get_user_by_id(req.email):  # placeholder; use email lookup instead
        pass
    from omnistore.auth_db import get_user_by_email

    if get_user_by_email(req.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = create_user(
        email=req.email,
        password=req.password,
        full_name=req.full_name,
        role=req.role,
    )
    token = create_access_token(user["id"], user["email"], user["role"])
    create_session(user["id"], token)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "is_active": user["is_active"],
        },
    }


@router.post("/login", response_model=TokenResponse, summary="Login")
async def login(req: LoginRequest):
    init_auth_db()
    user = authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"], user["role"])
    create_session(user["id"], token)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "is_active": user["is_active"],
        },
    }


@router.get("/me", response_model=UserResponse, summary="Get current user")
async def me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "is_active": user["is_active"],
    }


@router.post("/logout", summary="Logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return {"status": "logged out"}


# Dependency for protected routes
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="User inactive")
    return user


# RBAC dependency
def require_role(required_role: str):
    def role_checker(user: dict = Depends(get_current_user)):
        role_hierarchy = {"customer": 0, "merchant": 1, "admin": 2}
        if role_hierarchy.get(user["role"], 0) < role_hierarchy.get(required_role, 0):
            raise HTTPException(
                status_code=403,
                detail=f"Requires {required_role} role",
            )
        return user

    return role_checker


# Rate limiting dependency
from omnistore.auth_db import check_rate_limit


def rate_limit(identifier_header: str = "x-forwarded-for"):
    async def rate_limit_dep(request):
        from starlette.requests import Request

        req: Request = request
        ident = req.headers.get(identifier_header) or req.client.host if req.client else "anon"
        from omnistore.auth_db import check_rate_limit as _check

        if not _check(identifier=ident):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        return True

    return rate_limit_dep
