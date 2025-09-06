import { ReactNode } from 'react';
import AuthGuard from '@/components/AuthGuard';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps): ReactNode {
  return (
    <AuthGuard requiredRole="admin">
      {children}
    </AuthGuard>
  );
}