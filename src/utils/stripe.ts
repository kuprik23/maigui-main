import Stripe from 'stripe';

// Define Plan constants (matches Prisma schema string values)
export const Plan = {
  FREE: 'FREE',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE'
} as const;

export type PlanType = typeof Plan[keyof typeof Plan];

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Plan pricing configuration
const PLAN_PRICES: Record<string, number | undefined> = {
  [Plan.FREE]: 0,
  [Plan.PRO]: 5000, // $50.00
  [Plan.ENTERPRISE]: undefined, // Custom pricing
};

// Minutes per month for each plan
const PLAN_MINUTES: Record<string, number> = {
  [Plan.FREE]: 5,
  [Plan.PRO]: 500,
  [Plan.ENTERPRISE]: 9999, // Effectively unlimited
};

/**
 * Create a new customer in Stripe
 */
export async function createCustomer(
  email: string,
  name?: string
): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
  });
  
  return customer.id;
}

/**
 * Create a subscription for a customer
 */
export async function createSubscription(
  customerId: string,
  plan: string
): Promise<{
  subscriptionId: string;
  clientSecret?: string;
  status: string;
}> {
  // Free plan doesn't need a Stripe subscription
  if (plan === Plan.FREE) {
    return {
      subscriptionId: 'free_plan',
      status: 'active',
    };
  }
  
  // Enterprise plan requires custom handling
  if (plan === Plan.ENTERPRISE) {
    return {
      subscriptionId: 'contact_sales',
      status: 'pending',
    };
  }
  
  // First create a product
  const product = await stripe.products.create({
    name: 'Em3rsa Pro Plan',
    description: '500 minutes of AI interaction per month',
  });

  // Then create a price for the product
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: PLAN_PRICES[plan],
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
  });

  // Create subscription for Pro plan
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
  
  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
  
  return {
    subscriptionId: subscription.id,
    clientSecret: paymentIntent.client_secret || undefined,
    status: subscription.status,
  };
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<boolean> {
  // Handle free and enterprise plans
  if (subscriptionId === 'free_plan' || subscriptionId === 'contact_sales') {
    return true;
  }
  
  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
}

/**
 * Update a subscription to a new plan
 */
export async function updateSubscription(
  subscriptionId: string,
  newPlan: string,
  customerId: string
): Promise<{
  subscriptionId: string;
  clientSecret?: string;
  status: string;
}> {
  // Handle special cases
  if (subscriptionId === 'free_plan' || subscriptionId === 'contact_sales') {
    return createSubscription(customerId, newPlan);
  }
  
  // Update existing subscription
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // If downgrading to free, cancel subscription
    if (newPlan === Plan.FREE) {
      await stripe.subscriptions.cancel(subscriptionId);
      return {
        subscriptionId: 'free_plan',
        status: 'active',
      };
    }
    
    // If upgrading to enterprise, cancel and create new
    if (newPlan === Plan.ENTERPRISE) {
      await stripe.subscriptions.cancel(subscriptionId);
      return {
        subscriptionId: 'contact_sales',
        status: 'pending',
      };
    }
    
    // Create a new product and price for the updated plan
    const product = await stripe.products.create({
      name: 'Em3rsa Pro Plan',
      description: '500 minutes of AI interaction per month',
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: PLAN_PRICES[newPlan],
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });

    // Update to Pro plan
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: price.id,
          },
        ],
      }
    );
    
    return {
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status,
    };
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Get minutes allowed for a plan
 */
export function getPlanMinutes(plan: string): number {
  return PLAN_MINUTES[plan];
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(
  signature: string,
  payload: Buffer
): Promise<{ type: string; data: any }> {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
    
    return {
      type: event.type,
      data: event.data.object,
    };
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
}
