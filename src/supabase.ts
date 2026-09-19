import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { initialProfiles, initialFleet, initialMissions, initialAuditLogs, demoRequests } from './mockData.js';
import { UserProfile, DroneItem, MissionItem, AuditLogItem, DemoRequestItem } from './types.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase connected successfully to:', supabaseUrl);
  } catch (error) {
    console.warn('⚠️ Supabase connection failed, falling back to in-memory store:', error);
  }
} else {
  console.log('ℹ️ Supabase credentials not set in .env. Running in ultra-fast in-memory/demo mode with full IndoWings data.');
}

// In-Memory store for fallback or local dev
export const inMemoryDB = {
  profiles: [...initialProfiles],
  fleet: [...initialFleet],
  missions: [...initialMissions],
  auditLogs: [...initialAuditLogs],
  demoRequests: [...demoRequests]
};

// Database helper functions that auto-switch between Supabase and InMemory
export const dbService = {
  // Profiles / Auth
  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
      if (!error && data) return data as UserProfile;
    }
    return inMemoryDB.profiles.find(p => p.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async getAllProfiles(): Promise<UserProfile[]> {
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) return data as UserProfile[];
    }
    return inMemoryDB.profiles;
  },

  // Fleet
  async getFleet(): Promise<DroneItem[]> {
    if (supabase) {
      const { data, error } = await supabase.from('drone_fleet').select('*').order('model_name');
      if (!error && data && data.length > 0) return data as DroneItem[];
    }
    return inMemoryDB.fleet;
  },

  async addDrone(drone: Omit<DroneItem, 'id'>): Promise<DroneItem> {
    const newDrone: DroneItem = {
      ...drone,
      id: `drn-${Date.now()}`
    };

    if (supabase) {
      const { data, error } = await supabase.from('drone_fleet').insert([drone]).select().single();
      if (!error && data) return data as DroneItem;
      if (error) console.warn('Supabase addDrone error:', error.message);
    }

    inMemoryDB.fleet.push(newDrone);
    return newDrone;
  },

  // Missions
  async getMissions(): Promise<MissionItem[]> {
    if (supabase) {
      const { data, error } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as MissionItem[];
    }
    return inMemoryDB.missions;
  },

  async createMission(mission: Omit<MissionItem, 'id' | 'created_at'>): Promise<MissionItem> {
    if (supabase) {
      const { data, error } = await supabase.from('missions').insert([mission]).select().single();
      if (!error && data) return data as MissionItem;
      if (error) console.warn('Supabase createMission error:', error.message);
    }

    const newMission: MissionItem = {
      ...mission,
      id: `msn-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    inMemoryDB.missions.unshift(newMission);
    return newMission;
  },

  async updateMissionStatus(id: string, status: MissionItem['status']): Promise<MissionItem | null> {
    if (supabase) {
      const { data, error } = await supabase.from('missions').update({ status }).eq('id', id).select().single();
      if (!error && data) return data as MissionItem;
    }

    const item = inMemoryDB.missions.find(m => m.id === id);
    if (item) {
      item.status = status;
      return item;
    }
    return null;
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLogItem[]> {
    if (supabase) {
      const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
      if (!error && data && data.length > 0) return data as AuditLogItem[];
    }
    return inMemoryDB.auditLogs;
  },

  async logAudit(entry: Omit<AuditLogItem, 'id' | 'timestamp'>): Promise<AuditLogItem> {
    if (supabase) {
      const { data, error } = await supabase.from('audit_logs').insert([entry]).select().single();
      if (!error && data) return data as AuditLogItem;
      if (error) console.warn('Supabase logAudit error:', error.message);
    }

    const item: AuditLogItem = {
      ...entry,
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    inMemoryDB.auditLogs.unshift(item);
    return item;
  },

  // Demo requests / Leads
  async saveDemoRequest(request: Omit<DemoRequestItem, 'id' | 'created_at'>): Promise<DemoRequestItem> {
    if (supabase) {
      const { data, error } = await supabase.from('demo_requests').insert([request]).select().single();
      if (!error && data) return data as DemoRequestItem;
      if (error) console.warn('Supabase saveDemoRequest error:', error.message);
    }

    const item: DemoRequestItem = {
      ...request,
      id: `lead-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    inMemoryDB.demoRequests.unshift(item);
    return item;
  }
};
