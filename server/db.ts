import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, conversions } from '@shared/schema';

// Use the DATABASE_URL environment variable
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres client
const queryClient = postgres(DATABASE_URL, { max: 1 });

// Create drizzle client
export const db = drizzle(queryClient, { schema: { users, conversions } });

console.log('Connected to PostgreSQL database');

// Export the tables for convenience
export const tables = {
  users,
  conversions
};
