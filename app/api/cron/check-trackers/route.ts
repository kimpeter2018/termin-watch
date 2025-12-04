// app/api/cron/check-trackers/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const EDGE_FUNCTION_URL = process.env.SUPABASE_EDGE_FUNCTION_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This endpoint should be called by a cron service (Vercel Cron, Upstash QStash, etc.)
export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET!;

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Find all trackers that need checking
    const { data: trackers, error } = await supabase
      .from("trackers")
      .select("*")
      .eq("status", "active")
      .gt("days_remaining", 0)
      .lte("next_check_at", new Date().toISOString())
      .order("next_check_at", { ascending: true })
      .limit(100); // Process max 100 per run

    if (error) {
      console.error("Error fetching trackers:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!trackers || trackers.length === 0) {
      return NextResponse.json({
        message: "No trackers to check",
        checked: 0,
      });
    }

    console.log(`[CRON] Found ${trackers.length} trackers to check`);

    // Invoke Edge Function for each tracker
    const results = await Promise.allSettled(
      trackers.map((tracker) => invokeCheckFunction(tracker.id))
    );

    // Count successes and failures
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`[CRON] Completed: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      message: "Tracker checks completed",
      total: trackers.length,
      successful,
      failed,
      tracker_ids: trackers.map((t) => t.id),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST endpoint for manual triggering (admin only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if user is admin (you should have an admin role system)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tracker_id } = body;

    if (!tracker_id) {
      return NextResponse.json(
        { error: "tracker_id required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: tracker } = await supabase
      .from("trackers")
      .select("user_id")
      .eq("id", tracker_id)
      .single();

    if (!tracker || tracker.user_id !== user.id) {
      return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
    }

    // Invoke check immediately
    const result = await invokeCheckFunction(tracker_id);

    return NextResponse.json({
      message: "Manual check triggered",
      result,
    });
  } catch (error) {
    console.error("Manual trigger error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function invokeCheckFunction(trackerId: string) {
  try {
    const response = await fetch(`${EDGE_FUNCTION_URL}/check-tracker`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ tracker_id: trackerId }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Edge function failed: ${error}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error invoking check for tracker ${trackerId}:`, error);
    throw error;
  }
}
