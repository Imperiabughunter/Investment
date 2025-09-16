import React from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { useCachedData } from '../hooks/useCachedData';
import { apiService } from '../services';

/**
 * Example component demonstrating the use of the useCachedData hook
 */
const CachedDataExample = ({ endpoint, renderItem, emptyMessage = 'No data available' }) => {
  // Use the cached data hook
  const { data, isLoading, error, refetch } = useCachedData(
    `api_${endpoint}`, // Cache key based on endpoint
    () => apiService.get(endpoint), // Fetch function
    {
      cacheDuration: 10 * 60 * 1000, // 10 minutes cache
      dependencies: [endpoint], // Refetch when endpoint changes
    }
  );

  // Render loading state
  if (isLoading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF7B00" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  // Render error state
  if (error && !data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading data</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  // Render data
  return (
    <FlatList
      data={data || []}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={data?.length === 0 ? styles.centerContainer : styles.listContainer}
      ListEmptyComponent={
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          colors={['#FF7B00']}
          tintColor="#FF7B00"
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default CachedDataExample;