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

  // If still loading authentication, show loading
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Determine user type based on authenticated user data
  const userRole = user?.role || user?.groupRole;
  
  // If no authentication at all, show login
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/reset" component={Reset} />
        <Route path="/login" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  // Determine role based on authenticated user
  const isAdmin = isAuthenticated && userRole === 'admin';
  const isFieldMonitor = isAuthenticated && userRole === 'field_monitor';
  const isFieldAttendant = isAuthenticated && userRole === 'field_attendant';
  const isMember = isAuthenticated && ['chairman', 'secretary', 'finance', 'member'].includes(userRole);
  
  // Member permission levels
  const isGroupLeader = isMember && ['chairman', 'secretary', 'finance'].includes(userRole);
  const isRegularMember = isMember && userRole === 'member';
  
  return (
    <Switch>
      {/* Public routes always available */}
      <Route path="/reset" component={Reset} />
      <Route path="/login" component={Login} />
      
      {/* MEMBER ROUTES - Highest Priority - Members can only see their group's data */}
      {isMember && (
        <>
          <Route path="/member-dashboard/:memberId" component={MemberDashboard} />
          <Route path="/member-dashboard" component={MemberDashboard} />
          {/* ONLY chairman, secretary, finance can submit data - regular members VIEW ONLY */}
          {isGroupLeader && (
            <>
              <Route path="/members" component={Members} />
              <Route path="/submit-savings" component={SubmitSavingsPage} />
              <Route path="/loan-payments" component={LoanPaymentsPage} />
              <Route path="/loan-submission" component={LoanSubmissionPage} />
            </>
          )}
          {/* Regular members can only view - no editing access */}
          {isRegularMember && (
            <>
              <Route path="/members" component={() => <Members readOnly={true} />} />
            </>
          )}
          {/* Default route for members */}
          <Route path="/" component={MemberDashboard} />
        </>
      )}
      
      {/* FIELD MONITOR ROUTES - See only assigned groups by admin */}
      {isFieldMonitor && (
        <>
          <Route path="/field-dashboard" component={FieldDashboard} />
          <Route path="/members" component={Members} />
          <Route path="/submit-savings" component={SubmitSavingsPage} />
          <Route path="/loan-payments" component={LoanPaymentsPage} />
          <Route path="/loan-submission" component={LoanSubmissionPage} />
          <Route path="/groups" component={Groups} />
          <Route path="/groups/:groupId" component={GroupDetails} />
          <Route path="/" component={FieldDashboard} />
        </>
      )}
      
      {/* FIELD ATTENDANT ROUTES - See only groups they enrolled */}
      {isFieldAttendant && (
        <>
          <Route path="/field-dashboard" component={FieldDashboard} />
          <Route path="/members" component={Members} />
          <Route path="/submit-savings" component={SubmitSavingsPage} />
          <Route path="/loan-payments" component={LoanPaymentsPage} />
          <Route path="/loan-submission" component={LoanSubmissionPage} />
          <Route path="/groups" component={Groups} />
          <Route path="/groups/:groupId" component={GroupDetails} />
          <Route path="/" component={FieldDashboard} />
        </>
      )}
      
      {/* ADMIN ROUTES - See all groups and data */}
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
          <Route path="/" component={Dashboard} />
        </>
      )}
      
      {/* Fallback for unauthenticated */}
      <Route path="/" component={Login} />
      
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
