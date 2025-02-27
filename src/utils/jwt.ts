import jwt from 'jsonwebtoken';

// Create a type declaration for the JWT payload
interface JwtPayload {
  sub: string;  // Subject (user ID)
  iat?: number; // Issued at
  exp?: number; // Expiration time
  [key: string]: any; // Allow any additional properties
}

/**
 * Generate a JWT token
 */
export function generateToken(userId: string, secret: string, expiresIn = '7d'): string {
  const payload: JwtPayload = {
    sub: userId
  };
  
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string, secret: string): JwtPayload | null {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Generate a refresh token with longer expiration
 */
export function generateRefreshToken(userId: string, secret: string): string {
  const payload: JwtPayload = {
    sub: userId
  };
  
  return jwt.sign(payload, secret, { expiresIn: '30d' });
}
