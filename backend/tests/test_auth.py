"""Regression checks for provisioned accounts and removed demo credentials."""

import os

os.environ.setdefault("DATABASE_URL", "sqlite:///test.db")

import json

import pytest
from fastapi import HTTPException

from api.v1.routes.auth import configured_users, login
from core.security import decode_token, get_password_hash
from schemas.risk import LoginRequest


def test_no_default_demo_account(monkeypatch):
    monkeypatch.delenv("AUTH_USERS_JSON", raising=False)
    assert configured_users() == {}
    with pytest.raises(HTTPException) as exc:
        login(LoginRequest(username="partner", password="partner123"))
    assert exc.value.status_code == 401


def test_provisioned_account_can_log_in(monkeypatch):
    monkeypatch.setenv(
        "AUTH_USERS_JSON",
        json.dumps({
            "owner": {
                "role": "partner",
                "password_hash": get_password_hash("long-test-password"),
            }
        }),
    )
    result = login(LoginRequest(username="owner", password="long-test-password"))
    assert decode_token(result.access_token).sub == "owner"
    assert result.role == "partner"


def test_invalid_account_configuration_fails_closed(monkeypatch):
    monkeypatch.setenv("AUTH_USERS_JSON", '{"owner":{"role":"partner","password_hash":"plaintext"}}')
    with pytest.raises(ValueError):
        configured_users()
