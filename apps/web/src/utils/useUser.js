import * as React from 'react';
import authService from '../services/authService';

const useUser = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const fetchUser = React.useCallback(async () => {
    try {
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }, []);

  const refetchUser = React.useCallback(async () => {
    setLoading(true);
    const userData = await fetchUser();
    setUser(userData);
    setLoading(false);
  }, [fetchUser]);

  React.useEffect(() => {
    refetchUser();
  }, [refetchUser]);

  return { user, data: user, loading, refetch: refetchUser };
};

export { useUser }

export default useUser;