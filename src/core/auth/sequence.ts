import { generateToken, verifyToken } from '../../utils/jwt';

/**
 * Authentication service for Sequence wallet
 */
export class SequenceAuthService {
  private readonly jwtSecret: string;
  
  /**
   * Initialize Sequence auth service
   * @param jwtSecret Secret key for JWT signing
   */
  constructor(jwtSecret: string) {
    this.jwtSecret = jwtSecret;
  }
  
  /**
   * Generate an authentication challenge for a wallet address
   * @param address Wallet address to authenticate
   * @returns Challenge message to sign
   */
  async generateAuthChallenge(address: string): Promise<string> {
    // Create a unique challenge with timestamp
    const timestamp = Date.now();
    const nonce = Math.floor(Math.random() * 1000000);
    
    return `Sign this message to authenticate with Em3rsa: ${address.toLowerCase()}:${timestamp}:${nonce}`;
  }
  
  /**
   * Verify a signature from a wallet
   * @param message The message that was signed
   * @param signature The signature to verify
   * @param address The wallet address that signed
   * @returns True if signature is valid
   */
  async verifySignature(message: string, signature: string, address: string): Promise<boolean> {
    try {
      // In a real implementation, we would use ethers.js or similar to verify
      // For this demo, we'll simulate verification
      console.log(`Verifying signature for ${address}`);
      console.log(`Message: ${message}`);
      console.log(`Signature: ${signature}`);
      
      // Check if the message format is correct
      if (!message.startsWith('Sign this message to authenticate with Em3rsa:')) {
        return false;
      }
      
      // Check if the address in the message matches
      const parts = message.split(':');
      if (parts.length < 3 || parts[1].toLowerCase() !== address.toLowerCase()) {
        return false;
      }
      
      // In a real implementation, we would verify the signature cryptographically
      // For this demo, we'll assume it's valid if the format is correct
      return true;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }
  
  /**
   * Generate a JWT token for an authenticated user
   * @param userId User ID in the database
   * @param address Wallet address
   * @returns JWT token
   */
  generateToken(userId: string, address: string): string {
    return generateToken(userId, this.jwtSecret, '7d');
  }
  
  /**
   * Verify a JWT token
   * @param token JWT token to verify
   * @returns Decoded token payload or null if invalid
   */
  verifyToken(token: string): { sub: string } | null {
    return verifyToken(token, this.jwtSecret);
  }
}
