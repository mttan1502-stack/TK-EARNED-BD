import { Request, Response, NextFunction } from 'express';
import { verifyToken, dbService } from '../db.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'user' | 'admin';
    email?: string;
    username?: string;
  };
  admin?: {
    id: string;
    role: 'admin';
    username: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }

  req.user = payload;
  next();
}

export function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload || payload.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Administrator privileges required.' });
  }

  req.admin = {
    id: payload.id,
    role: 'admin',
    username: payload.username || 'Sultan',
  };
  next();
}
