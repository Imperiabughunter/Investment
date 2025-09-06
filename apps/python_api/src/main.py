from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers
from routers import auth, users, wallets, investments, loans, admin, crypto_deposits, health

# Import Celery app for background tasks
from tasks.celery_app import celery_app

# Create FastAPI app
app = FastAPI(
    title="Prime Investment Platform API",
    description="API for Prime Investment and Lending Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
        "exp://192.168.1.*:8081",
        os.getenv("WEB_BASE_URL", "http://localhost:5173"),
        os.getenv("MOBILE_BASE_URL", "http://localhost:8081"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(wallets.router, prefix="/wallets", tags=["Wallets"])
app.include_router(investments.router, prefix="/investments", tags=["Investments"])
app.include_router(loans.router, prefix="/loans", tags=["Loans"])
app.include_router(crypto_deposits.router, prefix="/crypto-deposits", tags=["Crypto Deposits"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Prime Investment Platform API",
        "version": "1.0.0",
        "status": "running",
        "documentation": "/docs",
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)