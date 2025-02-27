import express from 'express';
import { authenticate } from './auth';

const router = express.Router();

/**
 * Get user profile
 * @route GET /api/users/profile
 */
router.get('/profile', authenticate, async (req, res, next) => {
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
      twoFactorEnabled: user.twoFactorEnabled,
      subscription: user.subscription ? {
        plan: user.subscription.plan,
        status: user.subscription.status,
        monthlyMinutes: user.subscription.monthlyMinutes,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate
      } : null,
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update user profile
 * @route PUT /api/users/profile
 */
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Check if email is already in use by another user
    if (email) {
      const existingUser = await req.prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser && existingUser.id !== req.user?.id) {
        return res.status(400).json({ error: 'Email is already in use' });
      }
    }
    
    // Update user profile
    const updatedUser = await req.prisma.user.update({
      where: { id: req.user?.id },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined
      },
      include: { subscription: true }
    });
    
    // If email was updated and user has a Stripe customer ID, update it there too
    if (email && updatedUser.subscription?.stripeCustomerId) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.customers.update(
        updatedUser.subscription.stripeCustomerId,
        { email }
      );
    }
    
    // Log profile update
    await req.prisma.securityLog.create({
      data: {
        userId: req.user?.id || '',
        action: 'PROFILE_UPDATE',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        success: true
      }
    });
    
    res.json({
      id: updatedUser.id,
      address: updatedUser.sequenceId,
      name: updatedUser.name,
      email: updatedUser.email,
      twoFactorEnabled: updatedUser.twoFactorEnabled,
      subscription: updatedUser.subscription ? {
        plan: updatedUser.subscription.plan,
        status: updatedUser.subscription.status,
        monthlyMinutes: updatedUser.subscription.monthlyMinutes
      } : null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user security logs
 * @route GET /api/users/security-logs
 */
router.get('/security-logs', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const logs = await req.prisma.securityLog.findMany({
      where: { userId: req.user?.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });
    
    const total = await req.prisma.securityLog.count({
      where: { userId: req.user?.id }
    });
    
    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Enable two-factor authentication
 * @route POST /api/users/2fa/enable
 */
router.post('/2fa/enable', authenticate, async (req, res, next) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user?.id }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }
    
    // In a real implementation, we would generate a TOTP secret and QR code
    // For this demo, we'll just simulate it
    const secret = 'DEMO2FASECRET';
    
    // Update user with 2FA secret (in a real app, this would be encrypted)
    await req.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true
      }
    });
    
    // Log 2FA enablement
    await req.prisma.securityLog.create({
      data: {
        userId: user.id,
        action: '2FA_ENABLED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        success: true
      }
    });
    
    res.json({
      success: true,
      message: '2FA has been enabled'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Disable two-factor authentication
 * @route POST /api/users/2fa/disable
 */
router.post('/2fa/disable', authenticate, async (req, res, next) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user?.id }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }
    
    // Update user to disable 2FA
    await req.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false
      }
    });
    
    // Log 2FA disablement
    await req.prisma.securityLog.create({
      data: {
        userId: user.id,
        action: '2FA_DISABLED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        success: true
      }
    });
    
    res.json({
      success: true,
      message: '2FA has been disabled'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user usage statistics
 * @route GET /api/users/usage
 */
router.get('/usage', authenticate, async (req, res, next) => {
  try {
    const timeframe = req.query.timeframe as string || 'month';
    let startDate: Date;
    
    // Calculate start date based on timeframe
    const now = new Date();
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }
    
    // Get interactions for the specified timeframe
    const interactions = await req.prisma.interaction.findMany({
      where: {
        userId: req.user?.id,
        sessionStart: {
          gte: startDate
        }
      },
      orderBy: { sessionStart: 'asc' }
    });
    
    // Calculate total usage in seconds
    const totalUsage = interactions.reduce((sum: number, interaction: { duration: number }) => sum + interaction.duration, 0);
    
    // Get subscription details
    const subscription = await req.prisma.subscription.findUnique({
      where: { userId: req.user?.id }
    });
    
    // Calculate remaining minutes
    const usedMinutes = Math.ceil(totalUsage / 60);
    const totalMinutes = subscription?.monthlyMinutes || 0;
    const remainingMinutes = Math.max(0, totalMinutes - usedMinutes);
    
    res.json({
      timeframe,
      totalUsage: {
        seconds: totalUsage,
        minutes: usedMinutes
      },
      subscription: {
        totalMinutes,
        remainingMinutes,
        percentUsed: totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0
      },
      interactions
    });
  } catch (error) {
    next(error);
  }
});

export default router;
