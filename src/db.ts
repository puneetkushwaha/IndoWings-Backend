import fs from 'fs';
import path from 'path';

let DATA_DIR = path.resolve(process.cwd(), 'data');
if (fs.existsSync(path.resolve(process.cwd(), 'server'))) {
  DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(collection: string) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function readJSON<T>(collection: string, defaultData: T): T {
  const file = getFilePath(collection);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${collection}.json:`, err);
    return defaultData;
  }
}

function writeJSON<T>(collection: string, data: T): void {
  const file = getFilePath(collection);
  const tempFile = `${file}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, file);
}

// Initial Fleet seed if empty
const defaultDrones = Array.from({ length: 50 }, (_, i) => {
  const statuses = ['idle', 'en-route', 'charging', 'on-hold', 'returning'];
  const models = ['Cyberone Pro', 'Cyberone Max', 'IndoHawk Alpha', 'StealthPro VTOL', 'AgriWing X'];
  const cities = ['Noida Sector 62 Plant', 'Connaught Place Hub', 'Gurugram Defense Depot', 'Faridabad Logistics Hub', 'Greater Noida Assembly'];
  const qcStatuses = ['passed', 'pending', 'inspection_required'];
  return {
    id: `INW-UAV-${String(i + 1).padStart(3, '0')}`,
    serial_number: `IW-${models[i % 5].substring(0, 3).toUpperCase()}-2026-${String(i + 101)}`,
    model: models[i % 5],
    status: statuses[i % 5],
    qc_status: i % 3 === 0 ? 'passed' : qcStatuses[i % 3],
    qc_notes: i % 3 === 0 ? 'DGCA Flight Certification & Avionics Passed' : 'Pre-dispatch calibration pending',
    qc_certified_by: i % 3 === 0 ? 'Fleet Eng. Rajesh Kumar' : null,
    battery: Math.floor(Math.random() * 40) + 60,
    speed_kmh: Math.floor(Math.random() * 40) + 40,
    altitude_m: Math.floor(Math.random() * 80) + 60,
    current_city: cities[i % 5],
    lat: 28.5355 + (Math.random() - 0.5) * 0.2,
    lng: 77.3910 + (Math.random() - 0.5) * 0.2,
    deliveries_today: Math.floor(Math.random() * 4),
    assigned_order: null as string | null,
    assigned_client: null as string | null,
  };
});

// Seed provisioned users for the 4 core roles
const defaultUsers = [
  {
    id: 'ADMIN-001',
    name: process.env.ADMIN_NAME || 'Puneet Kushwaha',
    email: process.env.ADMIN_EMAIL || 'puneet@indowings.com',
    phone: '+919999999999',
    role: 'admin',
    station: 'IndoWings HQ & Plant, Noida',
    organization: 'IndoWings Corporate',
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'FLEET-001',
    name: 'Rajesh Sharma',
    email: 'fleet@indowings.com',
    phone: '+919876543201',
    role: 'fleet_manager',
    station: 'Noida Assembly & QC Plant',
    organization: 'IndoWings Fleet Operations',
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'DISP-001',
    name: 'Vikram Malhotra',
    email: 'dispatch@indowings.com',
    phone: '+919876543202',
    role: 'dispatcher',
    station: 'Delhi-NCR Logistics Hub',
    organization: 'IndoWings Dispatch Command',
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'SUPP-001',
    name: 'IndoFleet Support Desk',
    email: 'connect@indowings.com',
    phone: '+917669478937',
    role: 'support',
    station: 'Central Grievance & Technical Support Desk',
    organization: 'IndoFleet Support Operations',
    status: 'active',
    created_at: new Date().toISOString()
  }
];

// Live customer feedback store (no mock/dummy seed data)
const defaultFeedbacks: any[] = [];

