import { User, IUser, Conversion, IConversion } from "./models";
import mongoose from "mongoose";
import session from "express-session";
import memorystore from "memorystore";
import { default as connectMongo } from 'connect-mongo';
const MongoStore = connectMongo;
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
    // Initialize MongoDB session store
    this.sessionStore = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/pdf-converter',
      collectionName: 'sessions',
      ttl: 14 * 24 * 60 * 60, // 14 days in seconds
    });
  }

  // Convert Mongoose document to storage type
  private _userToStorageType(user: IUser): UserType {
    return {
      id: user._id ? user._id.toString() : '',
      username: user.username,
      email: user.email,
      password: user.password,
    };
  }

  // Convert Mongoose document to storage type
  private _conversionToStorageType(conversion: IConversion): ConversionType {
    return {
      id: conversion._id ? conversion._id.toString() : '',
      userId: conversion.userId ? conversion.userId.toString() : '',
      originalFilename: conversion.originalFilename,
      originalSize: conversion.originalSize,
      convertedSize: conversion.convertedSize,
      status: conversion.status,
      xmlContent: conversion.xmlContent,
      createdAt: conversion.createdAt,
      updatedAt: conversion.updatedAt,
      metadata: conversion.metadata,
    };
  }

  async getUser(id: string): Promise<UserType | undefined> {
    try {
      const user = await User.findById(id);
      return user ? this._userToStorageType(user) : undefined;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ username });
      return user ? this._userToStorageType(user) : undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ email });
      return user ? this._userToStorageType(user) : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUserType): Promise<UserType> {
    try {
      const newUser = new User(insertUser);
      const savedUser = await newUser.save();
      return this._userToStorageType(savedUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async createConversion(insertConversion: InsertConversionType): Promise<ConversionType> {
    try {
      const newConversion = new Conversion({
        ...insertConversion,
        userId: new mongoose.Types.ObjectId(insertConversion.userId),
      });
      const savedConversion = await newConversion.save();
      return this._conversionToStorageType(savedConversion);
    } catch (error) {
      console.error('Error creating conversion:', error);
      throw new Error('Failed to create conversion');
    }
  }

  async getConversion(id: string): Promise<ConversionType | undefined> {
    try {
      const conversion = await Conversion.findById(id);
      return conversion ? this._conversionToStorageType(conversion) : undefined;
    } catch (error) {
      console.error('Error getting conversion by ID:', error);
      return undefined;
    }
  }

  async updateConversion(id: string, data: UpdateConversionType): Promise<ConversionType | undefined> {
    try {
      const updatedConversion = await Conversion.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      );
      return updatedConversion ? this._conversionToStorageType(updatedConversion) : undefined;
    } catch (error) {
      console.error('Error updating conversion:', error);
      return undefined;
    }
  }

  async getUserConversions(userId: string): Promise<ConversionType[]> {
    try {
      const conversions = await Conversion.find({ 
        userId: new mongoose.Types.ObjectId(userId) 
      }).sort({ createdAt: -1 });
      
      return conversions.map(conversion => this._conversionToStorageType(conversion));
    } catch (error) {
      console.error('Error getting user conversions:', error);
      return [];
    }
  }

  async deleteConversion(id: string): Promise<boolean> {
    try {
      const result = await Conversion.findByIdAndDelete(id);
      return !!result;
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
