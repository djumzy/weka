import { Transaction } from "@shared/schema";
import { format } from "date-fns";

interface TransactionRowProps {
  transaction: Transaction;
  memberName: string;
  groupName: string;
}

const transactionTypeStyles = {
  deposit: "bg-green-100 text-green-800",
  withdrawal: "bg-red-100 text-red-800",
  loan_payment: "bg-blue-100 text-blue-800",
  loan_disbursement: "bg-amber-100 text-amber-800",
};

const transactionTypeLabels = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  loan_payment: "Loan Payment",
  loan_disbursement: "Loan Disbursed",
};

export function TransactionRow({ transaction, memberName, groupName }: TransactionRowProps) {
  const typeStyle = transactionTypeStyles[transaction.type as keyof typeof transactionTypeStyles] || "bg-gray-100 text-gray-800";
  const typeLabel = transactionTypeLabels[transaction.type as keyof typeof transactionTypeLabels] || transaction.type;

  return (
    <tr 
      className="border-b border-border hover:bg-muted/25" 
      data-testid={`transaction-row-${transaction.id}`}
    >
      <td className="p-4 text-sm text-foreground">
        {format(new Date(transaction.transactionDate), "MMM dd, yyyy")}
      </td>
      <td className="p-4 text-sm text-foreground" data-testid={`member-name-${transaction.id}`}>
        {memberName}
      </td>
      <td className="p-4">
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyle}`}
          data-testid={`transaction-type-${transaction.id}`}
        >
          {typeLabel}
        </span>
      </td>
      <td className="p-4 text-sm font-medium text-foreground" data-testid={`amount-${transaction.id}`}>
        ${parseFloat(transaction.amount).toFixed(2)}
      </td>
      <td className="p-4 text-sm text-muted-foreground" data-testid={`group-name-${transaction.id}`}>
        {groupName}
      </td>
    </tr>
  );
}
