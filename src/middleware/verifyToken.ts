import { Request, Response, NextFunction } from "express";
import { auth } from "../firebase";
export interface AuthRequest extends Request {
  user?: any;
}
export default function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }
  const payload = auth.verifyIdToken(token)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      // (req as any).user = decodedToken;
      const issuedAt = new Date(decodedToken.iat * 1000); 
      const expiresAt = new Date(decodedToken.exp * 1000); 

      console.log("UID:", uid);
      console.log("Emitido en:", issuedAt);
      console.log("Expira en:", expiresAt);

      req.user = decodedToken;

      next();
    })
    .catch((error: any) => {
      let msg = 'Invalid token';
      if (error.code === 'auth/id-token-expired') {
        msg = 'Token expired';
      } else if (error.code === 'auth/argument-error') {
        msg = 'Malformed token';
      }
      return res.status(401).json({ message: msg });
    });
}
