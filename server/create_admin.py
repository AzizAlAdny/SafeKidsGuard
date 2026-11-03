"""
Safe Kids Guard - Administrator Account Management CLI
Creates a new admin account or promotes an existing user to admin.

Usage:
    python create_admin.py --email admin@example.com --password YourPassword --name "Admin Name"
    python create_admin.py --promote aziz@gmail.com
"""
import argparse
import asyncio
import sys
from pathlib import Path

# Add server directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.auth.models import User


async def create_admin(email: str, password: str, full_name: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            print(f"[!] User '{email}' already exists with role '{user.role}'.")
            if user.role != "admin":
                user.role = "admin"
                user.is_active = True
                await session.commit()
                print(f"[OK] Promoted existing user '{email}' to 'admin'.")
            return

        new_admin = User(
            email=email,
            password_hash=hash_password(password),
            role="admin",
            full_name=full_name,
            is_active=True,
        )
        session.add(new_admin)
        await session.commit()
        print(f"[OK] Successfully created new administrator account:")
        print(f"    Email:    {email}")
        print(f"    Role:     admin")
        print(f"    Name:     {full_name}")


async def promote_user(email: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            print(f"[X] No user found with email: {email}")
            return

        user.role = "admin"
        user.is_active = True
        await session.commit()
        print(f"[OK] Successfully promoted '{email}' to 'admin' role.")


def main():
    parser = argparse.ArgumentParser(description="Manage Safe Kids Guard Administrator Accounts")
    parser.add_argument("--email", type=str, default="admin@safekidsguard.com", help="Admin email address")
    parser.add_argument("--password", type=str, default="Admin@123456", help="Admin password (min 8 chars)")
    parser.add_argument("--name", type=str, default="System Administrator", help="Admin full name")
    parser.add_argument("--promote", type=str, help="Promote an existing user to admin by email")

    args = parser.parse_args()

    if args.promote:
        asyncio.run(promote_user(args.promote))
    else:
        asyncio.run(create_admin(args.email, args.password, args.name))


if __name__ == "__main__":
    main()
