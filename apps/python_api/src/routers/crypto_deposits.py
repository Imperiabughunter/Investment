from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID

from db.database import get_db
from schemas.schemas import User, CryptoPaymentRequest, CryptoPaymentResponse, Transaction, TransactionType, TransactionStatus
from services.crypto_service import CryptoService
from services.wallet_service import WalletService
from routers.auth import get_current_active_user, get_current_user

router = APIRouter()
crypto_service = CryptoService()
wallet_service = WalletService()

# Generate crypto deposit address
@router.post("/address/{currency}", status_code=status.HTTP_201_CREATED)
async def generate_deposit_address(
    currency: str,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        address_data = await crypto_service.generate_address(currency, current_user.id)
        return address_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate deposit address")

# Create crypto payment request
@router.post("/payment", response_model=CryptoPaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_request(
    payment_request: CryptoPaymentRequest,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        payment_data = await crypto_service.create_payment(payment_request.amount, payment_request.currency, payment_request.return_url, current_user.id)
        return payment_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create payment request")

# Get user's crypto deposit history
@router.get("/history", response_model=List[Transaction])
async def get_deposit_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
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
        transaction_type=TransactionType.DEPOSIT
    )

# Webhook for crypto payment notifications
@router.post("/webhook", status_code=status.HTTP_200_OK)
async def crypto_webhook(
    payload: Dict[str, Any] = Body(...),
    signature: str = Query(..., alias="x-signature"),
    db: Session = Depends(get_db)
):
    try:
        # Verify webhook signature
        is_valid = await crypto_service.verify_webhook_signature(payload, signature)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Process the webhook
        await crypto_service.process_webhook(db, payload)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get supported cryptocurrencies
@router.get("/currencies")
async def get_supported_currencies():
    try:
        currencies = await crypto_service._get_supported_currencies()
        return {"currencies": currencies}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch supported currencies")