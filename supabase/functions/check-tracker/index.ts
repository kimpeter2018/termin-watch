/* eslint-disable @typescript-eslint/no-explicit-any */

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// supabase/functions/check-tracker/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Types
interface Tracker {
  id: string;
  user_id: string;
  name: string;
  status: string;
  embassy_code: string;
  visa_type: string;
  target_url: string;
  check_interval_minutes: number;
  preferred_date_from: string | null;
  preferred_date_to: string | null;
  excluded_dates: string[] | null;
  notification_channels: string[] | null;
  notify_on_any_slot: boolean;
  notify_only_preferred_dates: boolean;
  days_purchased: number;
  days_remaining: number;
  consecutive_errors: number;
}

interface AvailableSlot {
  date: string;
  time_slots?: string[];
  url?: string;
  appointment_type?: string;
  location?: string;
}

interface CheckResult {
  success: boolean;
  slots_found: boolean;
  available_dates: AvailableSlot[];
  total_slots_count: number;
  check_duration_ms: number;
  error_message?: string;
  error_type?: string;
  http_status_code?: number;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// MAIN HANDLER
// ============================================
serve(async (req) => {
  try {
    // Verify authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { tracker_id } = await req.json();
    if (!tracker_id) {
      return new Response(JSON.stringify({ error: "tracker_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[CHECK] Starting check for tracker: ${tracker_id}`);

    // Fetch tracker configuration
    const tracker = await fetchTrackerConfig(tracker_id);
    if (!tracker) {
      return new Response(
        JSON.stringify({ error: "Tracker not found or inactive" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if tracker has days remaining
    if (tracker.days_remaining <= 0) {
      await updateTrackerStatus(tracker_id, "expired");
      return new Response(
        JSON.stringify({
          error: "Tracker expired",
          message: "No days remaining. Please purchase more tracker-days.",
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    // Perform the check
    const startTime = Date.now();
    const result = await performCheck(tracker);
    const duration = Date.now() - startTime;

    // Store result in database
    await storeResult(tracker_id, { ...result, check_duration_ms: duration });

    // Update tracker statistics
    await updateTrackerStats(tracker_id, result);

    // If slots found, trigger notifications
    if (result.slots_found && result.available_dates.length > 0) {
      await triggerNotifications(tracker, result.available_dates);
    }

    // Calculate and update next check time
    await scheduleNextCheck(tracker_id, tracker.check_interval_minutes);

    console.log(
      `[CHECK] Completed for ${tracker_id}: ${
        result.slots_found ? "SLOTS FOUND" : "No slots"
      }`
    );

    return new Response(
      JSON.stringify({
        success: true,
        tracker_id,
        result,
        duration_ms: duration,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[CHECK] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ============================================
// DATABASE FUNCTIONS
// ============================================

async function fetchTrackerConfig(trackerId: string): Promise<Tracker | null> {
  const { data, error } = await supabase
    .from("trackers")
    .select("*")
    .eq("id", trackerId)
    .eq("status", "active")
    .single();

  if (error) {
    console.error("[DB] Error fetching tracker:", error);
    return null;
  }

  return data as Tracker;
}

async function storeResult(trackerId: string, result: CheckResult) {
  const { error } = await supabase.from("tracker_results").insert({
    tracker_id: trackerId,
    checked_at: new Date().toISOString(),
    success: result.success,
    slots_found: result.slots_found,
    available_dates: result.available_dates,
    total_slots_count: result.total_slots_count,
    check_duration_ms: result.check_duration_ms,
    error_message: result.error_message || null,
    error_type: result.error_type || null,
    http_status_code: result.http_status_code || null,
  });

  if (error) {
    console.error("[DB] Error storing result:", error);
  }
}

async function updateTrackerStats(trackerId: string, result: CheckResult) {
  const updates: Record<string, any> = {
    total_checks: supabase.rpc("increment", { x: 1 }),
    last_checked_at: new Date().toISOString(),
  };

  if (result.success) {
    updates.consecutive_errors = 0;
    updates.last_error_message = null;
    updates.last_error_at = null;

    if (result.slots_found) {
      updates.total_slots_found = supabase.rpc("increment", {
        x: result.total_slots_count,
      });
      updates.last_slot_found_at = new Date().toISOString();
    }
  } else {
    updates.consecutive_errors = supabase.rpc("increment", { x: 1 });
    updates.last_error_message = result.error_message;
    updates.last_error_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("trackers")
    .update(updates)
    .eq("id", trackerId);

  if (error) {
    console.error("[DB] Error updating tracker stats:", error);
  }

  // Auto-pause if too many consecutive errors
  const { data: tracker } = await supabase
    .from("trackers")
    .select("consecutive_errors")
    .eq("id", trackerId)
    .single();

  if (tracker && tracker.consecutive_errors >= 10) {
    await updateTrackerStatus(trackerId, "error");
    console.warn(`[DB] Tracker ${trackerId} auto-paused due to errors`);
  }
}

async function updateTrackerStatus(trackerId: string, status: string) {
  await supabase.from("trackers").update({ status }).eq("id", trackerId);
}

async function scheduleNextCheck(trackerId: string, intervalMinutes: number) {
  const nextCheckAt = new Date(Date.now() + intervalMinutes * 60 * 1000);

  const { error } = await supabase
    .from("trackers")
    .update({ next_check_at: nextCheckAt.toISOString() })
    .eq("id", trackerId);

  if (error) {
    console.error("[DB] Error scheduling next check:", error);
  }
}

async function triggerNotifications(tracker: Tracker, slots: AvailableSlot[]) {
  console.log(`[NOTIFY] Triggering notifications for tracker ${tracker.id}`);

  // Filter slots based on user preferences
  const filteredSlots = filterSlotsByPreferences(tracker, slots);

  if (filteredSlots.length === 0) {
    console.log("[NOTIFY] No slots match user preferences");
    return;
  }

  // Create notification records for each channel
  for (const channel of tracker.notification_channels || ["email"]) {
    const { error } = await supabase.from("notifications").insert({
      tracker_id: tracker.id,
      user_id: tracker.user_id,
      type: channel,
      channel_destination: "", // Will be filled by notification service
      subject: `🎉 Appointment Available: ${tracker.name}`,
      message: formatNotificationMessage(tracker, filteredSlots),
      slots_data: filteredSlots,
      status: "pending",
    });

    if (error) {
      console.error(`[NOTIFY] Error creating ${channel} notification:`, error);
    }
  }
}

// ============================================
// SCRAPING FUNCTIONS
// ============================================

async function performCheck(tracker: Tracker): Promise<CheckResult> {
  try {
    console.log(
      `[SCRAPE] Checking ${tracker.embassy_code} - ${tracker.target_url}`
    );

    // Fetch embassy configuration
    const { data: embassyConfig } = await supabase
      .from("embassy_configs")
      .select("*")
      .eq("code", tracker.embassy_code)
      .single();

    if (!embassyConfig) {
      throw new Error(`Embassy config not found: ${tracker.embassy_code}`);
    }

    // Choose scraping method based on embassy requirements
    if (embassyConfig.requires_browser) {
      // Browser-based scraping (to be implemented in next step)
      return await scrapWithBrowser(tracker, embassyConfig);
    } else {
      // Simple HTTP scraping
      return await scrapeWithHTTP(tracker, embassyConfig);
    }
  } catch (error) {
    console.error("[SCRAPE] Error:", error);
    return {
      success: false,
      slots_found: false,
      available_dates: [],
      total_slots_count: 0,
      check_duration_ms: 0,
      error_message: error instanceof Error ? error.message : "Unknown error",
      error_type: "network",
    };
  }
}

async function scrapeWithHTTP(
  tracker: Tracker,
  embassyConfig: any
): Promise<CheckResult> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  };

  const response = await fetch(tracker.target_url, {
    method: "GET",
    headers,
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();

  // Check if CAPTCHA is present
  if (html.includes("captchaText") || html.includes("captcha")) {
    console.log("[SCRAPE] CAPTCHA detected - needs solving service");
    return {
      success: false,
      slots_found: false,
      available_dates: [],
      total_slots_count: 0,
      check_duration_ms: 0,
      error_message: "CAPTCHA required",
      error_type: "captcha",
      http_status_code: response.status,
    };
  }

  // Parse HTML for available dates
  const slots = parseAvailableDates(html, embassyConfig, tracker);

  return {
    success: true,
    slots_found: slots.length > 0,
    available_dates: slots,
    total_slots_count: slots.length,
    check_duration_ms: 0,
    http_status_code: response.status,
  };
}

async function scrapWithBrowser(
  tracker: Tracker,
  embassyConfig: any
): Promise<CheckResult> {
  // Placeholder for browser-based scraping
  console.log("[SCRAPE] Browser scraping not yet implemented");
  return {
    success: false,
    slots_found: false,
    available_dates: [],
    total_slots_count: 0,
    check_duration_ms: 0,
    error_message: "Browser scraping not implemented",
    error_type: "parsing",
  };
}

function parseAvailableDates(
  html: string,
  embassyConfig: any,
  tracker: Tracker
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];

  try {
    // German embassy specific parsing
    if (embassyConfig.booking_system === "termin-online") {
      // Look for available date indicators
      // Example pattern: <td class="nat_calendar_day_available">15</td>
      const availableDayPattern =
        /class="nat_calendar_day_available[^"]*"[^>]*>(\d+)</g;
      const matches = [...html.matchAll(availableDayPattern)];

      // Look for month/year context
      const monthYearPattern = /calendar_month[^>]*>([^<]+)</;
      const monthYearMatch = html.match(monthYearPattern);
      const currentMonth = monthYearMatch ? monthYearMatch[1] : "";

      for (const match of matches) {
        const day = match[1];
        // Construct approximate date (needs refinement based on actual HTML structure)
        const date = constructDate(day, currentMonth);

        if (date) {
          slots.push({
            date: date,
            appointment_type: tracker.visa_type,
            location: embassyConfig.name,
            url: tracker.target_url,
          });
        }
      }

      // Alternative: Look for "no appointments available" message
      if (
        html.includes("keine Termine") ||
        html.includes("no appointments") ||
        html.includes("Derzeit keine Termine")
      ) {
        console.log("[PARSE] No appointments message found");
        return [];
      }
    }

    // VFS Global specific parsing
    else if (embassyConfig.booking_system === "vfs") {
      // Look for VFS calendar date slots
      const vfsPattern = /data-date="([^"]+)"[^>]*class="[^"]*available/g;
      const matches = [...html.matchAll(vfsPattern)];

      for (const match of matches) {
        slots.push({
          date: match[1],
          appointment_type: tracker.visa_type,
          location: embassyConfig.name,
          url: tracker.target_url,
        });
      }
    }

    console.log(`[PARSE] Found ${slots.length} available slots`);
  } catch (error) {
    console.error("[PARSE] Error parsing HTML:", error);
  }

  return slots;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function constructDate(day: string, monthYear: string): string | null {
  try {
    // Parse German month names to date
    const monthMap: Record<string, number> = {
      Januar: 0,
      Februar: 1,
      März: 2,
      April: 3,
      Mai: 4,
      Juni: 5,
      Juli: 6,
      August: 7,
      September: 8,
      Oktober: 9,
      November: 10,
      Dezember: 11,
    };

    const parts = monthYear.trim().split(" ");
    if (parts.length !== 2) return null;

    const month = monthMap[parts[0]];
    const year = parseInt(parts[1]);

    if (month === undefined || isNaN(year)) return null;

    const date = new Date(year, month, parseInt(day));
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
  } catch {
    return null;
  }
}

function filterSlotsByPreferences(
  tracker: Tracker,
  slots: AvailableSlot[]
): AvailableSlot[] {
  let filtered = slots;

  // Filter by date range if specified
  if (tracker.preferred_date_from || tracker.preferred_date_to) {
    filtered = filtered.filter((slot) => {
      const slotDate = new Date(slot.date);

      if (tracker.preferred_date_from) {
        const fromDate = new Date(tracker.preferred_date_from);
        if (slotDate < fromDate) return false;
      }

      if (tracker.preferred_date_to) {
        const toDate = new Date(tracker.preferred_date_to);
        if (slotDate > toDate) return false;
      }

      return true;
    });
  }

  // Exclude specific dates
  if (tracker.excluded_dates && tracker.excluded_dates.length > 0) {
    filtered = filtered.filter(
      (slot) => !tracker.excluded_dates!.includes(slot.date)
    );
  }

  // If user wants ONLY preferred dates and none matched, return empty
  if (tracker.notify_only_preferred_dates && filtered.length === 0) {
    return [];
  }

  // If user wants any slot, return all or filtered
  if (tracker.notify_on_any_slot) {
    return filtered.length > 0 ? filtered : slots;
  }

  return filtered;
}

function formatNotificationMessage(
  tracker: Tracker,
  slots: AvailableSlot[]
): string {
  const slotList = slots
    .slice(0, 5)
    .map(
      (s) =>
        `• ${s.date}${s.time_slots ? ` at ${s.time_slots.join(", ")}` : ""}`
    )
    .join("\n");

  return `Great news! Appointment slots are now available for ${tracker.name}:

${slotList}

${slots.length > 5 ? `... and ${slots.length - 5} more slots` : ""}

Book now before they're gone: ${slots[0]?.url || tracker.target_url}

--
TerminWatch - Your visa appointment tracker`;
}

console.log("Edge Function: check-tracker loaded");

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/check-tracker' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
