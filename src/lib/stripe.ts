import Stripe from 'stripe';
import { createClient } from "@/utils/supabase/server";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const getStripeCustomer = async (userId: string, email: string, name?: string) => {
  const supabase = await createClient();
  
  // First check if user already has a subscription record
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  // If we have a customer ID in our database, fetch and return that customer
  if (subscription?.stripe_customer_id) {
    return await stripe.customers.retrieve(subscription.stripe_customer_id);
  }
  
  // If no existing customer, create a new one
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId // Store the Supabase user ID in Stripe metadata
    }
  });
  
  // Create initial subscription record
  await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      stripe_customer_id: customer.id,
      is_subscribed: false,
      subscription_status: 'inactive'
    });
    
  return customer;
};