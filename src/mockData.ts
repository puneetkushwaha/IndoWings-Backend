import { UserProfile, DroneItem, MissionItem, AuditLogItem, DemoRequestItem } from './types.js';

export const initialProfiles: UserProfile[] = [
  {
    id: 'usr-001',
    email: 'admin@indowings.com',
    full_name: 'Vikramaditya Sharma',
    role: 'admin',
    organization: 'IndoWings Flight HQ, Noida',
    badge_id: 'IW-ADM-001'
  },
  {
    id: 'usr-002',
    email: 'pilot@indowings.com',
    full_name: 'Capt. Aarav Rathore',
    role: 'pilot',
    organization: 'IndoWings Aerial Survey Wing',
    badge_id: 'IW-PLT-409'
  },
  {
    id: 'usr-003',
    email: 'defense@indowings.com',
    full_name: 'Major Rohan Verma (Retd.)',
    role: 'defense',
    organization: 'IndoWings Counter-UAS Security',
    badge_id: 'IW-DEF-102'
  },
  {
    id: 'usr-004',
    email: 'auditor@indowings.com',
    full_name: 'Ananya Deshmukh',
    role: 'auditor',
    organization: 'DGCA Regulatory Compliance Desk',
    badge_id: 'IW-AUD-088'
  }
];

export const initialFleet: DroneItem[] = [
  {
    id: 'drn-001',
    model_name: 'Cyberone Pro',
    category: 'Surveillance & ISR',
    serial_number: 'IW-COP-9021',
    status: 'ready',
    battery_pct: 96,
    flight_hours: 142.5,
    max_range_km: 25.0,
    endurance_mins: 75,
    max_speed_kmh: 80,
    payload_capacity_kg: 2.5,
    image_url: 'https://indowings.com/images/home/cyberonepro.webp'
  },
  {
    id: 'drn-002',
    model_name: 'Cyberone Max',
    category: 'Surveillance & ISR',
    serial_number: 'IW-COM-8812',
    status: 'in-flight',
    battery_pct: 82,
    flight_hours: 310.2,
    max_range_km: 40.0,
    endurance_mins: 110,
    max_speed_kmh: 95,
    payload_capacity_kg: 4.0,
    image_url: 'https://indowings.com/images/home/cyberone-max.webp'
  },
  {
    id: 'drn-003',
    model_name: 'Cyberone Lite',
    category: 'Surveillance & ISR',
    serial_number: 'IW-COL-4420',
    status: 'ready',
    battery_pct: 100,
    flight_hours: 85.0,
    max_range_km: 15.0,
    endurance_mins: 50,
    max_speed_kmh: 65,
    payload_capacity_kg: 1.2,
    image_url: 'https://indowings.com/images/cyberone-lite.png'
  },
  {
    id: 'drn-004',
    model_name: 'Cyberone Trainer Drone',
    category: 'Training',
    serial_number: 'IW-COT-1102',
    status: 'standby',
    battery_pct: 88,
    flight_hours: 520.4,
    max_range_km: 8.0,
    endurance_mins: 35,
    max_speed_kmh: 45,
    payload_capacity_kg: 0.8,
    image_url: 'https://indowings.com/images/home/trainer-drone.webp'
  },
  {
    id: 'drn-005',
    model_name: 'S-Series Pro',
    category: 'Precision Agriculture',
    serial_number: 'IW-SSP-7734',
    status: 'ready',
    battery_pct: 94,
    flight_hours: 215.8,
    max_range_km: 12.0,
    endurance_mins: 45,
    max_speed_kmh: 50,
    payload_capacity_kg: 16.0,
    image_url: 'https://indowings.com/images/home/s-series-pro.webp'
  },
  {
    id: 'drn-006',
    model_name: 'E-Series Pro',
    category: 'Precision Agriculture',
    serial_number: 'IW-ESP-6629',
    status: 'maintenance',
    battery_pct: 45,
    flight_hours: 198.0,
    max_range_km: 10.0,
    endurance_mins: 40,
    max_speed_kmh: 45,
    payload_capacity_kg: 10.0,
    image_url: 'https://indowings.com/images/home/e-series-pro.webp'
  },
  {
    id: 'drn-007',
    model_name: 'Ingenious Anti-Drone C-UAS',
    category: 'Counter-UAS Defense',
    serial_number: 'IW-AD-005',
    status: 'ready',
    battery_pct: 100,
    flight_hours: 980.0,
    max_range_km: 5.0,
    endurance_mins: 480,
    max_speed_kmh: 0,
    payload_capacity_kg: 0.0,
    image_url: 'https://indowings.com/images/anydrone.png'
  }
];

