import { useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: string | string[];
}

const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        navigate('/account/signin');
      } else if (requiredRole) {
        // Check for required role(s)
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const hasRequiredRole = user && roles.includes(user.role);
        
        if (!hasRequiredRole) {
          // Redirect to dashboard if authenticated but doesn't have required role
          navigate('/admin/dashboard');
        }
      }
    }
  }, [isAuthenticated, loading, requiredRole, navigate, user]);

  // Show nothing while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7B00]"></div>
      </div>
    );
  }

  // If not authenticated or doesn't have required role, don't render children
  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = user && roles.includes(user.role);
    
    if (!hasRequiredRole) {
      return null;
    }
  }

  // Render children if authenticated and has required role
  return <>{children}</>;
};

export default AuthGuard;