import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Custom hook for fetching and caching data
 * @param {string} key - The cache key
 * @param {Function} fetchFunction - The function to fetch data
 * @param {Object} options - Additional options
 * @param {number} options.cacheDuration - Duration in milliseconds to keep cache valid (default: 5 minutes)
 * @param {boolean} options.forceRefresh - Force refresh data from API
 * @param {Array} options.dependencies - Dependencies array to trigger refetch
 * @returns {Object} { data, isLoading, error, refetch }
 */
export const useCachedData = (key, fetchFunction, options = {}) => {
  const {
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    forceRefresh = false,
    dependencies = [],
  } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch data and update cache
  const fetchData = async (skipCache = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first if not skipping cache
      if (!skipCache && !forceRefresh) {
        const cachedData = await getCachedData(key);
        if (cachedData) {
          setData(cachedData.data);
          setIsLoading(false);
          
          // If cache is still fresh, return early
          if (Date.now() - cachedData.timestamp < cacheDuration) {
            return;
          }
          // Otherwise continue to fetch fresh data but don't show loading state
        }
      }

      // Fetch fresh data
      const freshData = await fetchFunction();
      setData(freshData);

      // Update cache
      await AsyncStorage.setItem(
        `cache_${key}`,
        JSON.stringify({
          data: freshData,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      console.error(`Error fetching data for ${key}:`, err);
      setError(err);
      
      // Try to use cached data even if expired in case of error
      if (!skipCache) {
        const cachedData = await getCachedData(key);
        if (cachedData) {
          setData(cachedData.data);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get cached data
  const getCachedData = async (cacheKey) => {
    try {
      const cachedItem = await AsyncStorage.getItem(`cache_${cacheKey}`);
      if (cachedItem) {
        return JSON.parse(cachedItem);
      }
    } catch (err) {
      console.error(`Error reading cache for ${cacheKey}:`, err);
    }
    return null;
  };

  // Function to manually refetch data
  const refetch = () => fetchData(true);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [key, forceRefresh, ...dependencies]);

  return { data, isLoading, error, refetch };
};

/**
 * Helper function to clear all cached data
 */
export const clearAllCachedData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('cache_'));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Helper function to clear specific cached data
 * @param {string} key - The cache key to clear
 */
export const clearCachedData = async (key) => {
  try {
    await AsyncStorage.removeItem(`cache_${key}`);
  } catch (error) {
    console.error(`Error clearing cache for ${key}:`, error);
  }
};