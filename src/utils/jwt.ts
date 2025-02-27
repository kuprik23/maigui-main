/**
 * JWT utility functions for authentication
 */

interface JwtPayload {
  sub: string;
  address: string;
  iat: number;
  exp?: number;
}

/**
 * Sign a JWT token
 */
export function sign(
  payload: JwtPayload | object,
  secret: string,
  options?: { expiresIn: string | number }
): string {
  // In a real implementation, this would use the jsonwebtoken library
  // This is a simplified mock implementation for demonstration purposes
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = typeof options?.expiresIn === 'string' 
    ? parseExpiresIn(options.expiresIn) 
    : (options?.expiresIn || 3600);
  
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };
  
  // Mock token generation - in a real app, use the actual jwt library
  return Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
}

/**
 * Verify a JWT token
 */
export function verify(token: string, secret: string): JwtPayload | null {
  try {
    // In a real implementation, this would use the jsonwebtoken library
    // This is a simplified mock implementation for demonstration purposes
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Parse expiration time string (e.g., '1h', '7d') to seconds
 */
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhdw])$/);
  if (!match) {
    return 3600; // Default to 1 hour
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    case 'w': return value * 7 * 24 * 60 * 60;
    default: return 3600;
  }
}
