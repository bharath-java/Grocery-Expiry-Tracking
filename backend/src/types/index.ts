import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'user' | 'admin';
    email: string;
  };
  file?: Express.Multer.File; // for images upload middleware compatibility
}
