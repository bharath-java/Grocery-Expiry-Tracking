import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import { sendError } from '../utils/responses';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Auto-bypass/fallback to a default user to support the login-free user experience
  if (!token || token === 'null' || token === 'undefined' || token === 'anonymous_bypass_token') {
    req.user = {
      id: '60c72b2f9b1d8e234c8d4321', // Standard MongoDB 24-character hex ID
      role: 'user',
      email: 'user@gmail.com'
    };
    return next();
  }

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'grocerytracker_jwt_secret_key_2026_super_secure'
    ) as any;
    
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };
    next();
  } catch (error) {
    // Graceful fallback to default user if token verification fails
    req.user = {
      id: '60c72b2f9b1d8e234c8d4321',
      role: 'user',
      email: 'user@gmail.com'
    };
    next();
  }
};

export const authorize = (...roles: ('user' | 'admin')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(
        res, 
        `User role '${req.user?.role}' is not authorized to access this route`, 
        403
      );
    }
    next();
  };
};
