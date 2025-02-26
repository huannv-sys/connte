import { users, type User, type InsertUser } from "@shared/schema";
import { type Device, type Alert, type Metric, type InsertAlert } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getLatestMetrics(): Promise<Metric>;
  executeCommand(command: string): Promise<string>;
  createAlert(alert: InsertAlert): Promise<Alert>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private metrics: Metric | null = null;
  private updateInterval: NodeJS.Timeout;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    // Simulate metrics updates every second
    this.updateInterval = setInterval(() => {
      this.metrics = {
        id: 1,
        deviceId: 1,
        timestamp: new Date(),
        cpuLoad: Math.floor(Math.random() * 100),
        memoryUsed: Math.floor(Math.random() * 100),
        interfaces: {
          ether1: "up",
          "vlan100": "up",
          "bridge1": "up"
        },
        vpnStatus: {
          "vpn0": "connected",
          "l2tp-out1": "disconnected"
        },
        wifiClients: [
          { mac: "00:11:22:33:44:55", hostname: "device1", signal: "-65dBm" },
          { mac: "AA:BB:CC:DD:EE:FF", hostname: "device2", signal: "-72dBm" }
        ]
      };
    }, 1000);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getLatestMetrics(): Promise<Metric> {
    if (!this.metrics) {
      throw new Error("No metrics available");
    }
    return this.metrics;
  }

  async executeCommand(command: string): Promise<string> {
    // Simulate command execution
    return `Executed command: ${command}\nOutput: Command simulation successful`;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    // Simulate alert creation
    return {
      id: 1,
      ...alert,
      enabled: true
    };
  }
}

export const storage = new MemStorage();