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
  
  console.log('Starting database setup...');
  
  try {
    // Create tables directly with SQL commands
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS conversions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        original_filename TEXT NOT NULL,
        original_size INTEGER NOT NULL,
        converted_size INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        xml_content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        metadata JSONB
      );
    `);

    // Create session table for PostgreSQL session store
    await db.execute(`
      CREATE TABLE IF NOT EXISTS session (
        sid varchar NOT NULL COLLATE "default",
        sess json NOT NULL,
        expire timestamp(6) NOT NULL,
        CONSTRAINT session_pkey PRIMARY KEY (sid)
      );
    `);

    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

performMigration();