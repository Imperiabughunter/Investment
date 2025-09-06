from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID

from models.models import Notification
from repositories.notification_repository import NotificationRepository
from tasks.notification_tasks import broadcast_notification as broadcast_task
from tasks.notification_tasks import send_notification as send_notification_task

class NotificationService:
    def __init__(self):
        self.notification_repository = NotificationRepository()
    
    def get_all_notifications(self, db: Session, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get all notifications with pagination
        """
        # In a real implementation, this would likely include filtering by user role
        # or other criteria for admin purposes
        notifications = db.query(Notification).order_by(Notification.created_at.desc())\
            .offset(skip).limit(limit).all()
        
        return [{
            "id": str(notification.id),
            "user_id": str(notification.user_id),
            "title": notification.title,
            "message": notification.message,
            "is_read": notification.is_read,
            "type": notification.type,
            "reference_id": notification.reference_id,
            "created_at": notification.created_at
        } for notification in notifications]
    
    def get_user_notifications(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get notifications for a specific user with pagination
        """
        notifications = self.notification_repository.get_by_user_id(db, user_id, skip, limit)
        
        return [{
            "id": str(notification.id),
            "title": notification.title,
            "message": notification.message,
            "is_read": notification.is_read,
            "type": notification.type,
            "reference_id": notification.reference_id,
            "created_at": notification.created_at
        } for notification in notifications]
    
    def get_unread_count(self, db: Session, user_id: UUID) -> int:
        """
        Get count of unread notifications for a user
        """
        return self.notification_repository.get_unread_count(db, user_id)
    
    def mark_as_read(self, db: Session, notification_id: UUID) -> Dict[str, Any]:
        """
        Mark a notification as read
        """
        notification = self.notification_repository.mark_as_read(db, notification_id)
        if not notification:
            return {"success": False, "message": "Notification not found"}
        
        return {
            "success": True,
            "notification": {
                "id": str(notification.id),
                "is_read": notification.is_read
            }
        }
    
    def mark_all_as_read(self, db: Session, user_id: UUID) -> Dict[str, Any]:
        """
        Mark all notifications as read for a user
        """
        count = self.notification_repository.mark_all_as_read(db, user_id)
        
        return {
            "success": True,
            "count": count,
            "message": f"Marked {count} notifications as read"
        }
    
    def delete_notification(self, db: Session, notification_id: UUID) -> Dict[str, Any]:
        """
        Delete a notification
        """
        success = self.notification_repository.delete(db, notification_id)
        
        if not success:
            return {"success": False, "message": "Notification not found"}
        
        return {"success": True, "message": "Notification deleted successfully"}
    
    def send_user_notification(self, db: Session, user_id: UUID, title: str, message: str, notification_type: str = "system") -> Dict[str, Any]:
        """
        Send a notification to a specific user
        """
        # Create the notification in the database
        notification = self.notification_repository.create(
            db=db,
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type
        )
        
        # Queue a task to send push notification if applicable
        # This is done asynchronously to avoid blocking the API
        send_notification_task.delay(
            user_id=str(user_id),
            title=title,
            message=message,
            notification_type=notification_type
        )
        
        return {
            "success": True,
            "notification_id": str(notification.id),
            "message": "Notification sent successfully"
        }
    
    def send_broadcast_notification(self, db: Session, title: str, message: str, notification_type: str = "system", user_role: Optional[str] = None) -> Dict[str, Any]:
        """
        Send a notification to all users or users with a specific role
        """
        # Queue a task to send the broadcast notification
        # This is done asynchronously to avoid blocking the API
        broadcast_task.delay(
            title=title,
            message=message,
            user_role=user_role,
            notification_type=notification_type
        )
        
        return {
            "success": True,
            "message": "Broadcast notification queued successfully"
        }