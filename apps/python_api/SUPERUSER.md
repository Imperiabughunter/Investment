# Superuser Functionality

This document provides information about the superuser functionality in the CreateXYZ platform.

## Overview

Superusers have full CRUD (Create, Read, Update, Delete) abilities in the system and can manage all users, including admin users. Superusers are at the top of the role hierarchy:

1. **SUPERUSER** - Full system access, can manage all users including admins
2. **ADMIN** - Administrative access, can manage regular users
3. **SUPPORT** - Support access, limited administrative capabilities
4. **USER** - Regular user access

## Creating a Superuser

There are two ways to create a superuser:

### 1. Using the Command Line Script

A command line script is provided to create the first superuser in the system:

```bash
# Navigate to the python_api directory
cd apps/python_api

# Run the create_superuser.py script
python create_superuser.py --email admin@example.com --password securepassword --first-name Admin --last-name User --phone "+1234567890"
```

The `--phone` parameter is optional.

### 2. Using the API (Requires Existing Superuser)

Once you have at least one superuser in the system, you can create additional superusers through the API:

```
POST /auth/register/superuser
Authorization: Bearer <superuser_token>

{
  "email": "newsuperuser@example.com",
  "password": "securepassword",
  "first_name": "New",
  "last_name": "Superuser",
  "phone": "+1234567890"
}
```

## Superuser Capabilities

Superusers can:

1. Create, read, update, and delete any user in the system
2. Create and manage admin users through dedicated endpoints
3. Access all administrative features
4. Create additional superusers

## Admin Management Endpoints

Superusers have access to special endpoints for managing admin users:

```
# Create a new admin user
POST /admins

# Get all admin users
GET /admins

# Update an admin user
PUT /admins/{admin_id}

# Delete an admin user
DELETE /admins/{admin_id}
```

## Security Considerations

- Superuser accounts should be created sparingly and only for trusted individuals
- Use strong, unique passwords for superuser accounts
- Regularly audit superuser actions in the system
- Consider implementing additional security measures like 2FA for superuser accounts

## Implementation Details

The superuser functionality is implemented across several files:

- `models.py` and `schemas.py` - Define the SUPERUSER role
- `user_service.py` - Contains methods for creating superusers and managing users
- `auth_service.py` - Handles superuser authentication and creation
- `admin.py` - Contains endpoints for superuser operations
- `auth.py` - Includes the superuser registration endpoint
- `create_superuser.py` - Command line script for creating superusers