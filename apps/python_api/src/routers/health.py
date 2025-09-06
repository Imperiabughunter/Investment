from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from typing import Dict
import os
import psutil
import time

from db.database import get_db

router = APIRouter()

# Track application start time for uptime calculation
START_TIME = time.time()

@router.get("/health")
async def health_check():
    """
    Basic health check endpoint
    """
    return {"status": "ok", "message": "API is running"}

@router.get("/health/db")
async def db_health_check(db: Session = Depends(get_db)):
    """
    Database connection health check
    """
    try:
        # Execute a simple query to check database connection
        db.execute("SELECT 1")
        return {"status": "ok", "message": "Database connection is healthy"}
    except Exception as e:
        return {"status": "error", "message": f"Database connection error: {str(e)}"}

@router.get("/health/detailed")
async def detailed_health_check(response: Response, db: Session = Depends(get_db)) -> Dict:
    """
    Detailed health check with system metrics and database connection test
    """
    # System metrics
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    uptime = time.time() - START_TIME
    
    # Test database connection
    db_status = "connected"
    db_response_time = 0
    try:
        start_time = time.time()
        db.execute("SELECT 1")
        db_response_time = time.time() - start_time
    except Exception as e:
        db_status = f"error: {str(e)}"
        response.status_code = 500
    
    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "uptime_seconds": uptime,
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_total_mb": memory.total / (1024 * 1024),
            "memory_used_mb": memory.used / (1024 * 1024),
            "memory_percent": memory.percent,
            "disk_total_gb": disk.total / (1024 * 1024 * 1024),
            "disk_used_gb": disk.used / (1024 * 1024 * 1024),
            "disk_percent": disk.percent,
        },
        "database": {
            "status": db_status,
            "response_time_ms": round(db_response_time * 1000, 2) if db_status == "connected" else None
        }
    }