export const initialMissions: MissionItem[] = [
  {
    id: 'msn-101',
    title: 'Noida Industrial Corridor Topographic Mapping',
    pilot_email: 'pilot@indowings.com',
    drone_model: 'Cyberone Pro',
    status: 'ACTIVE',
    location_name: 'Gautam Buddha Nagar, UP',
    area_hectares: 420.5,
    altitude_meters: 120,
    waypoints: [
      { lat: 28.5355, lng: 77.3910, alt: 120 },
      { lat: 28.5385, lng: 77.3950, alt: 120 },
      { lat: 28.5410, lng: 77.3980, alt: 120 },
      { lat: 28.5370, lng: 77.4010, alt: 120 }
    ],
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'msn-102',
    title: 'Western Ghats Canopy Moisture & Forest Health',
    pilot_email: 'pilot@indowings.com',
    drone_model: 'Cyberone Max',
    status: 'COMPLETED',
    location_name: 'Western Ghats Sector 4',
    area_hectares: 850.0,
    altitude_meters: 150,
    waypoints: [
      { lat: 15.3173, lng: 74.1240, alt: 150 },
      { lat: 15.3210, lng: 74.1310, alt: 150 }
    ],
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'msn-103',
    title: 'Punjab Agricultural Belt Nano-Fertilizer Spraying',
    pilot_email: 'pilot@indowings.com',
    drone_model: 'S-Series Pro',
    status: 'PLANNED',
    location_name: 'Ludhiana Agricultural Sector',
    area_hectares: 160.0,
    altitude_meters: 25,
    waypoints: [
      { lat: 30.9010, lng: 75.8573, alt: 25 },
      { lat: 30.9050, lng: 75.8610, alt: 25 }
    ],
    created_at: new Date().toISOString()
  }
];

export const initialAuditLogs: AuditLogItem[] = [
  {
    id: 'aud-01',
    user_email: 'admin@indowings.com',
    role: 'admin',
    action: 'USER_LOGIN',
    resource: 'Command Center Console v3.4.4',
    ip_address: '10.0.4.12',
    severity: 'INFO',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'aud-02',
    user_email: 'admin@indowings.com',
    role: 'admin',
    action: 'MISSION_APPROVAL',
    resource: 'Noida Industrial Corridor Topographic Mapping',
    ip_address: '10.0.4.12',
    severity: 'INFO',
    timestamp: new Date(Date.now() - 5400000).toISOString()
  },
  {
    id: 'aud-03',
    user_email: 'pilot@indowings.com',
    role: 'pilot',
    action: 'TAKEOFF_ARM',
    resource: 'UAV IW-COP-9021 (Cyberone Pro)',
    ip_address: '192.168.1.104',
    severity: 'INFO',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'aud-04',
    user_email: 'defense@indowings.com',
    role: 'defense',
    action: 'RADAR_SWEEP_ACTIVATE',
    resource: 'Sector B Airspace Perimeter C-UAS',
    ip_address: '10.0.8.5',
    severity: 'INFO',
    timestamp: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'aud-05',
    user_email: 'auditor@indowings.com',
    role: 'auditor',
    action: 'DGCA_COMPLIANCE_EXPORT',
    resource: 'Aviation Flight Logs Q3-2026',
    ip_address: '10.0.2.19',
    severity: 'INFO',
    timestamp: new Date(Date.now() - 600000).toISOString()
  }
];

export const demoRequests: DemoRequestItem[] = [];
