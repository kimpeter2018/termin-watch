import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: plans, error } = await supabase
      .from("pricing_plans")
      .select("*")
      .eq("is_active", true)
      .order("check_interval_minutes");

    if (error) throw error;

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing plans" },
      { status: 500 }
    );
  }
}
