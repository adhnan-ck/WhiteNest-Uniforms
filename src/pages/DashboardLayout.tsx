import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const DashboardLayout = () => {
  const { userProfile, loading } = useAuth();
  const location = useLocation();

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

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

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

  if (location.pathname === "/") {
    return <Navigate to={getDefaultRoute()} replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile top bar with hamburger to open sidebar */}
          <div className="md:hidden sticky top-0 z-20 border-b bg-background">
            <div className="flex items-center gap-3 px-4 py-3">
              <SidebarTrigger />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground capitalize">{userProfile?.name || userProfile?.email || "User"}</p>
                <h1 className="text-base font-semibold">Whitenest Uniforms</h1>
              </div>
            </div>
          </div>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
