import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv(override=True)

# Database URL: use PostgreSQL (IPv6) if available, otherwise SQLite fallback
DATABASE_URL = os.getenv("DATABASE_URL")

# Retry mechanism for database connection
def get_database_url(max_retries=5, retry_delay=3):
    for attempt in range(max_retries):
        db_url = os.getenv("DATABASE_URL")
        if db_url:
            print(f"Database URL found: {db_url[:10]}...")
            return db_url
        else:
            print(f"Database URL not found, retrying ({attempt+1}/{max_retries})...")
            # Reload environment variables with force override
            load_dotenv(dotenv_path=None, override=True)
            time.sleep(retry_delay)
    
    # Default to SQLite if no database URL is provided after retries
    sqlite_path = os.path.join(os.getcwd(), "prime_invest.db")
    sqlite_url = f"sqlite:////{sqlite_path}"
    print(f"Using SQLite fallback at: {sqlite_path}")
    return sqlite_url

DATABASE_URL = get_database_url()

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # No special connect_args needed for PostgreSQL
    connect_args = {}

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
