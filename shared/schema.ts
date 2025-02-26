import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ipAddress: text("ip_address").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
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

export const insertDeviceSchema = createInsertSchema(devices);
export const insertAlertSchema = createInsertSchema(alerts).pick({
  deviceId: true,
  type: true,
  threshold: true,
  email: true,
});

export type Device = typeof devices.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Metric = typeof metrics.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
