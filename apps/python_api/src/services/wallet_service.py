from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from models.models import Wallet as WalletModel, Transaction as TransactionModel, TransactionType, TransactionStatus
from schemas.schemas import WalletUpdate, TransactionCreate
from repositories.wallet_repository import WalletRepository
from repositories.transaction_repository import TransactionRepository

class WalletService:
    def __init__(self):
        self.wallet_repository = WalletRepository()
        self.transaction_repository = TransactionRepository()
    
    def get_wallet(self, db: Session, wallet_id: UUID) -> Optional[WalletModel]:
        """
        Get a wallet by ID
        """
        return self.wallet_repository.get_by_id(db, wallet_id)
    
    def get_wallet_by_user_id(self, db: Session, user_id: UUID) -> Optional[WalletModel]:
        """
        Get a wallet by user ID
        """
        return self.wallet_repository.get_by_user_id(db, user_id)
    
    def update_wallet(self, db: Session, wallet_id: UUID, wallet_update: WalletUpdate) -> Optional[WalletModel]:
        """
        Update a wallet
        """
        wallet = self.get_wallet(db, wallet_id)
        if not wallet:
            return None
        
        update_data = wallet_update.model_dump(exclude_unset=True)
        
        # Update balance if provided
        if "balance" in update_data:
            return self.wallet_repository.set_balance(db, wallet_id, update_data["balance"])
        
        # Update currency if provided
        if "currency" in update_data:
            return self.wallet_repository.update_currency(db, wallet_id, update_data["currency"])
        
        return wallet
    
    def update_wallet_balance(self, db: Session, wallet_id: UUID, amount: float) -> Optional[WalletModel]:
        """
        Update wallet balance
        """
        return self.wallet_repository.update_balance(db, wallet_id, amount)
    
    def get_wallet_transactions(self, db: Session, wallet_id: UUID, skip: int = 0, limit: int = 100, 
                               transaction_type: Optional[TransactionType] = None) -> List[TransactionModel]:
        """
        Get wallet transactions
        """
        return self.transaction_repository.get_by_wallet_id(
            db, 
            wallet_id, 
            skip=skip, 
            limit=limit,
            transaction_type=transaction_type
        )
    
    def create_transaction(self, db: Session, user_id: UUID, wallet_id: UUID, amount: float, 
                          transaction_type: TransactionType, description: Optional[str] = None,
                          reference: Optional[str] = None, investment_id: Optional[UUID] = None,
                          loan_id: Optional[UUID] = None) -> TransactionModel:
        """
        Create a new transaction and update wallet balance
        """
        # Create transaction
        transaction = self.transaction_repository.create(
            db,
            user_id=user_id,
            wallet_id=wallet_id,
            amount=abs(amount),  # Store absolute amount in transaction
            type=transaction_type,
            status=TransactionStatus.COMPLETED,  # Auto-complete for now
            description=description,
            reference=reference,
            investment_id=investment_id,
            loan_id=loan_id
        )
        
        # Update wallet balance
        if transaction_type in [TransactionType.DEPOSIT, TransactionType.INTEREST]:
            self.wallet_repository.update_balance(db, wallet_id, abs(amount))
        elif transaction_type in [TransactionType.WITHDRAWAL, TransactionType.INVESTMENT, TransactionType.LOAN_PAYMENT]:
            self.wallet_repository.update_balance(db, wallet_id, -abs(amount))
        
        return transaction