import * as crypto from 'crypto';

/**
 * Encryption service for sensitive data
 */
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  
  /**
   * Initialize encryption service with a key
   * @param key Hex-encoded 32-byte key (64 characters)
   */
  constructor(key: string) {
    if (key.length !== 64) {
      throw new Error('Encryption key must be 64 characters (32 bytes) in hex format');
    }
    this.key = Buffer.from(key, 'hex');
  }
  
  /**
   * Encrypt data
   * @param data Data to encrypt
   * @returns Encrypted data as hex string with IV and auth tag
   */
  encrypt(data: string): string {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag();
    
    // Return IV + encrypted data + auth tag as hex
    return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
  }
  
  /**
   * Decrypt data
   * @param encryptedData Encrypted data from encrypt()
   * @returns Decrypted data
   */
  decrypt(encryptedData: string): string {
    // Split the encrypted data into IV, ciphertext, and auth tag
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * Generate a secure random key for encryption
   * @returns Hex-encoded 32-byte key (64 characters)
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Hash a password using bcrypt
   * @param password Password to hash
   * @returns Hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
  
  /**
   * Verify a password against a hash
   * @param password Password to verify
   * @param hash Hash to compare against
   * @returns True if password matches hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, hash);
  }
}
