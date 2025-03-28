import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Check for DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create a specific client for migrations
const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });

async function performMigration() {
  const db = drizzle(migrationClient);
  
  console.log('Starting database migrations...');
  
  try {
    await migrate(db, { migrationsFolder: 'migrations' });
    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

performMigration();