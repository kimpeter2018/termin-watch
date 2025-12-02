// app/page.tsx
import React from 'react';
import Link from 'next/link';
import { Calendar, Bell, Zap, Shield, Clock, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">TerminWatch</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition">How It Works</a>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition transform hover:scale-105"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-gray-300 hover:text-white transition">
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition transform hover:scale-105"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-8">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Never Miss an Appointment Again</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Monitor Appointment<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Availability 24/7
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Get instant notifications when your desired appointment slots become available. 
            Perfect for visa appointments, passport renewals, and government services.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/signup"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105 shadow-lg shadow-purple-500/50"
            >
              Start Monitoring Free
            </Link>
            <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-semibold transition backdrop-blur-sm border border-white/20">
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="text-4xl font-bold text-purple-400 mb-2">10k+</div>
              <div className="text-gray-300">Active Monitors</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="text-4xl font-bold text-purple-400 mb-2">95%</div>
              <div className="text-gray-300">Success Rate</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="text-4xl font-bold text-purple-400 mb-2">24/7</div>
              <div className="text-gray-300">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-300">
              Everything you need to secure your appointment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Clock className="w-8 h-8" />,
                title: "Real-Time Monitoring",
                description: "Check availability every minute with premium plans. Never miss a slot."
              },
              {
                icon: <Bell className="w-8 h-8" />,
                title: "Instant Notifications",
                description: "Get alerts via email, SMS, or WhatsApp the moment a slot opens."
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: "Date Preferences",
                description: "Set your preferred dates and time windows for maximum flexibility."
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Multiple Monitors",
                description: "Track multiple appointment systems simultaneously."
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Safe & Legal",
                description: "Only monitors public availability. No automated booking or login required."
              },
              {
                icon: <CheckCircle className="w-8 h-8" />,
                title: "Easy Setup",
                description: "Just paste the URL and select preferences. We handle the rest."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 transition group">
                <div className="text-purple-400 mb-4 group-hover:scale-110 transition">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-300">
              Get started in 3 simple steps
            </p>
          </div>

          <div className="space-y-12">
            {[
              {
                step: "01",
                title: "Paste Your URL",
                description: "Copy the appointment booking page URL and paste it into our system."
              },
              {
                step: "02",
                title: "Set Preferences",
                description: "Choose your preferred dates, time windows, and monitoring frequency."
              },
              {
                step: "03",
                title: "Get Notified",
                description: "Receive instant alerts when matching appointments become available."
              }
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white">
                  {item.step}
                </div>
                <div className="flex-grow bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-300 text-lg">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-300">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Basic",
                price: "9",
                frequency: "Check every 30-60 min",
                features: ["1 active monitor", "Email notifications", "Date preferences", "7-day monitoring"]
              },
              {
                name: "Standard",
                price: "19",
                frequency: "Check every 10 min",
                features: ["3 active monitors", "Email + SMS alerts", "Date & time preferences", "30-day monitoring", "Priority support"],
                popular: true
              },
              {
                name: "Premium",
                price: "39",
                frequency: "Check every 1-3 min",
                features: ["10 active monitors", "All notification types", "Advanced preferences", "90-day monitoring", "Dedicated support", "API access"]
              }
            ].map((plan, index) => (
              <div key={index} className={`relative bg-white/5 backdrop-blur-sm border rounded-xl p-8 ${plan.popular ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-white/10'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    ${plan.price}<span className="text-lg text-gray-400">/mo</span>
                  </div>
                  <p className="text-purple-400 text-sm">{plan.frequency}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-300">
                      <CheckCircle className="w-5 h-5 text-purple-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className={`block text-center w-full py-3 rounded-lg font-semibold transition ${plan.popular ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 px-4 bg-yellow-500/10 border-y border-yellow-500/20">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <p className="text-yellow-200 text-sm">
            <strong>Legal Notice:</strong> This service only monitors publicly visible appointment availability information. 
            We do not interact with, alter, or bypass official appointment systems. We are not affiliated with any government agency.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-6 h-6 text-purple-400" />
                <span className="text-xl font-bold text-white">TerminWatch</span>
              </div>
              <p className="text-gray-400 text-sm">
                Never miss an appointment again with automated monitoring.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Disclaimer</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
            © 2024 TerminWatch. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}