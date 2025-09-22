import { Response, NextFunction } from 'express';
import User from '../models/usuario';
import { AuthRequest } from './verifyToken';

export const authorize = (roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'No autorizado: ' });

    const dbUser = await User.findOne({ uid: req.user.uid });
    if (!dbUser || !roles.includes(dbUser.rol))
      return res.status(403).json({ message: 'No tienes permiso' });

    next();
  };
};


