import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/trackers/[id]/toggle - Pause/Resume tracker
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
      .select("status, user_id")
      .eq("id", params.id)
      .single();

    if (!tracker || tracker.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Toggle status
    const newStatus = tracker.status === "active" ? "paused" : "active";

    const { data: updated, error } = await supabase
      .from("trackers")
      .update({ status: newStatus })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await supabase.from("audit_logs").insert({
      event_type: newStatus === "active" ? "tracker_resumed" : "tracker_paused",
      entity_type: "tracker",
      entity_id: params.id,
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
