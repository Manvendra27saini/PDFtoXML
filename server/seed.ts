import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  // Check for DATABASE_URL environment variable
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Create a specific client for seeding
  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);
  
  console.log('Starting database seeding...');
  
  try {
    // Check if the demo user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, 'demo@example.com'));

    if (existingUser.length === 0) {
      // Insert a demo user
      const hashedPassword = await hashPassword('password123');
      
      await db.insert(users).values({
        username: 'demo',
        email: 'demo@example.com',
        password: hashedPassword
      });
      
      console.log('Demo user created successfully!');
    } else {
      console.log('Demo user already exists, skipping creation');
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedDatabase();