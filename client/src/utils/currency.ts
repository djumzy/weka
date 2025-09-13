// Currency formatting utilities for UGX
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

// Compact currency formatter for mobile/small displays
export function formatCurrencyCompact(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (numAmount >= 1000000) {
    return `UGX ${(numAmount / 1000000).toFixed(1)}M`;
  } else if (numAmount >= 1000) {
    return `UGX ${(numAmount / 1000).toFixed(1)}K`;
  } else {
    return `UGX ${numAmount.toLocaleString()}`;
  }
}

// Short currency formatter for very small spaces
export function formatCurrencyShort(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (numAmount >= 1000000) {
    return `${(numAmount / 1000000).toFixed(1)}M`;
  } else if (numAmount >= 1000) {
    return `${(numAmount / 1000).toFixed(1)}K`;
  } else {
    return numAmount.toLocaleString();
  }
}

export function formatNumber(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-UG').format(numAmount);
}