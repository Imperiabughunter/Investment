from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from db.database import get_db
from schemas.schemas import Loan, LoanCreate, LoanProduct, LoanStatus
from services.loan_service import LoanService
from routers.auth import get_current_active_user, get_current_user

router = APIRouter()
loan_service = LoanService()

# Get all active loan products
@router.get("/products", response_model=List[LoanProduct])
async def get_loan_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return loan_service.get_active_products(db, skip=skip, limit=limit)

# Get loan product by ID
@router.get("/products/{product_id}", response_model=LoanProduct)
async def get_loan_product(
    product_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    product = loan_service.get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Loan product not found")
    return product

# Get user's loans
@router.get("/my-loans", response_model=List[Loan])
async def get_my_loans(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[LoanStatus] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return loan_service.get_user_loans(db, current_user.id, skip=skip, limit=limit, status=status)

# Get user's loan by ID
@router.get("/my-loans/{loan_id}", response_model=Loan)
async def get_my_loan(
    loan_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    loan = loan_service.get_loan(db, loan_id)
    if loan is None or loan.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan

# Apply for a new loan
@router.post("/apply", response_model=Loan, status_code=status.HTTP_201_CREATED)
async def apply_for_loan(
    product_id: UUID = Body(...),
    amount: float = Body(..., gt=0),
    term_months: int = Body(..., gt=0),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Get the loan product
    product = loan_service.get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Loan product not found")
    
    # Validate amount against product min/max
    if amount < product.min_amount:
        raise HTTPException(status_code=400, detail=f"Minimum loan amount is {product.min_amount}")
    if amount > product.max_amount:
        raise HTTPException(status_code=400, detail=f"Maximum loan amount is {product.max_amount}")
    
    # Create the loan application
    try:
        loan = loan_service.create_loan_application(db, current_user.id, product_id, amount, term_months)
        return loan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Make a loan payment
@router.post("/my-loans/{loan_id}/payment", response_model=Loan)
async def make_loan_payment(
    loan_id: UUID = Path(...),
    amount: float = Body(..., gt=0),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Get the loan
    loan = loan_service.get_loan(db, loan_id)
    if loan is None or loan.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    # Validate loan status
    if loan.status != LoanStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Loan is not active")
    
    # Make the payment
    try:
        updated_loan = loan_service.make_loan_payment(db, loan_id, amount)
        return updated_loan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Admin routes
async def get_current_admin(current_user = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    return current_user

# Get all loans (admin only)
@router.get("/", response_model=List[Loan])
async def get_all_loans(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[LoanStatus] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    return loan_service.get_all_loans(db, skip=skip, limit=limit, status=status)

# Get loan by ID (admin only)
@router.get("/{loan_id}", response_model=Loan)
async def get_loan(
    loan_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    loan = loan_service.get_loan(db, loan_id)
    if loan is None:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan

# Update loan status (admin only)
@router.put("/{loan_id}/status", response_model=Loan)
async def update_loan_status(
    loan_id: UUID = Path(...),
    status: LoanStatus = Body(...),
    rejection_reason: Optional[str] = Body(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    loan = loan_service.get_loan(db, loan_id)
    if loan is None:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    try:
        updated_loan = loan_service.update_loan_status(db, loan_id, status, rejection_reason)
        return updated_loan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))