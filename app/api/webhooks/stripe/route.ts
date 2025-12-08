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

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = await createClient();

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
    const userId = session.metadata?.user_id;
    const trackerData = JSON.parse(session.metadata?.tracker_data || "{}");
    const purchaseData = JSON.parse(session.metadata?.purchase_data || "{}");

    if (!userId || !trackerData || !purchaseData) {
      console.error("Missing metadata in session:", session.id);
      return;
    }

    // Add payment intent ID to purchase data
    purchaseData.payment_intent_id = session.payment_intent as string;

    // Use database function to create tracker with purchase
    const { data: trackerId, error } = await supabase.rpc(
      "create_tracker_with_purchase",
      {
        p_user_id: userId,
        p_tracker_data: trackerData,
        p_purchase_data: purchaseData,
      }
    );

    if (error) {
      console.error("Error creating tracker:", error);
      return;
    }

    console.log(`Successfully created tracker ${trackerId} with purchase`);

    // Send confirmation email
    await sendPurchaseConfirmation(
      userId,
      trackerId,
      trackerData,
      purchaseData,
      supabase
    );
  } catch (error) {
    console.error("Error handling successful payment:", error);
  }
}

async function sendPurchaseConfirmation(
  userId: string,
  trackerId: string,
  trackerData: any,
  purchaseData: any,
  supabase: any
) {
  const { data: user } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  if (!user) return;

  const dateFrom = new Date(purchaseData.date_range_start).toLocaleDateString();
  const dateTo = new Date(purchaseData.date_range_end).toLocaleDateString();
  const days =
    Math.ceil(
      (new Date(purchaseData.date_range_end).getTime() -
        new Date(purchaseData.date_range_start).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  await supabase.from("notifications").insert({
    tracker_id: trackerId,
    user_id: userId,
    type: "email",
    channel_destination: user.email,
    subject: `✅ Tracker Activated: ${trackerData.name}`,
    message: `
Hi ${user.full_name || "there"},

Your appointment tracker has been activated!

📍 Location: ${trackerData.embassy_code}
📅 Monitoring Period: ${dateFrom} - ${dateTo} (${days} days)
⏱️ Check Frequency: Every ${purchaseData.check_interval_minutes} minutes
💰 Amount Paid: $${purchaseData.final_price.toFixed(2)}

Your tracker is now actively monitoring for available appointment slots.
You'll receive instant notifications when slots become available.

View your tracker: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Best regards,
TerminWatch Team
    `,
    status: "pending",
  });

  console.log(`Purchase confirmation queued for ${user.email}`);
}
