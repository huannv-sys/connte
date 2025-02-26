import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { sendAlert } from "./email";
import { z } from "zod";
import { insertAlertSchema, insertDeviceSchema } from "@shared/schema";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup authentication routes
  setupAuth(app);

  // WebSocket server for real-time metrics
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const metrics = storage.getLatestMetrics();
        ws.send(JSON.stringify(metrics));
      }
    }, 1000);

    ws.on("close", () => clearInterval(interval));
  });

  // REST API routes
  app.get("/api/metrics", async (_req, res) => {
    const metrics = await storage.getLatestMetrics();
    res.json(metrics);
  });

  app.post("/api/terminal", async (req, res) => {
    const { command } = req.body;
    const output = await storage.executeCommand(command);
    res.send(output);
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const alert = insertAlertSchema.parse(req.body);
      await storage.createAlert(alert);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Invalid alert configuration" });
    }
  });

  // System logs endpoint
  app.get("/api/logs", async (_req, res) => {
    const logs = await storage.getLogs();
    res.json(logs);
  });

  // Mikrotik device management endpoints
  app.post("/api/devices", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const deviceData = insertDeviceSchema.parse(req.body);
      const device = await storage.createDevice({
        ...deviceData,
        userId: req.user.id
      });

      // Attempt to connect to the device after creating it
      await storage.connectMikrotik(device);
      res.json(device);
    } catch (error) {
      res.status(400).json({ error: "Lỗi khi thêm thiết bị" });
    }
  });

  app.get("/api/devices", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const devices = await storage.getDevices(req.user.id);
    res.json(devices);
  });

  app.post("/api/devices/:id/disconnect", async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      await storage.disconnectMikrotik(deviceId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to disconnect device" });
    }
  });

  app.post("/api/devices/:id/command", async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const { command } = req.body;
      const output = await storage.executeMikrotikCommand(deviceId, command);
      res.json({ output });
    } catch (error) {
      res.status(500).json({ error: "Failed to execute command" });
    }
  });

  return httpServer;
}