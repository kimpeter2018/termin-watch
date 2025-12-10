import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/trackers/[id]/toggle - Pause/Resume tracker
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current status
    const { data: tracker } = await supabase
      .from("trackers")
      .select("status, user_id, days_remaining")
      .eq("id", id)
      .single();

    if (!tracker || tracker.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Don't allow toggling expired trackers
    if (tracker.status === "expired" || tracker.days_remaining <= 0) {
      return NextResponse.json(
        { error: "Cannot resume expired tracker. Please extend first." },
        { status: 400 }
      );
    }

    // Toggle status
    const newStatus = tracker.status === "active" ? "paused" : "active";

    const { data: updated, error } = await supabase
      .from("trackers")
      .update({
        status: newStatus,
        // Update next_check_at when resuming
        ...(newStatus === "active" && {
          next_check_at: new Date().toISOString(),
        }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await supabase.from("audit_logs").insert({
      event_type: newStatus === "active" ? "tracker_resumed" : "tracker_paused",
      entity_type: "tracker",
      entity_id: id,
      user_id: user.id,
    });

    return NextResponse.json({ tracker: updated });
  } catch (error) {
    console.error("Error toggling tracker:", error);
    const message =
      error instanceof Error ? error.message : "Failed to toggle tracker";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
