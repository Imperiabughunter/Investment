from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from db.database import get_db
from schemas.schemas import User, UserUpdate, UserRole
from services.user_service import UserService
from routers.auth import get_current_active_user, get_current_user

router = APIRouter()
user_service = UserService()

# Get current user profile
@router.get("/profile", response_model=User)
async def get_user_profile(current_user: User = Depends(get_current_active_user)):
    return current_user

# Update current user profile
@router.put("/profile", response_model=User)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return user_service.update_user(db, current_user.id, user_update)

# Admin routes - require admin role
async def get_current_admin(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    return current_user

# Get all users (admin only)
@router.get("/", response_model=List[User])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return user_service.get_users(db, skip=skip, limit=limit)

# Get user by ID (admin only)
@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    db_user = user_service.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

# Update user (admin only)
@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: UUID = Path(...),
    user_update: UserUpdate = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    db_user = user_service.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user_service.update_user(db, user_id, user_update)

# Deactivate user (admin only)
@router.delete("/{user_id}")
async def deactivate_user(
    user_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    db_user = user_service.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user_service.deactivate_user(db, user_id)
    return {"message": "User deactivated successfully"}

# Change user role (admin only)
@router.put("/{user_id}/role", response_model=User)
async def change_user_role(
    user_id: UUID = Path(...),
    role: UserRole = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    db_user = user_service.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    return user_service.update_user_role(db, user_id, role)