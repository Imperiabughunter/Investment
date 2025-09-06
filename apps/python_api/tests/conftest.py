import pytest
from unittest.mock import MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from db.database import Base, get_db
from main import app

# Create in-memory SQLite database for testing
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def test_db():
    # Create in-memory database engine
    engine = create_engine(
        TEST_SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def override_get_db(test_db):
    # Override the get_db dependency
    def _get_test_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides = {}

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

@pytest.fixture
def mock_user_service():
    service = MagicMock()
    return service

@pytest.fixture
def mock_wallet_service():
    service = MagicMock()
    return service

@pytest.fixture
def mock_investment_service():
    service = MagicMock()
    return service

@pytest.fixture
def mock_loan_service():
    service = MagicMock()
    return service

@pytest.fixture
def mock_crypto_service():
    service = MagicMock()
    return service

@pytest.fixture
def mock_document_service():
    service = MagicMock()
    return service