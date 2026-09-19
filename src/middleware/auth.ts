import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserProfile } from '../types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'indowings_command_center_secret_2026';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied. No authorization token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserProfile;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Unauthorized role: ${req.user?.role || 'none'}. Required: ${roles.join(', ')}` 
      });
      return;
    }
    next();
  };
};
