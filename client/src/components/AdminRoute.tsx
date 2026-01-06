/**
 * AdminRoute Component
 * Protects admin routes by checking user role
 * Redirects non-admin users to home page
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const isStaff = user && ((user as any).role === 'admin' || (user as any).role === 'employee');

  useEffect(() => {
    if (!loading && !isStaff) {
      // Redirect non-staff users to home with toast message
      setLocation('/');
    }
  }, [user, loading, isStaff, setLocation]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  // Show nothing if not staff (will redirect)
  if (!isStaff) {
    return null;
  }

  // Render admin content
  return <>{children}</>;
}
