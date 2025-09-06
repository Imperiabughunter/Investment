from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from models.models import Notification

class NotificationRepository:
    def get_by_id(self, db: Session, notification_id: UUID) -> Optional[Notification]:
        """
        Get a notification by ID
        """
        return db.query(Notification).filter(Notification.id == notification_id).first()
    
    def get_by_user_id(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Notification]:
        """
        Get all notifications for a user with pagination
        """
        return db.query(Notification).filter(Notification.user_id == user_id)\
            .order_by(Notification.created_at.desc())\
            .offset(skip).limit(limit).all()
    
    def get_unread_count(self, db: Session, user_id: UUID) -> int:
        """
        Get count of unread notifications for a user
        """
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()
    
    def create(self, db: Session, user_id: UUID, title: str, message: str, 
               notification_type: str = "system", reference_id: Optional[str] = None) -> Notification:
        """
        Create a new notification
        """
        db_notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            reference_id=reference_id
        )
        db.add(db_notification)
        db.commit()
        db.refresh(db_notification)
        return db_notification
    
    def mark_as_read(self, db: Session, notification_id: UUID) -> Optional[Notification]:
        """
        Mark a notification as read
        """
        db_notification = self.get_by_id(db, notification_id)
        if db_notification:
            db_notification.is_read = True
            db.commit()
            db.refresh(db_notification)
        return db_notification
    
    def mark_all_as_read(self, db: Session, user_id: UUID) -> int:
        """
        Mark all notifications as read for a user
        Returns the number of notifications updated
        """
        result = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({Notification.is_read: True})
        db.commit()
        return result
    
    def delete(self, db: Session, notification_id: UUID) -> bool:
        """
        Delete a notification
        Returns True if successful, False otherwise
        """
        db_notification = self.get_by_id(db, notification_id)
        if db_notification:
            db.delete(db_notification)
            db.commit()
            return True
        return False
    
    def delete_all_for_user(self, db: Session, user_id: UUID) -> int:
        """
        Delete all notifications for a user
        Returns the number of notifications deleted
        """
        result = db.query(Notification).filter(Notification.user_id == user_id).delete()
        db.commit()
        return result