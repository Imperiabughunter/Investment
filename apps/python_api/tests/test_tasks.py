import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

# Import tasks to test
from tasks.investment_tasks import process_investment_returns, process_investment_maturity
from tasks.loan_tasks import calculate_monthly_interest, process_due_payments
from tasks.crypto_tasks import check_pending_orders
from tasks.notification_tasks import send_reminders

# Mock models and enums
class InvestmentStatus:
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"

class TransactionType:
    INVESTMENT_RETURN = "INVESTMENT_RETURN"

class TransactionStatus:
    COMPLETED = "COMPLETED"

class OrderStatus:
    PENDING = "PENDING"
    EXPIRED = "EXPIRED"

@pytest.fixture
def mock_db_session():
    """Create a mock database session"""
    session = MagicMock()
    return session

@patch('tasks.investment_tasks.investment_service')
@patch('tasks.investment_tasks.SessionLocal')
def test_process_investment_returns(mock_session_local, mock_investment_service, mock_db_session):
    """Test the process_investment_returns task"""
    # Setup mocks
    mock_session_local.return_value = mock_db_session
    
    # Create mock investments
    mock_investment = MagicMock()
    mock_investment.id = "123"
    mock_investment.amount = 1000
    mock_investment.current_value = 1050
    mock_investment.end_date = datetime.utcnow() + timedelta(days=30)
    
    # Create mock plan
    mock_plan = MagicMock()
    mock_plan.roi_percentage = 10  # 10% annual ROI
    
    # Setup return values
    mock_investment_service.get_all_investments.return_value = [mock_investment]
    mock_investment_service.get_plan.return_value = mock_plan
    
    # Call the task
    result = process_investment_returns()
    
    # Assertions
    mock_investment_service.get_all_investments.assert_called_once_with(
        mock_db_session, status=InvestmentStatus.ACTIVE
    )
    mock_investment_service.get_plan.assert_called_once_with(
        mock_db_session, mock_investment.plan_id
    )
    mock_investment_service.update_investment_value.assert_called_once()
    assert "Processed returns for 1 active investments" in result

@patch('tasks.loan_tasks.loan_service')
@patch('tasks.loan_tasks.SessionLocal')
def test_calculate_monthly_interest(mock_session_local, mock_loan_service, mock_db_session):
    """Test the calculate_monthly_interest task"""
    # Setup mocks
    mock_session_local.return_value = mock_db_session
    
    # Create mock loans
    mock_loan = MagicMock()
    mock_loan.id = "456"
    mock_loan.user_id = "user123"
    mock_loan.remaining_amount = 5000
    
    # Setup return values
    mock_loan_service.get_all_loans.return_value = [mock_loan]
    mock_loan_service.calculate_monthly_interest.return_value = mock_loan
    
    # Call the task
    result = calculate_monthly_interest()
    
    # Assertions
    mock_loan_service.get_all_loans.assert_called_once_with(
        mock_db_session, status=LoanStatus.ACTIVE
    )
    mock_loan_service.calculate_monthly_interest.assert_called_once_with(
        mock_db_session, mock_loan.id
    )
    assert "Applied monthly interest to 1 active loans" in result

@patch('tasks.crypto_tasks.crypto_service')
@patch('tasks.crypto_tasks.SessionLocal')
def test_check_pending_orders(mock_session_local, mock_crypto_service, mock_db_session):
    """Test the check_pending_orders task"""
    # Setup mocks
    mock_session_local.return_value = mock_db_session
    
    # Create mock orders
    mock_order = MagicMock()
    mock_order.id = "789"
    mock_order.user_id = "user456"
    mock_order.amount = 0.1
    mock_order.currency = "BTC"
    mock_order.created_at = datetime.utcnow() - timedelta(hours=25)  # Older than 24 hours
    
    # Setup return values
    mock_crypto_service.get_pending_orders.return_value = [mock_order]
    
    # Call the task
    result = check_pending_orders()
    
    # Assertions
    mock_crypto_service.get_pending_orders.assert_called_once_with(mock_db_session)
    mock_crypto_service.update_order_status.assert_called_once_with(
        mock_db_session, mock_order.id, OrderStatus.EXPIRED, "Order expired after 24 hours"
    )
    assert "Checked 1 pending orders" in result

@patch('tasks.notification_tasks.send_loan_payment_reminders')
@patch('tasks.notification_tasks.send_investment_maturity_reminders')
@patch('tasks.notification_tasks.send_kyc_reminders')
@patch('tasks.notification_tasks.send_inactive_account_reminders')
@patch('tasks.notification_tasks.SessionLocal')
def test_send_reminders(
    mock_session_local, 
    mock_inactive_reminders,
    mock_kyc_reminders,
    mock_investment_reminders,
    mock_loan_reminders,
    mock_db_session
):
    """Test the send_reminders task"""
    # Setup mocks
    mock_session_local.return_value = mock_db_session
    
    # Call the task
    result = send_reminders()
    
    # Assertions
    mock_loan_reminders.assert_called_once_with(mock_db_session)
    mock_investment_reminders.assert_called_once_with(mock_db_session)
    mock_kyc_reminders.assert_called_once_with(mock_db_session)
    mock_inactive_reminders.assert_called_once_with(mock_db_session)
    assert "Sent all daily reminders" in result