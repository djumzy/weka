import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Home,
  Users,
  User,
  DollarSign,
  FileText,
  Calendar,
  BarChart3,
  LogOut,
  Calculator,
  UserPlus,
} from "lucide-react";

const navigationItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/groups", icon: Users, label: "Groups" },
  { href: "/members", icon: User, label: "Members" },
  { href: "/transactions", icon: DollarSign, label: "Transactions" },
  { href: "/loans", icon: FileText, label: "Loans" },
  { href: "/loan-calculator", icon: Calculator, label: "Loan Calculator" },
  { href: "/meetings", icon: Calendar, label: "Meetings" },
  { href: "/user-management", icon: UserPlus, label: "User Management" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
];

export function AdminSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { 
        method: "POST",
        credentials: "include" 
      });
      // Force page reload to clear authentication state
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even on error
      window.location.href = "/";
    }
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col" data-testid="admin-sidebar">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3" data-testid="sidebar-header">
          <img 
            src="/attached_assets/WEKA_1756289094166.png" 
            alt="WEKA Logo" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-lg font-semibold text-foreground">WEKA Admin</h1>
            <p className="text-sm text-muted-foreground">Community Banking</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2" data-testid="sidebar-navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center space-x-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3" data-testid="sidebar-footer">
        {/* Theme Toggle */}
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
        
        {/* User Info */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-secondary-foreground">
              {user?.firstName?.[0] || user?.email?.[0] || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.email || "User"
              }
            </p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
