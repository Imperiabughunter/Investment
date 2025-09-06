from celery import Celery
from celery.schedules import crontab
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Celery app
celery_app = Celery(
    "prime_investment",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Configure periodic tasks
celery_app.conf.beat_schedule = {
    "process-investment-returns-daily": {
        "task": "tasks.investment_tasks.process_investment_returns",
        "schedule": crontab(hour=0, minute=0),  # Run at midnight every day
    },
    "calculate-loan-interest-monthly": {
        "task": "tasks.loan_tasks.calculate_monthly_interest",
        "schedule": crontab(day_of_month=1, hour=0, minute=0),  # Run on the 1st of every month
    },
    "process-loan-payments-daily": {
        "task": "tasks.loan_tasks.process_due_payments",
        "schedule": crontab(hour=0, minute=0),  # Run at midnight every day
    },
    "check-pending-orders": {
        "task": "tasks.crypto_tasks.check_pending_orders",
        "schedule": crontab(minute="*/10"),  # Run every 10 minutes
    },
    "send-notification-reminders": {
        "task": "tasks.notification_tasks.send_reminders",
        "schedule": crontab(hour=9, minute=0),  # Run at 9 AM every day
    },
}