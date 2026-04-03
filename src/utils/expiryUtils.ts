// ========================
// File: /src/utils/expiryUtils.ts
// ========================

/**
 * Calculate the number of days left until the expiry date.
 * Returns negative numbers if the date is in the past.
 */
export function calculateDaysLeft(expiryDate: string | number | Date): number {
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return 0; // Invalid date fallback

  const diff = expiry.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Determine the status color based on days left.
 * Accepts a number or a string (will convert to number safely)
 */
export function getStatusColor(daysLeft: number | string): 'expired' | 'near-expiry' | 'good' {
  const days = typeof daysLeft === 'string' ? parseInt(daysLeft, 10) : daysLeft;
  if (isNaN(days)) return 'expired'; // fallback if not a number

  if (days < 0) return 'expired';
  if (days <= 30) return 'near-expiry';
  return 'good';
}

/**
 * Format expiry info into a user-friendly string.
 */
export function formatExpiryInfo(expiryDate: string | number | Date): string {
  const daysLeft = calculateDaysLeft(expiryDate);

  if (daysLeft < 0) return `Expired ${Math.abs(daysLeft)} day(s) ago`;
  if (daysLeft === 0) return 'Expires today';
  if (daysLeft === 1) return 'Expires in 1 day';
  return `Expires in ${daysLeft} days`;
}

/**
 * Utility to combine daysLeft and status color for easier use in UI.
 */
export function getExpiryStatus(expiryDate?: string | number | Date) {
  if (!expiryDate) return { daysLeft: null, statusColor: null, info: 'No expiry date' };
  const daysLeft = calculateDaysLeft(expiryDate);
  const statusColor = getStatusColor(daysLeft);
  const info = formatExpiryInfo(expiryDate);
  return { daysLeft, statusColor, info };
}

/**
 * Calculate an automatic discount based on how close the product is to expiry.
 * Returns a percentage discount (0-100).
 */
export function calculateAutoDiscount(expiryDate: string | number | Date): number {
  const daysLeft = calculateDaysLeft(expiryDate);

  if (daysLeft <= 0) return 50;        // Expired → 50% discount
  if (daysLeft <= 30) return 20;       // Near expiry → 20% discount
  if (daysLeft <= 90) return 10;       // Less than 3 months → 10% discount
  return 0;                             // Otherwise, no discount
}