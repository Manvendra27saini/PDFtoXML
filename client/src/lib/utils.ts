import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string or timestamp into a human-readable format
 * @param date Date string or timestamp
 * @param formatString Optional format string (default: 'PPP')
 * @returns Formatted date string
 */
export function formatDate(date: string | number | Date, formatString: string = 'PPP'): string {
  return format(new Date(date), formatString)
}

/**
 * Format a file size in bytes to a human-readable string (KB, MB, GB)
 * @param bytes File size in bytes
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}
