# Prime Investment Platform

A full-stack investment and lending platform with mobile app for users and web admin panel.

## Architecture Overview

### Backend (Python FastAPI)
- **Modular Layered Architecture**: Routers → Services → Repositories
- **Database**: PostgreSQL with SQLAlchemy ORM and Alembic migrations
- **Authentication**: Supabase Auth with JWT tokens
- **Background Tasks**: Celery + Redis for scheduled operations
- **Real-time Updates**: WebSockets/Supabase Realtime

### Frontend
- **Mobile App**: React Native with glassmorphism UI (black, white, gold theme)
- **Admin Panel**: React + TailwindCSS

## Features

### User Features
- Account management (signup, login, password reset)
- KYC verification
- Wallet management
- Investment opportunities
- Loan applications
- Crypto deposits
- Withdrawals
- Transaction history
- Notifications

### Admin Features
- Dashboard with KPIs
- User management
- KYC verification
- Investment product management
- Loan product management
- Transaction management
- Audit logs
- Broadcast notifications

### Superuser Features
- All admin features
- Create and manage admin users
- Full CRUD abilities for all users
- System-wide access control

## Project Structure

```
├── apps
│   ├── python_api        # Backend API
│   │   ├── migrations    # Alembic migrations
│   │   ├── src           # Source code
│   │   │   ├── db        # Database connection
│   │   │   ├── models    # SQLAlchemy models
│   │   │   ├── repositories # Data access layer
│   │   │   ├── routers   # API endpoints
│   │   │   ├── services  # Business logic
│   │   │   ├── tasks     # Celery tasks
│   │   │   └── utils     # Utility functions
│   ├── mobile            # React Native mobile app
│   └── web               # React admin panel
├── docker-compose.yml    # Docker Compose configuration
└── .github               # GitHub Actions workflows
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Python 3.11+

### Environment Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/prime-investment-platform.git
   cd prime-investment-platform
   ```

2. Create environment files
   ```bash
   cp .env.example .env
   ```

3. Start the backend services
   ```bash
   docker-compose up -d
   ```

4. Run database migrations
   ```bash
   docker-compose exec api alembic upgrade head
   ```

5. Create a superuser (optional)
   ```bash
   docker-compose exec api python create_superuser.py --email admin@example.com --password securepassword --first-name Admin --last-name User
   ```
   See `apps/python_api/SUPERUSER.md` for more details on superuser functionality.

### Running the Backend

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Access API documentation
open http://localhost:8000/docs
```

### Running the Admin Panel

```bash
cd apps/web
npm install
npm run dev
```

### Running the Mobile App

```bash
cd apps/mobile
npm install
npm start
```

## API Documentation

The API documentation is available at `/docs` when the API is running. It provides a comprehensive overview of all available endpoints, request/response schemas, and authentication requirements.

## Background Tasks

The platform uses Celery for background tasks:

- Investment returns calculation (daily)
- Loan interest calculation (monthly)
- Due payment processing (daily)
- Pending order checks (every 10 minutes)
- Notification reminders (daily)

You can monitor Celery tasks using Flower at `http://localhost:5555`.

## Testing

### Backend Tests

```bash
cd apps/python_api
pytest
```

### Frontend Tests

```bash
# Web Admin Panel
cd apps/web
npm test

# Mobile App
cd apps/mobile
npm test
```

## Deployment

The project includes GitHub Actions workflows for CI/CD. When code is pushed to the main branch, it will:

1. Run tests for backend and frontend
2. Build Docker images
3. Build web and mobile apps
4. Deploy to the configured environments

## License

This project is licensed under the MIT License - see the LICENSE file for details.
