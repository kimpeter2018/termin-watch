import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: locations, error } = await supabase
      .from("embassy_configs")
      .select("code, name, city, country_code, supported_visa_types")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
