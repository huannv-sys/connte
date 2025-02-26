import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // router, switch, wireless, etc.
  model: text("model").notNull(), // RB951G-2HnD, CRS112-8G-4S, etc.
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
  isAdmin: true,
});

export const insertDeviceSchema = createInsertSchema(devices).pick({
  name: true,
  type: true,
  model: true,
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

export const deviceTypes = [
  { value: "router", label: "Router" },
  { value: "switch", label: "Switch" },
  { value: "wireless", label: "Wireless" },
  { value: "bridge", label: "Bridge" },
] as const;

export const deviceModels = {
  router: [
    { value: "RB951G-2HnD", label: "hAP Series (RB951G-2HnD)" },
    { value: "RB2011UiAS-2HnD", label: "RB2011 Series" },
    { value: "CCR1009-7G-1C", label: "Cloud Core Router" },
  ],
  switch: [
    { value: "CRS112-8G-4S", label: "Cloud Router Switch (CRS112)" },
    { value: "CSS610-8G-2S+", label: "Cloud Smart Switch" },
  ],
  wireless: [
    { value: "wAP-AC", label: "wAP AC" },
    { value: "cAP-AC", label: "cAP AC" },
  ],
  bridge: [
    { value: "RBLHG-5nD", label: "LHG Series" },
    { value: "RBLDF-5nD", label: "LDF Series" },
  ],
} as const;


export type User = typeof users.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type Log = typeof logs.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Metric = typeof metrics.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type InsertAlert = z.infer<typeof insertAlertSchema>;