import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const getStripeCustomer = async (email: string, name?: string) => {
  const customers = await stripe.customers.list({ email });
  
  if (customers.data.length) {
    return customers.data[0];
  }
  
  return stripe.customers.create({
    email,
    name
  });
};