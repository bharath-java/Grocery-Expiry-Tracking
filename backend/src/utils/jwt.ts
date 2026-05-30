import jwt from 'jsonwebtoken';

export const generateToken = (id: string, email: string, role: string): string => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET || 'grocerytracker_jwt_secret_key_2026_super_secure',
    { expiresIn: '1d' }
  );
};

export const generateRefreshToken = (id: string): string => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET || 'grocerytracker_jwt_refresh_secret_key_2026_super_secure',
    { expiresIn: '7d' }
  );
};
