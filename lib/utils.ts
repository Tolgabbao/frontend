import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks if a date is within the last 30 days
 * @param date The date to check
 * @returns boolean
 */
export function isWithinLast30Days(date: Date): boolean {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
  return date >= thirtyDaysAgo;
}
