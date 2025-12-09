import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/trackers - List user's trackers
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: trackers, error } = await supabase
      .from("trackers")
      .select(
        `
        *,
        embassy:embassy_configs!trackers_embassy_code_fkey(*)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ trackers });
  } catch (error) {
    console.error("Error fetching trackers:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch trackers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/trackers - Create new tracker
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Check subscription limits
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("max_trackers, min_check_interval_minutes")
      .eq("user_id", user.id)
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 }
      );
    }

    // Check current tracker count
    const { count } = await supabase
      .from("trackers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["active", "paused"]);

    if (count && count >= subscription.max_trackers) {
      return NextResponse.json(
        {
          error: `You have reached your plan limit of ${subscription.max_trackers} tracker(s)`,
        },
        { status: 403 }
      );
    }

    // Validate check interval against plan
    if (body.check_interval_minutes < subscription.min_check_interval_minutes) {
      return NextResponse.json(
        {
          error: `Your plan allows checks every ${subscription.min_check_interval_minutes} minutes minimum`,
        },
        { status: 403 }
      );
    }

    console.log("AUTH USER:", user);
    console.log("REQUEST BODY:", body);
    console.log("SUBSCRIPTION:", subscription);

    // Create tracker
    const { data: tracker, error } = await supabase
      .from("trackers")
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description,
        embassy_code: body.embassy_code,
        visa_type: body.visa_type,
        target_url: body.target_url,
        check_interval_minutes: body.check_interval_minutes,
        preferred_date_from: body.preferred_date_from || null,
        preferred_date_to: body.preferred_date_to || null,
        notification_channels: body.notification_channels || ["email"],
        notify_on_any_slot: body.notify_on_any_slot ?? true,
        notify_only_preferred_dates: body.notify_only_preferred_dates ?? false,
        status: "active",
        next_check_at: new Date().toISOString(),
      })
      .select()
      .single();

    console.log("TRACKER INSERT RESULT:", tracker);
    console.log("TRACKER INSERT ERROR:", error);
    if (error) throw error;

    // Log audit event
    await supabase.from("audit_logs").insert({
      event_type: "tracker_created",
      entity_type: "tracker",
      entity_id: tracker.id,
      user_id: user.id,
      event_data: {
        tracker_name: tracker.name,
        embassy_code: tracker.embassy_code,
      },
    });

    return NextResponse.json({ tracker }, { status: 201 });
  } catch (error) {
    console.error("Error creating tracker:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create tracker";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
