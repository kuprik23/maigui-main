import crypto from 'crypto';

export class EncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly keyLength = 32;
    private readonly ivLength = 16;
    private readonly tagLength = 16;
    private readonly key: Buffer;

    constructor(encryptionKey: string) {
        // Use environment variable for key in production
        this.key = Buffer.from(encryptionKey, 'hex');
    }

    async encrypt(data: string): Promise<{
        encrypted: string;
        iv: string;
        tag: string;
    }> {
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        
        const encrypted = Buffer.concat([
            cipher.update(data, 'utf8'),
            cipher.final()
        ]);

        const tag = cipher.getAuthTag();

        return {
            encrypted: encrypted.toString('base64'),
            iv: iv.toString('base64'),
            tag: tag.toString('base64')
        };
    }

    async decrypt(encryptedData: {
        encrypted: string;
        iv: string;
        tag: string;
    }): Promise<string> {
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.key,
            Buffer.from(encryptedData.iv, 'base64')
        );

        decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));

        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedData.encrypted, 'base64')),
            decipher.final()
        ]);

        return decrypted.toString('utf8');
    }

    static generateKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }
}
