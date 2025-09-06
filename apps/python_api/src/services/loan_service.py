from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from models.models import LoanStatus, TransactionType, TransactionStatus
from repositories.loan_repository import LoanRepository
from repositories.loan_product_repository import LoanProductRepository
from repositories.transaction_repository import TransactionRepository
from services.wallet_service import WalletService

class LoanService:
    def __init__(self):
        self.loan_repository = LoanRepository()
        self.loan_product_repository = LoanProductRepository()
        self.transaction_repository = TransactionRepository()
        self.wallet_service = WalletService()
    
    def get_product(self, db: Session, product_id: UUID):
        """
        Get a loan product by ID
        """
        return self.loan_product_repository.get_by_id(db, product_id)
    
    def get_active_products(self, db: Session, skip: int = 0, limit: int = 100):
        """
        Get all active loan products
        """
        return self.loan_product_repository.get_active_products(db, skip, limit)
    
    def get_loan(self, db: Session, loan_id: UUID):
        """
        Get a loan by ID
        """
        return self.loan_repository.get_by_id(db, loan_id)
    
    def get_user_loans(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100, status: Optional[LoanStatus] = None):
        """
        Get loans for a specific user
        """
        return self.loan_repository.get_by_user_id(db, user_id, skip, limit, status)
    
    def get_all_loans(self, db: Session, skip: int = 0, limit: int = 100, status: Optional[LoanStatus] = None):
        """
        Get all loans (admin function)
        """
        return self.loan_repository.get_all(db, skip, limit, status)
    
    def create_loan_application(self, db: Session, user_id: UUID, product_id: UUID, amount: float, term_months: int):
        """
        Create a new loan application
        """
        # Get the loan product
        product = self.loan_product_repository.get_by_id(db, product_id)
        if not product:
            raise ValueError("Loan product not found")
        
        # Validate amount against product min/max
        if amount < product.min_amount:
            raise ValueError(f"Minimum loan amount is {product.min_amount}")
        if amount > product.max_amount:
            raise ValueError(f"Maximum loan amount is {product.max_amount}")
        
        # Validate term against product min/max terms
        if term_months < product.min_term_months:
            raise ValueError(f"Minimum loan term is {product.min_term_months} months")
        if term_months > product.max_term_months:
            raise ValueError(f"Maximum loan term is {product.max_term_months} months")
        
        # Calculate interest rate and total repayment amount
        interest_rate = product.interest_rate
        total_interest = amount * (interest_rate / 100) * (term_months / 12)
        total_repayment = amount + total_interest
        monthly_payment = total_repayment / term_months
        
        # Calculate start and end dates
        start_date = None  # Will be set when loan is approved
        end_date = None    # Will be set when loan is approved
        
        # Create the loan application
        loan = self.loan_repository.create(
            db=db,
            user_id=user_id,
            product_id=product_id,
            amount=amount,
            interest_rate=interest_rate,
            term_months=term_months,
            total_repayment=total_repayment,
            monthly_payment=monthly_payment,
            remaining_amount=total_repayment,
            start_date=start_date,
            end_date=end_date,
            status=LoanStatus.PENDING,
            rejection_reason=None
        )
        
        return loan
    
    def update_loan_status(self, db: Session, loan_id: UUID, status: LoanStatus, rejection_reason: Optional[str] = None):
        """
        Update a loan's status (admin function)
        """
        # Get the loan
        loan = self.loan_repository.get_by_id(db, loan_id)
        if not loan:
            raise ValueError("Loan not found")
        
        # Handle status transition
        if status == LoanStatus.APPROVED and loan.status == LoanStatus.PENDING:
            # Set start and end dates
            start_date = datetime.utcnow()
            end_date = start_date + timedelta(days=30 * loan.term_months)
            
            # Update loan with approval details
            loan = self.loan_repository.update(
                db=db,
                loan_id=loan_id,
                status=status,
                start_date=start_date,
                end_date=end_date
            )
            
            # Create a transaction for the loan disbursement
            transaction = self.transaction_repository.create(
                db=db,
                user_id=loan.user_id,
                wallet_id=None,  # Will be set by wallet service
                amount=loan.amount,
                transaction_type=TransactionType.LOAN_DISBURSEMENT,
                status=TransactionStatus.PENDING,
                reference=f"Loan {loan_id} disbursement"
            )
            
            # Add the loan amount to the user's wallet
            self.wallet_service.process_deposit(
                db=db,
                user_id=loan.user_id,
                amount=loan.amount,
                transaction_id=transaction.id,
                description=f"Loan {loan_id} disbursement"
            )
            
            # Update transaction status
            self.transaction_repository.update_status(
                db=db,
                transaction_id=transaction.id,
                status=TransactionStatus.COMPLETED
            )
            
        elif status == LoanStatus.REJECTED and loan.status == LoanStatus.PENDING:
            # Update loan with rejection details
            loan = self.loan_repository.update(
                db=db,
                loan_id=loan_id,
                status=status,
                rejection_reason=rejection_reason
            )
            
        elif status == LoanStatus.CLOSED and loan.status == LoanStatus.ACTIVE:
            # Ensure loan is fully repaid
            if loan.remaining_amount > 0:
                raise ValueError("Cannot close loan with remaining balance")
            
            # Update loan status to closed
            loan = self.loan_repository.update(
                db=db,
                loan_id=loan_id,
                status=status
            )
            
        else:
            raise ValueError(f"Invalid status transition from {loan.status} to {status}")
        
        return loan
    
    def make_loan_payment(self, db: Session, loan_id: UUID, amount: float):
        """
        Process a loan payment
        """
        # Get the loan
        loan = self.loan_repository.get_by_id(db, loan_id)
        if not loan:
            raise ValueError("Loan not found")
        
        # Validate loan status
        if loan.status != LoanStatus.ACTIVE:
            raise ValueError("Loan is not active")
        
        # Validate payment amount
        if amount <= 0:
            raise ValueError("Payment amount must be greater than zero")
        
        if amount > loan.remaining_amount:
            amount = loan.remaining_amount  # Cap at remaining amount
        
        # Create a transaction for the loan payment
        transaction = self.transaction_repository.create(
            db=db,
            user_id=loan.user_id,
            wallet_id=None,  # Will be set by wallet service
            amount=amount,
            transaction_type=TransactionType.LOAN_PAYMENT,
            status=TransactionStatus.PENDING,
            reference=f"Payment for Loan {loan_id}"
        )
        
        # Deduct the payment amount from the user's wallet
        try:
            self.wallet_service.process_withdrawal(
                db=db,
                user_id=loan.user_id,
                amount=amount,
                transaction_id=transaction.id,
                description=f"Payment for Loan {loan_id}"
            )
        except ValueError as e:
            # Update transaction status to failed
            self.transaction_repository.update_status(
                db=db,
                transaction_id=transaction.id,
                status=TransactionStatus.FAILED
            )
            raise ValueError(f"Payment failed: {str(e)}")
        
        # Update transaction status
        self.transaction_repository.update_status(
            db=db,
            transaction_id=transaction.id,
            status=TransactionStatus.COMPLETED
        )
        
        # Update loan remaining amount
        new_remaining = loan.remaining_amount - amount
        loan = self.loan_repository.update(
            db=db,
            loan_id=loan_id,
            remaining_amount=new_remaining
        )
        
        # If loan is fully repaid, update status to CLOSED
        if new_remaining == 0:
            loan = self.loan_repository.update(
                db=db,
                loan_id=loan_id,
                status=LoanStatus.CLOSED
            )
        
        return loan
    
    def get_due_loans(self, db: Session):
        """
        Get all active loans with payments due (for background task)
        """
        return self.loan_repository.get_due_loans(db)
    
    def calculate_monthly_interest(self, db: Session, loan_id: UUID):
        """
        Calculate and apply monthly interest to a loan (for background task)
        """
        # Get the loan
        loan = self.loan_repository.get_by_id(db, loan_id)
        if not loan or loan.status != LoanStatus.ACTIVE:
            return None
        
        # Calculate monthly interest
        monthly_interest = loan.remaining_amount * (loan.interest_rate / 100 / 12)
        
        # Update loan remaining amount
        new_remaining = loan.remaining_amount + monthly_interest
        loan = self.loan_repository.update(
            db=db,
            loan_id=loan_id,
            remaining_amount=new_remaining
        )
        
        return loan