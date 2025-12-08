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

    // Get embassy details for target URL
    const { data: embassy } = await supabase
      .from("embassy_configs")
      .select("base_url, name")
      .eq("code", trackerData.embassy_code)
      .single();

    if (!embassy) {
      return NextResponse.json({ error: "Embassy not found" }, { status: 404 });
    }

    // Add target URL to tracker data
    trackerData.target_url = embassy.base_url;

    // Calculate days
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
        tracker_data: JSON.stringify(trackerData),
        purchase_data: JSON.stringify(purchaseData),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=cancelled`,
      customer_email: user.email,
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error("Error creating checkout:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
