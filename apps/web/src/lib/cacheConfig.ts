import { QueryClient } from '@tanstack/react-query';

// Default stale times for different types of data
export const CACHE_TIME = {
  BRIEF: 1000 * 60 * 1, // 1 minute
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 15, // 15 minutes
  LONG: 1000 * 60 * 60, // 1 hour
  EXTENDED: 1000 * 60 * 60 * 24, // 24 hours
};

// Create a client
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: CACHE_TIME.SHORT,
        cacheTime: CACHE_TIME.MEDIUM,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  });
};

// Cache key factories
export const cacheKeys = {
  // User related
  user: {
    all: ['users'] as const,
    lists: () => [...cacheKeys.user.all, 'list'] as const,
    list: (filters: any) => [...cacheKeys.user.lists(), filters] as const,
    details: () => [...cacheKeys.user.all, 'detail'] as const,
    detail: (id: string) => [...cacheKeys.user.details(), id] as const,
  },
  // Dashboard related
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...cacheKeys.dashboard.all, 'stats'] as const,
  },
  // Transactions related
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...cacheKeys.transactions.all, 'list'] as const,
    list: (filters: any) => [...cacheKeys.transactions.lists(), filters] as const,
    details: () => [...cacheKeys.transactions.all, 'detail'] as const,
    detail: (id: string) => [...cacheKeys.transactions.details(), id] as const,
  },
  // Settings related
  settings: {
    all: ['settings'] as const,
    general: () => [...cacheKeys.settings.all, 'general'] as const,
    notifications: () => [...cacheKeys.settings.all, 'notifications'] as const,
  },
};