"""
Tests for Auth endpoints: register, login, refresh, me, create child.
"""
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.main import app
from app.core.database import Base, get_db

# Fixtures (client, setup_db, override_get_db) provided by conftest.py


# ── Tests ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_register_parent(client):
    resp = await client.post("/auth/register", json={
        "email": "parent@test.com",
        "password": "Password123",
        "full_name": "أحمد محمد",
        "role": "parent",
        "whatsapp_phone": "966501234567",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["role"] == "parent"


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {
        "email": "parent@test.com",
        "password": "Password123",
        "full_name": "أحمد",
        "role": "parent",
    }
    await client.post("/auth/register", json=payload)
    resp = await client.post("/auth/register", json=payload)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_login(client):
    await client.post("/auth/register", json={
        "email": "user@test.com",
        "password": "Password123",
        "full_name": "Test",
        "role": "parent",
    })
    resp = await client.post("/auth/login", json={
        "email": "user@test.com",
        "password": "Password123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/auth/register", json={
        "email": "user2@test.com",
        "password": "Password123",
        "full_name": "Test",
        "role": "parent",
    })
    resp = await client.post("/auth/login", json={
        "email": "user2@test.com",
        "password": "WrongPassword",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me(client):
    reg = await client.post("/auth/register", json={
        "email": "me@test.com",
        "password": "Password123",
        "full_name": "Me",
        "role": "parent",
    })
    token = reg.json()["access_token"]
    resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@test.com"


@pytest.mark.asyncio
async def test_invalid_whatsapp_phone(client):
    resp = await client.post("/auth/register", json={
        "email": "wa@test.com",
        "password": "Password123",
        "full_name": "Test",
        "role": "parent",
        "whatsapp_phone": "123",   # invalid format
    })
    assert resp.status_code == 422  # Pydantic validation error


@pytest.mark.asyncio
async def test_refresh_token(client):
    reg = await client.post("/auth/register", json={
        "email": "refresh@test.com",
        "password": "Password123",
        "full_name": "Refresh Tester",
        "role": "parent",
    })
    assert reg.status_code == 201
    refresh_token = reg.json()["refresh_token"]

    resp = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    # Token rotation: new refresh token is issued
    assert data["refresh_token"] != refresh_token


@pytest.mark.asyncio
async def test_create_child_account(client):
    reg = await client.post("/auth/register", json={
        "email": "parent_for_child@test.com",
        "password": "Password123",
        "full_name": "الأب فهد",
        "role": "parent",
    })
    token = reg.json()["access_token"]

    resp = await client.post(
        "/auth/children",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "child@test.com",
            "password": "ChildPassword123",
            "full_name": "سعد فهد",
            "nickname": "سعد",
        },
    )
    assert resp.status_code == 201
    child_data = resp.json()
    assert child_data["role"] == "child"
    assert child_data["email"] == "child@test.com"

