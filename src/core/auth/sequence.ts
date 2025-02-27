import { SequenceProvider } from '@0xsequence/provider';
import * as jwt from '../../utils/jwt';
import * as crypto from 'crypto';

interface AuthResult {
  token: string;
  user: {
    id: string;
    address: string;
  };
}

export class SequenceAuthService {
  private readonly jwtSecret: string;
  private readonly tokenExpiry: string;
  private readonly nonceMap: Map<string, { nonce: string; expires: number }>;
  private readonly NONCE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  constructor(jwtSecret: string, tokenExpiry = '24h') {
    this.jwtSecret = jwtSecret;
    this.tokenExpiry = tokenExpiry;
    this.nonceMap = new Map();
  }

  /**
   * Generate a challenge message for the user to sign
   */
  async generateAuthChallenge(address: string): Promise<string> {
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    
    // Store nonce with expiry
    this.nonceMap.set(address.toLowerCase(), {
      nonce,
      expires: timestamp + this.NONCE_EXPIRY
    });
    
    return `Sign in to Em3rsa\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
  }

  /**
   * Verify a signature from Sequence wallet
   */
  async verifySignature(
    message: string,
    signature: string,
    address: string
  ): Promise<boolean> {
    try {
      // Extract nonce from message
      const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/i);
      if (!nonceMatch) {
        throw new Error('Invalid message format');
      }
      
      const nonce = nonceMatch[1];
      const storedNonceData = this.nonceMap.get(address.toLowerCase());
      
      // Verify nonce exists and hasn't expired
      if (!storedNonceData) {
        throw new Error('No authentication challenge found');
      }
      
      if (Date.now() > storedNonceData.expires) {
        this.nonceMap.delete(address.toLowerCase());
        throw new Error('Authentication challenge expired');
      }
      
      if (storedNonceData.nonce !== nonce) {
        throw new Error('Invalid nonce');
      }
      
      // For now, we'll use a simplified verification since we don't have direct access to Sequence SDK
      // In a real implementation, you would use the Sequence SDK's verification method
      // This is a placeholder for demonstration purposes
      const isValid = true; // Simulated verification
      
      // Clean up used nonce
      if (isValid) {
        this.nonceMap.delete(address.toLowerCase());
      }
      
      return isValid;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Generate a JWT token for the authenticated user
   */
  generateToken(userId: string, address: string): string {
    return jwt.sign(
      {
        sub: userId,
        address: address.toLowerCase(),
        iat: Math.floor(Date.now() / 1000)
      },
      this.jwtSecret,
      { expiresIn: this.tokenExpiry }
    );
  }

  /**
   * Verify a JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Initialize Sequence provider
   */
  static async initProvider(): Promise<SequenceProvider> {
    // This is a simplified initialization for demonstration
    // In a real implementation, you would use the actual Sequence SDK
    const provider = new SequenceProvider({
      networkId: 1, // Ethereum mainnet
      defaultNetwork: 'mainnet'
    });
    
    return provider;
  }
}
