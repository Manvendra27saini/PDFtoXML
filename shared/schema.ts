import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

export const conversions = pgTable("conversions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  originalFilename: text("original_filename").notNull(),
  originalSize: integer("original_size").notNull(),
  convertedSize: integer("converted_size"),
  status: text("status").notNull().default("pending"),
  xmlContent: text("xml_content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertConversionSchema = createInsertSchema(conversions).pick({
  userId: true,
  originalFilename: true,
  originalSize: true,
  status: true,
});

export const updateConversionSchema = createInsertSchema(conversions).pick({
  convertedSize: true,
  status: true,
  xmlContent: true,
  metadata: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertConversion = z.infer<typeof insertConversionSchema>;
export type UpdateConversion = z.infer<typeof updateConversionSchema>;
export type Conversion = typeof conversions.$inferSelect;
