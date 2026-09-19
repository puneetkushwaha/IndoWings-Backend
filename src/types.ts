export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'pilot' | 'defense' | 'auditor';
  organization: string;
  badge_id: string;
  created_at?: string;
}

export interface DroneItem {
  id: string;
  model_name: string;
  category: string;
  serial_number: string;
  status: 'ready' | 'in-flight' | 'maintenance' | 'standby';
  battery_pct: number;
  flight_hours: number;
  max_range_km: number;
  endurance_mins: number;
  max_speed_kmh: number;
  payload_capacity_kg: number;
  image_url: string;
  created_at?: string;
}

export interface Waypoint {
  lat: number;
  lng: number;
  alt: number;
}

export interface MissionItem {
  id: string;
  title: string;
  pilot_email: string;
  drone_model: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ABORTED';
  location_name: string;
  area_hectares: number;
  altitude_meters: number;
  waypoints: Waypoint[];
  created_at?: string;
}

export interface AuditLogItem {
  id: string;
  user_email: string;
  role: string;
  action: string;
  resource: string;
  ip_address: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  timestamp: string;
}

export interface DemoRequestItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  drone_interest: string;
  use_case?: string;
  message?: string;
  created_at?: string;
}
