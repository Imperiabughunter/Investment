from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from models.models import Transaction, TransactionType, TransactionStatus

class TransactionRepository:
    def get_by_id(self, db: Session, transaction_id: UUID) -> Optional[Transaction]:
        """
        Get a transaction by ID
        """
        return db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    def get_by_wallet_id(self, db: Session, wallet_id: UUID, skip: int = 0, limit: int = 100,
                        transaction_type: Optional[TransactionType] = None) -> List[Transaction]:
        """
        Get transactions by wallet ID
        """
        query = db.query(Transaction).filter(Transaction.wallet_id == wallet_id)
        
        if transaction_type:
            query = query.filter(Transaction.type == transaction_type)
        
        return query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_user_id(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100,
                      transaction_type: Optional[TransactionType] = None) -> List[Transaction]:
        """
        Get transactions by user ID
        """
        query = db.query(Transaction).filter(Transaction.user_id == user_id)
        
        if transaction_type:
            query = query.filter(Transaction.type == transaction_type)
        
        return query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    
    def create(self, db: Session, user_id: UUID, wallet_id: UUID, amount: float, type: TransactionType,
              status: TransactionStatus = TransactionStatus.PENDING, description: Optional[str] = None,
              reference: Optional[str] = None, investment_id: Optional[UUID] = None,
              loan_id: Optional[UUID] = None) -> Transaction:
        """
        Create a new transaction
        """
        db_transaction = Transaction(
            user_id=user_id,
            wallet_id=wallet_id,
            amount=amount,
            type=type,
            status=status,
            description=description,
            reference=reference,
            investment_id=investment_id,
            loan_id=loan_id
        )
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        return db_transaction
    
    def update_status(self, db: Session, transaction_id: UUID, status: TransactionStatus) -> Optional[Transaction]:
        """
        Update transaction status
        """
        db_transaction = self.get_by_id(db, transaction_id)
        if db_transaction:
            db_transaction.status = status
            db.commit()
            db.refresh(db_transaction)
        return db_transaction
    
    def get_by_investment_id(self, db: Session, investment_id: UUID) -> List[Transaction]:
        """
        Get transactions by investment ID
        """
        return db.query(Transaction).filter(Transaction.investment_id == investment_id).all()
    
    def get_by_loan_id(self, db: Session, loan_id: UUID) -> List[Transaction]:
        """
        Get transactions by loan ID
        """
        return db.query(Transaction).filter(Transaction.loan_id == loan_id).all()