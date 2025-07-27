import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  console.log("🚀 WEBHOOK ENDPOINT HIT!")
  console.log("🚀 Timestamp:", new Date().toISOString())
  console.log("🚀 URL:", request.url)
  console.log("🚀 Method:", request.method)
  
  try {
    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get("stripe-signature")!

    console.log("📨 Webhook received - Headers:", {
      signature: sig ? "present" : "missing",
      contentType: headersList.get("content-type"),
      bodyLength: body.length,
      userAgent: headersList.get("user-agent")
    })
    
    console.log("📨 Raw body preview:", body.substring(0, 200))
    
    // For testing - check if this is from ngrok/Stripe
    if (!sig) {
      console.log("⚠️ No stripe-signature header found")
      return NextResponse.json({ error: "No signature header" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      console.log(`🔐 Attempting webhook verification with secret: ${endpointSecret?.substring(0, 10)}...`)
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
      console.log(`✅ Webhook verified - Event: ${event.type}, ID: ${event.id}`)
    } catch (err) {
      console.error(`❌ Webhook signature verification failed:`, err)
      console.log(`🔐 Expected secret starts with: ${endpointSecret?.substring(0, 10)}...`)
      console.log(`🔐 Signature received: ${sig?.substring(0, 50)}...`)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Handle the event
    console.log(`🎯 Processing webhook event: ${event.type}`)
    console.log(`📋 Event data:`, JSON.stringify(event.data.object, null, 2))
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription)
        break
      
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`)
        console.log(`📄 Event data:`, JSON.stringify(event.data.object, null, 2))
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('🎯 Processing checkout.session.completed:', {
      sessionId: session.id,
      customerId: session.customer,
      customerEmail: session.customer_details?.email,
      metadata: session.metadata,
      clientReferenceId: session.client_reference_id,
      subscriptionId: session.subscription
    })

    const customerEmail = session.customer_details?.email
    const userId = session.metadata?.user_id || session.client_reference_id
    const customerId = session.customer as string

    if (customerEmail || userId) {
      console.log(`🔄 Attempting to update user: ${userId || customerEmail}`)
      
      // Update user with Stripe customer ID
      const { data, error } = await supabase
        .from('users')
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq(userId ? 'id' : 'email', userId || customerEmail)
        .select()

      if (error) {
        console.error('❌ Error updating user with customer ID:', error)
      } else {
        console.log(`✅ Updated user ${userId || customerEmail} with customer ID ${customerId}`, data)
        
        // If there's a subscription in the checkout, manually trigger subscription update
        if (session.subscription) {
          console.log(`🔄 Checkout has subscription ${session.subscription}, fetching details...`)
          try {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
            await handleSubscriptionUpdate(subscription)
          } catch (subError) {
            console.error('❌ Error handling subscription from checkout:', subError)
          }
        }
      }
    } else {
      console.warn('⚠️ No user identifier found in checkout session')
    }
  } catch (error) {
    console.error('❌ Error in handleCheckoutCompleted:', error)
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string
    
    // Get subscription type from price ID or product metadata
    const subscriptionType = getSubscriptionTypeFromSubscription(subscription)
    
    // Determine if user is in trial
    const isInTrial = subscription.status === 'trialing'
    const trialStartDate = subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null
    const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
    
    console.log(`📋 Subscription update for ${customerId}:`, {
      subscriptionId: subscription.id,
      status: subscription.status,
      type: subscriptionType,
      isInTrial,
      trialEndDate,
      priceAmount: subscription.items.data[0]?.price.unit_amount
    })
    
    // First, check if the user exists with this stripe_customer_id
    let { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('stripe_customer_id', customerId)
      .single()
    
    // If not found by stripe_customer_id, try to get customer email from Stripe and match by email
    if (findError || !existingUser) {
      console.log(`⚠️ User not found with stripe_customer_id: ${customerId}, trying to find by email...`)
      
      try {
        // Get customer details from Stripe
        const customer = await stripe.customers.retrieve(customerId)
        if (customer && !customer.deleted && customer.email) {
          console.log(`🔍 Found Stripe customer email: ${customer.email}`)
          
          // Try to find user by email
          const { data: userByEmail, error: emailError } = await supabase
            .from('users')
            .select('id, email, stripe_customer_id')
            .eq('email', customer.email)
            .single()
          
          if (!emailError && userByEmail) {
            console.log(`✅ Found user by email: ${userByEmail.email}`)
            
            // Update the user with the stripe_customer_id for future webhooks
            await supabase
              .from('users')
              .update({ stripe_customer_id: customerId })
              .eq('id', userByEmail.id)
            
            existingUser = { ...userByEmail, stripe_customer_id: customerId }
            console.log(`🔗 Updated user ${userByEmail.id} with stripe_customer_id: ${customerId}`)
          }
        }
      } catch (stripeError) {
        console.error(`❌ Error fetching customer from Stripe:`, stripeError)
      }
    }
    
    if (!existingUser) {
      console.error(`❌ User not found by stripe_customer_id or email for customer: ${customerId}`)
      return
    }
    
    console.log(`🔍 Found user for update:`, {
      userId: existingUser.id,
      email: existingUser.email,
      stripeCustomerId: existingUser.stripe_customer_id
    })
    
    // Update user subscription information
    const { data: updateResult, error } = await supabase
      .from('users')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_type: subscriptionType,
        subscription_status: subscription.status,
        subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_start_date: trialStartDate,
        trial_end_date: trialEndDate,
        trial_ending_notified: false, // Reset trial notification flag
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', customerId)
      .select()

    if (error) {
      console.error('❌ Error updating user subscription:', error)
    } else {
      console.log(`✅ Updated subscription for customer ${customerId}:`, {
        updateResult,
        type: subscriptionType,
        status: subscription.status,
        trial: isInTrial ? `ends ${trialEndDate}` : 'none'
      })
    }
  } catch (error) {
    console.error('❌ Error in handleSubscriptionUpdate:', error)
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string
    
    const { error } = await supabase
      .from('users')
      .update({
        subscription_type: 'free',
        subscription_status: 'canceled',
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', customerId)

    if (error) {
      console.error('❌ Error canceling user subscription:', error)
    } else {
      console.log(`✅ Canceled subscription for customer ${customerId}`)
    }
  } catch (error) {
    console.error('❌ Error in handleSubscriptionCanceled:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string
    
    // Update subscription status to active on successful payment
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', customerId)

    if (error) {
      console.error('❌ Error updating payment success:', error)
    } else {
      console.log(`✅ Payment succeeded for customer ${customerId}`)
    }
  } catch (error) {
    console.error('❌ Error in handlePaymentSucceeded:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string
    
    // Update subscription status to past_due on failed payment
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', customerId)

    if (error) {
      console.error('❌ Error updating payment failure:', error)
    } else {
      console.log(`⚠️ Payment failed for customer ${customerId}`)
    }
  } catch (error) {
    console.error('❌ Error in handlePaymentFailed:', error)
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string
    const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
    
    console.log(`⏰ Trial will end for customer ${customerId} on ${trialEndDate?.toISOString()}`)
    
    // Update user with trial ending notification
    const { error } = await supabase
      .from('users')
      .update({
        trial_ending_notified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', customerId)

    if (error) {
      console.error('❌ Error updating trial will end:', error)
    } else {
      console.log(`✅ Marked trial will end notification for customer ${customerId}`)
    }

    // Here you could also send an email notification to the user
    // notifying them that their trial is ending soon
    
  } catch (error) {
    console.error('❌ Error in handleTrialWillEnd:', error)
  }
}

function getSubscriptionTypeFromSubscription(subscription: Stripe.Subscription): 'basic' | 'pro' | 'enterprise' {
  // Check the payment links in URL metadata or product metadata
  const priceId = subscription.items.data[0]?.price.id
  const productId = subscription.items.data[0]?.price.product as string
  
  // Map based on price amounts or product metadata
  const price = subscription.items.data[0]?.price
  if (price) {
    const monthlyAmount = price.unit_amount || 0
    
    // Basic: $39/month = 3900 cents
    if (monthlyAmount >= 2900 && monthlyAmount <= 3900) return 'basic'
    // Pro: $79/month = 7900 cents  
    if (monthlyAmount >= 6900 && monthlyAmount <= 7900) return 'pro'
    // Enterprise: $180/month = 18000 cents
    if (monthlyAmount >= 16000) return 'enterprise'
  }
  
  // Default to basic if we can't determine
  return 'basic'
}