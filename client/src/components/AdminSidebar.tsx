import { useState } from "react";
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
  PlusCircle,
  MinusCircle,
  Menu,
  X,
} from "lucide-react";
import wekaLogo from "@assets/WEKA_1756289094166.png";
import dreamersLogo from "@assets/updated logo the dreamers_1756291084041.png";

// Navigation items with role-based access control
const navigationItems = [
  // Dashboard - available to all authenticated users
  { href: "/", icon: Home, label: "Dashboard", roles: ['admin', 'field_monitor', 'field_attendant', 'chairman', 'secretary', 'finance', 'member'] },
  
  // Group Members - viewable by all, editable only by leaders and field staff
  { href: "/members", icon: User, label: "Group Members", roles: ['admin', 'field_monitor', 'field_attendant', 'chairman', 'secretary', 'finance', 'member'] },
  
  // VSLA Data Submission - ONLY chairman, secretary, finance can submit data
  { href: "/submit-savings", icon: PlusCircle, label: "Submit Savings", roles: ['admin', 'field_monitor', 'field_attendant', 'chairman', 'secretary', 'finance'] },
  { href: "/loan-submission", icon: FileText, label: "Loan Submission", roles: ['admin', 'field_monitor', 'field_attendant', 'chairman', 'secretary', 'finance'] },
  { href: "/loan-payments", icon: MinusCircle, label: "Loan Payments", roles: ['admin', 'field_monitor', 'field_attendant', 'chairman', 'secretary', 'finance'] },
  
  // Group Management - field staff and admins
  { href: "/groups", icon: Users, label: "Groups", roles: ['admin', 'field_monitor', 'field_attendant'] },
  
  // Admin-only system functions
  { href: "/transactions", icon: DollarSign, label: "All Transactions", roles: ['admin'] },
  { href: "/loans", icon: FileText, label: "All Loans", roles: ['admin'] },
  { href: "/loan-calculator", icon: Calculator, label: "Loan Calculator", roles: ['admin'] },
  { href: "/meetings", icon: Calendar, label: "All Meetings", roles: ['admin'] },
  { href: "/user-management", icon: UserPlus, label: "User Management", roles: ['admin'] },
  { href: "/reports", icon: BarChart3, label: "System Reports", roles: ['admin'] },
];

interface AdminSidebarProps {
  userRole?: string;
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Determine the actual user role:
  // 1. If userRole prop is provided (for group leaders/members), use it
  // 2. If user is authenticated via API and has a role, use that role (admin/field)
  // 3. Otherwise default to 'member'
  const actualUserRole = userRole || (isAuthenticated && user?.role ? user.role : 'member');
  
  // Filter navigation items based on actual user role
  const allowedItems = navigationItems.filter(item => 
    item.roles.includes(actualUserRole)
  );

  const handleLogout = async () => {
    try {
      // Check if this is a member session (stored in localStorage)
      const memberSession = localStorage.getItem('memberSession');
      
      if (memberSession) {
        // Member logout - clear localStorage and redirect
        localStorage.removeItem('memberSession');
        window.location.href = '/login';
        return;
      }
      
      // Staff logout - clear server session
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      window.location.href = '/login';
    } catch (error) {
      console.log('Logout error:', error);
      // Force redirect even on error
      window.location.href = '/login';
    }
  };

  const sidebarContent = (
    <aside className="w-64 bg-card border-r border-border flex flex-col" data-testid="admin-sidebar">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between" data-testid="sidebar-header">
          <div className="flex items-center space-x-3">
            <img 
              src={wekaLogo} 
              alt="WEKA Logo" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-lg font-semibold text-foreground">WEKA Admin</h1>
              <p className="text-sm text-muted-foreground">Save For Future</p>
            </div>
          </div>
          <img 
            src={dreamersLogo} 
            alt="The Dreamers Logo" 
            className="w-8 h-8 object-contain"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2" data-testid="sidebar-navigation">
        {allowedItems.map((item) => {
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
                onClick={() => setIsMobileMenuOpen(false)}
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
              {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {(user as any)?.firstName && (user as any)?.lastName 
                ? `${(user as any).firstName} ${(user as any).lastName}` 
                : (user as any)?.email || "User"
              }
            </p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleLogout();
              setIsMobileMenuOpen(false);
            }}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile Menu Button - Hamburger Menu */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-3 left-3 z-50 lg:hidden bg-background/80 backdrop-blur-sm border shadow-sm"
        onClick={() => setIsMobileMenuOpen(true)}
        data-testid="mobile-menu-button"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Mobile Sidebar with Close Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 z-50 bg-background border shadow-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
