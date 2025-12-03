import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/trackers/[id] - Get single tracker
export async function GET(
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

    const { data: tracker, error } = await supabase
      .from("trackers")
      .select(
        `
        *,
        embassy:embassy_configs!trackers_embassy_code_fkey(*)
      `
      )
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;

    // Get recent results
    const { data: results } = await supabase
      .from("tracker_results")
      .select("*")
      .eq("tracker_id", params.id)
      .order("checked_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ tracker, results });
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

    const body = await request.json();

    // Verify ownership
    const { data: existing } = await supabase
      .from("trackers")
      .select("user_id")
      .eq("id", params.id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update tracker
    const { data: tracker, error } = await supabase
      .from("trackers")
      .update(body)
      .eq("id", params.id)
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

    // Verify ownership
    const { data: existing } = await supabase
      .from("trackers")
      .select("user_id, name")
      .eq("id", params.id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete tracker (cascade will delete results and notifications)
    const { error } = await supabase
      .from("trackers")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    // Log audit event
    await supabase.from("audit_logs").insert({
      event_type: "tracker_deleted",
      entity_type: "tracker",
      entity_id: params.id,
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
