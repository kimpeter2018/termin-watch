import React from "react";
import Link from "next/link";
import {
  Calendar,
  Bell,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  User,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">
                TerminWatch
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-gray-900 transition font-medium text-[15px]"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900 transition font-medium text-[15px]"
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 transition font-medium text-[15px]"
              >
                Pricing
              </a>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 text-[15px]">
                    <span>{profile!.full_name.split(" ")[0]}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <button className="text-gray-700 hover:text-gray-900 transition font-semibold text-[15px] px-4 py-2">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/auth/signup">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 text-[15px]">
                      Get Started
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2">
                <span className="text-sm font-semibold text-blue-700">
                  Trusted by 10,000+ visa applicants
                </span>
              </div>

              {/* Main Heading */}
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
                  Never Miss Your
                  <span className="block mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Visa Appointment
                  </span>
                </h1>

                <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                  Automated 24/7 monitoring of visa appointment systems. Get
                  instant notifications the moment slots become available at
                  your preferred embassy or consulate.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/30 group">
                  <span className="text-lg">Start Monitoring Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </button>
                <button className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-gray-900 font-semibold px-8 py-4 rounded-xl transition border-2 border-gray-200 hover:border-gray-300">
                  <span className="text-lg">View Demo</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-8 pt-4">
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 border-2 border-white"></div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white"></div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 border-2 border-white"></div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 border-2 border-white"></div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">
                      10,000+ users
                    </div>
                    <div className="text-xs text-gray-500">Active monitors</div>
                  </div>
                </div>

                <div className="h-10 w-px bg-gray-200"></div>

                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    4.9/5 rating
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative lg:pl-8">
              {/* Main Card */}
              <div className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Calendar
                        className="w-6 h-6 text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Monitor Status
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        Active
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-green-700">
                      Live
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      247
                    </div>
                    <div className="text-xs font-medium text-blue-700">
                      Checks Today
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      3
                    </div>
                    <div className="text-xs font-medium text-purple-700">
                      Slots Found
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      98%
                    </div>
                    <div className="text-xs font-medium text-green-700">
                      Uptime
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">
                        Real-time Monitoring
                      </div>
                      <div className="text-xs text-gray-500">
                        Checks every 1-60 minutes
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Bell className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">
                        Instant Alerts
                      </div>
                      <div className="text-xs text-gray-500">
                        Email, SMS & WhatsApp
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">
                        Safe & Legal
                      </div>
                      <div className="text-xs text-gray-500">
                        Public data monitoring only
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Floating Notification Card */}
              <div className="absolute -bottom-6 -left-6 bg-white border border-gray-200 rounded-xl shadow-xl p-4 max-w-xs animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      New Slot Available!
                    </div>
                    <div className="text-xs text-gray-500">
                      German Embassy - Frankfurt
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      2 minutes ago
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Decoration */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10"></div>
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-50 -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="py-12 px-6 lg:px-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                10,000+
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Active Users
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">250K+</div>
              <div className="text-sm text-gray-600 font-medium">
                Slots Found
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">95%</div>
              <div className="text-sm text-gray-600 font-medium">
                Success Rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-sm text-gray-600 font-medium">
                Monitoring
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
