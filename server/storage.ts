import { users, type User, type InsertUser } from "@shared/schema";
import { type Device, type Alert, type Metric, type InsertAlert, type Log, type InsertDevice } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getLatestMetrics(): Promise<Metric>;
  executeCommand(command: string): Promise<string>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  getLogs(): Promise<Log[]>;
  // Mikrotik API methods
  connectMikrotik(device: Device): Promise<void>;
  disconnectMikrotik(deviceId: number): Promise<void>;
  executeMikrotikCommand(deviceId: number, command: string): Promise<string>;
  getDevices(userId: number): Promise<Device[]>;
  createDevice(device: InsertDevice & { userId: number }): Promise<Device>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private metrics: Metric | null = null;
  private logs: Log[] = [];
  private updateInterval: NodeJS.Timeout;
  currentId: number;
  private devices: Map<number, Device>;

  constructor() {
    this.users = new Map();
    this.devices = new Map();
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

      // Add sample system log
      this.logs.push({
        id: this.logs.length + 1,
        deviceId: 1,
        type: "system",
        message: `System metrics updated - CPU: ${this.metrics.cpuLoad}%, Memory: ${this.metrics.memoryUsed}%`,
        timestamp: new Date()
      });
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
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date() 
    };
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
    // Log the command execution
    this.logs.push({
      id: this.logs.length + 1,
      deviceId: 1,
      type: "system",
      message: `Command executed: ${command}`,
      timestamp: new Date()
    });
    return `Executed command: ${command}\nOutput: Command simulation successful`;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    // Log alert creation
    this.logs.push({
      id: this.logs.length + 1,
      deviceId: alert.deviceId,
      type: "system",
      message: `Alert created for ${alert.type} with threshold ${alert.threshold}%`,
      timestamp: new Date()
    });
    return {
      id: 1,
      ...alert,
      enabled: true
    };
  }

  async getLogs(): Promise<Log[]> {
    return this.logs;
  }

  async connectMikrotik(device: Device): Promise<void> {
    // Simulate Mikrotik connection
    this.logs.push({
      id: this.logs.length + 1,
      deviceId: device.id,
      type: "system",
      message: `Connected to Mikrotik device ${device.name} (${device.ipAddress})`,
      timestamp: new Date()
    });
  }

  async disconnectMikrotik(deviceId: number): Promise<void> {
    this.logs.push({
      id: this.logs.length + 1,
      deviceId: deviceId,
      type: "system",
      message: "Disconnected from Mikrotik device",
      timestamp: new Date()
    });
  }

  async executeMikrotikCommand(deviceId: number, command: string): Promise<string> {
    this.logs.push({
      id: this.logs.length + 1,
      deviceId: deviceId,
      type: "system",
      message: `Executed Mikrotik command: ${command}`,
      timestamp: new Date()
    });
    return `Simulated Mikrotik command execution: ${command}`;
  }

  async getDevices(userId: number): Promise<Device[]> {
    return Array.from(this.devices.values()).filter(
      (device) => device.userId === userId
    );
  }

  async createDevice(device: InsertDevice & { userId: number }): Promise<Device> {
    const id = this.currentId++;
    const newDevice: Device = { ...device, id };
    this.devices.set(id, newDevice);
    return newDevice;
  }
}

export const storage = new MemStorage();