from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from models.models import Investment as InvestmentModel, InvestmentPlan as InvestmentPlanModel, InvestmentStatus, TransactionType
from repositories.investment_repository import InvestmentRepository
from repositories.investment_plan_repository import InvestmentPlanRepository
from services.wallet_service import WalletService

class InvestmentService:
    def __init__(self):
        self.investment_repository = InvestmentRepository()
        self.plan_repository = InvestmentPlanRepository()
        self.wallet_service = WalletService()
    
    def get_plan(self, db: Session, plan_id: UUID) -> Optional[InvestmentPlanModel]:
        """
        Get an investment plan by ID
        """
        return self.plan_repository.get_by_id(db, plan_id)
    
    def get_active_plans(self, db: Session, skip: int = 0, limit: int = 100) -> List[InvestmentPlanModel]:
        """
        Get all active investment plans
        """
        return self.plan_repository.get_active_plans(db, skip=skip, limit=limit)
    
    def get_investment(self, db: Session, investment_id: UUID) -> Optional[InvestmentModel]:
        """
        Get an investment by ID
        """
        return self.investment_repository.get_by_id(db, investment_id)
    
    def get_user_investments(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100, 
                            status: Optional[InvestmentStatus] = None) -> List[InvestmentModel]:
        """
        Get investments by user ID
        """
        return self.investment_repository.get_by_user_id(db, user_id, skip=skip, limit=limit, status=status)
    
    def get_all_investments(self, db: Session, skip: int = 0, limit: int = 100,
                           status: Optional[InvestmentStatus] = None) -> List[InvestmentModel]:
        """
        Get all investments
        """
        return self.investment_repository.get_all(db, skip=skip, limit=limit, status=status)
    
    def create_investment(self, db: Session, user_id: UUID, plan_id: UUID, amount: float) -> InvestmentModel:
        """
        Create a new investment
        """
        # Get the investment plan
        plan = self.get_plan(db, plan_id)
        if not plan:
            raise ValueError("Investment plan not found")
        
        # Validate amount against plan min/max
        if amount < plan.min_amount:
            raise ValueError(f"Minimum investment amount is {plan.min_amount}")
        if amount > plan.max_amount:
            raise ValueError(f"Maximum investment amount is {plan.max_amount}")
        
        # Get user's wallet
        wallet = self.wallet_service.get_wallet_by_user_id(db, user_id)
        if not wallet:
            raise ValueError("User wallet not found")
        
        # Check if user has enough balance
        if wallet.balance < amount:
            raise ValueError("Insufficient wallet balance")
        
        # Calculate expected return and end date
        roi_decimal = plan.roi_percentage / 100
        expected_return = amount * (1 + roi_decimal)
        end_date = datetime.utcnow() + timedelta(days=plan.duration_days)
        
        # Create the investment
        investment = self.investment_repository.create(
            db,
            user_id=user_id,
            plan_id=plan_id,
            amount=amount,
            status=InvestmentStatus.ACTIVE,
            start_date=datetime.utcnow(),
            end_date=end_date,
            expected_return=expected_return,
            current_value=amount  # Initial value is the principal amount
        )
        
        # Create transaction and update wallet balance
        self.wallet_service.create_transaction(
            db,
            user_id=user_id,
            wallet_id=wallet.id,
            amount=-amount,  # Negative amount for investment
            transaction_type=TransactionType.INVESTMENT,
            description=f"Investment in {plan.name}",
            investment_id=investment.id
        )
        
        return investment
    
    def update_investment_status(self, db: Session, investment_id: UUID, status: InvestmentStatus) -> Optional[InvestmentModel]:
        """
        Update investment status
        """
        investment = self.get_investment(db, investment_id)
        if not investment:
            return None
        
        # If completing an investment, process the return
        if status == InvestmentStatus.COMPLETED and investment.status != InvestmentStatus.COMPLETED:
            # Get user's wallet
            wallet = self.wallet_service.get_wallet_by_user_id(db, investment.user_id)
            if wallet:
                # Calculate profit
                profit = investment.expected_return - investment.amount
                
                # Create transaction for the return of principal + profit
                self.wallet_service.create_transaction(
                    db,
                    user_id=investment.user_id,
                    wallet_id=wallet.id,
                    amount=investment.expected_return,
                    transaction_type=TransactionType.INTEREST,
                    description=f"Investment return: {investment.plan.name}",
                    investment_id=investment.id
                )
        
        # Update the investment status
        return self.investment_repository.update_status(db, investment_id, status)
    
    def update_investment_value(self, db: Session, investment_id: UUID, current_value: float) -> Optional[InvestmentModel]:
        """
        Update investment current value
        """
        return self.investment_repository.update_value(db, investment_id, current_value)