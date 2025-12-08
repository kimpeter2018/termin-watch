import { EmbassyConfig, GermanVisaType } from "@/lib/database.types";
import { MapPin, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Type definitions
type CheckInterval = 5 | 15 | 30 | 60;

interface IntervalOption {
  value: CheckInterval;
  label: string;
  tier: string;
  checksPerDay: number;
  color: string;
}

interface PricingTier {
  basePrice: number;
  discount7: number;
  discount15: number;
  discount30: number;
}

const CHECK_INTERVALS: IntervalOption[] = [
  {
    value: 5,
    label: "Every 5 minutes",
    tier: "Premium",
    checksPerDay: 288,
    color: "purple",
  },
  {
    value: 15,
    label: "Every 15 minutes",
    tier: "Pro",
    checksPerDay: 96,
    color: "blue",
  },
  {
    value: 30,
    label: "Every 30 minutes",
    tier: "Standard",
    checksPerDay: 48,
    color: "green",
  },
  {
    value: 60,
    label: "Every hour",
    tier: "Basic",
    checksPerDay: 24,
    color: "gray",
  },
];

const PRICING: Record<CheckInterval, PricingTier> = {
  5: { basePrice: 1.99, discount7: 10, discount15: 20, discount30: 35 },
  15: { basePrice: 1.29, discount7: 10, discount15: 20, discount30: 35 },
  30: { basePrice: 0.89, discount7: 10, discount15: 20, discount30: 35 },
  60: { basePrice: 0.59, discount7: 10, discount15: 20, discount30: 35 },
};

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

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [locationType, setLocationType] = useState<
    "embassy" | "auslaenderbehorde"
  >("embassy");
  const [embassies, setEmbassies] = useState<EmbassyConfig[]>([]);
  const [auslaenderbehoerden, setAuslaenderbehoerden] = useState<
    EmbassyConfig[]
  >([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [visaType, setVisaType] = useState("national");
  const [checkInterval, setCheckInterval] = useState<CheckInterval>(15);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Pricing calculation
  const [pricing, setPricing] = useState({
    totalDays: 0,
    subtotal: 0,
    discountPercent: 0,
    discountAmount: 0,
    finalPrice: 0,
  });

  const calculatePricing = () => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const days =
      Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const plan = PRICING[checkInterval];
    const subtotal = plan.basePrice * days;

    let discountPercent = 0;
    if (days >= 30) discountPercent = plan.discount30;
    else if (days >= 15) discountPercent = plan.discount15;
    else if (days >= 7) discountPercent = plan.discount7;

    const discountAmount = subtotal * (discountPercent / 100);
    const finalPrice = subtotal - discountAmount;

    setPricing({
      totalDays: days,
      subtotal: subtotal,
      discountPercent,
      discountAmount,
      finalPrice,
    });
  };

  useEffect(() => {
    if (dateFrom && dateTo && checkInterval) {
      calculatePricing();
    }
  }, [dateFrom, dateTo, checkInterval]);

  useEffect(() => {
    const fetchLocations = async () => {
      const res = await fetch("/api/locations");
      const json = await res.json();
      const allLocations: EmbassyConfig[] = json.locations;

      if (!json.error && allLocations) {
        const embassyList = allLocations.filter(
          (loc) => !loc.code.startsWith("ABH-")
        );
        const abhList = allLocations.filter((loc) =>
          loc.code.startsWith("ABH-")
        );

        setEmbassies(embassyList);
        setAuslaenderbehoerden(abhList);
      }
    };

    fetchLocations();
  }, []);

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

      if (!dateFrom || !dateTo) {
        throw new Error("Please select date range");
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

      // Prepare tracker data
      const trackerData = {
        name: name.trim(),
        description: `Monitoring ${location.name} for ${visaType} appointments`,
        embassy_code: location.code,
        visa_type: visaType,
        target_url: location.base_url,
        notification_channels: [
          emailNotifications && "email",
          smsNotifications && "sms",
        ].filter(Boolean),
        notify_on_any_slot: true,
        preferred_date_from: dateFrom,
        preferred_date_to: dateTo,
      };

      // Prepare purchase data
      const purchaseData = {
        check_interval_minutes: checkInterval,
        date_range_start: dateFrom,
        date_range_end: dateTo,
        base_price: pricing.subtotal,
        discount_applied: pricing.discountPercent,
        discount_amount: pricing.discountAmount,
        final_price: pricing.finalPrice,
      };

      // Create Stripe checkout session
      const response = await fetch("/api/trackers/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackerData,
          purchaseData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const { sessionUrl } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = sessionUrl;
    } catch (error) {
      console.error("Error creating checkout:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create checkout";
      setError(message);
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

  const selectedInterval = CHECK_INTERVALS.find(
    (i) => i.value === checkInterval
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Create New Tracker
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Monitor visa appointments 24/7
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((s) => (
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
                      {s === 2 && "Check Frequency"}
                      {s === 3 && "Date Range"}
                      {s === 4 && "Notifications"}
                    </div>
                  </div>
                  {s < 4 && (
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
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Step 1: Location */}
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
                    className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Location Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setLocationType("embassy")}
                      className={`p-4 rounded-xl border-2 transition ${
                        locationType === "embassy"
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <svg
                        className="w-8 h-8 mx-auto mb-2 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="font-semibold text-gray-900">
                        Embassy/Consulate
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Apply from abroad
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationType("auslaenderbehorde")}
                      className={`p-4 rounded-xl border-2 transition ${
                        locationType === "auslaenderbehorde"
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <svg
                        className="w-8 h-8 mx-auto mb-2 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
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

            {/* Step 2: Check Frequency */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    How often should we check for appointments?
                  </label>
                  <div className="space-y-3">
                    {CHECK_INTERVALS.map((interval) => (
                      <button
                        key={interval.value}
                        type="button"
                        onClick={() =>
                          setCheckInterval(interval.value as CheckInterval)
                        }
                        className={`w-full p-4 rounded-xl border-2 transition text-left ${
                          checkInterval === interval.value
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <svg
                              className="w-6 h-6 text-blue-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {interval.label}
                              </div>
                              <div className="text-sm text-gray-600 mt-0.5">
                                {interval.checksPerDay} checks per day ·{" "}
                                {interval.tier} tier
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              ${PRICING[interval.value].basePrice}
                            </div>
                            <div className="text-xs text-gray-500">per day</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm text-blue-900">
                      <strong>Why different intervals?</strong> More frequent
                      checks increase your chances of catching newly available
                      slots, but cost more due to server resources and CAPTCHA
                      solving.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Date Range */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    When should we monitor for you?
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        min={dateFrom || new Date().toISOString().split("T")[0]}
                        className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {pricing.totalDays > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                      <div className="font-semibold text-gray-900">
                        Volume Discounts Applied
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">7+ days:</span>
                        <span className="font-medium text-gray-900">
                          {PRICING[checkInterval].discount7}% off
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">15+ days:</span>
                        <span className="font-medium text-gray-900">
                          {PRICING[checkInterval].discount15}% off
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">30+ days:</span>
                        <span className="font-medium text-emerald-600">
                          {PRICING[checkInterval].discount30}% off
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Notifications */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Notification Channels
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) =>
                          setEmailNotifications(e.target.checked)
                        }
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          Email Notifications
                        </div>
                        <div className="text-sm text-gray-600">
                          Included free
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                      <svg
                        className="w-5 h-5 text-purple-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          SMS Notifications
                        </div>
                        <div className="text-sm text-gray-600">
                          +€0.10 per alert
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">
                        Ready to monitor!
                      </div>
                      <div className="text-sm text-gray-600">
                        Your tracker will start immediately after payment
                        confirmation.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              className="text-gray-700 hover:text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="text-gray-700 hover:text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && (!name || !selectedLocation)) ||
                    (step === 3 && (!dateFrom || !dateTo))
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
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Payment</span>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Sidebar */}
        {step >= 3 && pricing.totalDays > 0 && (
          <div className="w-80 bg-gradient-to-br from-gray-50 to-gray-100 border-l border-gray-200 p-6 overflow-y-auto">
            <div className="sticky top-6">
              <div className="flex items-center space-x-2 mb-4">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-bold text-gray-900">
                  Pricing Summary
                </h3>
              </div>

              <div className="space-y-4">
                {/* Monitoring Details */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Monitoring Details
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check Frequency:</span>
                      <span className="font-medium text-gray-900">
                        Every {checkInterval} min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium text-gray-900">
                        {pricing.totalDays} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Checks:</span>
                      <span className="font-medium text-gray-900">
                        ~
                        {(selectedInterval?.checksPerDay || 0) *
                          pricing.totalDays}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Price Breakdown
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-900">
                        ${pricing.subtotal.toFixed(2)}
                      </span>
                    </div>
                    {pricing.discountPercent > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">
                          Discount ({pricing.discountPercent}%):
                        </span>
                        <span className="font-medium text-green-600">
                          -${pricing.discountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">
                          Total:
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          ${pricing.finalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Savings Badge */}
                {pricing.discountPercent > 0 && (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-4 text-white">
                    <div className="flex items-center space-x-2 mb-1">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <div className="font-bold">
                        You&apos;re saving ${pricing.discountAmount.toFixed(2)}!
                      </div>
                    </div>
                    <div className="text-sm text-green-100">
                      {pricing.discountPercent}% discount applied for{" "}
                      {pricing.totalDays}+ days
                    </div>
                  </div>
                )}

                {/* What;s Included */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    What&apos;s Included
                  </div>
                  <div className="space-y-2">
                    {[
                      "24/7 automated monitoring",
                      "Instant email alerts",
                      "CAPTCHA solving included",
                      "Cancel anytime",
                      "Priority support",
                    ].map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <svg
                          className="w-4 h-4 text-green-600 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
