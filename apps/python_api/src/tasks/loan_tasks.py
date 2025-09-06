from tasks.celery_app import celery_app
from sqlalchemy.orm import Session
from datetime import datetime

from db.database import SessionLocal
from models.models import LoanStatus, TransactionType, TransactionStatus
from services.loan_service import LoanService
from services.wallet_service import WalletService
from services.user_service import UserService

loan_service = LoanService()
wallet_service = WalletService()
user_service = UserService()

@celery_app.task
def calculate_monthly_interest():
    """
    Calculate and apply monthly interest to active loans
    """
    db = SessionLocal()
    try:
        # Get all active loans
        active_loans = loan_service.get_all_loans(db, status=LoanStatus.ACTIVE)
        
        for loan in active_loans:
            # Calculate and apply monthly interest
            updated_loan = loan_service.calculate_monthly_interest(db, loan.id)
            
            if updated_loan:
                # Create a notification for the user
                user_service.create_notification(
                    db=db,
                    user_id=loan.user_id,
                    title="Loan Interest Applied",
                    message=f"Monthly interest has been applied to your loan. Your remaining balance is now {updated_loan.remaining_amount}."
                )
        
        return f"Applied monthly interest to {len(active_loans)} active loans"
    finally:
        db.close()

@celery_app.task
def process_due_payments():
    """
    Process payments due for active loans
    """
    db = SessionLocal()
    try:
        # Get loans with payments due
        due_loans = loan_service.get_due_loans(db)
        
        for loan in due_loans:
            # Create a notification for the user
            user_service.create_notification(
                db=db,
                user_id=loan.user_id,
                title="Loan Payment Due",
                message=f"Your monthly loan payment of {loan.monthly_payment} is due today. Please make your payment to avoid late fees."
            )
            
            # Check if auto-payment is enabled (future feature)
            # For now, just remind the user
        
        return f"Processed {len(due_loans)} loans with payments due"
    finally:
        db.close()

@celery_app.task
def check_overdue_loans():
    """
    Check for overdue loans and send reminders
    """
    db = SessionLocal()
    try:
        # Get all active loans
        active_loans = loan_service.get_all_loans(db, status=LoanStatus.ACTIVE)
        
        today = datetime.utcnow().date()
        overdue_loans = []
        
        for loan in active_loans:
            # Calculate days since last payment (simplified logic)
            # In a real implementation, we would track actual payment dates
            payment_day = loan.start_date.day
            current_day = today.day
            
            # If we're past the payment day for this month
            if current_day > payment_day:
                days_overdue = current_day - payment_day
                
                # If overdue by more than 3 days, send a reminder
                if days_overdue > 3:
                    overdue_loans.append(loan)
                    
                    # Create a notification for the user
                    user_service.create_notification(
                        db=db,
                        user_id=loan.user_id,
                        title="Loan Payment Overdue",
                        message=f"Your loan payment of {loan.monthly_payment} is {days_overdue} days overdue. Please make your payment as soon as possible to avoid additional fees."
                    )
        
        return f"Sent reminders for {len(overdue_loans)} overdue loans"
    finally:
        db.close()