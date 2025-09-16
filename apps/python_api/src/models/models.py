from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from datetime import datetime

from db.database import Base

# Enums
class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    SUPPORT = "support"
    SUPERUSER = "superuser"

class TransactionType(str, enum.Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    INVESTMENT = "investment"
    LOAN_PAYMENT = "loan_payment"
    INTEREST = "interest"

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

class DocumentType(str, enum.Enum):
    ID_CARD = "id_card"
    PASSPORT = "passport"
    DRIVING_LICENSE = "driving_license"
    PROOF_OF_ADDRESS = "proof_of_address"
    SELFIE = "selfie"

class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class LoanStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ACTIVE = "active"
    PAID = "paid"
    DEFAULTED = "defaulted"

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class NotificationStatus(str, enum.Enum):
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"

class InvestmentStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Models
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    phone = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String, nullable=True)

    # Relationships
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    documents = relationship("Document", back_populates="user")
    investments = relationship("Investment", back_populates="user")
    loans = relationship("Loan", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    balance = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="wallet")
    transactions = relationship("Transaction", back_populates="wallet")

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    type = Column(Enum(DocumentType))
    file_url = Column(String)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.PENDING)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="documents")

class InvestmentPlan(Base):
    __tablename__ = "investment_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    description = Column(Text)
    min_amount = Column(Float)
    max_amount = Column(Float)
    roi_percentage = Column(Float)  # Annual ROI percentage
    duration_days = Column(Integer)  # Duration in days
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    investments = relationship("Investment", back_populates="plan")

class Investment(Base):
    __tablename__ = "investments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    plan_id = Column(UUID(as_uuid=True), ForeignKey("investment_plans.id"))
    amount = Column(Float)
    status = Column(Enum(InvestmentStatus), default=InvestmentStatus.ACTIVE)
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True))
    expected_return = Column(Float)  # Total expected return including principal
    current_value = Column(Float)  # Current value including accrued interest
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="investments")
    plan = relationship("InvestmentPlan", back_populates="investments")
    transactions = relationship("Transaction", back_populates="investment")

class LoanProduct(Base):
    __tablename__ = "loan_products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    description = Column(Text)
    min_amount = Column(Float)
    max_amount = Column(Float)
    interest_rate = Column(Float)  # Annual interest rate percentage
    term_months = Column(Integer)  # Loan term in months
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    loans = relationship("Loan", back_populates="product")

class Loan(Base):
    __tablename__ = "loans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    product_id = Column(UUID(as_uuid=True), ForeignKey("loan_products.id"))
    amount = Column(Float)
    status = Column(Enum(LoanStatus), default=LoanStatus.PENDING)
    application_date = Column(DateTime(timezone=True), server_default=func.now())
    approval_date = Column(DateTime(timezone=True), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    interest_rate = Column(Float)  # Annual interest rate percentage
    term_months = Column(Integer)  # Loan term in months
    monthly_payment = Column(Float, nullable=True)
    total_payment = Column(Float, nullable=True)  # Total payment including interest
    remaining_balance = Column(Float, nullable=True)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="loans")
    product = relationship("LoanProduct", back_populates="loans")
    transactions = relationship("Transaction", back_populates="loan")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"))
    investment_id = Column(UUID(as_uuid=True), ForeignKey("investments.id"), nullable=True)
    loan_id = Column(UUID(as_uuid=True), ForeignKey("loans.id"), nullable=True)
    type = Column(Enum(TransactionType))
    amount = Column(Float)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    description = Column(String, nullable=True)
    reference = Column(String, nullable=True)  # External reference (e.g., crypto tx hash)
    rejection_reason = Column(String, nullable=True)  # Reason for rejection if status is REJECTED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="transactions")
    wallet = relationship("Wallet", back_populates="transactions")
    investment = relationship("Investment", back_populates="transactions")
    loan = relationship("Loan", back_populates="transactions")
    order = relationship("Order", back_populates="transaction", uselist=False)

class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), unique=True)
    external_id = Column(String, nullable=True)  # External payment provider order ID
    payment_method = Column(String)
    amount = Column(Float)
    currency = Column(String)
    status = Column(String)
    payment_details = Column(Text, nullable=True)  # JSON string with payment details
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    transaction = relationship("Transaction", back_populates="order")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String)
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    type = Column(String)  # e.g., "transaction", "investment", "loan", "system"
    reference_id = Column(String, nullable=True)  # ID of the referenced entity
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String)  # e.g., "login", "create", "update", "delete"
    entity_type = Column(String)  # e.g., "user", "investment", "loan"
    entity_id = Column(String)
    details = Column(Text, nullable=True)  # JSON string with action details
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())