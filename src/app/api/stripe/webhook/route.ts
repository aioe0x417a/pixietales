import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const sig = request.headers.get("stripe-signature")

    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      )
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    // Admin client for DB operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const userId = session.metadata?.supabase_user_id

        if (!customerId) break

        // Update the family record: set plan to 'family', store subscription ID, reset counter
        const updateData: Record<string, unknown> = {
          plan: "family",
          stripe_subscription_id: subscriptionId,
          stories_used_this_month: 0,
          billing_period_start: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Try to find by customer ID first
        const { data: existingFamily } = await supabaseAdmin
          .from("families")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (existingFamily) {
          await supabaseAdmin
            .from("families")
            .update(updateData)
            .eq("stripe_customer_id", customerId)
        } else if (userId) {
          // Fallback: upsert by user_id from metadata
          await supabaseAdmin
            .from("families")
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              ...updateData,
            }, { onConflict: "user_id" })
        }

        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const status = subscription.status

        // If subscription is active, determine plan from price
        if (status === "active") {
          const interval = subscription.items.data[0]?.price?.recurring?.interval

          // Determine plan type based on billing interval
          const plan = interval === "year" ? "annual" : "family"

          await supabaseAdmin
            .from("families")
            .update({
              plan,
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId)
        } else if (status === "past_due" || status === "unpaid") {
          // Keep the plan but log the issue -- could add grace period logic here
          console.warn(`Subscription ${subscription.id} is ${status} for customer ${customerId}`)
        }

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Downgrade to free
        await supabaseAdmin
          .from("families")
          .update({
            plan: "free",
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId)

        break
      }

      default:
        // Unhandled event type -- ignore silently
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Stripe webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
