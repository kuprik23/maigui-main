import express from 'express';
import { Plan } from '../../utils/stripe';
import { createCustomer } from '../../utils/stripe';

const router = express.Router();

/**
 * Generate a challenge for Sequence wallet authentication
 * @route POST /api/auth/sequence/challenge
 */
router.post('/sequence/challenge', async (req, res, next) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const challenge = await req.sequenceAuthService.generateAuthChallenge(address);
    
    res.json({ challenge });
  } catch (error) {
    next(error);
  }
});

/**
 * Verify a signature and authenticate with Sequence wallet
 * @route POST /api/auth/sequence/verify
 */
router.post('/sequence/verify', async (req, res, next) => {
  try {
    const { address, message, signature } = req.body;
    
    if (!address || !message || !signature) {
      return res.status(400).json({ 
        error: 'Wallet address, message, and signature are required' 
      });
    }
    
    // Verify the signature
    const isValid = await req.sequenceAuthService.verifySignature(
      message,
      signature,
      address
    );
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Find or create user
    let user = await req.prisma.user.findUnique({
      where: { sequenceId: address.toLowerCase() },
      include: { subscription: true }
    });
    
    if (!user) {
      // Create new user
      user = await req.prisma.user.create({
        data: {
          sequenceId: address.toLowerCase(),
          subscription: {
            create: {
              plan: Plan.FREE,
              monthlyMinutes: 5,
              status: 'active',
            }
          }
        },
        include: { subscription: true }
      });
      
      // Create Stripe customer for future billing
      if (user.email) {
        const customerId = await createCustomer(user.email, user.name || undefined);
        
        // Update user with Stripe customer ID
        if (user.subscription) {
          await req.prisma.subscription.update({
            where: { id: user.subscription.id },
            data: { stripeCustomerId: customerId }
          });
        }
      }
      
      // Log security event
      await req.prisma.securityLog.create({
        data: {
          userId: user.id,
          action: 'ACCOUNT_CREATED',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || '',
          success: true,
          details: 'Account created via Sequence wallet'
        }
      });
    }
    
    // Generate JWT token
    const token = req.sequenceAuthService.generateToken(user.id, address);
    
    // Log successful login
    await req.prisma.securityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        success: true
      }
    });
    
    // Return user data and token
    res.json({
      token,
      user: {
        id: user.id,
        address: user.sequenceId,
        name: user.name,
        email: user.email,
        subscription: user.subscription ? {
          plan: user.subscription.plan,
          status: user.subscription.status,
          monthlyMinutes: user.subscription.monthlyMinutes
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Middleware to authenticate requests
 */
export const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const payload = req.sequenceAuthService.verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Check if user exists
    const user = await req.prisma.user.findUnique({
      where: { id: payload.sub }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user to request
    req.user = {
      id: user.id,
      address: user.sequenceId || ''
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Get current authenticated user
 * @route GET /api/auth/me
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { subscription: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      address: user.sequenceId,
      name: user.name,
      email: user.email,
      subscription: user.subscription ? {
        plan: user.subscription.plan,
        status: user.subscription.status,
        monthlyMinutes: user.subscription.monthlyMinutes
      } : null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Logout (client-side only, just for security logging)
 * @route POST /api/auth/logout
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    // Log logout event
    await req.prisma.securityLog.create({
      data: {
        userId: req.user?.id || '',
        action: 'LOGOUT',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        success: true
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
