import { Router } from 'express';
import { dbService } from '../supabase.js';
import { authenticateToken, requireRoles, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET all fleet
router.get('/', async (req, res) => {
  try {
    const fleet = await dbService.getFleet();
    res.json({ fleet });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drone fleet' });
  }
});

// GET single drone
router.get('/:id', async (req, res) => {
  const fleet = await dbService.getFleet();
  const drone = fleet.find(d => d.id === req.params.id);
  if (!drone) {
    res.status(404).json({ error: 'Drone not found' });
    return;
  }
  res.json({ drone });
});

// POST register new drone (Admin only)
router.post('/', authenticateToken, requireRoles('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { model_name, category, serial_number, max_range_km, endurance_mins, max_speed_kmh, payload_capacity_kg, image_url } = req.body;
    
    if (!model_name || !serial_number) {
      res.status(400).json({ error: 'Model name and serial number are required' });
      return;
    }

    const newDrone = await dbService.addDrone({
      model_name,
      category: category || 'Surveillance & ISR',
      serial_number,
      status: 'ready',
      battery_pct: 100,
      flight_hours: 0,
      max_range_km: Number(max_range_km) || 20,
      endurance_mins: Number(endurance_mins) || 60,
      max_speed_kmh: Number(max_speed_kmh) || 70,
      payload_capacity_kg: Number(payload_capacity_kg) || 2,
      image_url: image_url || 'https://indowings.com/images/home/cyberonepro.webp'
    });

    await dbService.logAudit({
      user_email: req.user?.email || 'admin',
      role: 'admin',
      action: 'AIRCRAFT_REGISTERED',
      resource: `${model_name} (${serial_number})`,
      ip_address: req.ip || '127.0.0.1',
      severity: 'INFO'
    });

    res.status(201).json({ message: 'Drone registered successfully', drone: newDrone });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register drone' });
  }
});

export default router;
