/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Bell,
  LogOut,
  User,
  Settings,
  CreditCard,
  Plus,
  Search,
  TrendingUp,
  Zap,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CreateTrackerModal from "@/components/trackers/CreateTrackerModal";
import TrackersList from "@/components/trackers/TrackersList";

export default function DashboardClient() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "cancelled" | null
  >(null);
  const [stats, setStats] = useState({
    totalTrackers: 0,
    activeTrackers: 0,
    totalChecks: 0,
    totalSlotsFound: 0,
  });
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "premium">("free");

  // Check for payment status in URL
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      setPaymentStatus("success");
      // Refresh trackers list after successful payment
      setRefreshTrigger((prev) => prev + 1);
      // Clear URL params
      router.replace("/dashboard");
    } else if (payment === "cancelled") {
      setPaymentStatus("cancelled");
      // Clear URL params
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  const fetchStats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("v_user_tracker_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setStats({
        totalTrackers: data.total_trackers,
        activeTrackers: data.active_trackers,
        totalChecks: data.total_checks,
        totalSlotsFound: data.total_slots_found,
      });
    }
  };

  const fetchUserPlan = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setUserPlan(data.plan);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUserPlan();
  }, [refreshTrigger]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleCreateSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Payment Status Messages */}
      {paymentStatus === "success" && (
        <div className="fixed top-6 right-4 z-50 animate-slide-down">
          <div className="bg-green-50 border border-green-200 rounded-xl shadow-lg p-4 flex items-start space-x-3 max-w-md">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">
                Payment Successful!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Your tracker has been created and is now monitoring for
                appointments.
              </p>
            </div>
            <button
              onClick={() => setPaymentStatus(null)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {paymentStatus === "cancelled" && (
        <div className="fixed top-6 right-4 z-50 animate-slide-down">
          <div className="bg-orange-50 border border-orange-200 rounded-xl shadow-lg p-4 flex items-start space-x-3 max-w-md">
            <XCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900">
                Payment Cancelled
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Your payment was cancelled. No charges were made.
              </p>
            </div>
            <button
              onClick={() => setPaymentStatus(null)}
              className="text-orange-600 hover:text-orange-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                TerminWatch
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Plan Badge */}
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  userPlan === "premium"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : userPlan === "pro"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {userPlan.toUpperCase()}
              </div>

              <button className="relative text-gray-600 hover:text-gray-900 transition p-2 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-900 text-sm font-medium hidden md:block">
                    {profile?.full_name || user?.email?.split("@")[0] || "User"}
                  </span>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">
                          {profile?.full_name || "User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <button className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition w-full">
                        <Settings className="w-4 h-4" />
                        <span className="text-sm font-medium">Settings</span>
                      </button>
                      <button className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition w-full">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm font-medium">Billing</span>
                      </button>
                      <hr className="my-2 border-gray-200" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-3 px-4 py-2.5 text-red-600 hover:bg-red-50 w-full transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600">
                Monitor German visa appointments in real-time
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Tracker</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Total
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.totalTrackers}
              </div>
              <div className="text-sm text-gray-600">Active Trackers</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Checks
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.totalChecks}
              </div>
              <div className="text-sm text-gray-600">Total Checks</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Found
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.totalSlotsFound}
              </div>
              <div className="text-sm text-gray-600">Slots Found</div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 shadow-sm text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ring-4 ring-green-400/30"></div>
              </div>
              <div className="text-3xl font-bold mb-1">
                {stats.activeTrackers}
              </div>
              <div className="text-sm text-blue-100">Currently Monitoring</div>
            </div>
          </div>
        </div>

        {/* Trackers List or Empty State */}
        {stats.totalTrackers === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-blue-600" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              No trackers yet
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
              Start monitoring German visa appointments by creating your first
              tracker. Get notified instantly when slots become available.
            </p>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 group"
            >
              <Plus className="w-5 h-5" />
              <span className="text-lg">Create Your First Tracker</span>
            </button>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">
                Need help getting started?
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                >
                  <span>📖 View Documentation</span>
                </a>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                >
                  <span>🎥 Watch Tutorial</span>
                </a>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                >
                  <span>💬 Contact Support</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <>
            <TrackersList onRefresh={refreshTrigger} />
          </>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Real-time Monitoring
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Our system checks appointment availability automatically based on
              your plan and alerts you immediately when slots open up.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Instant Notifications
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Get notified via email or SMS the moment an appointment slot
              becomes available at your selected embassy or Ausländerbehörde.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Multiple Locations
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Track appointments at multiple embassies and Ausländerbehörden
              simultaneously with different date preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Create Tracker Modal */}
      <CreateTrackerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
