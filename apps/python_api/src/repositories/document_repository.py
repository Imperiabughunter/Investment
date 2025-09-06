from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from models.models import Document, DocumentStatus

class DocumentRepository:
    def get_by_id(self, db: Session, document_id: UUID) -> Optional[Document]:
        """
        Get a document by ID
        """
        return db.query(Document).filter(Document.id == document_id).first()
    
    def get_by_user_id(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100,
                      status: Optional[DocumentStatus] = None) -> List[Document]:
        """
        Get documents by user ID
        """
        query = db.query(Document).filter(Document.user_id == user_id)
        
        if status:
            query = query.filter(Document.status == status)
        
        return query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100,
               status: Optional[DocumentStatus] = None) -> List[Document]:
        """
        Get all documents
        """
        query = db.query(Document)
        
        if status:
            query = query.filter(Document.status == status)
        
        return query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    
    def create(self, db: Session, user_id: UUID, document_type: str, file_path: str,
              description: Optional[str], status: DocumentStatus) -> Document:
        """
        Create a new document
        """
        db_document = Document(
            user_id=user_id,
            document_type=document_type,
            file_path=file_path,
            description=description,
            status=status
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        return db_document
    
    def update_status(self, db: Session, document_id: UUID, status: DocumentStatus,
                     rejection_reason: Optional[str] = None) -> Optional[Document]:
        """
        Update document status
        """
        db_document = self.get_by_id(db, document_id)
        if db_document:
            db_document.status = status
            if rejection_reason is not None:
                db_document.rejection_reason = rejection_reason
            db.commit()
            db.refresh(db_document)
        return db_document
    
    def count_by_status(self, db: Session, status: DocumentStatus) -> int:
        """
        Count documents by status
        """
        return db.query(Document).filter(Document.status == status).count()