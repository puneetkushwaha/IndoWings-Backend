import { Router } from 'express';
import { dbService } from '../supabase.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET audit logs
router.get('/', async (req, res) => {
  try {
    const logs = await dbService.getAuditLogs();
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
