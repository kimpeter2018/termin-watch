// components/trackers/CreateTrackerModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  MapPin,
  Bell,
  AlertCircle,
  Globe,
  Building2,
  CreditCard,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EmbassyConfig, GermanVisaType } from "@/lib/database.types";

interface CreateTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PricingPlan {
  id: string;
  days: number;
  check_interval_minutes: number;
  price_usd: number;
  discount_pct: number;
}

export default function CreateTrackerModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTrackerModalProps) {
  const supabase = createClient();

  // Form state
  const [step, setStep] = useState(1); // 1: Location, 2: Preferences, 3: Pricing, 4: Notifications, 5: Payment
  const [name, setName] = useState("");
  const [locationType, setLocationType] = useState<
    "embassy" | "auslaenderbehorde"
  >("embassy");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [visaType, setVisaType] = useState<GermanVisaType>("national");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [notifyOnAny, setNotifyOnAny] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);

  // Data
  const [embassies, setEmbassies] = useState<EmbassyConfig[]>([]);
  const [auslaenderbehoerden, setAuslaenderbehoerden] = useState<
    EmbassyConfig[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mock pricing plans (would be fetched from DB)
  const POPULAR_PLANS: PricingPlan[] = [
    {
      id: "0f7e1f9c-5152-41b8-a744-a39c6f8feff3",
      days: 7,
      check_interval_minutes: 15,
      price_usd: 15.99,
      discount_pct: 14,
    },
    {
      id: "4b8d1aa3-038c-4255-bc20-b86c15a7c355",
      days: 7,
      check_interval_minutes: 30,
      price_usd: 12.99,
      discount_pct: 12,
    },
    {
      id: "a72b6291-f08e-4d29-8cf6-0d502da8d0c2",
      days: 30,
      check_interval_minutes: 15,
      price_usd: 49.99,
      discount_pct: 30,
    },
  ];

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

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      await fetchLocations();
    };

    load();
  }, [isOpen]);

  const handleNext = () => {
    if (step === 1 && (!name || !selectedLocation)) {
      setError("Please fill in all required fields");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const handleProceedToPayment = () => {
    if (!selectedPlan) {
      setError("Please select a pricing plan");
      return;
    }
    setError("");
    // This would redirect to Stripe checkout
    console.log("Proceeding to payment with plan:", selectedPlan);
    // For now, just show step 5
    setStep(5);
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
    setSelectedPlan(null);
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
              Step {step} of 5 - {step === 1 && "Location"}
              {step === 2 && "Preferences"}
              {step === 3 && "Choose Plan"}
              {step === 4 && "Notifications"}
              {step === 5 && "Payment"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    step >= s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s}
                </div>
                {s < 5 && (
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
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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

          {/* Step 2: Preferences */}
          {step === 2 && (
            <div className="space-y-6">
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

          {/* Step 3: Pricing Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Choose Your Plan
                </h3>
                <p className="text-sm text-gray-600">
                  Select check frequency and duration for your tracker
                </p>
              </div>

              <div className="space-y-3">
                {POPULAR_PLANS.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const originalPrice =
                    plan.discount_pct > 0
                      ? (
                          plan.price_usd /
                          (1 - plan.discount_pct / 100)
                        ).toFixed(2)
                      : null;

                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full p-4 rounded-xl border-2 transition text-left ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="text-lg font-bold text-gray-900">
                              Every {plan.check_interval_minutes}min checks
                            </div>
                            {plan.discount_pct > 0 && (
                              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                                Save {plan.discount_pct}%
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {plan.days} day{plan.days > 1 ? "s" : ""} of
                            monitoring •{" "}
                            {Math.floor(
                              (plan.days * 24 * 60) /
                                plan.check_interval_minutes
                            )}{" "}
                            total checks
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            ${plan.price_usd}
                          </div>
                          {originalPrice && (
                            <div className="text-sm text-gray-400 line-through">
                              ${originalPrice}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CreditCard className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      Need more options?
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      View all plans including 1-day and premium options
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Notifications */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Notification Channels
                </h3>
                <p className="text-sm text-gray-600">
                  Choose how you want to be notified
                </p>
              </div>

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

                <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  />
                  <Bell className="w-5 h-5 text-purple-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      SMS Notifications
                    </div>
                    <div className="text-sm text-gray-600">
                      Get instant text alerts
                    </div>
                  </div>
                </label>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">✓</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">
                      Almost ready!
                    </div>
                    <div className="text-sm text-gray-600">
                      Review your selections and proceed to secure payment
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Payment Summary */}
          {step === 5 && selectedPlan && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Payment Summary
                  </h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tracker Name</span>
                    <span className="font-semibold text-gray-900">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location</span>
                    <span className="font-semibold text-gray-900">
                      {locations.find((l) => l.code === selectedLocation)
                        ?.name || "Selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check Frequency</span>
                    <span className="font-semibold text-gray-900">
                      Every {selectedPlan.check_interval_minutes} minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-semibold text-gray-900">
                      {selectedPlan.days} days
                    </span>
                  </div>

                  <div className="border-t border-blue-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900 font-semibold">
                        Total Amount
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${selectedPlan.price_usd}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 flex items-center justify-center space-x-2">
                <span>Proceed to Stripe Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="text-center text-xs text-gray-500">
                You&apos;ll be redirected to Stripe&apos;s secure payment page
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
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
            {step < 3 && (
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && (!name || !selectedLocation)) || loading
                }
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleNext}
                disabled={!selectedPlan}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === 4 && (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition"
              >
                <span>Review & Pay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
