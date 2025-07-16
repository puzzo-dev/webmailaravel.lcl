export function formatNumber(num) {
  if (typeof num !== 'number') return num;
  return num.toLocaleString();
}

export function formatCurrency(num, currency = 'USD') {
  if (typeof num !== 'number') return num;
  return num.toLocaleString(undefined, { style: 'currency', currency });
} 