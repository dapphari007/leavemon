import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface SubscriptionGuardProps {
  children?: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { isAuthenticated, hasActiveSubscription, checkSubscription } = useAuth();
  const location = useLocation();
  
  // Always check subscription status
  const isSubscriptionActive = checkSubscription();
  
  // If not authenticated, let the ProtectedRoute handle the redirect
  if (!isAuthenticated) {
    return children ? <>{children}</> : <Outlet />;
  }
  
  // If subscription has expired, redirect to subscription page
  if (!isSubscriptionActive && !location.pathname.includes("/subscription")) {
    return <Navigate to="/subscription-expired" replace />;
  }
  
  // Render children or outlet
  return children ? <>{children}</> : <Outlet />;
};

export default SubscriptionGuard;