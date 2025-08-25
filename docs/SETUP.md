# 🚀 Investment App - Development Setup Guide

## Quick Start

```bash
pnpm i && pnpm dev
```

## 📋 Prerequisites

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0 (recommended)
- **Git**: Latest version
- **Expo CLI**: `npm i -g @expo/cli` (for mobile development)

## 🏗️ Architecture Overview

```
investment-app/
├── apps/
│   ├── api/        # Hono REST API server (Node.js)
│   ├── mobile/     # React Native app (Expo SDK 53)
│   └── web/        # React web app (React Router 7 + Vite)
├── packages/       # Shared packages (future)
├── docs/          # Documentation
└── [root configs] # Monorepo tooling
```

## 🔧 Installation & Setup

### 1. Clone and Install Dependencies

```bash
cd createxyz-project/createxyz-project
pnpm install
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

**Required Environment Variables:**
```bash
# Database (Get from Neon, PlanetScale, or local PostgreSQL)
DATABASE_URL="postgres://username:password@host:port/database"

# Supabase (Optional, for additional features)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# JWT Secret (Generate a random string)
JWT_SECRET="your-super-secret-jwt-key-here"

# Stripe (Get from Stripe Dashboard)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 3. Database Setup (Optional)

If you want full functionality, set up a PostgreSQL database:

**Option A: Neon (Recommended)**
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL locally
# Create database
createdb investment_app

# Add connection string to .env
DATABASE_URL="postgres://username:password@localhost:5432/investment_app"
```

## 🚀 Development Commands

### Start All Services
```bash
pnpm dev
```
This starts:
- **API Server**: http://localhost:3001
- **Web App**: http://localhost:5173
- **Mobile App**: Metro bundler on http://localhost:8081

### Individual Services
```bash
# API server only
pnpm dev:api

# Web app only  
pnpm dev:web

# Mobile app only
pnpm dev:mobile
```

### Other Useful Commands
```bash
# Clean everything
pnpm clean

# Type checking
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix

# Testing
pnpm test
```

## 📱 Mobile Development

### Setup Expo Development

```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Start mobile development
cd apps/mobile
pnpm expo start
```

**Development Options:**
- **Expo Go**: Scan QR code with Expo Go app
- **iOS Simulator**: Press `i` in terminal
- **Android Emulator**: Press `a` in terminal  
- **Web**: Press `w` in terminal

### Building Mobile Apps

```bash
# Development build
pnpm mobile:ios        # iOS development build
pnpm mobile:android    # Android development build

# Production build
pnpm mobile:build:ios      # iOS production build
pnpm mobile:build:android  # Android production build
```

## 🌐 Web Development

The web app runs on **React Router 7** with **Vite** for fast development.

```bash
# Development server
pnpm dev:web
# Opens http://localhost:5173

# Build for production
pnpm build:web

# Preview production build
pnpm web preview
```

## 🔌 API Development

The API is built with **Hono** (lightweight web framework) and runs on **Node.js**.

```bash
# Development server with hot reload
pnpm dev:api
# API available at http://localhost:3001

# Build for production
pnpm build:api

# Start production server
pnpm api start
```

### API Endpoints

**Health Check:**
- `GET /health` - Basic health check
- `GET /health/status` - Detailed system status

**Authentication:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user (protected)

**Wallets:**
- `GET /wallets/balance` - Get wallet balance (protected)
- `GET /wallets/transactions` - Get transaction history (protected)
- `POST /wallets/deposit` - Deposit funds (protected)
- `POST /wallets/withdraw` - Withdraw funds (protected)

**Investments:**
- `GET /investments/plans` - Get available investment plans
- `GET /investments/my-investments` - Get user's investments (protected)
- `POST /investments/create` - Create new investment (protected)

## 🗄️ Database Schema

The app uses **Drizzle ORM** for database management:

```bash
# Generate schema
pnpm api db:generate

# Push schema to database
pnpm api db:push

# View database in browser
pnpm api db:studio

# Seed development data
pnpm api db:seed
```

## 🔐 Authentication Flow

1. **Registration/Login** → JWT tokens issued
2. **Access Token** → Short-lived (1 hour), used for API requests
3. **Refresh Token** → Long-lived (7 days), used to get new access tokens
4. **Protected Routes** → Require valid access token

## 🎨 UI Components

- **Web**: Chakra UI + Tailwind CSS
- **Mobile**: React Native + Expo components
- **Shared**: React Native Web for cross-platform components

## ⚡ Performance Tips

- **Web**: Vite provides instant HMR
- **Mobile**: Use Expo development builds for faster iteration
- **API**: `tsx` provides TypeScript hot reload

## 🐛 Troubleshooting

### Common Issues

**Metro bundler issues (Mobile):**
```bash
cd apps/mobile
pnpm expo start -c  # Clear cache
```

**Port conflicts:**
```bash
# Kill processes on ports
lsof -ti:3001 | xargs kill  # API
lsof -ti:5173 | xargs kill  # Web
lsof -ti:8081 | xargs kill  # Mobile
```

**TypeScript errors:**
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm type-check
```

**Database connection issues:**
1. Check `DATABASE_URL` in `.env`
2. Ensure database server is running
3. Test connection: `pnpm api db:studio`

### Development Logs

- **API**: Check terminal running `pnpm dev:api`
- **Web**: Check browser console + terminal
- **Mobile**: Check Metro bundler terminal + device logs

## 🚢 Deployment

### API Server
```bash
# Build for production
pnpm build:api

# Deploy to your preferred platform:
# - Railway, Render, Fly.io, Vercel, etc.
```

### Web App
```bash
# Build for production
pnpm build:web

# Deploy to:
# - Vercel, Netlify, Railway, etc.
```

### Mobile App
```bash
# Build production apps
eas build --platform all

# Submit to app stores
eas submit --platform all
```

## 📚 Next Steps

1. **Database Setup**: Configure your database and run migrations
2. **API Integration**: Connect mobile and web apps to the API
3. **Authentication**: Implement complete auth flow
4. **Payment Integration**: Add Stripe payment processing
5. **Testing**: Add comprehensive test suite
6. **Deployment**: Deploy to production platforms

## 📞 Support

- **Documentation**: Check `/docs` folder for detailed guides
- **API Reference**: Visit http://localhost:3001 when API is running
- **Issues**: Check terminal output for detailed error messages

---

**Happy coding! 🎉**
