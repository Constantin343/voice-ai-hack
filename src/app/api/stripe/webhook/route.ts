import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('Stripe-Signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err?.message || 'Unknown error'}` },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      
      if (session.metadata?.userId) {
        await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: session.metadata.userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            is_subscribed: true,
            subscription_status: 'active'
          })
      }
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      
      await supabase
        .from('user_subscriptions')
        .update({
          is_subscribed: false,
          subscription_status: 'canceled',
          stripe_subscription_id: null
        })
        .eq('stripe_customer_id', subscription.customer)
      
      break
    }
  }

  return NextResponse.json({ received: true })
}

export const runtime = 'edge' 