import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

// Initialize Supabase client with service role key
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

// Map Stripe price IDs to plan types
const PRICE_TO_PLAN_MAP: Record<string, 'free' | 'pro_monthly' | 'pro_annual'> = {
  [Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID')!]: 'pro_monthly',
  [Deno.env.get('STRIPE_PRO_ANNUAL_PRICE_ID')!]: 'pro_annual',
}

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()

    if (!signature) {
      throw new Error('Missing Stripe signature')
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400 }
      )
    }

    console.log('Processing webhook event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChanged(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed for session:', session.id)
  
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  
  if (!customerId || !subscriptionId) {
    throw new Error('Missing customer or subscription ID in checkout session')
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  // Get user ID from customer metadata or database
  const userId = session.metadata?.supabase_user_id
  if (!userId) {
    // Fallback: find user by Stripe customer ID
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()
    
    if (error || !profile) {
      throw new Error(`Cannot find user for customer ${customerId}`)
    }
  }

  await updateUserSubscription(subscription, userId || profile!.id)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Invoice paid:', invoice.id)
  
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) {
    console.log('No subscription associated with invoice, skipping')
    return
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = await getUserIdFromCustomer(subscription.customer as string)
  
  await updateUserSubscription(subscription, userId)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id)
  
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) {
    console.log('No subscription associated with invoice, skipping')
    return
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = await getUserIdFromCustomer(subscription.customer as string)
  
  // Update subscription status to past_due
  await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  // Update subscriptions table
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  console.log(`Updated subscription to past_due for user ${userId}`)
  
  // TODO: Trigger payment failure email
}

async function handleSubscriptionChanged(subscription: Stripe.Subscription) {
  console.log('Subscription changed:', subscription.id)
  
  const userId = await getUserIdFromCustomer(subscription.customer as string)
  await updateUserSubscription(subscription, userId)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id)
  
  const userId = await getUserIdFromCustomer(subscription.customer as string)
  
  // Update user profile
  await supabase
    .from('profiles')
    .update({
      plan_type: 'free',
      subscription_status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  // Update subscriptions table
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  console.log(`Canceled subscription for user ${userId}`)
  
  // TODO: Trigger cancellation email
}

async function getUserIdFromCustomer(customerId: string): Promise<string> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (error || !profile) {
    throw new Error(`Cannot find user for customer ${customerId}`)
  }

  return profile.id
}

async function updateUserSubscription(subscription: Stripe.Subscription, userId: string) {
  const priceId = subscription.items.data[0]?.price.id
  const planType = PRICE_TO_PLAN_MAP[priceId] || 'free'
  
  const subscriptionData = {
    plan_type: planType,
    subscription_status: subscription.status as any,
    updated_at: new Date().toISOString(),
  }

  // Update user profile
  await supabase
    .from('profiles')
    .update(subscriptionData)
    .eq('id', userId)

  // Upsert subscription record
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: subscription.status as any,
      plan_type: planType,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_subscription_id',
    })

  console.log(`Updated subscription for user ${userId} to ${planType} (${subscription.status})`)
  
  // TODO: Trigger appropriate lifecycle emails based on status change
}