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

  // If not authenticated, show public routes + member dashboard
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/reset" component={Reset} />
        <Route path="/login" component={Login} />
        {/* Member dashboard accessible without admin auth */}
        <Route path="/member-dashboard/:memberId" component={MemberDashboard} />
        <Route path="/member-dashboard" component={MemberDashboard} />
        <Route path="/" component={MemberDashboard} />
        <Route component={Login} />
      </Switch>
    );
  }

  // User is authenticated - determine which routes they can access
  const isAdmin = user?.role === 'admin';
  const isFieldStaff = user?.role === 'field';
  const isMember = !user?.role; // Members don't have a role field
  
  return (
    <Switch>
      {/* Reset page for clearing corrupted sessions */}
      <Route path="/reset" component={Reset} />
      
      {/* Unified login page */}
      <Route path="/login" component={Login} />
      
      {/* Member-specific routes - accessible to all */}
      <Route path="/member-dashboard/:memberId" component={MemberDashboard} />
      <Route path="/member-dashboard" component={MemberDashboard} />
      
      {/* Field staff dashboard */}
      {isFieldStaff && (
        <Route path="/field-dashboard" component={FieldDashboard} />
      )}
      
      {/* Routes accessible to admins and some members */}
      <Route path="/" component={isAdmin ? Dashboard : (isMember ? MemberDashboard : FieldDashboard)} />
      <Route path="/members" component={Members} />
      <Route path="/submit-savings" component={SubmitSavingsPage} />
      <Route path="/loan-payments" component={LoanPaymentsPage} />
      <Route path="/loan-submission" component={LoanSubmissionPage} />
      
      {/* Admin-only routes */}
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
