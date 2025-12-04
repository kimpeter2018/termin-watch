export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["users"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };

      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "free" | "pro" | "premium";
          status: "active" | "cancelled" | "past_due" | "paused";
          max_trackers: number;
          min_check_interval_minutes: number;
          notification_channels: ("email" | "sms" | "whatsapp" | "push")[];
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_subscriptions"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["user_subscriptions"]["Insert"]
        >;
      };

      trackers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: "active" | "paused" | "error" | "expired";
          embassy_code: string;
          visa_type: string;
          target_url: string;
          check_interval_minutes: 1 | 5 | 15 | 30 | 60;
          last_checked_at: string | null;
          next_check_at: string | null;
          preferred_date_from: string | null;
          preferred_date_to: string | null;
          excluded_dates: string[] | null;
          notification_channels: ("email" | "sms" | "whatsapp" | "push")[];
          notify_on_any_slot: boolean;
          notify_only_preferred_dates: boolean;
          total_checks: number;
          total_slots_found: number;
          total_notifications_sent: number;
          last_slot_found_at: string | null;
          consecutive_errors: number;
          last_error_message: string | null;
          last_error_at: string | null;
          days_purchased: number;
          days_remaining: number;
          activated_at: string | null;
          deactivated_at: string | null;
          auto_renew: boolean;
          created_at: string;
          updated_at: string;
          expires_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["trackers"]["Row"],
          | "id"
          | "created_at"
          | "updated_at"
          | "total_checks"
          | "total_slots_found"
          | "total_notifications_sent"
          | "consecutive_errors"
        >;
        Update: Partial<Database["public"]["Tables"]["trackers"]["Insert"]>;
      };

      tracker_purchases: {
        Row: {
          id: string;
          tracker_id: string;
          user_id: string;
          days_purchased: number;
          amount_paid: number;
          currency: string;
          payment_provider: string | null;
          payment_intent_id: string | null;
          payment_status: "pending" | "completed" | "failed" | "refunded";
          created_at: string;
          completed_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["tracker_purchases"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["tracker_purchases"]["Insert"]
        >;
      };

      pricing_plans: {
        Row: {
          id: string;
          days: number;
          price_usd: number;
          discount_pct: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["pricing_plans"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["pricing_plans"]["Insert"]
        >;
      };

      tracker_results: {
        Row: {
          id: string;
          tracker_id: string;
          checked_at: string;
          check_duration_ms: number | null;
          slots_found: boolean;
          available_dates: AvailableSlot[] | null;
          total_slots_count: number;
          http_status_code: number | null;
          response_size_bytes: number | null;
          success: boolean;
          error_message: string | null;
          error_type:
            | "network"
            | "parsing"
            | "timeout"
            | "captcha"
            | "rate_limit"
            | null;
          raw_response: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["tracker_results"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["tracker_results"]["Insert"]
        >;
      };

      notifications: {
        Row: {
          id: string;
          tracker_id: string;
          user_id: string;
          type: "email" | "sms" | "whatsapp" | "push";
          channel_destination: string;
          subject: string | null;
          message: string;
          slots_data: AvailableSlot[] | null;
          status: "pending" | "sent" | "failed" | "bounced";
          sent_at: string | null;
          delivered_at: string | null;
          error_message: string | null;
          retry_count: number;
          provider: string | null;
          provider_message_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["notifications"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["notifications"]["Insert"]
        >;
      };

      embassy_configs: {
        Row: {
          id: string;
          code: string;
          country_code: string;
          city: string;
          name: string;
          booking_system: "termin-online" | "vfs" | "ustraveldocs" | "custom";
          base_url: string;
          supported_visa_types: string[];
          selectors: EmbassySelectors | null;
          requires_browser: boolean;
          has_captcha: boolean;
          rate_limit_per_hour: number;
          is_active: boolean;
          last_successful_check: string | null;
          last_failed_check: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["embassy_configs"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["embassy_configs"]["Insert"]
        >;
      };

      audit_logs: {
        Row: {
          id: string;
          event_type: string;
          entity_type: "tracker" | "notification" | "subscription";
          entity_id: string | null;
          user_id: string | null;
          event_data: Record<string, unknown> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["audit_logs"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
    };

    Views: {
      v_user_tracker_stats: {
        Row: {
          user_id: string;
          total_trackers: number;
          active_trackers: number;
          total_checks: number;
          total_slots_found: number;
          last_check_time: string | null;
        };
      };

      v_recent_slots: {
        Row: {
          id: string;
          tracker_id: string;
          tracker_name: string;
          embassy_code: string;
          checked_at: string;
          available_dates: AvailableSlot[] | null;
          total_slots_count: number;
        };
      };
    };
  };
}

// ============================================
// Custom Types
// ============================================

export interface AvailableSlot {
  date: string; // ISO date string
  time_slots?: string[]; // e.g., ['09:00', '14:30']
  url?: string; // Direct booking URL if available
  appointment_type?: string;
  location?: string; // Embassy/ABH location
}

// German Visa Types
export type GermanVisaType =
  | "national" // National Visa (>90 days)
  | "schengen" // Schengen Visa (<90 days)
  | "student" // Student Visa
  | "work" // Work Visa
  | "family" // Family Reunion
  | "residence_permit" // Residence Permit (Aufenthaltstitel)
  | "extension" // Extension of Residence Permit
  | "blue_card" // EU Blue Card
  | "registration"; // Initial Registration (Anmeldung)

// Location Types
export type LocationType = "embassy" | "consulate" | "auslaenderbehorde";

export interface EmbassySelectors {
  date_container?: string;
  available_date_class?: string;
  slot_time_class?: string;
  booking_button?: string;
  no_slots_message?: string;
  custom_selectors?: Record<string, string>;
}

export interface TrackerPreferences {
  preferred_date_from?: string;
  preferred_date_to?: string;
  excluded_dates?: string[];
  notify_on_any_slot?: boolean;
  notify_only_preferred_dates?: boolean;
}

export interface NotificationPayload {
  tracker_name: string;
  embassy_name: string;
  slots: AvailableSlot[];
  tracker_url: string;
}

// ============================================
// Convenience Types
// ============================================

export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type Subscription =
  Database["public"]["Tables"]["user_subscriptions"]["Row"];
export type SubscriptionInsert =
  Database["public"]["Tables"]["user_subscriptions"]["Insert"];
export type SubscriptionUpdate =
  Database["public"]["Tables"]["user_subscriptions"]["Update"];

export type Tracker = Database["public"]["Tables"]["trackers"]["Row"];
export type TrackerInsert = Database["public"]["Tables"]["trackers"]["Insert"];
export type TrackerUpdate = Database["public"]["Tables"]["trackers"]["Update"];

export type TrackerResult =
  Database["public"]["Tables"]["tracker_results"]["Row"];
export type TrackerResultInsert =
  Database["public"]["Tables"]["tracker_results"]["Insert"];
export type TrackerResultUpdate =
  Database["public"]["Tables"]["tracker_results"]["Update"];

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationInsert =
  Database["public"]["Tables"]["notifications"]["Insert"];
export type NotificationUpdate =
  Database["public"]["Tables"]["notifications"]["Update"];

export type EmbassyConfig =
  Database["public"]["Tables"]["embassy_configs"]["Row"];
export type EmbassyConfigInsert =
  Database["public"]["Tables"]["embassy_configs"]["Insert"];
export type EmbassyConfigUpdate =
  Database["public"]["Tables"]["embassy_configs"]["Update"];

export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type AuditLogInsert =
  Database["public"]["Tables"]["audit_logs"]["Insert"];
export type AuditLogUpdate =
  Database["public"]["Tables"]["audit_logs"]["Update"];

// View types
export type UserTrackerStats =
  Database["public"]["Views"]["v_user_tracker_stats"]["Row"];
export type RecentSlot = Database["public"]["Views"]["v_recent_slots"]["Row"];

// ============================================
// Plan Limits Configuration
// ============================================

export const PLAN_LIMITS = {
  free: {
    max_trackers: 1,
    min_check_interval_minutes: 60,
    notification_channels: ["email"] as const,
    max_notifications_per_day: 10,
  },
  pro: {
    max_trackers: 5,
    min_check_interval_minutes: 5,
    notification_channels: ["email", "sms"] as const,
    max_notifications_per_day: 100,
  },
  premium: {
    max_trackers: 999, // "unlimited"
    min_check_interval_minutes: 1,
    notification_channels: ["email", "sms", "whatsapp", "push"] as const,
    max_notifications_per_day: 1000,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
