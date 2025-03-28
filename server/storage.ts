import { users, type User, type InsertUser, conversions, type Conversion, type InsertConversion, type UpdateConversion } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, desc } from 'drizzle-orm';
import postgres from 'postgres';
import connectPg from "connect-pg-simple";

// PostgreSQL session store
const PostgresSessionStore = connectPg(session);

// Create a connection pool
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createConversion(conversion: InsertConversion): Promise<Conversion>;
  getConversion(id: number): Promise<Conversion | undefined>;
  updateConversion(id: number, data: UpdateConversion): Promise<Conversion | undefined>;
  getUserConversions(userId: number): Promise<Conversion[]>;
  deleteConversion(id: number): Promise<boolean>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // Initialize PostgreSQL session store
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL!,
      },
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createConversion(insertConversion: InsertConversion): Promise<Conversion> {
    const result = await db.insert(conversions).values(insertConversion).returning();
    return result[0];
  }

  async getConversion(id: number): Promise<Conversion | undefined> {
    const result = await db.select().from(conversions).where(eq(conversions.id, id)).limit(1);
    return result[0];
  }

  async updateConversion(id: number, data: UpdateConversion): Promise<Conversion | undefined> {
    const result = await db.update(conversions)
      .set(data)
      .where(eq(conversions.id, id))
      .returning();
      
    return result[0];
  }

  async getUserConversions(userId: number): Promise<Conversion[]> {
    return db.select()
      .from(conversions)
      .where(eq(conversions.userId, userId))
      .orderBy(desc(conversions.createdAt));
  }

  async deleteConversion(id: number): Promise<boolean> {
    const result = await db.delete(conversions)
      .where(eq(conversions.id, id))
      .returning();
      
    return result.length > 0;
  }
}

// Memory storage implementation (for backwards compatibility)
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private conversions: Map<number, Conversion>;
  public sessionStore: session.Store;
  private userIdCounter: number;
  private conversionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.conversions = new Map();
    this.userIdCounter = 1;
    this.conversionIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createConversion(insertConversion: InsertConversion): Promise<Conversion> {
    const id = this.conversionIdCounter++;
    const currentDate = new Date();
    
    // Create a properly typed conversion object
    const conversion = {
      id,
      userId: insertConversion.userId,
      originalFilename: insertConversion.originalFilename,
      originalSize: insertConversion.originalSize,
      status: insertConversion.status || 'pending',
      createdAt: currentDate,
      convertedSize: null as number | null,
      xmlContent: null as string | null,
      metadata: null as unknown,
    };
    
    this.conversions.set(id, conversion);
    return conversion;
  }

  async getConversion(id: number): Promise<Conversion | undefined> {
    return this.conversions.get(id);
  }

  async updateConversion(id: number, data: UpdateConversion): Promise<Conversion | undefined> {
    const conversion = this.conversions.get(id);
    if (!conversion) return undefined;

    const updatedConversion = { ...conversion, ...data };
    this.conversions.set(id, updatedConversion);
    return updatedConversion;
  }

  async getUserConversions(userId: number): Promise<Conversion[]> {
    return Array.from(this.conversions.values())
      .filter(conversion => conversion.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteConversion(id: number): Promise<boolean> {
    return this.conversions.delete(id);
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
