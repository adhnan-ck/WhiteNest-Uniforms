import { LayoutDashboard, Scissors, Shirt, SparklesIcon, Users, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { userProfile, signOut } = useAuth();

  const getNavigationItems = () => {
    const role = userProfile?.role;
    
    if (role === "admin") {
      return [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Users", url: "/users", icon: Users },
      ];
    }
    
    if (role === "cutter") {
      return [{ title: "Cutting", url: "/cutter", icon: Scissors }];
    }
    
    if (role === "tailor") {
      return [{ title: "Stitching", url: "/tailor", icon: Shirt }];
    }
    
    if (role === "finisher") {
      return [{ title: "Finishing", url: "/finisher", icon: SparklesIcon }];
    }
    
    return [];
  };

  const items = getNavigationItems();

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          {/* Logo Icon */}
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Scissors className="h-4 w-4 text-primary-foreground" />
          </div>
          
          {/* Company + User */}
          <div>
            <h2 className="text-sm font-semibold">Whitenest Uniforms</h2>
            <p className="text-xs text-muted-foreground truncate max-w-[120px]">
              {userProfile?.name || userProfile?.email || "User"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="hover:bg-accent"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
