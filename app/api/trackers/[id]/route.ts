import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/trackers/[id] - Get single tracker
export async function GET(
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

    // Fetch tracker
    const { data: tracker, error } = await supabase
      .from("trackers")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;

    // Fetch embassy details separately
    const { data: embassy } = await supabase
      .from("embassy_configs")
      .select("*")
      .eq("code", tracker.embassy_code)
      .single();

    // Attach embassy to tracker
    const trackerWithEmbassy = {
      ...tracker,
      embassy: embassy || null,
    };

    // Get recent results
    const { data: results } = await supabase
      .from("tracker_results")
      .select("*")
      .eq("tracker_id", id)
      .order("checked_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ tracker: trackerWithEmbassy, results });
  } catch (error) {
    console.error("Error fetching tracker:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch tracker";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/trackers/[id] - Update tracker
export async function PATCH(
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

    const body = await request.json();

    // Verify ownership
    const { data: existing } = await supabase
      .from("trackers")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update tracker
    const { data: tracker, error } = await supabase
      .from("trackers")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await supabase.from("audit_logs").insert({
      event_type: "tracker_updated",
      entity_type: "tracker",
      entity_id: tracker.id,
      user_id: user.id,
      event_data: {
        changes: Object.keys(body),
      },
    });

    return NextResponse.json({ tracker });
  } catch (error) {
    console.error("Error updating tracker:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update tracker";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/trackers/[id] - Delete tracker
export async function DELETE(
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

    // Verify ownership
    const { data: existing } = await supabase
      .from("trackers")
      .select("user_id, name")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete tracker (cascade will delete results and notifications)
    const { error } = await supabase.from("trackers").delete().eq("id", id);

    if (error) throw error;

    // Log audit event
    await supabase.from("audit_logs").insert({
      event_type: "tracker_deleted",
      entity_type: "tracker",
      entity_id: id,
      user_id: user.id,
      event_data: {
        tracker_name: existing.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tracker:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete tracker";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
