// app/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from("users")
        .select("id, onboarding_completed")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        // Create user profile if it doesn't exist
        await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || null,
          passport_country: null,
          onboarding_completed: false,
          avatar_url: data.user.user_metadata?.avatar_url || null,
        });

        // Redirect to onboarding for new users
        return NextResponse.redirect(`${origin}/onboarding`);
      } else if (!existingProfile.onboarding_completed) {
        // Redirect to onboarding if not completed
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  // Redirect to dashboard for existing users who completed onboarding
  return NextResponse.redirect(`${origin}/dashboard`);
}
