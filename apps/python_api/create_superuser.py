#!/usr/bin/env python
"""
Script to create a superuser with full CRUD abilities
Run this script from the command line to create a superuser account
"""

import os
import sys
import argparse
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Add the src directory to the path so we can import modules
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

# Load environment variables
load_dotenv()

from db.database import SessionLocal
from services.user_service import UserService

def create_superuser(email: str, password: str, first_name: str, last_name: str, phone: str = None):
    """
    Create a superuser with full CRUD abilities
    """
    db: Session = SessionLocal()
    try:
        user_service = UserService()
        superuser = user_service.create_superuser(
            db=db,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone
        )
        print(f"Superuser created successfully: {superuser.email}")
        return superuser
    except Exception as e:
        print(f"Error creating superuser: {e}")
        return None
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Create a superuser with full CRUD abilities")
    parser.add_argument("--email", required=True, help="Superuser email")
    parser.add_argument("--password", required=True, help="Superuser password")
    parser.add_argument("--first-name", required=True, help="Superuser first name")
    parser.add_argument("--last-name", required=True, help="Superuser last name")
    parser.add_argument("--phone", help="Superuser phone number (optional)")
    
    args = parser.parse_args()
    
    create_superuser(
        email=args.email,
        password=args.password,
        first_name=args.first_name,
        last_name=args.last_name,
        phone=args.phone
    )

if __name__ == "__main__":
    main()