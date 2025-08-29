import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Groups from "@/pages/Groups";
import GroupDetails from "@/pages/GroupDetails";
import Members from "@/pages/Members";
import MemberDashboard from "@/pages/MemberDashboard";
import FieldDashboard from "@/pages/FieldDashboard";
import Transactions from "@/pages/Transactions";
import Loans from "@/pages/Loans";
import LoanCalculator from "@/pages/LoanCalculator";
import SubmitSavingsPage from "@/pages/SubmitSavingsPage";
import LoanPaymentsPage from "@/pages/LoanPaymentsPage";
import LoanSubmissionPage from "@/pages/LoanSubmissionPage";
import Meetings from "@/pages/Meetings";
import UserManagement from "@/pages/UserManagement";
import Reports from "@/pages/Reports";
import Reset from "@/pages/Reset";

function Router() {
  const [memberSession, setMemberSession] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Always call useAuth hook - never call hooks conditionally
  const { isAuthenticated, isLoading } = useAuth();

  // Load member session and mark auth as checked
  useEffect(() => {
    const sessionData = localStorage.getItem('memberSession');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        setMemberSession(session);
      } catch (error) {
        console.error('Invalid member session:', error);
        localStorage.removeItem('memberSession');
      }
    }
    setAuthChecked(true);
  }, []);

  // Check if user has leadership role that can access navigation
  const isLeadershipRole = memberSession && ['chairman', 'secretary', 'finance'].includes(memberSession.member?.groupRole);
  const hasNavigationAccess = isAuthenticated || isLeadershipRole;

  // If still checking auth, show loading
  if (!authChecked || (isLoading && !memberSession)) {
    return <div>Loading...</div>;
  }

  // If no access to protected routes, only show public routes
  if (!hasNavigationAccess) {
    return (
      <Switch>
        <Route path="/reset" component={Reset} />
        <Route path="/login" component={Login} />
        <Route path="/member-dashboard/:memberId" component={MemberDashboard} />
        <Route component={Login} />
      </Switch>
    );
  }

  // User has access - show all routes
  return (
    <Switch>
      {/* Reset page for clearing corrupted sessions */}
      <Route path="/reset" component={Reset} />
      
      {/* Unified login page */}
      <Route path="/login" component={Login} />
      
      {/* Member dashboard - accessible with member session */}
      <Route path="/member-dashboard/:memberId" component={MemberDashboard} />
      
      {/* Field staff dashboard */}
      <Route path="/field-dashboard" component={FieldDashboard} />
      
      {/* Routes accessible to both admins and group leaders */}
      <Route path="/" component={isAuthenticated ? Dashboard : () => <MemberDashboard />} />
      <Route path="/members" component={Members} />
      <Route path="/submit-savings" component={SubmitSavingsPage} />
      <Route path="/loan-payments" component={LoanPaymentsPage} />
      <Route path="/loan-submission" component={LoanSubmissionPage} />
      
      {/* Admin-only routes */}
      {isAuthenticated && (
        <>
          <Route path="/groups" component={Groups} />
          <Route path="/groups/:groupId" component={GroupDetails} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/loans" component={Loans} />
          <Route path="/loan-calculator" component={LoanCalculator} />
          <Route path="/meetings" component={Meetings} />
          <Route path="/user-management" component={UserManagement} />
          <Route path="/reports" component={Reports} />
        </>
      )}
      
      {/* 404 Not Found */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="weka-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
