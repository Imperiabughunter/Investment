# Investment App Monorepo Audit Report

**Date**: August 25, 2025  
**Audited by**: AI Development Assistant  

## 🔍 Executive Summary

This audit identifies critical dependency conflicts and monorepo structure issues in the investment application. The most urgent issue is the React version mismatch between mobile (React 19) and web (React 18) which causes compatibility problems.

## 📊 Current Architecture

```
createxyz-project/
├── apps/
│   ├── mobile/     # React Native + Expo SDK 53
│   └── web/        # React Router 7 + Vite
└── [missing: apps/api, packages/, docs/]
```

## 🚨 Critical Issues Found

### 1. React Version Conflict (HIGH PRIORITY)
- **Mobile**: React 19.0.0 + React DOM 19.0.0
- **Web**: React 18.2.0 + React DOM 18.2.0
- **Impact**: Shared components fail, build inconsistencies, runtime errors
- **Action**: Downgrade mobile to React 18.2.0 (Expo 53 supports it)

### 2. React Native Version Mismatch (HIGH PRIORITY)
- **Current**: `react-native@0.79.3` (standalone)
- **Expected**: Expo SDK 53 includes React Native 0.75.x
- **Impact**: Metro bundler conflicts, native module incompatibilities
- **Action**: Remove standalone react-native, let Expo SDK manage it

### 3. Missing API Package (HIGH PRIORITY)
- **Current**: API routes embedded in web app (`src/app/api/`)
- **Expected**: Dedicated `apps/api` with Hono server
- **Impact**: Poor separation of concerns, difficult deployment
- **Action**: Extract API to separate package

### 4. Custom Dependencies (MEDIUM PRIORITY)
- **Issue**: `react-native-calendars` uses custom GitHub tarball
- **Risk**: No version control, potential security issues
- **Action**: Find compatible published version or fork properly

### 5. Missing Monorepo Setup (MEDIUM PRIORITY)
- **Issue**: No root package.json with workspaces
- **Impact**: No unified dependency management, complex dev setup
- **Action**: Create workspace root with pnpm workspaces

## 🔧 Dependency Version Conflicts

| Package | Mobile Version | Web Version | Status | Action |
|---------|---------------|-------------|--------|---------|
| react | 19.0.0 | ^18.2.0 | ❌ Conflict | Align to 18.2.0 |
| react-dom | 19.0.0 | ^18.2.0 | ❌ Conflict | Align to 18.2.0 |
| @tanstack/react-query | ^5.72.2 | ^5.72.2 | ✅ Match | Pin version |
| zustand | 5.0.3 | ^5.0.3 | ✅ Compatible | Pin to 5.0.3 |
| three | ^0.166.0 | ^0.175.0 | ⚠️ Minor diff | Align to latest |
| yup | ^1.6.1 | ^1.6.1 | ✅ Match | Pin version |
| date-fns | ^4.1.0 | ^4.1.0 | ✅ Match | Pin version |
| typescript | ~5.8.3 | ^5.8.3 | ✅ Compatible | Pin to 5.8.3 |

## 📦 Problematic Dependencies

### Mobile App Issues:
1. **@shopify/react-native-skia**: Using pre-release `v2.0.0-next.4`
2. **react-native-calendars**: Custom GitHub tarball instead of npm package
3. **yarn**: Included as dependency (should be dev tool)
4. **expo-three**: May conflict with different Three.js versions

### Web App Issues:
1. **@lshay/ui**: Unknown package, verify availability
2. **next-themes**: Override without using Next.js
3. **react-router-hono-server**: Unusual combination, verify compatibility

## 🎯 Action Plan

### Phase 1: Critical Fixes (Week 1)
1. ✅ **Create monorepo structure**
   ```bash
   # Create root package.json with workspaces
   # Add unified scripts for dev/build/test
   ```

2. ✅ **Align React versions** 
   ```bash
   # Mobile: Downgrade React to 18.2.0
   # Verify Expo 53 compatibility
   ```

3. ✅ **Fix React Native setup**
   ```bash
   # Remove standalone react-native
   # Let Expo SDK manage RN version
   ```

### Phase 2: Structure Improvements (Week 2)
4. ✅ **Extract API package**
   ```bash
   # Create apps/api with Hono + Node.js
   # Move API routes from web app
   ```

5. ✅ **Create shared packages**
   ```bash
   # packages/ui - Shared components
   # packages/types - TypeScript definitions
   # packages/config - Shared configs
   ```

### Phase 3: Optimization (Week 3)
6. ✅ **Resolve custom dependencies**
7. ✅ **Add development tooling**
8. ✅ **Create unified build pipeline**

## 🛠 Tools & Package Manager

**Recommended**: `pnpm` for workspace management
- Better disk usage than npm/yarn
- Faster installs
- Strict dependency hoisting
- Built-in workspace support

## 📋 Next Steps

1. **Execute Phase 1** immediately to resolve critical conflicts
2. **Set up local development** with unified scripts
3. **Test all apps** work together after fixes
4. **Document new architecture** for team onboarding

## 📞 Support

If issues persist after implementing fixes:
1. Check console for specific error messages
2. Clear Metro/Vite cache: `pnpm clean && pnpm dev`
3. Verify all environment variables are set
4. Review this audit for missed dependencies

---
*This audit was generated automatically. Review all actions before implementing.*
