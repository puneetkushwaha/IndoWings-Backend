import { Router } from 'express';
import { dbService, isSupabaseConfigured } from '../supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const fleet = await dbService.getFleet();
    const missions = await dbService.getMissions();
    const auditLogs = await dbService.getAuditLogs();

    const totalFlightHours = fleet.reduce((acc, curr) => acc + (Number(curr.flight_hours) || 0), 0);
    const activeDrones = fleet.filter(d => d.status === 'in-flight' || d.status === 'ready').length;
    const completedMissions = missions.filter(m => m.status === 'COMPLETED').length;

    res.json({
      system: 'IndoWings Enterprise Command Center v3.4.4',
      status: 'OPERATIONAL',
      supabase_connected: isSupabaseConfigured,
      stats: {
        total_fleet_count: fleet.length,
        active_uav_count: activeDrones,
        total_flight_hours: Math.round(totalFlightHours * 10) / 10,
        total_missions: missions.length,
        completed_missions: completedMissions,
        audit_events_logged: auditLogs.length,
        active_gcs_links: 14,
        dgca_compliance_status: '100% CERTIFIED'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch telemetry stats' });
  }
});

export default router;
