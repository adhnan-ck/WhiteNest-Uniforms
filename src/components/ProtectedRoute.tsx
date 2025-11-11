import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If userProfile is not loaded yet, wait (but don't wait forever if loading is false)
  // This handles the case where user exists but profile is still loading
  if (!userProfile && !loading) {
    console.warn("User profile not found. User may need to be created in the system.");
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles && userProfile) {
    if (!allowedRoles.includes(userProfile.role)) {
      // Redirect to their default dashboard instead of unauthorized
      const getDefaultRoute = () => {
        switch (userProfile.role) {
          case "admin":
            return "/dashboard";
          case "cutter":
            return "/cutter";
          case "tailor":
            return "/tailor";
          case "finisher":
            return "/finisher";
          default:
            return "/login";
        }
      };
      return <Navigate to={getDefaultRoute()} replace />;
    }
    
    // Check if user is active
    if (userProfile.isActive === false) {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};
