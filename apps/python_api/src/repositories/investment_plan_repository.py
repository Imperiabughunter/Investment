from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from models.models import InvestmentPlan

class InvestmentPlanRepository:
    def get_by_id(self, db: Session, plan_id: UUID) -> Optional[InvestmentPlan]:
        """
        Get an investment plan by ID
        """
        return db.query(InvestmentPlan).filter(InvestmentPlan.id == plan_id).first()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[InvestmentPlan]:
        """
        Get all investment plans
        """
        return db.query(InvestmentPlan).offset(skip).limit(limit).all()
    
    def get_active_plans(self, db: Session, skip: int = 0, limit: int = 100) -> List[InvestmentPlan]:
        """
        Get all active investment plans
        """
        return db.query(InvestmentPlan).filter(InvestmentPlan.is_active == True).offset(skip).limit(limit).all()
    
    def create(self, db: Session, name: str, description: str, min_amount: float,
              max_amount: float, roi_percentage: float, duration_days: int,
              is_active: bool = True) -> InvestmentPlan:
        """
        Create a new investment plan
        """
        db_plan = InvestmentPlan(
            name=name,
            description=description,
            min_amount=min_amount,
            max_amount=max_amount,
            roi_percentage=roi_percentage,
            duration_days=duration_days,
            is_active=is_active
        )
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        return db_plan
    
    def update(self, db: Session, plan_id: UUID, **kwargs) -> Optional[InvestmentPlan]:
        """
        Update an investment plan
        """
        db_plan = self.get_by_id(db, plan_id)
        if db_plan:
            for key, value in kwargs.items():
                if hasattr(db_plan, key) and value is not None:
                    setattr(db_plan, key, value)
            db.commit()
            db.refresh(db_plan)
        return db_plan
    
    def activate(self, db: Session, plan_id: UUID) -> Optional[InvestmentPlan]:
        """
        Activate an investment plan
        """
        return self.update(db, plan_id, is_active=True)
    
    def deactivate(self, db: Session, plan_id: UUID) -> Optional[InvestmentPlan]:
        """
        Deactivate an investment plan
        """
        return self.update(db, plan_id, is_active=False)