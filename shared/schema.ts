import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ipAddress: text("ip_address").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  apiKey: text("api_key").notNull(),
  userId: integer("user_id").notNull(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull(),
  type: text("type").notNull(), // system, auth, error
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull(),
  type: text("type").notNull(), // cpu, memory
  threshold: integer("threshold").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  email: text("email").notNull(),
});

export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  cpuLoad: integer("cpu_load").notNull(),
  memoryUsed: integer("memory_used").notNull(),
  interfaces: jsonb("interfaces").notNull(),
  vpnStatus: jsonb("vpn_status").notNull(),
  wifiClients: jsonb("wifi_clients").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertDeviceSchema = createInsertSchema(devices).pick({
  name: true,
  ipAddress: true,
  username: true,
  password: true, 
  apiKey: true,
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  deviceId: true,
  type: true,
  threshold: true,
  email: true,
});

export type User = typeof users.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type Log = typeof logs.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Metric = typeof metrics.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type InsertAlert = z.infer<typeof insertAlertSchema>;