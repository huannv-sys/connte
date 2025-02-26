import { users, type User, type InsertUser } from "@shared/schema";
import { type Device, type Alert, type Metric, type InsertAlert, type Log, type InsertDevice } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getUsers(): Promise<User[]>;
  getLatestMetrics(): Promise<Metric>;
  executeCommand(command: string): Promise<string>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  getLogs(): Promise<Log[]>;
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
      createdAt: new Date(),
      isAdmin: insertUser.isAdmin ?? false
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getLatestMetrics(): Promise<Metric> {
    if (!this.metrics) {
      throw new Error("No metrics available");
    }
    return this.metrics;
  }

  async executeCommand(command: string): Promise<string> {
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
    try {
      // In a real implementation, this would connect to the actual Mikrotik API
      // For now we'll simulate a connection check
      if (!device.ipAddress || !device.username || !device.password || !device.apiKey) {
        throw new Error("Thiếu thông tin kết nối");
      }

      // Log successful connection
      this.logs.push({
        id: this.logs.length + 1,
        deviceId: device.id,
        type: "system",
        message: `Đã kết nối thành công với thiết bị ${device.name} (${device.ipAddress})`,
        timestamp: new Date()
      });
    } catch (error: any) {
      // Log connection failure
      this.logs.push({
        id: this.logs.length + 1,
        deviceId: device.id,
        type: "error",
        message: `Lỗi kết nối thiết bị ${device.name}: ${error.message}`,
        timestamp: new Date()
      });
      throw error;
    }
  }

  async disconnectMikrotik(deviceId: number): Promise<void> {
    try {
      const device = Array.from(this.devices.values()).find(d => d.id === deviceId);
      if (!device) {
        throw new Error("Không tìm thấy thiết bị");
      }

      this.logs.push({
        id: this.logs.length + 1,
        deviceId: deviceId,
        type: "system",
        message: `Đã ngắt kết nối thiết bị ${device.name}`,
        timestamp: new Date()
      });
    } catch (error: any) {
      this.logs.push({
        id: this.logs.length + 1,
        deviceId: deviceId,
        type: "error",
        message: `Lỗi khi ngắt kết nối: ${error.message}`,
        timestamp: new Date()
      });
      throw error;
    }
  }

  async executeMikrotikCommand(deviceId: number, command: string): Promise<string> {
    try {
      const device = Array.from(this.devices.values()).find(d => d.id === deviceId);
      if (!device) {
        throw new Error("Không tìm thấy thiết bị");
      }

      this.logs.push({
        id: this.logs.length + 1,
        deviceId: deviceId,
        type: "system",
        message: `Thực thi lệnh trên thiết bị ${device.name}: ${command}`,
        timestamp: new Date()
      });
      return `Đã thực thi lệnh thành công: ${command}`;
    } catch (error: any) {
      this.logs.push({
        id: this.logs.length + 1,
        deviceId: deviceId,
        type: "error",
        message: `Lỗi khi thực thi lệnh: ${error.message}`,
        timestamp: new Date()
      });
      throw error;
    }
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