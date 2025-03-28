import { users, type User, type InsertUser, conversions, type Conversion, type InsertConversion, type UpdateConversion } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

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

export const storage = new MemStorage();
