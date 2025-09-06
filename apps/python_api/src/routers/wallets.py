from fastapi import APIRouter, Depends, HTTPException, status, Path, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from db.database import get_db
from schemas.schemas import Wallet, WalletUpdate, TransactionCreate, Transaction, TransactionType
from services.wallet_service import WalletService
from routers.auth import get_current_active_user, get_current_user

router = APIRouter()
wallet_service = WalletService()

# Get current user's wallet
@router.get("/me", response_model=Wallet)
async def get_my_wallet(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    wallet = wallet_service.get_wallet_by_user_id(db, current_user.id)
    if wallet is None:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet

# Get wallet transactions
@router.get("/me/transactions", response_model=List[Transaction])
async def get_my_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    transaction_type: Optional[TransactionType] = None,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    wallet = wallet_service.get_wallet_by_user_id(db, current_user.id)
    if wallet is None:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    return wallet_service.get_wallet_transactions(
        db, 
        wallet_id=wallet.id, 
        skip=skip, 
        limit=limit,
        transaction_type=transaction_type
    )

# Create deposit transaction
@router.post("/me/deposit", response_model=Transaction)
async def create_deposit(
    amount: float = Query(..., gt=0),
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    wallet = wallet_service.get_wallet_by_user_id(db, current_user.id)
    if wallet is None:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    transaction = wallet_service.create_transaction(
        db,
        user_id=current_user.id,
        wallet_id=wallet.id,
        amount=amount,
        transaction_type=TransactionType.DEPOSIT
    )
    
    return transaction

# Create withdrawal transaction
@router.post("/me/withdraw", response_model=Transaction)
async def create_withdrawal(
    amount: float = Query(..., gt=0),
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    wallet = wallet_service.get_wallet_by_user_id(db, current_user.id)
    if wallet is None:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    if wallet.balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    transaction = wallet_service.create_transaction(
        db,
        user_id=current_user.id,
        wallet_id=wallet.id,
        amount=-amount,  # Negative amount for withdrawal
        transaction_type=TransactionType.WITHDRAWAL
    )
    
    return transaction

# Admin routes
async def get_current_admin(current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    return current_user

# Get wallet by ID (admin only)
@router.get("/{wallet_id}", response_model=Wallet)
async def get_wallet(
    wallet_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    wallet = wallet_service.get_wallet(db, wallet_id)
    if wallet is None:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet

# Update wallet (admin only)
@router.put("/{wallet_id}", response_model=Wallet)
async def update_wallet(
    wallet_id: UUID = Path(...),
    wallet_update: WalletUpdate = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    wallet = wallet_service.get_wallet(db, wallet_id)
    if wallet is None:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    return wallet_service.update_wallet(db, wallet_id, wallet_update)

# Get wallet transactions (admin only)
@router.get("/{wallet_id}/transactions", response_model=List[Transaction])
async def get_wallet_transactions(
    wallet_id: UUID = Path(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    transaction_type: Optional[TransactionType] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    wallet = wallet_service.get_wallet(db, wallet_id)
    if wallet is None:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    return wallet_service.get_wallet_transactions(
        db, 
        wallet_id=wallet.id, 
        skip=skip, 
        limit=limit,
        transaction_type=transaction_type
    )