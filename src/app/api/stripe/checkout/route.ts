import { NextResponse } from 'next/server'
import { createClient } from "@/utils/supabase/server"
import { stripe, getStripeCustomer } from '@/lib/stripe'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const customer = await getStripeCustomer(user.email!, profile?.full_name)

    // Determine base URL based on environment
    const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_BASE_URL
      : 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          price: process.env.STRIPE_PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/home?success=true`,
      cancel_url: `${baseUrl}/home?canceled=true`,
      metadata: {
        userId: user.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    )
  }
} 