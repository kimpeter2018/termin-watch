"use client";

import { useState } from "react";
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
} from "lucide-react";

export default function Dashboard() {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
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
                    John Doe
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        John Doe
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        john@example.com
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
                    <button className="flex items-center space-x-3 px-4 py-2.5 text-red-600 hover:bg-red-50 w-full transition">
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Monitor and manage your appointment trackers
          </p>
        </div>

        {/* Empty State */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-blue-600" />
          </div>

          {/* Content */}
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            No trackers yet
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
            Start monitoring visa appointment availability by creating your
            first tracker. Get notified instantly when slots become available.
          </p>

          {/* CTA Button */}
          <button className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 group">
            <Plus className="w-5 h-5" />
            <span className="text-lg">Create Your First Tracker</span>
          </button>

          {/* Help Text */}
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
              Our system checks appointment availability every few minutes and
              alerts you immediately when slots open up.
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
              Get notified via email, SMS, or WhatsApp the moment an appointment
              slot becomes available at your embassy.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Multiple Embassies
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Track appointments at multiple embassies or consulates
              simultaneously with different date preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
