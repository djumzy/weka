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
  const { isAuthenticated, isLoading, user } = useAuth();
  const [memberSession, setMemberSession] = useState<any>(null);

  // Check for member session in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('memberSession');
    if (stored) {
      try {
        setMemberSession(JSON.parse(stored));
      } catch (e) {
        console.log('Invalid member session in localStorage');
      }
    }
  }, []);

  // If still loading authentication, show loading
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Determine user type and role
  const isStaffAuthenticated = isAuthenticated && user?.role; // Staff have roles (admin, field)
  const isMemberAuthenticated = memberSession?.member;
  const userRole = user?.role || memberSession?.member?.groupRole || 'guest';
  
  // If no authentication at all, show login
  if (!isStaffAuthenticated && !isMemberAuthenticated) {
    return (
      <Switch>
        <Route path="/reset" component={Reset} />
        <Route path="/login" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  // User is authenticated (either staff or member)
  const isAdmin = isStaffAuthenticated && userRole === 'admin';
  const isFieldStaff = isStaffAuthenticated && userRole === 'field';
  const isMember = isMemberAuthenticated && ['chairman', 'secretary', 'finance', 'member'].includes(userRole);
  
  return (
    <Switch>
      {/* Public routes always available */}
      <Route path="/reset" component={Reset} />
      <Route path="/login" component={Login} />
      
      {/* Member routes - only for authenticated members */}
      {isMemberAuthenticated && (
        <>
          <Route path="/member-dashboard/:memberId" component={MemberDashboard} />
          <Route path="/member-dashboard" component={MemberDashboard} />
          {/* Member leadership can access these */}
          {memberSession?.member && ['chairman', 'secretary', 'finance'].includes(memberSession.member.groupRole) && (
            <>
              <Route path="/members" component={Members} />
              <Route path="/submit-savings" component={SubmitSavingsPage} />
              <Route path="/loan-payments" component={LoanPaymentsPage} />
              <Route path="/loan-submission" component={LoanSubmissionPage} />
            </>
          )}
        </>
      )}
      
      {/* Field staff routes - only for field staff */}
      {isFieldStaff && (
        <>
          <Route path="/field-dashboard" component={FieldDashboard} />
          <Route path="/members" component={Members} />
          <Route path="/submit-savings" component={SubmitSavingsPage} />
          <Route path="/loan-payments" component={LoanPaymentsPage} />
          <Route path="/loan-submission" component={LoanSubmissionPage} />
        </>
      )}
      
      {/* Admin routes - only for administrators */}
      {isAdmin && (
        <>
          <Route path="/groups" component={Groups} />
          <Route path="/groups/:groupId" component={GroupDetails} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/loans" component={Loans} />
          <Route path="/loan-calculator" component={LoanCalculator} />
          <Route path="/meetings" component={Meetings} />
          <Route path="/user-management" component={UserManagement} />
          <Route path="/reports" component={Reports} />
          <Route path="/members" component={Members} />
          <Route path="/submit-savings" component={SubmitSavingsPage} />
          <Route path="/loan-payments" component={LoanPaymentsPage} />
          <Route path="/loan-submission" component={LoanSubmissionPage} />
        </>
      )}
      
      {/* Default home routes based on role */}
      <Route path="/" component={() => {
        if (isAdmin) return <Dashboard />;
        if (isFieldStaff) return <FieldDashboard />;
        if (memberSession?.member) return <MemberDashboard />;
        return <Login />;
      }} />
      
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
