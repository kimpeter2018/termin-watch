// app/api/webhooks/test/route.ts
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Test 1: Check if service client works
  const { data: testQuery, error: testError } = await supabase
    .from("users")
    .select("id, email")
    .limit(1);

  // Test 2: Try to insert an audit log
  const { data: auditLog, error: auditError } = await supabase
    .from("audit_logs")
    .insert({
      event_type: "test_event",
      entity_type: "webhook",
      event_data: { test: true, timestamp: new Date().toISOString() },
    })
    .select()
    .single();

  // Test 3: Get recent audit logs
  const { data: recentLogs, error: logsError } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    serviceClientWorks: !testError,
    testQuery: testQuery || testError,
    auditLogInserted: !auditError,
    auditLog: auditLog || auditError,
    recentLogs: recentLogs || logsError,
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
  });
}
