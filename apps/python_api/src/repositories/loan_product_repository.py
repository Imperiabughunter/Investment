from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID

from models.models import LoanProduct

class LoanProductRepository:
    def get_by_id(self, db: Session, product_id: UUID) -> Optional[LoanProduct]:
        """
        Get a loan product by ID
        """
        return db.query(LoanProduct).filter(LoanProduct.id == product_id).first()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[LoanProduct]:
        """
        Get all loan products
        """
        return db.query(LoanProduct).offset(skip).limit(limit).all()
    
    def get_active_products(self, db: Session, skip: int = 0, limit: int = 100) -> List[LoanProduct]:
        """
        Get all active loan products
        """
        return db.query(LoanProduct).filter(LoanProduct.is_active == True).offset(skip).limit(limit).all()
    
    def create(self, db: Session, name: str, description: str, min_amount: float,
              max_amount: float, interest_rate: float, min_term_months: int,
              max_term_months: int, is_active: bool = True) -> LoanProduct:
        """
        Create a new loan product
        """
        db_product = LoanProduct(
            name=name,
            description=description,
            min_amount=min_amount,
            max_amount=max_amount,
            interest_rate=interest_rate,
            min_term_months=min_term_months,
            max_term_months=max_term_months,
            is_active=is_active
        )
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product
    
    def update(self, db: Session, product_id: UUID, **kwargs) -> Optional[LoanProduct]:
        """
        Update a loan product
        """
        db_product = self.get_by_id(db, product_id)
        if db_product:
            for key, value in kwargs.items():
                if hasattr(db_product, key) and value is not None:
                    setattr(db_product, key, value)
            db.commit()
            db.refresh(db_product)
        return db_product
    
    def activate(self, db: Session, product_id: UUID) -> Optional[LoanProduct]:
        """
        Activate a loan product
        """
        return self.update(db, product_id, is_active=True)
    
    def deactivate(self, db: Session, product_id: UUID) -> Optional[LoanProduct]:
        """
        Deactivate a loan product
        """
        return self.update(db, product_id, is_active=False)