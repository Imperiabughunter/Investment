from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from db.database import get_db
from schemas.schemas import Investment, InvestmentCreate, InvestmentPlan, InvestmentStatus
from services.investment_service import InvestmentService
from routers.auth import get_current_active_user, get_current_user

router = APIRouter()
investment_service = InvestmentService()

# Get all active investment plans
@router.get("/plans", response_model=List[InvestmentPlan])
async def get_investment_plans(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return investment_service.get_active_plans(db, skip=skip, limit=limit)

# Get investment plan by ID
@router.get("/plans/{plan_id}", response_model=InvestmentPlan)
async def get_investment_plan(
    plan_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    plan = investment_service.get_plan(db, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Investment plan not found")
    return plan

# Get user's investments
@router.get("/my-investments", response_model=List[Investment])
async def get_my_investments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[InvestmentStatus] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return investment_service.get_user_investments(db, current_user.id, skip=skip, limit=limit, status=status)

# Get user's investment by ID
@router.get("/my-investments/{investment_id}", response_model=Investment)
async def get_my_investment(
    investment_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    investment = investment_service.get_investment(db, investment_id)
    if investment is None or investment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Investment not found")
    return investment

# Create a new investment
@router.post("/invest", response_model=Investment, status_code=status.HTTP_201_CREATED)
async def create_investment(
    plan_id: UUID = Body(...),
    amount: float = Body(..., gt=0),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Get the investment plan
    plan = investment_service.get_plan(db, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Investment plan not found")
    
    # Validate amount against plan min/max
    if amount < plan.min_amount:
        raise HTTPException(status_code=400, detail=f"Minimum investment amount is {plan.min_amount}")
    if amount > plan.max_amount:
        raise HTTPException(status_code=400, detail=f"Maximum investment amount is {plan.max_amount}")
    
    # Create the investment
    try:
        investment = investment_service.create_investment(db, current_user.id, plan_id, amount)
        return investment
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

# Get all investments (admin only)
@router.get("/", response_model=List[Investment])
async def get_all_investments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[InvestmentStatus] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    return investment_service.get_all_investments(db, skip=skip, limit=limit, status=status)

# Get investment by ID (admin only)
@router.get("/{investment_id}", response_model=Investment)
async def get_investment(
    investment_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    investment = investment_service.get_investment(db, investment_id)
    if investment is None:
        raise HTTPException(status_code=404, detail="Investment not found")
    return investment

# Update investment status (admin only)
@router.put("/{investment_id}/status", response_model=Investment)
async def update_investment_status(
    investment_id: UUID = Path(...),
    status: InvestmentStatus = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    investment = investment_service.get_investment(db, investment_id)
    if investment is None:
        raise HTTPException(status_code=404, detail="Investment not found")
    
    return investment_service.update_investment_status(db, investment_id, status)