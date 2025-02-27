import express from 'express';
import { authenticate } from './auth';
import { 
  Plan, 
  createCustomer,
  createSubscription, 
  updateSubscription, 
  cancelSubscription,
  getPlanMinutes
} from '../../utils/stripe';

const router = express.Router();

/**
 * Get current subscription
 * @route GET /api/subscriptions/current
 */
router.get('/current', authenticate, async (req, res, next) => {
  try {
    const subscription = await req.prisma.subscription.findUnique({
      where: { userId: req.user?.id }
    });
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    res.json({
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      monthlyMinutes: subscription.monthlyMinutes,
      startDate: subscription.startDate,
      endDate: subscription.endDate
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Create or update subscription
 * @route POST /api/subscriptions
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { plan } = req.body;
    
    if (!plan || !Object.values(Plan).includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    
    // Get user with subscription
    const user = await req.prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { subscription: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Ensure user has an email for Stripe
    if (plan !== Plan.FREE && !user.email) {
      return res.status(400).json({ 
        error: 'Email is required for paid subscriptions. Please update your profile first.' 
      });
    }
    
    let result;
    
    // If user already has a subscription, update it
    if (user.subscription) {
      // If plan is the same, return current subscription
      if (user.subscription.plan === plan) {
        return res.json({
          id: user.subscription.id,
          plan: user.subscription.plan,
          status: user.subscription.status,
          monthlyMinutes: user.subscription.monthlyMinutes
        });
      }
      
      // Create or ensure Stripe customer exists
      let stripeCustomerId = user.subscription.stripeCustomerId;
      if (!stripeCustomerId && user.email && plan !== Plan.FREE) {
        stripeCustomerId = await createCustomer(user.email, user.name || undefined);
      }
      
      // Update subscription in Stripe
      result = await updateSubscription(
        user.subscription.stripeSubId || 'free_plan',
        plan as Plan,
        stripeCustomerId || ''
      );
      
      // Update subscription in database
      await req.prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          plan: plan,
          monthlyMinutes: getPlanMinutes(plan as Plan),
          status: result.status,
          stripeSubId: result.subscriptionId,
          stripeCustomerId: stripeCustomerId || undefined
        }
      });
    } else {
      // Create new subscription
      
      // Create Stripe customer if needed
      let stripeCustomerId;
      if (user.email && plan !== Plan.FREE) {
        stripeCustomerId = await createCustomer(user.email, user.name || undefined);
      }
      
      // Create subscription in Stripe
      result = await createSubscription(
        stripeCustomerId || '',
        plan as Plan
      );
      
      // Create subscription in database
      await req.prisma.subscription.create({
        data: {
          userId: user.id,
          plan: plan,
          monthlyMinutes: getPlanMinutes(plan as Plan),
          status: result.status,
          stripeSubId: result.subscriptionId,
          stripeCustomerId: stripeCustomerId
        }
      });
    }
    
    // Log subscription change
    await req.prisma.securityLog.create({
      data: {
        userId: user.id,
        action: 'SUBSCRIPTION_UPDATED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        success: true,
        details: `Plan changed to ${plan}`
      }
    });
    
    // Return result with payment intent if needed
    res.json({
      success: true,
      plan,
      status: result.status,
      clientSecret: result.clientSecret,
      monthlyMinutes: getPlanMinutes(plan as Plan)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Cancel subscription
 * @route DELETE /api/subscriptions
 */
router.delete('/', authenticate, async (req, res, next) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { subscription: true }
    });
    
    if (!user || !user.subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Cancel in Stripe if needed
    if (user.subscription.stripeSubId && user.subscription.stripeSubId !== 'free_plan') {
      await cancelSubscription(user.subscription.stripeSubId);
    }
    
    // Update to free plan in database
    await req.prisma.subscription.update({
      where: { id: user.subscription.id },
      data: {
        plan: Plan.FREE,
        monthlyMinutes: getPlanMinutes(Plan.FREE),
        status: 'canceled',
        stripeSubId: 'free_plan',
        endDate: new Date()
      }
    });
    
    // Log subscription cancellation
    await req.prisma.securityLog.create({
      data: {
        userId: user.id,
        action: 'SUBSCRIPTION_CANCELED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        success: true
      }
    });
    
    res.json({
      success: true,
      message: 'Subscription canceled successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get available plans
 * @route GET /api/subscriptions/plans
 */
router.get('/plans', async (req, res) => {
  res.json({
    plans: [
      {
        id: Plan.FREE,
        name: 'Free',
        description: 'Basic access with limited features',
        price: 0,
        monthlyMinutes: getPlanMinutes(Plan.FREE),
        features: [
          '5 minutes of AI interaction per month',
          'Basic 3D visualization',
          'Standard support'
        ]
      },
      {
        id: Plan.PRO,
        name: 'Pro',
        description: 'Enhanced features for professionals',
        price: 50,
        monthlyMinutes: getPlanMinutes(Plan.PRO),
        features: [
          '500 minutes of AI interaction per month',
          'Advanced 3D visualization',
          'Priority support',
          'Usage analytics'
        ]
      },
      {
        id: Plan.ENTERPRISE,
        name: 'Enterprise',
        description: 'Custom solutions for organizations',
        price: null, // Custom pricing
        monthlyMinutes: getPlanMinutes(Plan.ENTERPRISE),
        features: [
          'Unlimited AI interaction',
          'Custom 3D models',
          'Dedicated support',
          'Advanced security features',
          'Custom integrations'
        ],
        contactSales: true
      }
    ]
  });
});

/**
 * Handle Stripe webhook
 * @route POST /api/subscriptions/webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({ error: 'Missing Stripe signature' });
    }
    
    // Process the webhook event
    const { handleWebhookEvent } = require('../../utils/stripe');
    const event = await handleWebhookEvent(signature, req.body);
    
    // Handle different event types
    switch (event.type) {
      case 'invoice.payment_succeeded':
        // Update subscription status to active
        const invoice = event.data;
        if (invoice.subscription) {
          const subscription = await req.prisma.subscription.findFirst({
            where: { stripeSubId: invoice.subscription }
          });
          
          if (subscription) {
            await req.prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: 'active' }
            });
          }
        }
        break;
        
      case 'invoice.payment_failed':
        // Update subscription status to past_due
        const failedInvoice = event.data;
        if (failedInvoice.subscription) {
          const subscription = await req.prisma.subscription.findFirst({
            where: { stripeSubId: failedInvoice.subscription }
          });
          
          if (subscription) {
            await req.prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: 'past_due' }
            });
          }
        }
        break;
        
      case 'customer.subscription.deleted':
        // Update subscription to canceled
        const deletedSub = event.data;
        const subscription = await req.prisma.subscription.findFirst({
          where: { stripeSubId: deletedSub.id }
        });
        
        if (subscription) {
          await req.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'canceled',
              plan: Plan.FREE,
              monthlyMinutes: getPlanMinutes(Plan.FREE),
              stripeSubId: 'free_plan',
              endDate: new Date()
            }
          });
        }
        break;
    }
    
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

export default router;
