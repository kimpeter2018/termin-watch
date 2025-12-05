"use client";

import { useState } from "react";
import {
  X,
  Zap,
  Clock,
  Check,
  TrendingUp,
  Calendar,
  Sparkles,
} from "lucide-react";

interface PricingPlan {
  id: string;
  days: number;
  check_interval_minutes: number;
  price_usd: number;
  discount_pct: number;
  is_active: boolean;
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: PricingPlan) => void;
  existingTrackerName?: string; // For upgrading existing tracker
}

// This would come from your database
const PRICING_PLANS: PricingPlan[] = [
  // 1 Day Plans
  {
    id: "737b82f4-f2c7-48f9-a2e1-7669103e1a24",
    days: 1,
    check_interval_minutes: 5,
    price_usd: 3.99,
    discount_pct: 0,
    is_active: true,
  },
  {
    id: "09e62bf0-0485-4bb2-8fe2-68963e097fef",
    days: 1,
    check_interval_minutes: 15,
    price_usd: 2.99,
    discount_pct: 0,
    is_active: true,
  },
  {
    id: "d50d2eb9-04d3-4426-91a4-a3edfbeb350e",
    days: 1,
    check_interval_minutes: 30,
    price_usd: 2.49,
    discount_pct: 0,
    is_active: true,
  },
  {
    id: "158dfc21-b7ed-4c50-ac26-7103fd02b746",
    days: 1,
    check_interval_minutes: 60,
    price_usd: 1.99,
    discount_pct: 0,
    is_active: true,
  },
  // 7 Day Plans
  {
    id: "4faea8f1-dc0a-4374-878e-fefcf5e1a7b9",
    days: 7,
    check_interval_minutes: 5,
    price_usd: 19.99,
    discount_pct: 16,
    is_active: true,
  },
  {
    id: "0f7e1f9c-5152-41b8-a744-a39c6f8feff3",
    days: 7,
    check_interval_minutes: 15,
    price_usd: 15.99,
    discount_pct: 14,
    is_active: true,
  },
  {
    id: "4b8d1aa3-038c-4255-bc20-b86c15a7c355",
    days: 7,
    check_interval_minutes: 30,
    price_usd: 12.99,
    discount_pct: 12,
    is_active: true,
  },
  {
    id: "57c5b918-c946-491f-be17-a4d8baa1c210",
    days: 7,
    check_interval_minutes: 60,
    price_usd: 9.99,
    discount_pct: 10,
    is_active: true,
  },
  // 30 Day Plans
  {
    id: "83ccd7a5-db9c-4e10-9f4c-7f8a667e2912",
    days: 30,
    check_interval_minutes: 5,
    price_usd: 59.99,
    discount_pct: 35,
    is_active: true,
  },
  {
    id: "a72b6291-f08e-4d29-8cf6-0d502da8d0c2",
    days: 30,
    check_interval_minutes: 15,
    price_usd: 49.99,
    discount_pct: 30,
    is_active: true,
  },
  {
    id: "7b54cb22-79c0-4001-8983-b78a85d6bcd0",
    days: 30,
    check_interval_minutes: 30,
    price_usd: 39.99,
    discount_pct: 25,
    is_active: true,
  },
  {
    id: "5e5ee195-e8a7-4bd6-bd2f-3e8014047844",
    days: 30,
    check_interval_minutes: 60,
    price_usd: 29.99,
    discount_pct: 20,
    is_active: true,
  },
];

