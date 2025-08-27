import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, FileText, BarChart3 } from "lucide-react";
import wekaLogo from "@assets/WEKA_1756289094166.png";
import dreamersLogo from "@assets/updated logo the dreamers_1756291084041.png";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <img 
                src={wekaLogo} 
                alt="WEKA Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">WEKA</h1>
                <p className="text-sm text-muted-foreground">Wealth, Equity, Knowledge, and Accessibility</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <img 
                src={dreamersLogo} 
                alt="The Dreamers Logo" 
                className="w-8 h-8 object-contain"
              />
              <Button onClick={handleLogin} data-testid="button-login">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Save For Future System with WEKA
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Empowering communities through Wealth, Equity, Knowledge, and Accessibility. 
            Comprehensive platform for managing VSLA groups with role-based access control.
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            data-testid="button-get-started"
            className="text-lg px-8 py-3"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              WEKA Features for Save For Future
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From member registration to loan processing, our platform handles all aspects of VSLA management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card data-testid="feature-group-management">
              <CardHeader>
                <Users className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Group Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create and manage multiple VSLA groups with customizable settings and member limits.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="feature-member-tracking">
              <CardHeader>
                <DollarSign className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Member & Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track member profiles, savings balances, and contribution history with detailed records.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="feature-loan-processing">
              <CardHeader>
                <FileText className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Loan Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Handle loan applications, approvals, disbursements, and repayments with automated calculations.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="feature-reporting">
              <CardHeader>
                <BarChart3 className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Reports & Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Generate comprehensive financial reports and track group performance metrics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src={wekaLogo} 
                alt="WEKA Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-lg font-semibold text-foreground">WEKA</span>
              <img 
                src={dreamersLogo} 
                alt="The Dreamers Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <p className="text-muted-foreground">
              Empowering communities through organized savings and lending.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
