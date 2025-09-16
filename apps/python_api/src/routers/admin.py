from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from db.database import get_db
from schemas.schemas import User, UserUpdate, UserRole, Document, DocumentStatus, Investment, InvestmentStatus, InvestmentPlan
from services.user_service import UserService
from services.document_service import DocumentService
from services.investment_service import InvestmentService
from services.loan_service import LoanService
from services.wallet_service import WalletService
from services.notification_service import NotificationService
from services.audit_service import AuditService
from routers.auth import get_current_user, get_current_superuser

router = APIRouter()
user_service = UserService()
document_service = DocumentService()
investment_service = InvestmentService()
loan_service = LoanService()
wallet_service = WalletService()
notification_service = NotificationService()
audit_service = AuditService()

# Superuser Management Endpoints
@router.post("/admins", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_admin(
    user_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    # Set role to ADMIN by default
    user_data["role"] = UserRole.ADMIN
    return user_service.create_user(db, user_data)

@router.get("/admins", response_model=List[User])
async def get_all_admins(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    return user_service.get_users_by_role(db, UserRole.ADMIN, skip=skip, limit=limit)

@router.put("/admins/{admin_id}", response_model=User)
async def update_admin(
    admin_id: UUID = Path(...),
    user_update: UserUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    user = user_service.get_user(db, admin_id)
    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=404, detail="Admin user not found")
    return user_service.update_user(db, admin_id, user_update)

@router.delete("/admins/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin(
    admin_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    user = user_service.get_user(db, admin_id)
    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=404, detail="Admin user not found")
    user_service.delete_user(db, admin_id)
    return None

# User Management Endpoints
@router.get("/users", response_model=List[User])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    return user_service.get_users(db, skip=skip, limit=limit)

@router.get("/users/{user_id}", response_model=User)
async def get_user(
    user_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: UUID = Path(...),
    user_update: UserUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_service.update_user(db, user_id, user_update)

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_service.delete_user(db, user_id)
    return None

@router.put("/users/{user_id}/deactivate", response_model=User)
async def deactivate_user(
    user_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_service.deactivate_user(db, user_id)

@router.put("/users/{user_id}/activate", response_model=User)
async def activate_user(
    user_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_service.activate_user(db, user_id)

# Admin dependency - require admin role
async def get_current_admin(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN and current_user.role != UserRole.SUPERUSER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    return current_user

# Superuser dependency - require superuser role
async def get_current_superuser(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.SUPERUSER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser privileges required"
        )
    return current_user

# Dashboard statistics
@router.get("/dashboard/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    # Get statistics from various services
    total_users = len(user_service.get_users(db, skip=0, limit=1000))
    active_users = len([u for u in user_service.get_users(db, skip=0, limit=1000) if u.is_active])
    
    # Get pending KYC documents
    pending_kyc = len(document_service.get_all_documents(db, skip=0, limit=1000, status=DocumentStatus.PENDING))
    
    # Get investment statistics
    total_investments = len(investment_service.get_all_investments(db, skip=0, limit=1000))
    active_investments = len(investment_service.get_all_investments(db, skip=0, limit=1000, status=InvestmentStatus.ACTIVE))
    
    # Get loan statistics
    total_loans = len(loan_service.get_all_loans(db, skip=0, limit=1000))
    pending_loans = len(loan_service.get_all_loans(db, skip=0, limit=1000, status="PENDING"))
    
    # Get wallet statistics
    total_balance = wallet_service.get_total_platform_balance(db)
    
    return {
        "users": {
            "total": total_users,
            "active": active_users
        },
        "kyc": {
            "pending": pending_kyc
        },
        "investments": {
            "total": total_investments,
            "active": active_investments
        },
        "loans": {
            "total": total_loans,
            "pending": pending_loans
        },
        "wallet": {
            "total_balance": total_balance
        }
    }

# KYC Management Endpoints
@router.get("/kyc", response_model=List[Document])
async def get_all_kyc_documents(
    skip: int = 0,
    limit: int = 100,
    status: Optional[DocumentStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    return document_service.get_all_documents(db, skip=skip, limit=limit, status=status)

@router.get("/kyc/{document_id}", response_model=Document)
async def get_kyc_document(
    document_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    document = document_service.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.put("/kyc/{document_id}/approve", response_model=Document)
async def approve_kyc_document(
    document_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    document = document_service.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document_service.update_document_status(db, document_id, DocumentStatus.APPROVED)

@router.put("/kyc/{document_id}/reject", response_model=Document)
async def reject_kyc_document(
    document_id: UUID = Path(...),
    rejection_reason: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    document = document_service.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document_service.update_document_status(db, document_id, DocumentStatus.REJECTED, rejection_reason)

# Investment Plan Management Endpoints
@router.get("/investment-plans", response_model=List[InvestmentPlan])
async def get_all_investment_plans(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return investment_service.get_all_plans(db, skip=skip, limit=limit)

@router.post("/investment-plans", response_model=InvestmentPlan, status_code=status.HTTP_201_CREATED)
async def create_investment_plan(
    plan_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return investment_service.create_plan(db, plan_data)

@router.put("/investment-plans/{plan_id}", response_model=InvestmentPlan)
async def update_investment_plan(
    plan_id: UUID = Path(...),
    plan_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    plan = investment_service.get_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Investment plan not found")
    return investment_service.update_plan(db, plan_id, plan_data)

@router.delete("/investment-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_investment_plan(
    plan_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    plan = investment_service.get_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Investment plan not found")
    investment_service.delete_plan(db, plan_id)
    return None

# Investment Management Endpoints
@router.get("/investments", response_model=List[Investment])
async def get_all_investments(
    skip: int = 0,
    limit: int = 100,
    status: Optional[InvestmentStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return investment_service.get_all_investments(db, skip=skip, limit=limit, status=status)

@router.get("/investments/{investment_id}", response_model=Investment)
async def get_investment(
    investment_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    investment = investment_service.get_investment(db, investment_id)
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    return investment

@router.put("/investments/{investment_id}/status", response_model=Investment)
async def update_investment_status(
    investment_id: UUID = Path(...),
    status: InvestmentStatus = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    investment = investment_service.get_investment(db, investment_id)
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    return investment_service.update_investment_status(db, investment_id, status)

# Loan Product Management Endpoints
@router.get("/loan-products", response_model=List[dict])
async def get_all_loan_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return loan_service.get_all_loan_products(db, skip=skip, limit=limit)

@router.post("/loan-products", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_loan_product(
    product_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return loan_service.create_loan_product(db, product_data)

@router.get("/loan-products/{product_id}", response_model=dict)
async def get_loan_product(
    product_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    product = loan_service.get_loan_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Loan product not found")
    return product

@router.put("/loan-products/{product_id}", response_model=dict)
async def update_loan_product(
    product_id: UUID = Path(...),
    product_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    product = loan_service.get_loan_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Loan product not found")
    return loan_service.update_loan_product(db, product_id, product_data)

@router.delete("/loan-products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_loan_product(
    product_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    product = loan_service.get_loan_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Loan product not found")
    loan_service.delete_loan_product(db, product_id)
    return None

# Loan Management Endpoints
@router.get("/loans", response_model=List[dict])
async def get_all_loans(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return loan_service.get_all_loans(db, skip=skip, limit=limit, status=status)

@router.get("/loans/{loan_id}", response_model=dict)
async def get_loan(
    loan_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    loan = loan_service.get_loan(db, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan

@router.put("/loans/{loan_id}/approve", response_model=dict)
async def approve_loan(
    loan_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    loan = loan_service.get_loan(db, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan_service.approve_loan(db, loan_id)

@router.put("/loans/{loan_id}/reject", response_model=dict)
async def reject_loan(
    loan_id: UUID = Path(...),
    rejection_reason: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    loan = loan_service.get_loan(db, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan_service.reject_loan(db, loan_id, rejection_reason)

# Transaction Management Endpoints
@router.get("/transactions", response_model=List[Transaction])
async def get_all_transactions(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return wallet_service.get_all_transactions(db, skip=skip, limit=limit, status=status)

@router.get("/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction(
    transaction_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    transaction = wallet_service.get_transaction(db, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.put("/transactions/{transaction_id}/approve", response_model=Transaction)
async def approve_transaction(
    transaction_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    transaction = wallet_service.get_transaction(db, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    updated_transaction = wallet_service.approve_transaction(db, transaction_id)
    if not updated_transaction:
        raise HTTPException(status_code=400, detail="Transaction could not be approved. It may not be in pending status.")
    return updated_transaction

@router.put("/transactions/{transaction_id}/reject", response_model=Transaction)
async def reject_transaction(
    transaction_id: UUID = Path(...),
    rejection_reason: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    transaction = wallet_service.get_transaction(db, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    updated_transaction = wallet_service.reject_transaction(db, transaction_id, rejection_reason)
    if not updated_transaction:
        raise HTTPException(status_code=400, detail="Transaction could not be rejected. It may not be in pending status.")
    return updated_transaction

# Withdrawal Management Endpoints
@router.get("/withdrawals", response_model=List[Transaction])
async def get_all_withdrawals(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return wallet_service.get_all_withdrawals(db, skip=skip, limit=limit, status=status)

@router.get("/withdrawals/{withdrawal_id}", response_model=Transaction)
async def get_withdrawal(
    withdrawal_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    withdrawal = wallet_service.get_withdrawal(db, withdrawal_id)
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    return withdrawal

@router.put("/withdrawals/{withdrawal_id}/approve", response_model=Transaction)
async def approve_withdrawal(
    withdrawal_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    withdrawal = wallet_service.get_withdrawal(db, withdrawal_id)
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    updated_withdrawal = wallet_service.approve_withdrawal(db, withdrawal_id)
    if not updated_withdrawal:
        raise HTTPException(status_code=400, detail="Withdrawal could not be approved. It may not be in pending status.")
    return updated_withdrawal

@router.put("/withdrawals/{withdrawal_id}/reject", response_model=Transaction)
async def reject_withdrawal(
    withdrawal_id: UUID = Path(...),
    rejection_reason: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    withdrawal = wallet_service.get_withdrawal(db, withdrawal_id)
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    updated_withdrawal = wallet_service.reject_withdrawal(db, withdrawal_id, rejection_reason)
    if not updated_withdrawal:
        raise HTTPException(status_code=400, detail="Withdrawal could not be rejected. It may not be in pending status.")
    return updated_withdrawal

# Notification Endpoints
@router.get("/notifications", response_model=List[dict])
async def get_all_notifications(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return notification_service.get_all_notifications(db, skip=skip, limit=limit)

@router.post("/notifications/broadcast", response_model=dict)
async def send_broadcast_notification(
    title: str = Body(...),
    message: str = Body(...),
    notification_type: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return notification_service.send_broadcast_notification(
        db, title=title, message=message, notification_type=notification_type
    )

@router.post("/notifications/user/{user_id}", response_model=dict)
async def send_user_notification(
    user_id: UUID = Path(...),
    title: str = Body(...),
    message: str = Body(...),
    notification_type: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return notification_service.send_user_notification(
        db, user_id=user_id, title=title, message=message, notification_type=notification_type
    )

# Audit Log Endpoints
@router.get("/audit-logs", response_model=List[dict])
async def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[UUID] = None,
    action_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return audit_service.get_audit_logs(
        db, 
        skip=skip, 
        limit=limit, 
        user_id=user_id, 
        action_type=action_type,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/audit-logs/{log_id}", response_model=dict)
async def get_audit_log(
    log_id: UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    log = audit_service.get_audit_log(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")
    return log