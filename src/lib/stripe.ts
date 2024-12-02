import Stripe from 'stripe';
import { createClient } from "@/utils/supabase/server";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const getStripeCustomer = async (userId: string, email: string, name?: string) => {
  console.log(`[Stripe] Getting/creating customer for user: ${userId}, email: ${email}`);
  const supabase = await createClient();
  
  // First check if user already has a subscription record
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (subscription?.stripe_customer_id) {
    console.log(`[Stripe] Found existing customer ID: ${subscription.stripe_customer_id}`);
    return await stripe.customers.retrieve(subscription.stripe_customer_id);
  }
  
  console.log('[Stripe] No existing customer found, creating new customer');
  // If no existing customer, create a new one
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId // Store the Supabase user ID in Stripe metadata
    }
  });
  
  console.log(`[Stripe] Created new customer with ID: ${customer.id}`);
  // Update or create subscription record
  await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customer.id,
      is_subscribed: false,
      subscription_status: 'inactive'
    }, {
      onConflict: 'user_id'  // Specify which column determines uniqueness
    });
    
  return customer;
};