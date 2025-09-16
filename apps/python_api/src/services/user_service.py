from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from models.models import User, UserRole
from schemas.schemas import UserUpdate
from repositories.user_repository import UserRepository
from repositories.notification_repository import NotificationRepository

class UserService:
    def __init__(self):
        self.user_repository = UserRepository()
        self.notification_repository = NotificationRepository()
    
    def get_user(self, db: Session, user_id: UUID) -> Optional[User]:
        """
        Get a user by ID
        """
        return self.user_repository.get_by_id(db, user_id)
    
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """
        Get a user by email
        """
        return self.user_repository.get_by_email(db, email)
    
    def get_users(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Get all users with pagination
        """
        return self.user_repository.get_all(db, skip=skip, limit=limit)
    
    def get_users_by_role(self, db: Session, role: UserRole, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Get users by role
        """
        return self.user_repository.get_users_by_role(db, role=role, skip=skip, limit=limit)
    
    def update_user(self, db: Session, user_id: UUID, user_update: UserUpdate) -> Optional[User]:
        """
        Update a user's profile
        """
        update_data = user_update.dict(exclude_unset=True)
        return self.user_repository.update(db, user_id, **update_data)
    
    def update_user_role(self, db: Session, user_id: UUID, role: UserRole) -> Optional[User]:
        """
        Update a user's role
        """
        return self.user_repository.update(db, user_id, role=role)
    
    def deactivate_user(self, db: Session, user_id: UUID) -> Optional[User]:
        """
        Deactivate a user
        """
        return self.user_repository.update(db, user_id, is_active=False)
        
    def activate_user(self, db: Session, user_id: UUID) -> Optional[User]:
        """
        Activate a user
        """
        return self.user_repository.update(db, user_id, is_active=True)
    
    def delete_user(self, db: Session, user_id: UUID) -> bool:
        """
        Delete a user
        """
        return self.user_repository.delete(db, user_id)
    
    def count_users(self, db: Session) -> int:
        """
        Count all users
        """
        return self.user_repository.count_users(db)
    
    def count_active_users(self, db: Session) -> int:
        """
        Count active users
        """
        return self.user_repository.count_active_users(db)
    
    def create_notification(self, db: Session, user_id: UUID, title: str, message: str, notification_type: str = "system", reference_id: Optional[str] = None):
        """
        Create a notification for a user
        """
        return self.notification_repository.create(
            db=db,
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            reference_id=reference_id
        )
    
    def create_superuser(self, db: Session, email: str, password: str, first_name: str, last_name: str, phone: Optional[str] = None) -> User:
        """
        Create a superuser with full system access
        """
        from core.security import get_password_hash
        from repositories.wallet_repository import WalletRepository
        
        # Check if user already exists
        existing_user = self.get_user_by_email(db, email)
        if existing_user:
            return existing_user
            
        # Hash the password
        hashed_password = get_password_hash(password)
        
        # Create user with superuser role
        db_user = self.user_repository.create(
            db,
            email=email,
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=UserRole.SUPERUSER
        )
        
        # Create wallet for the user
        wallet_repository = WalletRepository()
        wallet_repository.create(db, user_id=db_user.id)
        
        # Create notification for system
        self.create_notification(
            db=db,
            user_id=db_user.id,
            title="Welcome Superuser",
            message=f"Welcome {first_name}! Your superuser account has been created with full system access.",
            notification_type="system"
        )
        
        return db_user
        
        # Hash the password
        hashed_password = get_password_hash(password)
        
        # Create superuser
        db_user = self.user_repository.create(
            db,
            email=email,
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=UserRole.SUPERUSER,
            is_active=True,
            is_verified=True
        )
        
        # Create wallet for the superuser
        wallet_repository = WalletRepository()
        wallet_repository.create(db, user_id=db_user.id)
        
        return db_user