import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
  console.log('Webhook received')
  
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('Stripe-Signature') as string

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    console.log('✅ Webhook verified, event type:', event.type)
  } catch (err: any) {
    console.error('❌ Webhook verification failed:', err.message)
    return new NextResponse(
      JSON.stringify({ error: `Webhook Error: ${err?.message || 'Unknown error'}` }),
      { status: 400 }
    )
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('💳 Processing checkout session:', session.id)
      
      if (session.metadata?.userId) {
        try {
          const { error } = await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: session.metadata.userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              is_subscribed: true,
              subscription_status: 'active'
            })
          
          if (error) throw error
          console.log('✨ Subscription updated successfully')
        } catch (error) {
          console.error('Error updating subscription:', error)
          return new NextResponse(
            JSON.stringify({ error: 'Error updating subscription' }),
            { status: 500 }
          )
        }
      }
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      
      try {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            is_subscribed: false,
            subscription_status: 'canceled',
            stripe_subscription_id: null
          })
          .eq('stripe_customer_id', subscription.customer)
        
        if (error) throw error
        console.log('✅ Subscription deletion processed')
      } catch (error) {
        console.error('Error processing subscription deletion:', error)
        return new NextResponse(
          JSON.stringify({ error: 'Error processing subscription deletion' }),
          { status: 500 }
        )
      }
      break
    }
  }

  return new NextResponse(JSON.stringify({ received: true }), { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
