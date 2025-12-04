/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = await createClient();

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session, supabase);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session expired:", session.id);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error("Payment failed:", paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  try {
    const trackerId = session.metadata?.tracker_id;
    const userId = session.metadata?.user_id;
    const daysPurchased = parseInt(session.metadata?.days_purchased || "0");

    if (!trackerId || !userId || !daysPurchased) {
      console.error("Missing metadata in session:", session.id);
      return;
    }

    // Add days to tracker using database function
    const { data, error } = await supabase.rpc("add_tracker_days", {
      p_tracker_id: trackerId,
      p_days: daysPurchased,
      p_amount: (session.amount_total || 0) / 100, // Convert cents to dollars
      p_payment_intent_id: session.payment_intent as string,
    });

    if (error) {
      console.error("Error adding tracker days:", error);
      return;
    }

    console.log(
      `Successfully added ${daysPurchased} days to tracker ${trackerId}`
    );

    // Send confirmation email (to be implemented)
    await sendPurchaseConfirmation(userId, trackerId, daysPurchased, supabase);
  } catch (error) {
    console.error("Error handling successful payment:", error);
  }
}

async function sendPurchaseConfirmation(
  userId: string,
  trackerId: string,
  days: number,
  supabase: any
) {
  // Get user and tracker details
  const { data: user } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  const { data: tracker } = await supabase
    .from("trackers")
    .select("name, embassy_code")
    .eq("id", trackerId)
    .single();

  if (!user || !tracker) return;

  // Create notification record (email will be sent by notification service)
  await supabase.from("notifications").insert({
    tracker_id: trackerId,
    user_id: userId,
    type: "email",
    channel_destination: user.email,
    subject: `✅ Purchase Confirmed: ${days} Tracker-Days`,
    message: `
Hi ${user.full_name || "there"},

Your purchase of ${days} tracker-day${days > 1 ? "s" : ""} has been confirmed!

Tracker: ${tracker.name}
Location: ${tracker.embassy_code}
Monitoring Duration: ${days} day${days > 1 ? "s" : ""}

Your tracker is now active and checking for available appointment slots.
You'll receive notifications as soon as slots become available.

View your tracker: ${
      process.env.NEXT_PUBLIC_APP_URL
    }/dashboard/trackers/${trackerId}

Best regards,
TerminWatch Team
    `,
    status: "pending",
  });

  console.log(`Purchase confirmation queued for ${user.email}`);
}