export const fileDB = {
  // USERS
  getUsers() {
    return readJSON<any[]>('users', defaultUsers);
  },
  saveUsers(users: any[]) {
    writeJSON('users', users);
  },
  findUserByEmail(email: string) {
    const users = this.getUsers();
    return users.find(u => u.email?.toLowerCase() === email?.toLowerCase());
  },
  findUserByPhone(phone: string) {
    const users = this.getUsers();
    const clean = phone.replace(/[^0-9]/g, '');
    return users.find(u => u.phone && u.phone.replace(/[^0-9]/g, '').endsWith(clean.slice(-10)));
  },
  addUser(user: any) {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
    return user;
  },
  updateUser(id: string, updates: any) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id || u.email?.toLowerCase() === id.toLowerCase());
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    this.saveUsers(users);
    return users[idx];
  },
  deleteUser(id: string) {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== id && u.email?.toLowerCase() !== id.toLowerCase());
    this.saveUsers(filtered);
    return true;
  },

  // ORDERS
  getOrders() {
    return readJSON<any[]>('orders', []);
  },
  saveOrders(orders: any[]) {
    writeJSON('orders', orders);
  },
  findOrderById(id: string) {
    if (!id) return undefined;
    const orders = this.getOrders();
    const cleanId = id.toLowerCase().trim();
    const noHyphen = cleanId.replace(/-/g, '');
    return orders.find(o => {
      const oId = (o.id || '').toLowerCase();
      return oId === cleanId || oId.replace(/-/g, '') === noHyphen;
    });
  },
  addOrder(order: any) {
    const orders = this.getOrders();
    orders.unshift(order);
    this.saveOrders(orders);
    return order;
  },
  updateOrder(id: string, updates: any) {
    if (!id) return null;
    const orders = this.getOrders();
    const cleanId = id.toLowerCase().trim();
    const noHyphen = cleanId.replace(/-/g, '');
    const idx = orders.findIndex(o => {
      const oId = (o.id || '').toLowerCase();
      return oId === cleanId || oId.replace(/-/g, '') === noHyphen;
    });
    if (idx === -1) return null;
    orders[idx] = { ...orders[idx], ...updates };
    this.saveOrders(orders);
    return orders[idx];
  },

  // FLEET
  getFleet() {
    return readJSON<any[]>('drones', defaultDrones);
  },
  saveFleet(fleet: any[]) {
    writeJSON('drones', fleet);
  },
  updateDrone(id: string, updates: any) {
    const fleet = this.getFleet();
    const idx = fleet.findIndex(d => d.id === id);
    if (idx === -1) return null;
    fleet[idx] = { ...fleet[idx], ...updates };
    this.saveFleet(fleet);
    return fleet[idx];
  },
  addDrone(drone: any) {
    const fleet = this.getFleet();
    fleet.unshift(drone);
    this.saveFleet(fleet);
    return drone;
  },
  addDronesBatch(drones: any[]) {
    const fleet = this.getFleet();
    const updated = [...drones, ...fleet];
    this.saveFleet(updated);
    return drones;
  },

  // OTP STORE
  getOTPs() {
    return readJSON<Record<string, { otp: string; expiresAt: number; name?: string; email?: string }>>('otps', {});
  },
  normalizeOtpKey(identifier: string) {
    if (identifier.includes('@')) {
      return identifier.toLowerCase().trim();
    }
    return identifier.replace(/[^0-9]/g, '').slice(-10);
  },
  saveOTP(identifier: string, otp: string, meta?: { name?: string; email?: string; phone?: string }) {
    const otps = this.getOTPs();
    const key = this.normalizeOtpKey(identifier);
    otps[key] = {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      ...meta
    };
    writeJSON('otps', otps);
  },
  verifyOTP(identifier: string, otp: string) {
    const otps = this.getOTPs();
    const key = this.normalizeOtpKey(identifier);
    const entry = otps[key];
    if (!entry) return { valid: false, reason: `No verification code requested for this ${identifier.includes('@') ? 'email address' : 'phone number'}` };
    if (Date.now() > entry.expiresAt) {
      delete otps[key];
      writeJSON('otps', otps);
      return { valid: false, reason: 'Verification code has expired. Please request a new one.' };
    }
    if (entry.otp !== otp.trim()) {
      return { valid: false, reason: 'Invalid verification code. Please check and try again.' };
    }
    // Delete once verified
    delete otps[key];
    writeJSON('otps', otps);
    return { valid: true, meta: entry };
  },

  // EXPERT CONSULTATION & SUPPORT REQUESTS
  getExpertRequests() {
    return readJSON<any[]>('expert_requests', []);
  },
  saveExpertRequest(request: any) {
    const list = this.getExpertRequests();
    list.unshift(request);
    writeJSON('expert_requests', list);
    return request;
  },
  updateExpertRequest(id: string, updates: any) {
    const list = this.getExpertRequests();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    writeJSON('expert_requests', list);
    return list[idx];
  },

  // FEEDBACKS & REVIEWS
  getFeedbacks() {
    return readJSON<any[]>('feedbacks', defaultFeedbacks);
  },
  saveFeedback(feedback: any) {
    const list = this.getFeedbacks();
    list.unshift(feedback);
    writeJSON('feedbacks', list);
    return feedback;
  },
  updateFeedback(id: string, updates: any) {
    const list = this.getFeedbacks();
    const idx = list.findIndex(f => f.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    writeJSON('feedbacks', list);
    return list[idx];
  },
  deleteFeedback(id: string) {
    let list = this.getFeedbacks();
    list = list.filter(f => f.id !== id);
    writeJSON('feedbacks', list);
    return true;
  }
};

