/**
 * Formats a number to Indian Rupee (INR) currency representation
 * @param {number} amount
 * @param {boolean} includeSign - if true, prefixes '+' or '-' explicitly for credits/debits
 * @returns {string} e.g. ₹2,450 or -₹2,000
 */
export function formatCurrency(amount, includeSign = false) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formattedNumber = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(absAmount);

  if (isNegative) {
    return `-₹${formattedNumber}`;
  }

  if (includeSign && amount > 0) {
    return `+₹${formattedNumber}`;
  }

  return `₹${formattedNumber}`;
}
