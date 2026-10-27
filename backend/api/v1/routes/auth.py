"""Authentication API routes."""

import logging
import json
import os

from fastapi import APIRouter, Depends, HTTPException, status

from core.security import (
    create_access_token,
    verify_password,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ROLE_HIERARCHY,
    User,
    get_current_user,
)
from schemas.risk import LoginRequest, TokenResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

def configured_users() -> dict:
    """Load explicitly provisioned users; never create default credentials."""
    try:
        users = json.loads(os.getenv("AUTH_USERS_JSON", "{}"))
    except json.JSONDecodeError as exc:
        raise ValueError("AUTH_USERS_JSON must be valid JSON") from exc
    if not isinstance(users, dict):
        raise ValueError("AUTH_USERS_JSON must be a JSON object")
    for username, user in users.items():
        if (not isinstance(username, str) or not isinstance(user, dict)
                or user.get("role") not in ROLE_HIERARCHY
                or not isinstance(user.get("password_hash"), str)
                or not user["password_hash"].startswith("$pbkdf2-sha256$")):
            raise ValueError("Each user needs a valid role and PBKDF2 password_hash")
    return users


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest):
    """Authenticate user and return JWT token.

    Users must be provisioned through AUTH_USERS_JSON.
    """
    user = configured_users().get(request.username)
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    token = create_access_token(
        data={"sub": request.username, "role": user["role"]}
    )
    return TokenResponse(
        access_token=token,
        role=user["role"],
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me")
def get_current_user_info(
    user: User | None = Depends(get_current_user),
):
    """Get current authenticated user info.

    Returns user details if authenticated, or anonymous status in development.
    """
    if user is None:
        return {"authenticated": False, "role": "anonymous"}
    return {
        "authenticated": True,
        "username": user.username,
        "role": user.role,
        "full_name": user.full_name,
    }
