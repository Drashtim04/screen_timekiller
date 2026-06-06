import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../context/AuthContext';

interface SubscriptionGuardProps {
  /** If true the guard blocks access and redirects to dashboard with pricing open */
  requirePro?: boolean;
  /** Called instead of redirect when user needs to upgrade */
  onUpgradeRequired?: () => void;
  children: React.ReactNode;
}

/**
 * SubscriptionGuard — a route-level guard that prevents non-Pro users
 * from accessing entire pages or sections.
 *
 * Usage:
 *   <SubscriptionGuard requirePro onUpgradeRequired={openPricing}>
 *     <AiReportsPage />
 *   </SubscriptionGuard>
 *
 * Does NOT modify any existing routes — only used where explicitly added.
 */
export default function SubscriptionGuard({
  requirePro = false,
  onUpgradeRequired,
  children,
}: SubscriptionGuardProps) {
  const { isPro, loading } = useSubscription();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (requirePro && !isPro) {
    if (onUpgradeRequired) {
      onUpgradeRequired();
      return null;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
