// components/trackers/CreateTrackerModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  MapPin,
  Clock,
  Bell,
  AlertCircle,
  Globe,
  Building2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EmbassyConfig, GermanVisaType } from "@/lib/database.types";

interface CreateTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTrackerModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTrackerModalProps) {
  const supabase = createClient();

  // Form state
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [locationType, setLocationType] = useState<
    "embassy" | "auslaenderbehorde"
  >("embassy");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [visaType, setVisaType] = useState<GermanVisaType>("national");
  const [checkInterval, setCheckInterval] = useState<1 | 5 | 15 | 30 | 60>(60);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [notifyOnAny, setNotifyOnAny] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Data
  const [embassies, setEmbassies] = useState<EmbassyConfig[]>([]);
  const [auslaenderbehoerden, setAuslaenderbehoerden] = useState<
    EmbassyConfig[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "premium">("free");
  const [maxTrackers, setMaxTrackers] = useState(1);
  const [currentTrackerCount, setCurrentTrackerCount] = useState(0);

  const fetchLocations = async () => {
    const { data: allLocations, error } = await supabase
      .from("embassy_configs")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (!error && allLocations) {
      const embassyList = allLocations.filter(
        (loc) => !loc.code.startsWith("ABH-")
      );
      const abhList = allLocations.filter((loc) => loc.code.startsWith("ABH-"));

      setEmbassies(embassyList);
      setAuslaenderbehoerden(abhList);
    }
  };

  const fetchUserSubscription = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_subscriptions")
      .select("plan, max_trackers, min_check_interval_minutes")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setUserPlan(data.plan);
      setMaxTrackers(data.max_trackers);
      setCheckInterval(data.min_check_interval_minutes as 1 | 5 | 15 | 30 | 60);
    }
  };

  const fetchTrackerCount = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from("trackers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["active", "paused"]);

    setCurrentTrackerCount(count || 0);
  };

  // Fetch locations and user subscription
  useEffect(() => {
    if (isOpen) {
      fetchLocations();
      fetchUserSubscription();
      fetchTrackerCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!name.trim()) {
        throw new Error("Please enter a tracker name");
      }

      if (!selectedLocation) {
        throw new Error("Please select a location");
      }

      if (currentTrackerCount >= maxTrackers) {
        throw new Error(
          `You've reached your plan limit of ${maxTrackers} tracker(s). Upgrade to create more.`
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get selected location details
      const location = [...embassies, ...auslaenderbehoerden].find(
        (loc) => loc.code === selectedLocation
      );

      if (!location) throw new Error("Invalid location selected");

      // Create tracker
      const { error: insertError } = await supabase.from("trackers").insert({
        user_id: user.id,
        name: name.trim(),
        description: `Monitoring ${location.name} for ${visaType} appointments`,
        embassy_code: location.code,
        visa_type: visaType,
        target_url: location.base_url,
        check_interval_minutes: checkInterval,
        preferred_date_from: dateFrom || null,
        preferred_date_to: dateTo || null,
        notification_channels: [
          emailNotifications && "email",
          smsNotifications && "sms",
        ].filter(Boolean) as string[],
        notify_on_any_slot: notifyOnAny,
        notify_only_preferred_dates: !notifyOnAny,
        status: "active",
        next_check_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      // Success!
      onSuccess();
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error Creating Tracker", error);
      const message =
        error instanceof Error ? error.message : "Failed to submit tracker";
      setError(message || "Failed to create tracker");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setName("");
    setSelectedLocation("");
    setVisaType("national");
    setDateFrom("");
    setDateTo("");
    setNotifyOnAny(true);
    setEmailNotifications(true);
    setSmsNotifications(false);
    setError("");
  };

  if (!isOpen) return null;

  const locations =
    locationType === "embassy" ? embassies : auslaenderbehoerden;
  const availableVisaTypes =
    locations.find((loc) => loc.code === selectedLocation)
      ?.supported_visa_types || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Create New Tracker
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Monitor German visa appointment availability
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s}
                </div>
                <div className="ml-3 flex-1">
                  <div
                    className={`text-sm font-medium ${
                      step >= s ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {s === 1 && "Location"}
                    {s === 2 && "Preferences"}
                    {s === 3 && "Notifications"}
                  </div>
                </div>
                {s < 3 && (
                  <div
                    className={`h-0.5 w-full ml-2 ${
                      step > s ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Location Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tracker Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Berlin Work Visa Tracker"
                  className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Location Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setLocationType("embassy");
                      setSelectedLocation("");
                    }}
                    className={`p-4 rounded-xl border-2 transition ${
                      locationType === "embassy"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Globe className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="font-semibold text-gray-900">
                      Embassy / Consulate
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Apply from abroad
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationType("auslaenderbehorde");
                      setSelectedLocation("");
                    }}
                    className={`p-4 rounded-xl border-2 transition ${
                      locationType === "auslaenderbehorde"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="font-semibold text-gray-900">
                      Ausländerbehörde
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Inside Germany
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Select Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => {
                      setSelectedLocation(e.target.value);
                      setVisaType("national");
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg py-3 pl-11 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="">Choose a location...</option>
                    {locations.map((loc) => (
                      <option key={loc.code} value={loc.code}>
                        {loc.name} ({loc.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedLocation && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Visa/Appointment Type
                  </label>
                  <select
                    value={visaType}
                    onChange={(e) =>
                      setVisaType(e.target.value as GermanVisaType)
                    }
                    className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    {availableVisaTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() +
                          type.slice(1).replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Date Preferences */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Check Frequency
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={checkInterval}
                    onChange={(e) =>
                      setCheckInterval(
                        Number(e.target.value) as 1 | 5 | 15 | 30 | 60
                      )
                    }
                    className="w-full bg-white border border-gray-300 rounded-lg py-3 pl-11 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    {userPlan === "premium" && (
                      <option value={1}>Every minute (Premium)</option>
                    )}
                    {userPlan !== "free" && (
                      <option value={5}>Every 5 minutes</option>
                    )}
                    {userPlan !== "free" && (
                      <option value={15}>Every 15 minutes</option>
                    )}
                    <option value={60}>Every hour</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Your {userPlan} plan allows checks every {checkInterval}{" "}
                  minute(s)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Preferred Date Range (Optional)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      From
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg py-3 pl-11 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      To
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        min={dateFrom}
                        className="w-full bg-white border border-gray-300 rounded-lg py-3 pl-11 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={notifyOnAny}
                    onChange={(e) => setNotifyOnAny(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      Notify me for any available slot
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Get alerts even if dates fall outside your preferred range
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Notifications */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Notification Channels
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    />
                    <Bell className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        Email Notifications
                      </div>
                      <div className="text-sm text-gray-600">
                        Included in all plans
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center space-x-3 p-4 rounded-lg border ${
                      userPlan === "free"
                        ? "bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={smsNotifications}
                      onChange={(e) => setSmsNotifications(e.target.checked)}
                      disabled={userPlan === "free"}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600 disabled:opacity-50"
                    />
                    <Bell className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        SMS Notifications
                        {userPlan === "free" && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Pro/Premium
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Get instant text alerts
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">✓</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">
                      Ready to monitor!
                    </div>
                    <div className="text-sm text-gray-600">
                      Your tracker will start checking immediately after
                      creation. You&apos;ll receive notifications as soon as
                      appointments become available.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="text-gray-700 hover:text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="text-gray-700 hover:text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && (!name || !selectedLocation)) || loading
                }
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Tracker</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
