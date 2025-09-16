from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional
import os

from db.database import get_db
from schemas.schemas import UserCreate, User, Token, TokenData, LoginRequest, RefreshTokenRequest
from services.auth_service import AuthService
from core.security import create_access_token, create_refresh_token, verify_refresh_token, get_password_hash

router = APIRouter()
auth_service = AuthService()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET", "your-super-secret-jwt-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Dependency to get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id, role=role)
    except JWTError:
        raise credentials_exception
    
    user = auth_service.get_user_by_id(db, user_id=token_data.user_id)
    if user is None:
        raise credentials_exception
    return user

# Dependency to get current active user
async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Dependency to get current superuser
async def get_current_superuser(current_user: User = Depends(get_current_user)):
    if current_user.role != "superuser":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can access this endpoint"
        )
    return current_user

# Register new user
@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = auth_service.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return auth_service.create_user(db=db, user=user)

# Register new superuser (protected endpoint)
@router.post("/register/superuser", response_model=User, status_code=status.HTTP_201_CREATED)
async def register_superuser(
    user_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if the current user is a superuser
    if current_user.role != "superuser":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only existing superusers can create new superusers"
        )
    
    # Check if email already exists
    db_user = auth_service.get_user_by_email(db, email=user_data.get("email"))
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create superuser
    return auth_service.create_superuser(db=db, user_data=user_data)

# Login user
@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access and refresh tokens
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=access_token_expires
    )
    
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
        expires_delta=refresh_token_expires
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

# Refresh token
@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token_req: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        payload = verify_refresh_token(refresh_token_req.refresh_token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        
        user = auth_service.get_user_by_id(db, user_id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        
        # Create new access and refresh tokens
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role},
            expires_delta=access_token_expires
        )
        
        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        new_refresh_token = create_refresh_token(
            data={"sub": str(user.id)},
            expires_delta=refresh_token_expires
        )
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

# Get current user info
@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# Password reset request
@router.post("/forgot-password")
async def forgot_password(email: str = Body(..., embed=True), db: Session = Depends(get_db)):
    user = auth_service.get_user_by_email(db, email=email)
    if not user:
        # Don't reveal that the user doesn't exist
        return {"success": True, "message": "If your email is registered, you will receive a password reset link"}
    
    # Generate a reset token
    reset_token = create_access_token(
        data={"sub": str(user.id), "purpose": "password_reset"},
        expires_delta=timedelta(hours=1)  # Token expires in 1 hour
    )
    
    # In a real implementation, send an email with the reset token
    # For demonstration, we'll just return the token in the response
    # In production, you would use an email service to send this token
    
    return {"success": True, "message": "If your email is registered, you will receive a password reset link", "token": reset_token}

# Reset password
@router.post("/reset-password")
async def reset_password(
    token: str = Body(...),
    new_password: str = Body(...),
    db: Session = Depends(get_db)
):
    try:
        # Verify the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        purpose = payload.get("purpose")
        
        if not user_id or purpose != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token"
            )
            
        # Get the user
        user = auth_service.get_user_by_id(db, user_id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        # Update the password
        hashed_password = get_password_hash(new_password)
        user.hashed_password = hashed_password
        db.commit()
        
        return {"success": True, "message": "Password has been reset successfully"}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token",
        )