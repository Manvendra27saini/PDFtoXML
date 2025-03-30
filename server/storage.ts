import { User, Conversion, InsertUser, InsertConversion, UpdateConversion } from "@shared/schema";
import { db, tables } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import memorystore from "memorystore";
import connectPg from "connect-pg-simple";
// Import mongoose related code only if needed for backwards compatibility
// import mongoose from "mongoose";
// import { User as MongoUser, Conversion as MongoConversion, IUser, IConversion } from "./models";

const PostgresSessionStore = connectPg(session);
const MemoryStore = memorystore(session);

// Define types that are compatible with our storage interface
export type UserType = {
  id: string;
  username: string;
  email: string;
  password: string;
};

export type ConversionType = {
  id: string;
  userId: string;
  originalFilename: string;
  originalSize: number;
  convertedSize: number | null;
  status: string;
  xmlContent: string | null;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
};

export type InsertUserType = Omit<UserType, "id">;
export type InsertConversionType = Omit<ConversionType, "id" | "createdAt" | "updatedAt">;
export type UpdateConversionType = Partial<Omit<ConversionType, "id" | "userId" | "createdAt" | "updatedAt">>;

export interface IStorage {
  getUser(id: string): Promise<UserType | undefined>;
  getUserByUsername(username: string): Promise<UserType | undefined>;
  getUserByEmail(email: string): Promise<UserType | undefined>;
  createUser(user: InsertUserType): Promise<UserType>;
  
  createConversion(conversion: InsertConversionType): Promise<ConversionType>;
  getConversion(id: string): Promise<ConversionType | undefined>;
  updateConversion(id: string, data: UpdateConversionType): Promise<ConversionType | undefined>;
  getUserConversions(userId: string): Promise<ConversionType[]>;
  deleteConversion(id: string): Promise<boolean>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // Initialize PostgreSQL session store
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      tableName: 'session',
      createTableIfMissing: true,
    });
  }

  // Convert Drizzle user to storage type
  private _userToStorageType(user: User): UserType {
    return {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      password: user.password,
    };
  }

  // Convert Drizzle conversion to storage type
  private _conversionToStorageType(conversion: Conversion): ConversionType {
    return {
      id: conversion.id.toString(),
      userId: conversion.userId.toString(),
      originalFilename: conversion.originalFilename,
      originalSize: conversion.originalSize,
      convertedSize: conversion.convertedSize || null,
      status: conversion.status,
      xmlContent: conversion.xmlContent || null,
      createdAt: conversion.createdAt,
      updatedAt: conversion.createdAt, // createdAt used as updatedAt for compatibility
      metadata: conversion.metadata || null,
    };
  }

  async getUser(id: string): Promise<UserType | undefined> {
    try {
      const [user] = await db.select().from(tables.users).where(eq(tables.users.id, parseInt(id)));
      return user ? this._userToStorageType(user) : undefined;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<UserType | undefined> {
    try {
      const [user] = await db.select().from(tables.users).where(eq(tables.users.username, username));
      return user ? this._userToStorageType(user) : undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<UserType | undefined> {
    try {
      const [user] = await db.select().from(tables.users).where(eq(tables.users.email, email));
      return user ? this._userToStorageType(user) : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUserType): Promise<UserType> {
    try {
      const dbInsertUser: InsertUser = {
        username: insertUser.username,
        email: insertUser.email,
        password: insertUser.password,
      };
      
      const [user] = await db.insert(tables.users).values(dbInsertUser).returning();
      return this._userToStorageType(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async createConversion(insertConversion: InsertConversionType): Promise<ConversionType> {
    try {
      const dbInsertConversion: InsertConversion = {
        userId: parseInt(insertConversion.userId),
        originalFilename: insertConversion.originalFilename,
        originalSize: insertConversion.originalSize,
        status: insertConversion.status || 'pending',
      };
      
      const [conversion] = await db.insert(tables.conversions).values(dbInsertConversion).returning();
      return this._conversionToStorageType(conversion);
    } catch (error) {
      console.error('Error creating conversion:', error);
      throw new Error('Failed to create conversion');
    }
  }

  async getConversion(id: string): Promise<ConversionType | undefined> {
    try {
      const [conversion] = await db.select().from(tables.conversions).where(eq(tables.conversions.id, parseInt(id)));
      return conversion ? this._conversionToStorageType(conversion) : undefined;
    } catch (error) {
      console.error('Error getting conversion by ID:', error);
      return undefined;
    }
  }

  async updateConversion(id: string, data: UpdateConversionType): Promise<ConversionType | undefined> {
    try {
      const dbUpdateConversion: UpdateConversion = {};
      
      if (data.convertedSize !== undefined) dbUpdateConversion.convertedSize = data.convertedSize;
      if (data.status !== undefined) dbUpdateConversion.status = data.status;
      if (data.xmlContent !== undefined) dbUpdateConversion.xmlContent = data.xmlContent;
      if (data.metadata !== undefined) dbUpdateConversion.metadata = data.metadata;
      
      const [updatedConversion] = await db
        .update(tables.conversions)
        .set(dbUpdateConversion)
        .where(eq(tables.conversions.id, parseInt(id)))
        .returning();
        
      return updatedConversion ? this._conversionToStorageType(updatedConversion) : undefined;
    } catch (error) {
      console.error('Error updating conversion:', error);
      return undefined;
    }
  }

  async getUserConversions(userId: string): Promise<ConversionType[]> {
    try {
      const conversions = await db
        .select()
        .from(tables.conversions)
        .where(eq(tables.conversions.userId, parseInt(userId)))
        .orderBy(tables.conversions.createdAt);
      
      return conversions.map(conversion => this._conversionToStorageType(conversion));
    } catch (error) {
      console.error('Error getting user conversions:', error);
      return [];
    }
  }

  async deleteConversion(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(tables.conversions)
        .where(eq(tables.conversions.id, parseInt(id)))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting conversion:', error);
      return false;
    }
  }
}

// Memory storage implementation (for backwards compatibility)
export class MemStorage implements IStorage {
  private users: Map<string, UserType>;
  private conversions: Map<string, ConversionType>;
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

  async getUser(id: string): Promise<UserType | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<UserType | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<UserType | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUserType): Promise<UserType> {
    const id = String(this.userIdCounter++);
    const user: UserType = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createConversion(insertConversion: InsertConversionType): Promise<ConversionType> {
    const id = String(this.conversionIdCounter++);
    const currentDate = new Date();
    
    // Create a properly typed conversion object
    const conversion: ConversionType = {
      id,
      userId: insertConversion.userId,
      originalFilename: insertConversion.originalFilename,
      originalSize: insertConversion.originalSize,
      status: insertConversion.status || 'pending',
      createdAt: currentDate,
      updatedAt: currentDate,
      convertedSize: null,
      xmlContent: null,
      metadata: null,
    };
    
    this.conversions.set(id, conversion);
    return conversion;
  }

  async getConversion(id: string): Promise<ConversionType | undefined> {
    return this.conversions.get(id);
  }

  async updateConversion(id: string, data: UpdateConversionType): Promise<ConversionType | undefined> {
    const conversion = this.conversions.get(id);
    if (!conversion) return undefined;

    const updatedConversion = { 
      ...conversion, 
      ...data,
      updatedAt: new Date() 
    };
    this.conversions.set(id, updatedConversion);
    return updatedConversion;
  }

  async getUserConversions(userId: string): Promise<ConversionType[]> {
    return Array.from(this.conversions.values())
      .filter(conversion => conversion.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteConversion(id: string): Promise<boolean> {
    return this.conversions.delete(id);
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
