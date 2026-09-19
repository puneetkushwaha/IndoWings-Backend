import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { dbService } from '../supabase.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'indowings_command_center_secret_2026';

// 1. Get all pre-configured demo accounts for quick testing
router.get('/demo-accounts', async (req, res) => {
  const profiles = await dbService.getAllProfiles();
  res.json({ accounts: profiles });
});

// 2. Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const profile = await dbService.getProfileByEmail(email);
  if (!profile) {
    res.status(401).json({ error: 'User not found with this email in IndoWings Command Center' });
    return;
  }

  // Generate JWT with user profile payload
  const token = jwt.sign(profile, JWT_SECRET, { expiresIn: '24h' });

  // Log audit entry
  await dbService.logAudit({
    user_email: profile.email,
    role: profile.role,
    action: 'USER_LOGIN',
    resource: 'Web Command Center GCS',
    ip_address: req.ip || '127.0.0.1',
    severity: 'INFO'
  });

  res.json({
    message: 'Authentication successful',
    token,
    user: profile
  });
});

// 3. Me (Verify Session)
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
