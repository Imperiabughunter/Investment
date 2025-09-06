from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from models.models import Wallet

class WalletRepository:
    def get_by_id(self, db: Session, wallet_id: UUID) -> Optional[Wallet]:
        """
        Get a wallet by ID
        """
        return db.query(Wallet).filter(Wallet.id == wallet_id).first()
    
    def get_by_user_id(self, db: Session, user_id: UUID) -> Optional[Wallet]:
        """
        Get a wallet by user ID
        """
        return db.query(Wallet).filter(Wallet.user_id == user_id).first()
    
    def create(self, db: Session, user_id: UUID, balance: float = 0.0, currency: str = "USD") -> Wallet:
        """
        Create a new wallet
        """
        db_wallet = Wallet(
            user_id=user_id,
            balance=balance,
            currency=currency
        )
        db.add(db_wallet)
        db.commit()
        db.refresh(db_wallet)
        return db_wallet
    
    def update_balance(self, db: Session, wallet_id: UUID, amount: float) -> Optional[Wallet]:
        """
        Update wallet balance
        """
        db_wallet = self.get_by_id(db, wallet_id)
        if db_wallet:
            db_wallet.balance += amount
            db.commit()
            db.refresh(db_wallet)
        return db_wallet
    
    def set_balance(self, db: Session, wallet_id: UUID, balance: float) -> Optional[Wallet]:
        """
        Set wallet balance
        """
        db_wallet = self.get_by_id(db, wallet_id)
        if db_wallet:
            db_wallet.balance = balance
            db.commit()
            db.refresh(db_wallet)
        return db_wallet
    
    def update_currency(self, db: Session, wallet_id: UUID, currency: str) -> Optional[Wallet]:
        """
        Update wallet currency
        """
        db_wallet = self.get_by_id(db, wallet_id)
        if db_wallet:
            db_wallet.currency = currency
            db.commit()
            db.refresh(db_wallet)
        return db_wallet