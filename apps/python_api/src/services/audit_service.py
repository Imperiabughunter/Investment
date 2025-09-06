from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import json

from models.models import AuditLog, User
from repositories.audit_repository import AuditRepository

class AuditService:
    def __init__(self):
        self.audit_repository = AuditRepository()
    
    def log_action(self, db: Session, user_id: Optional[UUID], action: str, entity_type: str, 
                  entity_id: str, details: Optional[Dict[str, Any]] = None, 
                  ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> AuditLog:
        """
        Log an action in the audit log
        """
        # Convert details to JSON string if provided
        details_json = json.dumps(details) if details else None
        
        return self.audit_repository.create(
            db=db,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            details=details_json,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    def get_audit_log(self, db: Session, audit_log_id: UUID) -> Optional[AuditLog]:
        """
        Get an audit log by ID
        """
        return self.audit_repository.get_by_id(db, audit_log_id)
    
    def get_all_audit_logs(self, db: Session, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        """
        Get all audit logs with pagination
        """
        return self.audit_repository.get_all(db, skip=skip, limit=limit)
    
    def get_user_audit_logs(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        """
        Get audit logs for a specific user
        """
        return self.audit_repository.get_by_user_id(db, user_id, skip=skip, limit=limit)
    
    def get_entity_audit_logs(self, db: Session, entity_type: str, entity_id: str, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        """
        Get audit logs for a specific entity
        """
        return self.audit_repository.get_by_entity(db, entity_type, entity_id, skip=skip, limit=limit)
    
    def get_action_audit_logs(self, db: Session, action: str, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        """
        Get audit logs for a specific action
        """
        return self.audit_repository.get_by_action(db, action, skip=skip, limit=limit)
    
    def get_audit_logs_by_date_range(self, db: Session, start_date: datetime, end_date: datetime, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        """
        Get audit logs within a date range
        """
        return self.audit_repository.get_by_date_range(db, start_date, end_date, skip=skip, limit=limit)