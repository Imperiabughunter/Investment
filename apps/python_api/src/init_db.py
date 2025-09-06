#!/usr/bin/env python3
"""
Database initialization script.
This script creates all the database tables.
"""
from db.database import engine
from models import models

def create_tables():
    """Create all database tables."""
    print("Creating database tables...")
    try:
        models.Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        raise

if __name__ == "__main__":
    create_tables()
