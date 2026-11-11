/**
 * Utility helpers
 */

export function formatCurrencyPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
