/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Zap, ArrowRight, Clock, TrendingUp, Sparkles } from "lucide-react";
import PricingModal from "@/components/pricing/PricingModal";

interface TrackerUpgradeCardProps {
  trackerId?: string;
  trackerName?: string;
  currentInterval?: number;
  daysRemaining?: number;
}

export default function TrackerUpgradeCard({
  trackerId,
  trackerName,
  currentInterval = 60,
  daysRemaining = 0,
}: TrackerUpgradeCardProps) {
  const [showPricingModal, setShowPricingModal] = useState(false);

  const handleSelectPlan = (plan: any) => {
    console.log("Selected plan:", plan);
    // Here you would redirect to Stripe checkout
    setShowPricingModal(false);
  };

  return (
    <>
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Upgrade Available</span>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold mb-2">
            {trackerId ? "Extend Your Tracker" : "Get Premium Monitoring"}
          </h3>

          <p className="text-blue-100 text-sm mb-6 leading-relaxed">
            {trackerId
              ? `Your tracker "${trackerName}" has ${daysRemaining} days remaining. Extend now for continued monitoring.`
              : "Faster checks mean you'll never miss an appointment. Upgrade to check every 5-15 minutes."}
          </p>

          {/* Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-sm">
                  Check every 5 minutes
                </div>
                <div className="text-xs text-blue-100">288 checks per day</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-sm">Instant SMS alerts</div>
                <div className="text-xs text-blue-100">
                  Get notified immediately
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-sm">Priority support</div>
                <div className="text-xs text-blue-100">Fast response times</div>
              </div>
            </div>
          </div>

          {/* Pricing Hint */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-100">Starting from</div>
                <div className="text-2xl font-bold">$1.99</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-100">Save up to</div>
                <div className="text-2xl font-bold">35%</div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => setShowPricingModal(true)}
            className="w-full bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-4 rounded-xl transition shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
          >
            <span>{trackerId ? "Extend Tracker" : "View Plans"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>
        </div>
      </div>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSelectPlan={handleSelectPlan}
        existingTrackerName={trackerName}
      />
    </>
  );
}
