import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { checkInterval, dateFrom, dateTo } = await request.json();

    const supabase = await createClient();

    // Calculate days
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Use database function to get pricing breakdown
    const { data, error } = await supabase.rpc("get_pricing_breakdown", {
      p_check_interval_minutes: checkInterval,
      p_days: days,
    });

    if (error) throw error;

    const breakdown = data[0];

    return NextResponse.json({
      checkInterval,
      dateFrom,
      dateTo,
      totalDays: breakdown.total_days,
      basePricePerDay: parseFloat(breakdown.base_price_per_day),
      subtotal: parseFloat(breakdown.subtotal),
      discountPercent: breakdown.discount_percent,
      discountAmount: parseFloat(breakdown.discount_amount),
      finalPrice: parseFloat(breakdown.final_price),
      checksPerDay: breakdown.checks_per_day,
    });
  } catch (error) {
    console.error("Error calculating price:", error);
    return NextResponse.json(
      { error: "Failed to calculate price" },
      { status: 500 }
    );
  }
}
