from tasks.celery_app import celery_app
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from db.database import SessionLocal
from models.models import InvestmentStatus, TransactionType, TransactionStatus
from services.investment_service import InvestmentService
from services.wallet_service import WalletService
from services.user_service import UserService

investment_service = InvestmentService()
wallet_service = WalletService()
user_service = UserService()

@celery_app.task
def process_investment_returns():
    """
    Process daily returns for active investments
    """
    db = SessionLocal()
    try:
        # Get all active investments
        active_investments = investment_service.get_all_investments(
            db, status=InvestmentStatus.ACTIVE
        )
        
        for investment in active_investments:
            # Calculate daily return
            plan = investment_service.get_plan(db, investment.plan_id)
            if not plan:
                continue
            
            # Calculate daily ROI (annual ROI / 365)
            daily_roi = plan.roi_percentage / 365
            daily_return = investment.amount * (daily_roi / 100)
            
            # Update investment current value
            new_value = investment.current_value + daily_return
            investment_service.update_investment_value(db, investment.id, new_value)
            
            # Check if investment has reached maturity
            if datetime.utcnow() >= investment.end_date:
                # Process investment maturity
                process_investment_maturity.delay(str(investment.id))
        
        return f"Processed returns for {len(active_investments)} active investments"
    finally:
        db.close()

@celery_app.task
def process_investment_maturity(investment_id: str):
    """
    Process an investment that has reached maturity
    """
    db = SessionLocal()
    try:
        # Get the investment
        investment = investment_service.get_investment(db, investment_id)
        if not investment or investment.status != InvestmentStatus.ACTIVE:
            return f"Investment {investment_id} not found or not active"
        
        # Update investment status to COMPLETED
        investment = investment_service.update_investment_status(
            db, investment_id, InvestmentStatus.COMPLETED
        )
        
        # Create a transaction for the investment return
        transaction = wallet_service.create_transaction(
            db=db,
            user_id=investment.user_id,
            amount=investment.current_value,
            transaction_type=TransactionType.INVESTMENT_RETURN,
            status=TransactionStatus.COMPLETED,
            reference=f"Investment {investment_id} maturity",
            metadata={
                "investment_id": investment_id,
                "original_amount": str(investment.amount),
                "return_amount": str(investment.current_value - investment.amount)
            }
        )
        
        # Add the investment return to the user's wallet
        wallet_service.process_deposit(
            db=db,
            user_id=investment.user_id,
            amount=investment.current_value,
            transaction_id=transaction.id,
            description=f"Investment return: {investment.current_value}"
        )
        
        # Create a notification for the user
        user_service.create_notification(
            db=db,
            user_id=investment.user_id,
            title="Investment Matured",
            message=f"Your investment of {investment.amount} has matured with a return of {investment.current_value - investment.amount}."
        )
        
        return f"Processed maturity for investment {investment_id}"
    finally:
        db.close()

@celery_app.task
def check_investments_ending_soon():
    """
    Check for investments ending soon and send notifications
    """
    db = SessionLocal()
    try:
        # Get investments ending in the next 3 days
        end_date = datetime.utcnow() + timedelta(days=3)
        investments = db.query(Investment).filter(
            Investment.status == InvestmentStatus.ACTIVE,
            Investment.end_date <= end_date,
            Investment.end_date > datetime.utcnow()
        ).all()
        
        for investment in investments:
            # Calculate days until maturity
            days_left = (investment.end_date - datetime.utcnow()).days
            
            # Create a notification for the user
            user_service.create_notification(
                db=db,
                user_id=investment.user_id,
                title="Investment Ending Soon",
                message=f"Your investment of {investment.amount} will mature in {days_left} days with an estimated return of {investment.current_value - investment.amount}."
            )
        
        return f"Sent notifications for {len(investments)} investments ending soon"
    finally:
        db.close()