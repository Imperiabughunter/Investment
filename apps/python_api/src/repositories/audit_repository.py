from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from models.models import AuditLog, User

class AuditRepository:
    def __init__(self):
        pass
    
    def create(self, db: Session, user_id: Optional[UUID], action: str, entity_type: str, 
               entity_id: str, details: Optional[Dict[str, Any]] = None, 
               ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> AuditLog:
        """
        Create a new audit log entry
        """
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log
    
    def get_by_id(self, db: Session, audit_log_id: UUID) -> Optional[AuditLog]:
        """
        Get an audit log by ID
        """
        return db.query(AuditLog).filter(AuditLog.id == audit_log_id).first()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        """
        Get all audit logs with pagination
        """
        return db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_user_id(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        """
        Get audit logs for a specific user
        """
        return db.query(AuditLog).filter(AuditLog.user_id == user_id).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_entity(self, db: Session, entity_type: str, entity_id: str, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        """
        Get audit logs for a specific entity
        """
        return db.query(AuditLog).filter(
            AuditLog.entity_type == entity_type,
            AuditLog.entity_id == entity_id
        ).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_action(self, db: Session, action: str, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        """
        Get audit logs for a specific action
        """
        return db.query(AuditLog).filter(AuditLog.action == action).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_date_range(self, db: Session, start_date: datetime, end_date: datetime, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        """
        Get audit logs within a date range
        """
        return db.query(AuditLog).filter(
            AuditLog.created_at >= start_date,
            AuditLog.created_at <= end_date
        ).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()