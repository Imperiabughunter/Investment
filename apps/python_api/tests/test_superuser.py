import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4

from main import app
from models.models import UserRole
from services.user_service import UserService
from services.auth_service import AuthService
from core.security import create_access_token

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def superuser_token(db: Session):
    # Create a superuser for testing
    user_service = UserService()
    email = f"superuser_{uuid4()}@test.com"
    superuser = user_service.create_superuser(
        db=db,
        email=email,
        password="testpassword",
        first_name="Test",
        last_name="Superuser"
    )
    
    # Create token for the superuser
    access_token = create_access_token(
        data={"sub": str(superuser.id), "role": superuser.role}
    )
    return access_token

@pytest.fixture
def admin_token(db: Session):
    # Create an admin user for testing
    auth_service = AuthService()
    email = f"admin_{uuid4()}@test.com"
    admin = auth_service.create_user(
        db=db,
        user={
            "email": email,
            "password": "testpassword",
            "first_name": "Test",
            "last_name": "Admin"
        }
    )
    
    # Update user role to admin
    user_service = UserService()
    admin = user_service.update_user_role(db, admin.id, UserRole.ADMIN)
    
    # Create token for the admin
    access_token = create_access_token(
        data={"sub": str(admin.id), "role": admin.role}
    )
    return access_token

def test_create_admin_as_superuser(client, superuser_token, db):
    # Test that a superuser can create an admin
    admin_data = {
        "email": f"new_admin_{uuid4()}@test.com",
        "password": "testpassword",
        "first_name": "New",
        "last_name": "Admin"
    }
    
    response = client.post(
        "/admins",
        json=admin_data,
        headers={"Authorization": f"Bearer {superuser_token}"}
    )
    
    assert response.status_code == 201
    assert response.json()["role"] == "admin"

def test_create_admin_as_admin_fails(client, admin_token, db):
    # Test that an admin cannot create another admin
    admin_data = {
        "email": f"new_admin_{uuid4()}@test.com",
        "password": "testpassword",
        "first_name": "New",
        "last_name": "Admin"
    }
    
    response = client.post(
        "/admins",
        json=admin_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 403

def test_get_admins_as_superuser(client, superuser_token, db):
    # Test that a superuser can get all admins
    response = client.get(
        "/admins",
        headers={"Authorization": f"Bearer {superuser_token}"}
    )
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_superuser_as_superuser(client, superuser_token, db):
    # Test that a superuser can create another superuser
    superuser_data = {
        "email": f"new_superuser_{uuid4()}@test.com",
        "password": "testpassword",
        "first_name": "New",
        "last_name": "Superuser"
    }
    
    response = client.post(
        "/auth/register/superuser",
        json=superuser_data,
        headers={"Authorization": f"Bearer {superuser_token}"}
    )
    
    assert response.status_code == 201
    assert response.json()["role"] == "superuser"

def test_create_superuser_as_admin_fails(client, admin_token, db):
    # Test that an admin cannot create a superuser
    superuser_data = {
        "email": f"new_superuser_{uuid4()}@test.com",
        "password": "testpassword",
        "first_name": "New",
        "last_name": "Superuser"
    }
    
    response = client.post(
        "/auth/register/superuser",
        json=superuser_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 403