from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from uuid import UUID
import enum

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

class InvestmentStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    two_factor_enabled: Optional[bool] = None

class UserInDB(UserBase):
    id: UUID
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    two_factor_enabled: bool

    class Config:
        from_attributes = True

class User(UserInDB):
    pass

# Auth schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: UUID
    role: UserRole

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Wallet schemas
class WalletBase(BaseModel):
    balance: float
    currency: str = "USD"

class WalletCreate(WalletBase):
    user_id: UUID

class WalletUpdate(BaseModel):
    balance: Optional[float] = None
    currency: Optional[str] = None

class WalletInDB(WalletBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Wallet(WalletInDB):
    pass

# Document schemas
class DocumentBase(BaseModel):
    type: DocumentType
    file_url: str

class DocumentCreate(DocumentBase):
    user_id: UUID

class DocumentUpdate(BaseModel):
    status: Optional[DocumentStatus] = None
    rejection_reason: Optional[str] = None

class DocumentInDB(DocumentBase):
    id: UUID
    user_id: UUID
    status: DocumentStatus
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Document(DocumentInDB):
    pass

# Investment Plan schemas
class InvestmentPlanBase(BaseModel):
    name: str
    description: str
    min_amount: float
    max_amount: float
    roi_percentage: float
    duration_days: int
    is_active: bool = True

class InvestmentPlanCreate(InvestmentPlanBase):
    pass

class InvestmentPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    roi_percentage: Optional[float] = None
    duration_days: Optional[int] = None
    is_active: Optional[bool] = None

class InvestmentPlanInDB(InvestmentPlanBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InvestmentPlan(InvestmentPlanInDB):
    pass

# Investment schemas
class InvestmentBase(BaseModel):
    amount: float
    status: InvestmentStatus = InvestmentStatus.ACTIVE

class InvestmentCreate(InvestmentBase):
    user_id: UUID
    plan_id: UUID

class InvestmentUpdate(BaseModel):
    status: Optional[InvestmentStatus] = None
    current_value: Optional[float] = None

class InvestmentInDB(InvestmentBase):
    id: UUID
    user_id: UUID
    plan_id: UUID
    start_date: datetime
    end_date: datetime
    expected_return: float
    current_value: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Investment(InvestmentInDB):
    plan: InvestmentPlan

# Loan Product schemas
class LoanProductBase(BaseModel):
    name: str
    description: str
    min_amount: float
    max_amount: float
    interest_rate: float
    term_months: int
    is_active: bool = True

class LoanProductCreate(LoanProductBase):
    pass

class LoanProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    term_months: Optional[int] = None
    is_active: Optional[bool] = None

class LoanProductInDB(LoanProductBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LoanProduct(LoanProductInDB):
    pass

# Loan schemas
class LoanBase(BaseModel):
    amount: float
    term_months: int

class LoanCreate(LoanBase):
    user_id: UUID
    product_id: UUID

class LoanUpdate(BaseModel):
    status: Optional[LoanStatus] = None
    approval_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    monthly_payment: Optional[float] = None
    total_payment: Optional[float] = None
    remaining_balance: Optional[float] = None
    rejection_reason: Optional[str] = None

class LoanInDB(LoanBase):
    id: UUID
    user_id: UUID
    product_id: UUID
    status: LoanStatus
    application_date: datetime
    approval_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    interest_rate: float
    monthly_payment: Optional[float] = None
    total_payment: Optional[float] = None
    remaining_balance: Optional[float] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Loan(LoanInDB):
    product: LoanProduct

# Transaction schemas
class TransactionBase(BaseModel):
    type: TransactionType
    amount: float
    status: TransactionStatus = TransactionStatus.PENDING
    description: Optional[str] = None
    reference: Optional[str] = None

class TransactionCreate(TransactionBase):
    user_id: UUID
    wallet_id: UUID
    investment_id: Optional[UUID] = None
    loan_id: Optional[UUID] = None

class TransactionUpdate(BaseModel):
    status: Optional[TransactionStatus] = None
    description: Optional[str] = None
    reference: Optional[str] = None

class TransactionInDB(TransactionBase):
    id: UUID
    user_id: UUID
    wallet_id: UUID
    investment_id: Optional[UUID] = None
    loan_id: Optional[UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Transaction(TransactionInDB):
    pass

# Order schemas
class OrderBase(BaseModel):
    payment_method: str
    amount: float
    currency: str
    status: str
    payment_details: Optional[str] = None
    external_id: Optional[str] = None

class OrderCreate(OrderBase):
    transaction_id: UUID

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_details: Optional[str] = None
    external_id: Optional[str] = None

class OrderInDB(OrderBase):
    id: UUID
    transaction_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Order(OrderInDB):
    pass

# Notification schemas
class NotificationBase(BaseModel):
    title: str
    message: str
    type: str
    reference_id: Optional[str] = None
    is_read: bool = False

class NotificationCreate(NotificationBase):
    user_id: UUID

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class NotificationInDB(NotificationBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class Notification(NotificationInDB):
    pass

# Deposit and Withdrawal schemas
class DepositRequest(BaseModel):
    amount: float = Field(..., gt=0)
    payment_method: str
    currency: str = "USD"

class WithdrawalRequest(BaseModel):
    amount: float = Field(..., gt=0)
    payment_method: str
    wallet_address: Optional[str] = None

# Crypto Payment schemas
class CryptoPaymentRequest(BaseModel):
    amount: float = Field(..., gt=0)
    currency: str
    return_url: str

class CryptoPaymentResponse(BaseModel):
    payment_url: str
    payment_id: str
    expires_at: datetime

# Admin Dashboard schemas
class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    total_investments: float
    active_investments: int
    total_loans: float
    active_loans: int
    pending_withdrawals: int
    pending_kyc: int