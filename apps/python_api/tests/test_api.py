import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from main import app
from db.database import get_db

# Create test client
client = TestClient(app)

# Mock database session
@pytest.fixture
def mock_db():
    db = MagicMock()
    return db

# Override the dependency
@pytest.fixture(autouse=True)
def override_get_db(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db
    yield
    app.dependency_overrides = {}

# Mock JWT authentication
@pytest.fixture
def mock_current_user():
    return {
        "id": "user123",
        "email": "test@example.com",
        "role": "user",
        "is_active": True
    }

@pytest.fixture
def mock_admin_user():
    return {
        "id": "admin123",
        "email": "admin@example.com",
        "role": "admin",
        "is_active": True
    }

# Override the JWT dependency
@pytest.fixture
def auth_override(mock_current_user):
    from routers.auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: mock_current_user
    yield
    app.dependency_overrides = {}

@pytest.fixture
def admin_auth_override(mock_admin_user):
    from routers.auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: mock_admin_user
    yield
    app.dependency_overrides = {}

# Test health endpoint
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

# Test auth endpoints
@patch("routers.auth.auth_service")
def test_login(mock_auth_service, mock_db):
    # Setup mock
    mock_auth_service.authenticate_user.return_value = {
        "access_token": "test_token",
        "refresh_token": "refresh_token",
        "token_type": "bearer"
    }
    
    # Test login
    response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "refresh_token" in response.json()

# Test user endpoints
@patch("routers.users.user_service")
def test_get_current_user(mock_user_service, mock_db, auth_override):
    # Setup mock
    mock_user = MagicMock()
    mock_user.id = "user123"
    mock_user.email = "test@example.com"
    mock_user.first_name = "Test"
    mock_user.last_name = "User"
    mock_user.model_dump.return_value = {
        "id": "user123",
        "email": "test@example.com",
        "first_name": "Test",
        "last_name": "User",
        "role": "user",
        "is_active": True
    }
    
    mock_user_service.get_user_by_id.return_value = mock_user
    
    # Test get current user
    response = client.get("/users/me")
    
    assert response.status_code == 200
    assert response.json()["id"] == "user123"
    assert response.json()["email"] == "test@example.com"

# Test wallet endpoints
@patch("routers.wallets.wallet_service")
def test_get_user_wallet(mock_wallet_service, mock_db, auth_override):
    # Setup mock
    mock_wallet = MagicMock()
    mock_wallet.id = "wallet123"
    mock_wallet.user_id = "user123"
    mock_wallet.balance = 1000.0
    mock_wallet.model_dump.return_value = {
        "id": "wallet123",
        "user_id": "user123",
        "balance": 1000.0,
        "created_at": "2023-01-01T00:00:00",
        "updated_at": "2023-01-01T00:00:00"
    }
    
    mock_wallet_service.get_user_wallet.return_value = mock_wallet
    
    # Test get user wallet
    response = client.get("/wallets/me")
    
    assert response.status_code == 200
    assert response.json()["id"] == "wallet123"
    assert response.json()["balance"] == 1000.0

# Test investment endpoints
@patch("routers.investments.investment_service")
def test_get_investment_plans(mock_investment_service, mock_db):
    # Setup mock
    mock_plan1 = MagicMock()
    mock_plan1.id = "plan123"
    mock_plan1.name = "Basic Plan"
    mock_plan1.min_amount = 100.0
    mock_plan1.max_amount = 1000.0
    mock_plan1.roi_percentage = 5.0
    mock_plan1.duration_days = 30
    mock_plan1.is_active = True
    mock_plan1.model_dump.return_value = {
        "id": "plan123",
        "name": "Basic Plan",
        "min_amount": 100.0,
        "max_amount": 1000.0,
        "roi_percentage": 5.0,
        "duration_days": 30,
        "is_active": True
    }
    
    mock_investment_service.get_active_plans.return_value = [mock_plan1]
    
    # Test get investment plans
    response = client.get("/investments/plans")
    
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == "plan123"
    assert response.json()[0]["name"] == "Basic Plan"

# Test loan endpoints
@patch("routers.loans.loan_service")
def test_get_loan_products(mock_loan_service, mock_db):
    # Setup mock
    mock_product1 = MagicMock()
    mock_product1.id = "product123"
    mock_product1.name = "Personal Loan"
    mock_product1.min_amount = 500.0
    mock_product1.max_amount = 5000.0
    mock_product1.interest_rate = 10.0
    mock_product1.term_months = 12
    mock_product1.is_active = True
    mock_product1.model_dump.return_value = {
        "id": "product123",
        "name": "Personal Loan",
        "min_amount": 500.0,
        "max_amount": 5000.0,
        "interest_rate": 10.0,
        "term_months": 12,
        "is_active": True
    }
    
    mock_loan_service.get_active_products.return_value = [mock_product1]
    
    # Test get loan products
    response = client.get("/loans/products")
    
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == "product123"
    assert response.json()[0]["name"] == "Personal Loan"

# Test admin endpoints
@patch("routers.admin.user_service")
def test_admin_get_users(mock_user_service, mock_db, admin_auth_override):
    # Setup mock
    mock_user1 = MagicMock()
    mock_user1.id = "user123"
    mock_user1.email = "test@example.com"
    mock_user1.model_dump.return_value = {
        "id": "user123",
        "email": "test@example.com",
        "first_name": "Test",
        "last_name": "User",
        "role": "user",
        "is_active": True
    }
    
    mock_user_service.get_all_users.return_value = [mock_user1]
    
    # Test admin get users
    response = client.get("/admin/users")
    
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == "user123"
    assert response.json()[0]["email"] == "test@example.com"

# Test crypto deposit endpoints
@patch("routers.crypto_deposits.crypto_service")
def test_generate_deposit_address(mock_crypto_service, mock_db, auth_override):
    # Setup mock
    mock_crypto_service.generate_deposit_address.return_value = {
        "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        "currency": "BTC"
    }
    
    # Test generate deposit address
    response = client.post(
        "/crypto-deposits/address",
        json={"currency": "BTC"}
    )
    
    assert response.status_code == 200
    assert response.json()["address"] == "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
    assert response.json()["currency"] == "BTC"