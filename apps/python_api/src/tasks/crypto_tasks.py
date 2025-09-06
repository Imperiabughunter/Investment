from tasks.celery_app import celery_app
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from db.database import SessionLocal
from models.models import OrderStatus, TransactionType, TransactionStatus
from services.crypto_service import CryptoService
from services.wallet_service import WalletService
from services.user_service import UserService

crypto_service = CryptoService()
wallet_service = WalletService()
user_service = UserService()

@celery_app.task
def check_pending_orders():
    """
    Check status of pending crypto deposit orders
    """
    db = SessionLocal()
    try:
        # Get all pending orders
        pending_orders = crypto_service.get_pending_orders(db)
        
        for order in pending_orders:
            # Check if order is older than 24 hours
            if datetime.utcnow() - order.created_at > timedelta(hours=24):
                # Cancel orders older than 24 hours
                crypto_service.update_order_status(
                    db, 
                    order.id, 
                    OrderStatus.EXPIRED,
                    "Order expired after 24 hours"
                )
                
                # Create a notification for the user
                user_service.create_notification(
                    db=db,
                    user_id=order.user_id,
                    title="Deposit Order Expired",
                    message=f"Your deposit order of {order.amount} {order.currency} has expired. Please create a new order if you still wish to deposit."
                )
            else:
                # For orders less than 24 hours old, check with payment provider
                # This would typically call an external API to check the status
                # For now, we'll just simulate this process
                try:
                    # In a real implementation, this would call the payment provider's API
                    # status = payment_provider_api.check_order_status(order.external_id)
                    
                    # For demonstration, we'll just leave orders as pending
                    # In a real implementation, you would update based on the API response
                    pass
                    
                except Exception as e:
                    # Log the error but don't fail the task
                    print(f"Error checking order {order.id}: {str(e)}")
        
        return f"Checked {len(pending_orders)} pending orders"
    finally:
        db.close()

@celery_app.task
def process_webhook_notification(payload):
    """
    Process a webhook notification from the payment provider
    This would be called by the webhook endpoint in the crypto_deposits router
    """
    db = SessionLocal()
    try:
        # Process the webhook notification
        result = crypto_service.process_webhook_notification(db, payload)
        
        if result.get("success"):
            # If the webhook was processed successfully, create a notification for the user
            order_id = result.get("order_id")
            user_id = result.get("user_id")
            amount = result.get("amount")
            currency = result.get("currency")
            
            if user_id and amount:
                user_service.create_notification(
                    db=db,
                    user_id=user_id,
                    title="Deposit Confirmed",
                    message=f"Your deposit of {amount} {currency} has been confirmed and added to your wallet."
                )
        
        return result
    finally:
        db.close()

@celery_app.task
def retry_failed_deposits():
    """
    Retry processing failed deposits
    """
    db = SessionLocal()
    try:
        # Get orders that are in FAILED status but might be retryable
        # This would typically be orders where the payment was received but processing failed
        failed_orders = db.query(Order).filter(
            Order.status == OrderStatus.FAILED,
            Order.updated_at > datetime.utcnow() - timedelta(days=1)  # Only retry recent failures
        ).all()
        
        retried_count = 0
        for order in failed_orders:
            try:
                # Attempt to reprocess the order
                crypto_service.process_deposit(
                    db,
                    order.id,
                    order.amount,
                    order.currency,
                    order.external_id
                )
                retried_count += 1
            except Exception as e:
                # Log the error but don't fail the task
                print(f"Error retrying order {order.id}: {str(e)}")
        
        return f"Retried {retried_count} failed deposits"
    finally:
        db.close()