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
      .select("base_url")
      .eq("code", trackerData.embassy_code)
      .single();

    if (!embassy) {
      return NextResponse.json({ error: "Embassy not found" }, { status: 404 });
    }

    // Add target URL to tracker data
    trackerData.target_url = embassy.base_url;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: Math.round(purchaseData.final_price * 100),
            product_data: {
              name: `${trackerData.name}`,
              description: `${
                Math.ceil(
                  (new Date(purchaseData.date_range_end).getTime() -
                    new Date(purchaseData.date_range_start).getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1
              } days monitoring at ${
                purchaseData.check_interval_minutes
              } min intervals`,
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
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error("Error creating checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
