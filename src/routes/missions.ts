import { Router } from 'express';
import { dbService } from '../supabase.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET missions
router.get('/', async (req, res) => {
  try {
    const missions = await dbService.getMissions();
    res.json({ missions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
});

// POST create mission
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, drone_model, location_name, area_hectares, altitude_meters, waypoints } = req.body;

    if (!title || !drone_model) {
      res.status(400).json({ error: 'Title and drone model are required' });
      return;
    }

    const mission = await dbService.createMission({
      title,
      pilot_email: req.user?.email || 'pilot@indowings.com',
      drone_model,
      status: 'PLANNED',
      location_name: location_name || 'Unassigned Sector',
      area_hectares: Number(area_hectares) || 100,
      altitude_meters: Number(altitude_meters) || 120,
      waypoints: waypoints || [
        { lat: 28.5355, lng: 77.3910, alt: 120 },
        { lat: 28.5385, lng: 77.3950, alt: 120 }
      ]
    });

    await dbService.logAudit({
      user_email: req.user?.email || 'pilot@indowings.com',
      role: req.user?.role || 'pilot',
      action: 'MISSION_CREATED',
      resource: mission.title,
      ip_address: req.ip || '127.0.0.1',
      severity: 'INFO'
    });

    res.status(201).json({ message: 'Mission created successfully', mission });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create mission' });
  }
});

// PATCH update status (Launch, Abort, Complete)
router.patch('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { status } = req.body;
    const missionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const mission = await dbService.updateMissionStatus(missionId, status);
    
    if (!mission) {
      res.status(404).json({ error: 'Mission not found' });
      return;
    }

    await dbService.logAudit({
      user_email: req.user?.email || 'pilot@indowings.com',
      role: req.user?.role || 'pilot',
      action: `MISSION_STATUS_${status}`,
      resource: mission.title,
      ip_address: req.ip || '127.0.0.1',
      severity: status === 'ABORTED' ? 'WARN' : 'INFO'
    });

    res.json({ message: 'Mission status updated', mission });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update mission' });
  }
});

export default router;
