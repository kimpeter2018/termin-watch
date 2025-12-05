"use client";

import React, { useState } from "react";
import {
  Calendar,
  User,
  Globe,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import CountryPicker from "@/components/onboarding/CountryPicker";

export default function OnboardingPage() {
  const [fullName, setFullName] = useState("");
  const [passportCountry, setPassportCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isNameFromAuth, setIsNameFromAuth] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Fetch user data on mount
  React.useEffect(() => {
    async function fetchUserData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Check if user has full_name from OAuth (Google sign-in)
          const authFullName = user.user_metadata?.full_name;

          // Fetch existing profile data
          const { data: profile } = await supabase
            .from("users")
            .select("full_name, passport_country")
            .eq("id", user.id)
            .single();

          if (profile?.full_name) {
            setFullName(profile.full_name);
            setIsNameFromAuth(true);
          } else if (authFullName) {
            setFullName(authFullName);
            setIsNameFromAuth(true);
          }

          if (profile?.passport_country) {
            setPassportCountry(profile.passport_country);
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setInitialLoading(false);
      }
    }

    fetchUserData();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not found");
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: fullName.trim(),
          passport_country: passportCountry,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Wait a bit for DB to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Force redirect (router will refetch in dashboard)
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Onboarding error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to complete onboarding"
      );
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center space-x-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
              <Calendar className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-3xl font-bold text-gray-900">
              TerminWatch
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome aboard! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Let&apos;s personalize your experience in just two quick steps
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 mb-6">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isNameFromAuth}
                  placeholder="ex.John Doe"
                  className={`w-full bg-white border-2 border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition ${
                    isNameFromAuth
                      ? "bg-gray-50 cursor-not-allowed opacity-75"
                      : ""
                  }`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {isNameFromAuth
                  ? "Name imported from your account"
                  : "This should match your passport name"}
              </p>
            </div>

            {/* Passport Country */}
            <div>
              <label
                htmlFor="passportCountry"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Passport Country
              </label>
              <CountryPicker
                value={passportCountry}
                onChange={setPassportCountry}
              />
              <p className="text-xs text-gray-500 mt-2">
                Select the country that issued your passport
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !fullName.trim() || !passportCountry}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Setting up your account...</span>
                </>
              ) : (
                <>
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Global Coverage
            </p>
            <p className="text-xs text-gray-600">
              Track appointments worldwide
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Instant Alerts
            </p>
            <p className="text-xs text-gray-600">Get notified immediately</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              24/7 Monitoring
            </p>
            <p className="text-xs text-gray-600">Never miss a slot</p>
          </div>
        </div>
      </div>
    </div>
  );
}
