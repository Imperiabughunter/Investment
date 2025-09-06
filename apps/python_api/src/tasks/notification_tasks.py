from tasks.celery_app import celery_app
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from db.database import SessionLocal
from models.models import NotificationStatus, LoanStatus, InvestmentStatus
from services.user_service import UserService
from services.loan_service import LoanService
from services.investment_service import InvestmentService

user_service = UserService()
loan_service = LoanService()
investment_service = InvestmentService()

@celery_app.task
def send_reminders():
    """
    Send daily reminders for various events
    """
    db = SessionLocal()
    try:
        # Send loan payment reminders
        send_loan_payment_reminders(db)
        
        # Send investment maturity reminders
        send_investment_maturity_reminders(db)
        
        # Send KYC completion reminders
        send_kyc_reminders(db)
        
        # Send inactive account reminders
        send_inactive_account_reminders(db)
        
        return "Sent all daily reminders"
    finally:
        db.close()

def send_loan_payment_reminders(db: Session):
    """
    Send reminders for upcoming loan payments
    """
    # Get loans with payments due in the next 3 days
    today = datetime.utcnow().date()
    upcoming_due_date = today + timedelta(days=3)
    
    # In a real implementation, you would query loans with payment dates
    # matching the upcoming_due_date
    active_loans = loan_service.get_all_loans(db, status=LoanStatus.ACTIVE)
    
    for loan in active_loans:
        # Calculate next payment date (simplified logic)
        # In a real implementation, you would track actual payment dates
        payment_day = loan.start_date.day
        next_payment_month = today.month
        next_payment_year = today.year
        
        # If we've already passed this month's payment day, look at next month
        if today.day > payment_day:
            next_payment_month += 1
            if next_payment_month > 12:
                next_payment_month = 1
                next_payment_year += 1
        
        try:
            next_payment_date = datetime(next_payment_year, next_payment_month, payment_day).date()
        except ValueError:
            # Handle edge cases like Feb 30
            next_payment_date = datetime(next_payment_year, next_payment_month + 1, 1).date() - timedelta(days=1)
        
        # If payment is due in the next 3 days
        if today <= next_payment_date <= upcoming_due_date:
            # Create a notification for the user
            user_service.create_notification(
                db=db,
                user_id=loan.user_id,
                title="Upcoming Loan Payment",
                message=f"Your loan payment of {loan.monthly_payment} is due on {next_payment_date.strftime('%Y-%m-%d')}. Please ensure you have sufficient funds in your wallet."
            )

def send_investment_maturity_reminders(db: Session):
    """
    Send reminders for investments nearing maturity
    """
    # Get investments maturing in the next 7 days
    upcoming_maturity = datetime.utcnow() + timedelta(days=7)
    
    active_investments = investment_service.get_all_investments(
        db, status=InvestmentStatus.ACTIVE
    )
    
    for investment in active_investments:
        # If investment is maturing in the next 7 days
        if investment.end_date <= upcoming_maturity:
            # Calculate days until maturity
            days_left = (investment.end_date - datetime.utcnow()).days
            
            # Create a notification for the user
            user_service.create_notification(
                db=db,
                user_id=investment.user_id,
                title="Investment Maturing Soon",
                message=f"Your investment of {investment.amount} will mature in {days_left} days with an estimated return of {investment.current_value - investment.amount}."
            )

def send_kyc_reminders(db: Session):
    """
    Send reminders for users with incomplete KYC
    """
    # Get users with incomplete KYC who haven't been reminded in the last 7 days
    users_needing_kyc = user_service.get_users_with_incomplete_kyc(db)
    
    for user in users_needing_kyc:
        # Check if we've sent a reminder in the last 7 days
        recent_notification = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.title.like("Complete Your KYC%"),
            Notification.created_at > datetime.utcnow() - timedelta(days=7)
        ).first()
        
        if not recent_notification:
            # Create a notification for the user
            user_service.create_notification(
                db=db,
                user_id=user.id,
                title="Complete Your KYC",
                message="Please complete your KYC verification to unlock all platform features including withdrawals and higher investment limits."
            )

def send_inactive_account_reminders(db: Session):
    """
    Send reminders to users who haven't logged in recently
    """
    # Get users who haven't logged in for 30 days
    inactive_threshold = datetime.utcnow() - timedelta(days=30)
    
    inactive_users = db.query(User).filter(
        User.last_login < inactive_threshold
    ).all()
    
    for user in inactive_users:
        # Check if we've sent a reminder in the last 30 days
        recent_notification = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.title == "We Miss You!",
            Notification.created_at > datetime.utcnow() - timedelta(days=30)
        ).first()
        
        if not recent_notification:
            # Create a notification for the user
            user_service.create_notification(
                db=db,
                user_id=user.id,
                title="We Miss You!",
                message="It's been a while since you've logged in. Check out our new investment opportunities and loan products!"
            )

@celery_app.task
def send_notification(user_id, title, message, notification_type="INFO"):
    """
    Send a notification to a specific user
    """
    db = SessionLocal()
    try:
        # Create the notification
        notification = user_service.create_notification(
            db=db,
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type
        )
        
        # In a real implementation, you might also send a push notification,
        # email, or SMS depending on the user's preferences
        
        return f"Sent notification {notification.id} to user {user_id}"
    finally:
        db.close()

@celery_app.task
def broadcast_notification(title, message, user_role=None, notification_type="INFO"):
    """
    Broadcast a notification to all users or users with a specific role
    """
    db = SessionLocal()
    try:
        # Get users to send the notification to
        if user_role:
            users = db.query(User).filter(User.role == user_role).all()
        else:
            users = db.query(User).all()
        
        # Create a notification for each user
        for user in users:
            user_service.create_notification(
                db=db,
                user_id=user.id,
                title=title,
                message=message,
                notification_type=notification_type
            )
        
        return f"Broadcast notification to {len(users)} users"
    finally:
        db.close()