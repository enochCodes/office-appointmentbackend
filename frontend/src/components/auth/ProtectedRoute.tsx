'use client';

import React, { ReactNode, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner'; // Assuming a spinner component

interface ProtectedRouteProps {
  children: ReactNode;
  // roles?: string[]; // Optional: for role-based access
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <LoadingSpinner />; // Or some other loading indicator
  }

  if (!isAuthenticated) {
    return null; // Or redirecting via useEffect, show nothing or a message
  }

  return <>{children}</>;
};

export default ProtectedRoute;
