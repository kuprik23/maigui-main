import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { 
  rateLimiter, 
  securityHeaders, 
  corsOptions, 
  errorHandler 
} from '../src/api/middleware/security';
import { EncryptionService } from '../src/utils/encryption';
import { SequenceAuthService } from '../src/core/auth/sequence';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize services
const encryptionService = new EncryptionService(
  process.env.ENCRYPTION_KEY || EncryptionService.generateKey()
);

const sequenceAuthService = new SequenceAuthService(
  process.env.JWT_SECRET || 'development-jwt-secret'
);

// Apply security middleware
app.use(securityHeaders);
app.use(corsOptions);
app.use(rateLimiter);
app.use(express.json());

// Make services available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  req.encryptionService = encryptionService;
  req.sequenceAuthService = sequenceAuthService;
  next();
});

// API routes
app.use('/api/auth', require('../src/api/routes/auth'));
app.use('/api/users', require('../src/api/routes/users'));
app.use('/api/subscriptions', require('../src/api/routes/subscriptions'));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

// Export app for testing
export default app;

// Add type definitions for request object
declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient;
      encryptionService: EncryptionService;
      sequenceAuthService: SequenceAuthService;
      user?: {
        id: string;
        address: string;
      };
    }
  }
}
