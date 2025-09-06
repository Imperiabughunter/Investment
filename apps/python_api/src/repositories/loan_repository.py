from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta

from models.models import Loan, LoanStatus

class LoanRepository:
    def get_by_id(self, db: Session, loan_id: UUID) -> Optional[Loan]:
        """
        Get a loan by ID
        """
        return db.query(Loan).filter(Loan.id == loan_id).first()
    
    def get_by_user_id(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100,
                      status: Optional[LoanStatus] = None) -> List[Loan]:
        """
        Get loans by user ID
        """
        query = db.query(Loan).filter(Loan.user_id == user_id)
        
        if status:
            query = query.filter(Loan.status == status)
        
        return query.order_by(Loan.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100,
               status: Optional[LoanStatus] = None) -> List[Loan]:
        """
        Get all loans
        """
        query = db.query(Loan)
        
        if status:
            query = query.filter(Loan.status == status)
        
        return query.order_by(Loan.created_at.desc()).offset(skip).limit(limit).all()
    
    def create(self, db: Session, user_id: UUID, product_id: UUID, amount: float,
              interest_rate: float, term_months: int, total_repayment: float,
              monthly_payment: float, remaining_amount: float, start_date: Optional[datetime],
              end_date: Optional[datetime], status: LoanStatus,
              rejection_reason: Optional[str] = None) -> Loan:
        """
        Create a new loan
        """
        db_loan = Loan(
            user_id=user_id,
            product_id=product_id,
            amount=amount,
            interest_rate=interest_rate,
            term_months=term_months,
            total_repayment=total_repayment,
            monthly_payment=monthly_payment,
            remaining_amount=remaining_amount,
            start_date=start_date,
            end_date=end_date,
            status=status,
            rejection_reason=rejection_reason
        )
        db.add(db_loan)
        db.commit()
        db.refresh(db_loan)
        return db_loan
    
    def update(self, db: Session, loan_id: UUID, **kwargs) -> Optional[Loan]:
        """
        Update a loan
        """
        db_loan = self.get_by_id(db, loan_id)
        if db_loan:
            for key, value in kwargs.items():
                if hasattr(db_loan, key) and value is not None:
                    setattr(db_loan, key, value)
            db.commit()
            db.refresh(db_loan)
        return db_loan
    
    def update_status(self, db: Session, loan_id: UUID, status: LoanStatus,
                     rejection_reason: Optional[str] = None) -> Optional[Loan]:
        """
        Update loan status
        """
        update_data = {"status": status}
        if rejection_reason is not None:
            update_data["rejection_reason"] = rejection_reason
        return self.update(db, loan_id, **update_data)
    
    def get_due_loans(self, db: Session) -> List[Loan]:
        """
        Get active loans with payments due (for background task)
        """
        today = datetime.utcnow().date()
        # Get loans where the payment day matches today's day of month
        # and the loan is active
        return db.query(Loan).filter(
            Loan.status == LoanStatus.ACTIVE,
            # Extract day from start_date and compare with today's day
            db.func.extract('day', Loan.start_date) == today.day
        ).all()