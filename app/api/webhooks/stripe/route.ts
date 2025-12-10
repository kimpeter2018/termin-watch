/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to log to audit_logs
async function logWebhookEvent(
  supabase: any,
  userId: string,
  eventType: string,
  data: any,
  success: boolean
) {
  try {
    await supabase.from("audit_logs").insert({
      event_type: eventType,
      entity_type: "webhook",
      user_id: userId,
      event_data: {
        ...data,
        success,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[WEBHOOK] Failed to log audit event:", error);
  }
}

export async function POST(request: Request) {
  // Create service client FIRST for logging
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    console.log("[WEBHOOK] Received webhook request");

    if (!signature) {
      console.error("[WEBHOOK] Missing stripe-signature header");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("[WEBHOOK] Event verified:", event.type, event.id);
    } catch (err) {
      console.error("[WEBHOOK] Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(
          "[WEBHOOK] Processing checkout.session.completed:",
          session.id
        );
        await handleSuccessfulPayment(session, supabase);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[WEBHOOK] Checkout session expired:", session.id);
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK] Top-level error:", error);

    // Try to log the error
    try {
      await supabase.from("audit_logs").insert({
        event_type: "webhook_error",
        entity_type: "webhook",
        event_data: {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
    } catch (logError) {
      console.error("[WEBHOOK] Failed to log error:", logError);
    }

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
  const userId = session.metadata?.user_id;

  try {
    console.log(
      "[WEBHOOK] Starting payment processing for session:",
      session.id
    );

    if (!userId) {
      throw new Error("Missing user_id in session metadata");
    }

    await logWebhookEvent(
      supabase,
      userId,
      "webhook_started",
      {
        session_id: session.id,
      },
      true
    );

    const trackerData = JSON.parse(session.metadata?.tracker_data || "{}");
    const purchaseData = JSON.parse(session.metadata?.purchase_data || "{}");

    console.log("[WEBHOOK] Parsed metadata:");
    console.log("[WEBHOOK] - User ID:", userId);
    console.log("[WEBHOOK] - Tracker data:", trackerData);
    console.log("[WEBHOOK] - Purchase data:", purchaseData);

    // Validate required data
    if (
      !trackerData.name ||
      !trackerData.embassy_code ||
      !trackerData.target_url
    ) {
      throw new Error(
        "Missing required tracker data: " +
          JSON.stringify({
            has_name: !!trackerData.name,
            has_embassy_code: !!trackerData.embassy_code,
            has_target_url: !!trackerData.target_url,
          })
      );
    }

    // Calculate days
    const startDate = new Date(purchaseData.date_range_start);
    const endDate = new Date(purchaseData.date_range_end);
    const daysPurchased =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    console.log("[WEBHOOK] Calculated days:", daysPurchased);

    // Create tracker
    console.log("[WEBHOOK] Creating tracker...");
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
        max_check_interval_minutes: purchaseData.check_interval_minutes,
        preferred_date_from: trackerData.preferred_date_from,
        preferred_date_to: trackerData.preferred_date_to,
        notification_channels: trackerData.notification_channels || ["email"],
        notify_on_any_slot: trackerData.notify_on_any_slot ?? true,
        days_purchased: daysPurchased,
        days_remaining: daysPurchased,
        activated_at: new Date().toISOString(),
        status: "active",
        next_check_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (trackerError) {
      console.error("[WEBHOOK] Tracker creation failed:", trackerError);
      await logWebhookEvent(
        supabase,
        userId,
        "tracker_creation_failed",
        {
          error: trackerError.message,
          details: trackerError,
        },
        false
      );
      throw trackerError;
    }

    console.log("[WEBHOOK] ✅ Tracker created successfully:", tracker.id);

    await logWebhookEvent(
      supabase,
      userId,
      "tracker_created",
      {
        tracker_id: tracker.id,
        tracker_name: tracker.name,
      },
      true
    );

    // Create purchase record
    console.log("[WEBHOOK] Creating purchase record...");
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
      console.error(
        "[WEBHOOK] Purchase record creation failed:",
        purchaseError
      );
      await logWebhookEvent(
        supabase,
        userId,
        "purchase_record_failed",
        {
          error: purchaseError.message,
          tracker_id: tracker.id,
        },
        false
      );
    } else {
      console.log("[WEBHOOK] ✅ Purchase record created");
    }

    // Log final success
    await logWebhookEvent(
      supabase,
      userId,
      "tracker_created_with_purchase",
      {
        tracker_id: tracker.id,
        tracker_name: tracker.name,
        check_interval: purchaseData.check_interval_minutes,
        days_purchased: daysPurchased,
        amount_paid: purchaseData.final_price,
      },
      true
    );

    console.log(
      "[WEBHOOK] ✅ Payment processing completed for tracker:",
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
    console.error("[WEBHOOK] ❌ Error handling successful payment:", error);

    // Log the error
    if (userId) {
      await logWebhookEvent(
        supabase,
        userId,
        "webhook_processing_failed",
        {
          session_id: session.id,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
        false
      );
    }

    // Re-throw to ensure Stripe knows the webhook failed
    throw error;
  }
}

async function sendPurchaseConfirmation(
  userId: string,
  trackerId: string,
  trackerData: any,
  purchaseData: any,
  supabase: any
) {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (!user) {
      console.error("[WEBHOOK] User not found for notification:", userId);
      return;
    }

    const dateFrom = new Date(
      purchaseData.date_range_start
    ).toLocaleDateString();
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
💰 Amount Paid: €${purchaseData.final_price.toFixed(2)}

Your tracker is now actively monitoring for available appointment slots.
You'll receive instant notifications when slots become available.

View your tracker: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Best regards,
TerminWatch Team
      `,
      status: "pending",
    });

    console.log(`[WEBHOOK] ✅ Purchase confirmation queued for ${user.email}`);
  } catch (error) {
    console.error("[WEBHOOK] Failed to send confirmation:", error);
  }
}
