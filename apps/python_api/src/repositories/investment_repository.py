from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from models.models import Investment, InvestmentStatus

class InvestmentRepository:
    def get_by_id(self, db: Session, investment_id: UUID) -> Optional[Investment]:
        """
        Get an investment by ID
        """
        return db.query(Investment).filter(Investment.id == investment_id).first()
    
    def get_by_user_id(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100,
                      status: Optional[InvestmentStatus] = None) -> List[Investment]:
        """
        Get investments by user ID
        """
        query = db.query(Investment).filter(Investment.user_id == user_id)
        
        if status:
            query = query.filter(Investment.status == status)
        
        return query.order_by(Investment.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100,
               status: Optional[InvestmentStatus] = None) -> List[Investment]:
        """
        Get all investments
        """
        query = db.query(Investment)
        
        if status:
            query = query.filter(Investment.status == status)
        
        return query.order_by(Investment.created_at.desc()).offset(skip).limit(limit).all()
    
    def create(self, db: Session, user_id: UUID, plan_id: UUID, amount: float,
              status: InvestmentStatus, start_date: datetime, end_date: datetime,
              expected_return: float, current_value: float) -> Investment:
        """
        Create a new investment
        """
        db_investment = Investment(
            user_id=user_id,
            plan_id=plan_id,
            amount=amount,
            status=status,
            start_date=start_date,
            end_date=end_date,
            expected_return=expected_return,
            current_value=current_value
        )
        db.add(db_investment)
        db.commit()
        db.refresh(db_investment)
        return db_investment
    
    def update_status(self, db: Session, investment_id: UUID, status: InvestmentStatus) -> Optional[Investment]:
        """
        Update investment status
        """
        db_investment = self.get_by_id(db, investment_id)
        if db_investment:
            db_investment.status = status
            db.commit()
            db.refresh(db_investment)
        return db_investment
    
    def update_value(self, db: Session, investment_id: UUID, current_value: float) -> Optional[Investment]:
        """
        Update investment current value
        """
        db_investment = self.get_by_id(db, investment_id)
        if db_investment:
            db_investment.current_value = current_value
            db.commit()
            db.refresh(db_investment)
        return db_investment
    
    def get_active_investments_ending_soon(self, db: Session, days: int = 1) -> List[Investment]:
        """
        Get active investments ending within the specified number of days
        """
        end_date = datetime.utcnow() + datetime.timedelta(days=days)
        return db.query(Investment).filter(
            Investment.status == InvestmentStatus.ACTIVE,
            Investment.end_date <= end_date
        ).all()