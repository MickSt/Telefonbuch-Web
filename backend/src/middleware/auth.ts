import { Request, Response, NextFunction } from 'express';
import { Session } from 'express-session';

export interface AuthRequest extends Request {
  user?: any;
  session: Session & { user?: any; accessToken?: string };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = req.session.user;
  next();
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
};
