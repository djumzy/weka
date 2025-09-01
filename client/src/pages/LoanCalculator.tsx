import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Calculator, DollarSign, Percent, Calendar } from "lucide-react";

interface LoanCalculation {
  monthlyPayment: number;
  totalInterest: number;
  totalAmount: number;
  paymentSchedule: {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }[];
}

export default function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [interestRate, setInterestRate] = useState<string>("");
  const [termMonths, setTermMonths] = useState<string>("");
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);

  const calculateLoan = () => {
    const principal = parseFloat(loanAmount);
    const rate = parseFloat(interestRate) / 100 / 12; // Monthly interest rate
    const months = parseInt(termMonths);

    if (!principal || !rate || !months) {
      return;
    }

    // Calculate monthly payment using loan formula
    const monthlyPayment = (principal * rate * Math.pow(1 + rate, months)) / 
                          (Math.pow(1 + rate, months) - 1);

    // Calculate total amount and interest
    const totalAmount = monthlyPayment * months;
    const totalInterest = totalAmount - principal;

    // Generate payment schedule
    let balance = principal;
    const paymentSchedule = [];

    for (let month = 1; month <= months; month++) {
      const interestPayment = balance * rate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      paymentSchedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
      });
    }

    setCalculation({
      monthlyPayment,
      totalInterest,
      totalAmount,
      paymentSchedule,
    });
  };

  const resetCalculator = () => {
    setLoanAmount("");
    setInterestRate("");
    setTermMonths("");
    setCalculation(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Loan Calculator</h1>
            <p className="text-muted-foreground">
              Calculate loan repayments, interest, and generate payment schedules
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5" />
                  <span>Loan Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="loanAmount">Loan Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="loanAmount"
                      type="number"
                      placeholder="Enter loan amount"
                      className="pl-10"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      data-testid="input-loan-amount"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="interestRate"
                      type="number"
                      placeholder="Enter interest rate"
                      className="pl-10"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      data-testid="input-interest-rate"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termMonths">Loan Term (Months)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="termMonths"
                      type="number"
                      placeholder="Enter loan term in months"
                      className="pl-10"
                      value={termMonths}
                      onChange={(e) => setTermMonths(e.target.value)}
                      data-testid="input-term-months"
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button onClick={calculateLoan} data-testid="button-calculate">
                    Calculate Loan
                  </Button>
                  <Button variant="outline" onClick={resetCalculator} data-testid="button-reset">
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Summary */}
            {calculation && (
              <Card>
                <CardHeader>
                  <CardTitle>Loan Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Monthly Payment</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(calculation.monthlyPayment)}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(calculation.totalAmount)}
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Interest</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(calculation.totalInterest)}
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Loan Amount</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(parseFloat(loanAmount))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment Schedule */}
          {calculation && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Payment Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead>Remaining Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculation.paymentSchedule.map((payment) => (
                        <TableRow key={payment.month}>
                          <TableCell className="font-medium">{payment.month}</TableCell>
                          <TableCell>{formatCurrency(payment.payment)}</TableCell>
                          <TableCell>{formatCurrency(payment.principal)}</TableCell>
                          <TableCell>{formatCurrency(payment.interest)}</TableCell>
                          <TableCell>{formatCurrency(payment.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}