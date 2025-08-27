import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Groups from "@/pages/Groups";
import GroupDetails from "@/pages/GroupDetails";
import Members from "@/pages/Members";
import MemberLogin from "@/pages/MemberLogin";
import MemberDashboard from "@/pages/MemberDashboard";
import Transactions from "@/pages/Transactions";
import Loans from "@/pages/Loans";
import LoanCalculator from "@/pages/LoanCalculator";
import Meetings from "@/pages/Meetings";
import UserManagement from "@/pages/UserManagement";
import Reports from "@/pages/Reports";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Member login routes - accessible without authentication */}
      <Route path="/member-login" component={MemberLogin} />
      <Route path="/member-dashboard/:memberId" component={MemberDashboard} />
      
      {isLoading || !isAuthenticated ? (
        <Route component={Login} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/groups" component={Groups} />
          <Route path="/groups/:groupId" component={GroupDetails} />
          <Route path="/members" component={Members} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/loans" component={Loans} />
          <Route path="/loan-calculator" component={LoanCalculator} />
          <Route path="/meetings" component={Meetings} />
          <Route path="/user-management" component={UserManagement} />
          <Route path="/reports" component={Reports} />
        </>
      )}
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
