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

    console.log("[WEBHOOK] Processing payment for user:", userId);

    // Calculate days
    const startDate = new Date(purchaseData.date_range_start);
    const endDate = new Date(purchaseData.date_range_end);
    const daysPurchased =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    // Create tracker
    const { data: tracker, error: trackerError } = await supabase
      .from("trackers")
      .insert({
        user_id: userId,
        name: trackerData.name,
        description: trackerData.description,
        embassy_code: trackerData.embassy_code,
        visa_type: trackerData.visa_type,
        target_url: trackerData.target_url,
        check_interval_minutes: purchaseData.check_interval_minutes,
        preferred_date_from: trackerData.preferred_date_from,
        preferred_date_to: trackerData.preferred_date_to,
        notification_channels: trackerData.notification_channels,
        notify_on_any_slot: trackerData.notify_on_any_slot || true,
        days_purchased: daysPurchased,
        days_remaining: daysPurchased,
        activated_at: new Date().toISOString(),
        status: "active",
        next_check_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (trackerError) {
      console.error("[WEBHOOK] Error creating tracker:", trackerError);
      return;
    }

    console.log("[WEBHOOK] Tracker created:", tracker.id);

    // Create purchase record
    const { error: purchaseError } = await supabase
      .from("tracker_purchases")
      .insert({
        tracker_id: tracker.id,
        user_id: userId,
        check_interval_minutes: purchaseData.check_interval_minutes,
        days_purchased: daysPurchased,
        date_range_start: purchaseData.date_range_start,
        date_range_end: purchaseData.date_range_end,
        base_price: purchaseData.base_price,
        discount_applied: purchaseData.discount_applied,
        discount_amount: purchaseData.discount_amount,
        final_price: purchaseData.final_price,
        currency: "eur",
        payment_provider: "stripe",
        payment_intent_id: session.payment_intent as string,
        payment_status: "completed",
        completed_at: new Date().toISOString(),
      });

    if (purchaseError) {
      console.error("[WEBHOOK] Error creating purchase record:", purchaseError);
    }

    // Log audit event
    await supabase.from("audit_logs").insert({
      event_type: "tracker_created_with_purchase",
      entity_type: "tracker",
      entity_id: tracker.id,
      user_id: userId,
      event_data: {
        tracker_name: tracker.name,
        check_interval: purchaseData.check_interval_minutes,
        days_purchased: daysPurchased,
        amount_paid: purchaseData.final_price,
      },
    });

    console.log(
      "[WEBHOOK] Successfully processed payment for tracker:",
      tracker.id
    );

    // Send confirmation email
    await sendPurchaseConfirmation(
      userId,
      tracker.id,
      trackerData,
      purchaseData,
      supabase
    );
  } catch (error) {
    console.error("[WEBHOOK] Error handling successful payment:", error);
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
