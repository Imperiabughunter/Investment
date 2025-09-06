from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from models.models import DocumentStatus
from repositories.document_repository import DocumentRepository

class DocumentService:
    def __init__(self):
        self.document_repository = DocumentRepository()
    
    def get_document(self, db: Session, document_id: UUID):
        """
        Get a document by ID
        """
        return self.document_repository.get_by_id(db, document_id)
    
    def get_user_documents(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100, status: Optional[DocumentStatus] = None):
        """
        Get documents for a specific user
        """
        return self.document_repository.get_by_user_id(db, user_id, skip, limit, status)
    
    def get_all_documents(self, db: Session, skip: int = 0, limit: int = 100, status: Optional[DocumentStatus] = None):
        """
        Get all documents (admin function)
        """
        return self.document_repository.get_all(db, skip, limit, status)
    
    def create_document(self, db: Session, user_id: UUID, document_type: str, file_path: str, description: Optional[str] = None):
        """
        Create a new document
        """
        return self.document_repository.create(
            db=db,
            user_id=user_id,
            document_type=document_type,
            file_path=file_path,
            description=description,
            status=DocumentStatus.PENDING
        )
    
    def update_document_status(self, db: Session, document_id: UUID, status: DocumentStatus, rejection_reason: Optional[str] = None):
        """
        Update a document's status (admin function)
        """
        document = self.document_repository.get_by_id(db, document_id)
        if not document:
            return None
        
        # If rejecting, require a reason
        if status == DocumentStatus.REJECTED and not rejection_reason:
            raise ValueError("Rejection reason is required when rejecting a document")
        
        return self.document_repository.update_status(db, document_id, status, rejection_reason)
    
    def count_documents_by_status(self, db: Session, status: DocumentStatus):
        """
        Count documents by status (for admin dashboard)
        """
        return self.document_repository.count_by_status(db, status)
    
    def has_verified_documents(self, db: Session, user_id: UUID):
        """
        Check if a user has at least one verified document (for KYC verification)
        """
        verified_docs = self.document_repository.get_by_user_id(
            db, user_id, status=DocumentStatus.APPROVED
        )
        return len(verified_docs) > 0