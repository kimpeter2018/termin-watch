import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";

// Singleton instance
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null =
  null;

/**
 * Creates or returns the existing Supabase client instance (Browser-side)
 * This implements the Singleton pattern to ensure only one client exists
 * throughout the application lifecycle
 */
export function createClient() {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  // Create new instance
  supabaseInstance = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );

  return supabaseInstance;
}

/**
 * Gets the existing Supabase client instance without creating a new one
 * Throws an error if the client hasn't been initialized yet
 */
export function getClient() {
  if (!supabaseInstance) {
    throw new Error(
      "Supabase client not initialized. Call createClient() first."
    );
  }
  return supabaseInstance;
}

/**
 * For testing purposes only - resets the singleton instance
 * WARNING: Only use this in test environments
 */
export function resetClient() {
  if (process.env.NODE_ENV !== "test") {
    console.warn("resetClient() should only be used in test environments");
  }
  supabaseInstance = null;
}