export default function PricingModal({
  isOpen,
  onClose,
  onSelectPlan,
  existingTrackerName,
}: PricingModalProps) {
  const [selectedDuration, setSelectedDuration] = useState<1 | 7 | 30>(7);

  if (!isOpen) return null;

  const filteredPlans = PRICING_PLANS.filter(
    (plan) => plan.days === selectedDuration && plan.is_active
  );

  const getIntervalLabel = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    return `${minutes / 60}hr`;
  };

  const getIntervalBadge = (minutes: number) => {
    if (minutes === 5)
      return { label: "Premium", color: "from-purple-500 to-pink-500" };
    if (minutes === 15)
      return { label: "Pro", color: "from-blue-500 to-indigo-500" };
    if (minutes === 30)
      return { label: "Standard", color: "from-green-500 to-emerald-500" };
    return { label: "Basic", color: "from-gray-500 to-gray-600" };
  };

  const calculateOriginalPrice = (price: number, discount: number) => {
    if (discount === 0) return null;
    return (price / (1 - discount / 100)).toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">
                Pay-per-tracker pricing
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {existingTrackerName
                ? `Extend "${existingTrackerName}"`
                : "Choose Your Monitoring Plan"}
            </h2>
            <p className="text-blue-100">
              Select duration and check frequency for your tracker
            </p>
          </div>
        </div>

        {/* Duration Selector */}
        <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Select Duration
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Longer durations offer better savings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* 1 Day */}
            <button
              onClick={() => setSelectedDuration(1)}
              className={`relative p-4 rounded-xl border-2 transition ${
                selectedDuration === 1
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="font-bold text-gray-900">1 Day</div>
                <div className="text-xs text-gray-500 mt-1">Quick test</div>
              </div>
            </button>

            {/* 7 Days */}
            <button
              onClick={() => setSelectedDuration(7)}
              className={`relative p-4 rounded-xl border-2 transition ${
                selectedDuration === 7
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Popular
                </span>
              </div>
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="font-bold text-gray-900">7 Days</div>
                <div className="text-xs text-green-600 font-semibold mt-1">
                  Save up to 16%
                </div>
              </div>
            </button>

            {/* 30 Days */}
            <button
              onClick={() => setSelectedDuration(30)}
              className={`relative p-4 rounded-xl border-2 transition ${
                selectedDuration === 30
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Best Value
                </span>
              </div>
              <div className="text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="font-bold text-gray-900">30 Days</div>
                <div className="text-xs text-purple-600 font-semibold mt-1">
                  Save up to 35%
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-400px)]">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Select Check Frequency
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Faster checks mean you&apos;ll be notified sooner when slots
              appear
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {filteredPlans.map((plan) => {
              const badge = getIntervalBadge(plan.check_interval_minutes);
              const originalPrice = calculateOriginalPrice(
                plan.price_usd,
                plan.discount_pct
              );
              const isRecommended = plan.check_interval_minutes === 15;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white border-2 rounded-xl p-6 transition hover:shadow-lg ${
                    isRecommended
                      ? "border-blue-600 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        Recommended
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${badge.color}`}
                    >
                      {badge.label}
                    </div>
                    {plan.discount_pct > 0 && (
                      <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                        Save {plan.discount_pct}%
                      </div>
                    )}
                  </div>

                  {/* Check Interval */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="text-2xl font-bold text-gray-900">
                        Every {getIntervalLabel(plan.check_interval_minutes)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {plan.check_interval_minutes === 5 &&
                        "Maximum speed - Check 288 times per day"}
                      {plan.check_interval_minutes === 15 &&
                        "Fast checks - 96 times per day"}
                      {plan.check_interval_minutes === 30 &&
                        "Regular checks - 48 times per day"}
                      {plan.check_interval_minutes === 60 &&
                        "Standard checks - 24 times per day"}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-4xl font-bold text-gray-900">
                        ${plan.price_usd}
                      </span>
                      {originalPrice && (
                        <span className="text-lg text-gray-400 line-through">
                          ${originalPrice}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      for {plan.days} day{plan.days > 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Email notifications</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>SMS alerts included</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Pause/resume anytime</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Historical data access</span>
                    </div>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => onSelectPlan(plan)}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition shadow-md hover:shadow-lg ${
                      isRecommended
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                  >
                    Select Plan
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Check className="w-4 h-4 text-green-500" />
                <span>Secure payment</span>
              </div>
              <div className="flex items-center space-x-1">
                <Check className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center space-x-1">
                <Check className="w-4 h-4 text-green-500" />
                <span>No hidden fees</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Powered by{" "}
              <span className="font-semibold text-gray-700">Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
