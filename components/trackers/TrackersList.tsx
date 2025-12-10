"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  Trash2,
  MapPin,
  Clock,
  Bell,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  MoreVertical,
  Zap,
  Timer,
} from "lucide-react";
import type { Tracker, EmbassyConfig } from "@/lib/database.types";

interface TrackerWithLocation extends Tracker {
  embassy?: EmbassyConfig;
}

interface TrackersListProps {
  onRefresh: number; // Trigger re-fetch when this changes
}

export default function TrackersList({ onRefresh }: TrackersListProps) {
  const [trackers, setTrackers] = useState<TrackerWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTracker, setSelectedTracker] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchTrackers();
  }, [onRefresh]);

  const fetchTrackers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/trackers");

      if (!response.ok) {
        throw new Error("Failed to fetch trackers");
      }

      const data = await response.json();
      setTrackers(data.trackers || []);
    } catch (err) {
      console.error("Error fetching trackers:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrackerStatus = async (
    trackerId: string,
    currentStatus: string
  ) => {
    setActionLoading(trackerId);
    try {
      const response = await fetch(`/api/trackers/${trackerId}/toggle`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle tracker");
      }

      await fetchTrackers();
    } catch (error) {
      console.error("Error toggling tracker:", error);
      alert("Failed to toggle tracker status");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteTracker = async (trackerId: string) => {
    if (!confirm("Are you sure you want to delete this tracker?")) return;

    setActionLoading(trackerId);
    try {
      const response = await fetch(`/api/trackers/${trackerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete tracker");
      }

      await fetchTrackers();
    } catch (error) {
      console.error("Error deleting tracker:", error);
      alert("Failed to delete tracker");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        icon: (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        ),
        label: "Active",
      },
      paused: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
        icon: <Pause className="w-3 h-3" />,
        label: "Paused",
      },
      error: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: <AlertCircle className="w-3 h-3" />,
        label: "Error",
      },
      expired: {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
        icon: <Clock className="w-3 h-3" />,
        label: "Expired",
      },
    };

    const config = configs[status as keyof typeof configs] || configs.active;

    return (
      <div
        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}
      >
        {config.icon}
        <span className="text-xs font-semibold">{config.label}</span>
      </div>
    );
  };

  const formatInterval = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    return `${minutes / 60} hour${minutes / 60 > 1 ? "s" : ""}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not checked yet";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getDaysRemainingStatus = (daysRemaining: number) => {
    if (daysRemaining <= 0) {
      return {
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        label: "Expired",
      };
    } else if (daysRemaining < 3) {
      return {
        color: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-200",
        label: `${Math.floor(daysRemaining)} days left`,
      };
    } else if (daysRemaining < 7) {
      return {
        color: "text-yellow-600",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        label: `${Math.floor(daysRemaining)} days left`,
      };
    } else {
      return {
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
        label: `${Math.floor(daysRemaining)} days left`,
      };
    }
  };

  const getIntervalTier = (minutes: number) => {
    const tiers: Record<number, { name: string; color: string }> = {
      5: { name: "Premium", color: "text-purple-600" },
      15: { name: "Pro", color: "text-blue-600" },
      30: { name: "Standard", color: "text-green-600" },
      60: { name: "Basic", color: "text-gray-600" },
    };
    return tiers[minutes] || tiers[60];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (trackers.length === 0) {
    return null; // Empty state is handled by parent
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Your Trackers</h2>
        <div className="text-sm text-gray-600">
          {trackers.length} tracker{trackers.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Trackers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trackers.map((tracker) => {
          const daysStatus = getDaysRemainingStatus(tracker.days_remaining);
          const intervalTier = getIntervalTier(tracker.check_interval_minutes);

          return (
            <div
              key={tracker.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                      {tracker.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(tracker.status)}
                      <div
                        className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${daysStatus.bg} ${daysStatus.color} ${daysStatus.border}`}
                      >
                        <Timer className="w-3 h-3" />
                        <span>{daysStatus.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setSelectedTracker(
                          selectedTracker === tracker.id ? null : tracker.id
                        )
                      }
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
                      disabled={actionLoading === tracker.id}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {selectedTracker === tracker.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setSelectedTracker(null)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-20">
                          <button
                            onClick={() => {
                              toggleTrackerStatus(tracker.id, tracker.status);
                              setSelectedTracker(null);
                            }}
                            disabled={
                              actionLoading === tracker.id ||
                              tracker.status === "expired"
                            }
                            className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition w-full text-left disabled:opacity-50"
                          >
                            {tracker.status === "active" ? (
                              <>
                                <Pause className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  Pause
                                </span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  Resume
                                </span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              deleteTracker(tracker.id);
                              setSelectedTracker(null);
                            }}
                            disabled={actionLoading === tracker.id}
                            className="flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition w-full text-left disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {tracker.embassy?.name || tracker.embassy_code}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {tracker.total_checks}
                    </div>
                    <div className="text-xs text-blue-700 font-medium mt-1">
                      Checks
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {tracker.total_slots_found}
                    </div>
                    <div className="text-xs text-green-700 font-medium mt-1">
                      Found
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {tracker.total_notifications_sent}
                    </div>
                    <div className="text-xs text-purple-700 font-medium mt-1">
                      Alerts
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Zap className="w-4 h-4" />
                      <span>Check interval</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-gray-900">
                        {formatInterval(tracker.check_interval_minutes)}
                      </span>
                      <span
                        className={`text-xs font-semibold ${intervalTier.color}`}
                      >
                        ({intervalTier.name})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Bell className="w-4 h-4" />
                      <span>Notifications</span>
                    </div>
                    <span className="font-semibold text-gray-900 capitalize">
                      {tracker.notification_channels.join(", ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Last check</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatDate(tracker.last_checked_at)}
                    </span>
                  </div>
                </div>

                {/* Days Remaining Progress */}
                {tracker.days_purchased > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-gray-700">
                        Time Remaining
                      </span>
                      <span className="text-gray-600">
                        {Math.floor(tracker.days_remaining)} /{" "}
                        {tracker.days_purchased} days
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          tracker.days_remaining / tracker.days_purchased > 0.5
                            ? "bg-green-500"
                            : tracker.days_remaining / tracker.days_purchased >
                              0.25
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              (tracker.days_remaining /
                                tracker.days_purchased) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Last slot found */}
                {tracker.last_slot_found_at && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-green-700">
                        Last slot found
                      </div>
                      <div className="text-xs text-green-600 mt-0.5">
                        {formatDate(tracker.last_slot_found_at)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Date preferences */}
                {(tracker.preferred_date_from || tracker.preferred_date_to) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <div className="text-xs font-semibold text-blue-700">
                        Preferred dates
                      </div>
                    </div>
                    <div className="text-xs text-blue-600">
                      {tracker.preferred_date_from &&
                        new Date(
                          tracker.preferred_date_from
                        ).toLocaleDateString()}{" "}
                      -{" "}
                      {tracker.preferred_date_to &&
                        new Date(
                          tracker.preferred_date_to
                        ).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Error message */}
                {tracker.status === "error" && tracker.last_error_message && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-red-700">
                        Error
                      </div>
                      <div className="text-xs text-red-600 mt-0.5 line-clamp-2">
                        {tracker.last_error_message}
                      </div>
                    </div>
                  </div>
                )}

                {/* Expired notice */}
                {tracker.status === "expired" && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-orange-700">
                        Tracker Expired
                      </div>
                      <div className="text-xs text-orange-600 mt-0.5">
                        Extend to resume monitoring
                      </div>
                    </div>
                    <button className="text-xs font-semibold text-orange-700 hover:text-orange-800 underline">
                      Extend
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
