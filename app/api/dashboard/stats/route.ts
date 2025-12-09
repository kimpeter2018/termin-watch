// app/api/dashboard/stats/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the view for aggregated stats
    const { data: stats, error } = await supabase
      .from("v_user_tracker_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // If no stats exist yet (new user), return zeros
      if (error.code === "PGRST116") {
        return NextResponse.json({
          total_trackers: 0,
          active_trackers: 0,
          total_checks: 0,
          total_slots_found: 0,
          last_check_time: null,
        });
      }
      throw error;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
