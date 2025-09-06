import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const AuthGuard = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!loading) {
      const inAuthGroup = segments[0] === 'auth';

      if (!isAuthenticated && !inAuthGroup) {
        // Redirect to login if not authenticated and not already in auth group
        router.replace('/auth/login');
      } else if (isAuthenticated && inAuthGroup) {
        // Redirect to dashboard if authenticated but still in auth group
        router.replace('/(tabs)/dashboard');
      }
    }
  }, [isAuthenticated, loading, segments, router]);

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF7B00" />
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default AuthGuard;