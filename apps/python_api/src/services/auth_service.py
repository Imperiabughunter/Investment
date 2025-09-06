from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from models.models import User
from schemas.schemas import UserCreate, UserRole, UserInDB
from core.security import get_password_hash, verify_password
from repositories.user_repository import UserRepository
from repositories.wallet_repository import WalletRepository

class AuthService:
    def __init__(self):
        self.user_repository = UserRepository()
        self.wallet_repository = WalletRepository()
    
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """
        Get a user by email
        """
        return self.user_repository.get_by_email(db, email)
    
    def get_user_by_id(self, db: Session, user_id: UUID) -> Optional[User]:
        """
        Get a user by ID
        """
        return self.user_repository.get_by_id(db, user_id)
    
    def create_user(self, db: Session, user: UserCreate) -> User:
        """
        Create a new user
        """
        # Hash the password
        hashed_password = get_password_hash(user.password)
        
        # Create user with hashed password
        db_user = self.user_repository.create(
            db,
            email=user.email,
            hashed_password=hashed_password,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            role=UserRole.USER
        )
        
        # Create wallet for the user
        self.wallet_repository.create(db, user_id=db_user.id)
        
        return db_user
    
    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """
        Authenticate a user
        """
        user = self.get_user_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
        
    def create_superuser(self, db: Session, user_data: dict) -> User:
        """
        Create a new superuser with full CRUD abilities
        """
        # Hash the password
        hashed_password = get_password_hash(user_data.get("password"))
        
        # Create user with superuser role
        db_user = self.user_repository.create(
            db,
            email=user_data.get("email"),
            hashed_password=hashed_password,
            first_name=user_data.get("first_name"),
            last_name=user_data.get("last_name"),
            phone=user_data.get("phone"),
            role=UserRole.SUPERUSER
        )
        
        # Create wallet for the user
        self.wallet_repository.create(db, user_id=db_user.id)
        
        return db_user