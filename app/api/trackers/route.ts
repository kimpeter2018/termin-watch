import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackerData, purchaseData } = await request.json();

    console.log("[CHECKOUT] Creating session for user:", user.id);
    console.log("[CHECKOUT] Tracker data:", trackerData);
    console.log("[CHECKOUT] Purchase data:", purchaseData);

    // Get embassy details for target URL
    const { data: embassy, error: embassyError } = await supabase
      .from("embassy_configs")
      .select("base_url, name")
      .eq("code", trackerData.embassy_code)
      .single();

    if (embassyError || !embassy) {
      console.error("[CHECKOUT] Embassy fetch error:", embassyError);
      return NextResponse.json({ error: "Embassy not found" }, { status: 404 });
    }

    // IMPORTANT: Add target URL to tracker data BEFORE storing in metadata
    const completeTrackerData = {
      ...trackerData,
      target_url: embassy.base_url,
    };

    console.log("[CHECKOUT] Complete tracker data:", completeTrackerData);

    // Calculate days for display
    const startDate = new Date(purchaseData.date_range_start);
    const endDate = new Date(purchaseData.date_range_end);
    const days =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: Math.round(purchaseData.final_price * 100),
            product_data: {
              name: trackerData.name,
              description: `${days} days monitoring at ${embassy.name} - Check every ${purchaseData.check_interval_minutes} min`,
              images: [
                "https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=400",
              ],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        tracker_data: JSON.stringify(completeTrackerData), // Use complete data
        purchase_data: JSON.stringify(purchaseData),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=cancelled`,
      customer_email: user.email,
    });

    console.log("[CHECKOUT] Session created:", session.id);

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error("[CHECKOUT] Error creating checkout:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
