from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from models.models import User, UserRole

class UserRepository:
    def get_by_id(self, db: Session, user_id: UUID) -> Optional[User]:
        """
        Get a user by ID
        """
        return db.query(User).filter(User.id == user_id).first()
    
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """
        Get a user by email
        """
        return db.query(User).filter(User.email == email).first()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Get all users with pagination
        """
        return db.query(User).offset(skip).limit(limit).all()
    
    def create(self, db: Session, email: str, hashed_password: str, first_name: str, 
               last_name: str, phone: Optional[str] = None, role: UserRole = UserRole.USER) -> User:
        """
        Create a new user
        """
        db_user = User(
            email=email,
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    def update(self, db: Session, user_id: UUID, **kwargs) -> Optional[User]:
        """
        Update a user
        """
        db_user = self.get_by_id(db, user_id)
        if db_user:
            for key, value in kwargs.items():
                if hasattr(db_user, key) and value is not None:
                    setattr(db_user, key, value)
            db.commit()
            db.refresh(db_user)
        return db_user
    
    def delete(self, db: Session, user_id: UUID) -> bool:
        """
        Delete a user
        """
        db_user = self.get_by_id(db, user_id)
        if db_user:
            db.delete(db_user)
            db.commit()
            return True
        return False
    
    def get_users_by_role(self, db: Session, role: UserRole, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Get users by role
        """
        return db.query(User).filter(User.role == role).offset(skip).limit(limit).all()
    
    def count_users(self, db: Session) -> int:
        """
        Count all users
        """
        return db.query(User).count()
    
    def count_active_users(self, db: Session) -> int:
        """
        Count active users
        """
        return db.query(User).filter(User.is_active == True).count()