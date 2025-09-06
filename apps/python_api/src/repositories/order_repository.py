from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from models.models import Order

class OrderRepository:
    def get_by_id(self, db: Session, order_id: UUID) -> Optional[Order]:
        """
        Get an order by ID
        """
        return db.query(Order).filter(Order.id == order_id).first()
    
    def get_by_external_id(self, db: Session, external_id: str) -> Optional[Order]:
        """
        Get an order by external ID
        """
        return db.query(Order).filter(Order.external_id == external_id).first()
    
    def get_by_user_id(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Order]:
        """
        Get orders by user ID
        """
        return db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    def create(self, db: Session, user_id: UUID, external_id: str, amount: float,
              currency: str, payment_address: Optional[str], status: str,
              expires_at: Optional[datetime] = None) -> Order:
        """
        Create a new order
        """
        db_order = Order(
            user_id=user_id,
            external_id=external_id,
            amount=amount,
            currency=currency,
            payment_address=payment_address,
            status=status,
            expires_at=expires_at,
            is_processed=False
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        return db_order
    
    def update(self, db: Session, order_id: UUID, **kwargs) -> Optional[Order]:
        """
        Update an order
        """
        db_order = self.get_by_id(db, order_id)
        if db_order:
            for key, value in kwargs.items():
                if hasattr(db_order, key) and value is not None:
                    setattr(db_order, key, value)
            db.commit()
            db.refresh(db_order)
        return db_order
    
    def get_pending_orders(self, db: Session) -> List[Order]:
        """
        Get all pending orders
        """
        return db.query(Order).filter(Order.status == "pending").all()