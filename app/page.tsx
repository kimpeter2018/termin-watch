import React from 'react';
import Link from 'next/link';
import { Calendar, Bell, Zap, Shield, Clock, CheckCircle, ArrowRight, Star, Users, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-[#2403fc] rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-black">TerminWatch</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-black transition font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-black transition font-medium">How It Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-black transition font-medium">Pricing</a>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="bg-[#2403fc] hover:bg-[#1d02c7] text-white px-6 py-2.5 rounded-lg transition font-semibold flex items-center space-x-2"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-gray-700 hover:text-black transition font-semibold">
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-[#2403fc] hover:bg-[#1d02c7] text-white px-6 py-2.5 rounded-lg transition font-semibold"
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
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-8 animate-fade-in">
              <Zap className="w-4 h-4 text-[#2403fc]" />
              <span className="text-sm font-semibold text-[#2403fc]">Automated Appointment Monitoring</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-black mb-6 leading-tight animate-slide-up">
              Never Miss Your
              <span className="block text-gradient">Visa Appointment</span>
            </h1>
            
            {/* Subheading */}
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-slide-up">
              Get instant alerts when appointment slots become available. Monitor embassy appointments, passport renewals, and government services 24/7.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-slide-up">
              <Link
                href="/auth/signup"
                className="bg-[#2403fc] hover:bg-[#1d02c7] text-white px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg hover:shadow-xl flex items-center space-x-2 group"
              >
                <span>Start Monitoring Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <button className="bg-white hover:bg-gray-50 text-black px-8 py-4 rounded-lg text-lg font-semibold transition border-2 border-gray-200">
                Watch Demo
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 animate-fade-in">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white"></div>
                </div>
                <span className="font-medium">10,000+ users</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="ml-1 font-medium">4.9/5</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#2403fc]" />
                </div>
              </div>
              <div className="text-4xl font-bold text-black mb-2">10,000+</div>
              <div className="text-gray-600 font-medium">Active Monitors</div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="text-4xl font-bold text-black mb-2">95%</div>
              <div className="text-gray-600 font-medium">Success Rate</div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="text-4xl font-bold text-black mb-2">24/7</div>
              <div className="text-gray-600 font-medium">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-50 text-[#2403fc] text-sm font-semibold px-4 py-2 rounded-full mb-4">
              Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features to help you secure your appointment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Clock className="w-7 h-7" />,
                title: "Real-Time Monitoring",
                description: "Check availability every minute with premium plans. Never miss a slot opening.",
                color: "bg-blue-50 text-[#2403fc]"
              },
              {
                icon: <Bell className="w-7 h-7" />,
                title: "Instant Notifications",
                description: "Get alerts via email, SMS, or WhatsApp the moment a slot becomes available.",
                color: "bg-green-50 text-green-600"
              },
              {
                icon: <Calendar className="w-7 h-7" />,
                title: "Date Preferences",
                description: "Set your preferred dates and time windows for maximum flexibility.",
                color: "bg-purple-50 text-purple-600"
              },
              {
                icon: <Zap className="w-7 h-7" />,
                title: "Multiple Monitors",
                description: "Track multiple appointment systems simultaneously with one account.",
                color: "bg-yellow-50 text-yellow-600"
              },
              {
                icon: <Shield className="w-7 h-7" />,
                title: "Safe & Legal",
                description: "Only monitors public availability. No automated booking or login required.",
                color: "bg-red-50 text-red-600"
              },
              {
                icon: <CheckCircle className="w-7 h-7" />,
                title: "Easy Setup",
                description: "Just paste the URL and select preferences. We handle the rest automatically.",
                color: "bg-indigo-50 text-indigo-600"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition group">
                <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-black mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-50 text-[#2403fc] text-sm font-semibold px-4 py-2 rounded-full mb-4">
              How It Works
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to never miss an appointment
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "Paste Your URL",
                description: "Copy the appointment booking page URL from your embassy or government website and paste it into our system.",
                color: "bg-[#2403fc]"
              },
              {
                step: "02",
                title: "Set Your Preferences",
                description: "Choose your preferred dates, time windows, and monitoring frequency. Customize notification channels.",
                color: "bg-[#2403fc]"
              },
              {
                step: "03",
                title: "Get Instant Alerts",
                description: "Receive immediate notifications when matching appointments become available. Book your slot before it's gone.",
                color: "bg-[#2403fc]"
              }
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-6 group">
                <div className={`flex-shrink-0 w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg`}>
                  {item.step}
                </div>
                <div className="flex-grow bg-gray-50 border border-gray-200 rounded-2xl p-8 group-hover:shadow-md transition">
                  <h3 className="text-2xl font-bold text-black mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-50 text-[#2403fc] text-sm font-semibold px-4 py-2 rounded-full mb-4">
              Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Basic",
                price: "9",
                frequency: "Every 30-60 minutes",
                features: ["1 active monitor", "Email notifications", "Date preferences", "7-day monitoring", "Basic support"],
                popular: false
              },
              {
                name: "Standard",
                price: "19",
                frequency: "Every 10 minutes",
                features: ["3 active monitors", "Email + SMS alerts", "Advanced preferences", "30-day monitoring", "Priority support", "History tracking"],
                popular: true
              },
              {
                name: "Premium",
                price: "39",
                frequency: "Every 1-3 minutes",
                features: ["10 active monitors", "All notification types", "Custom preferences", "90-day monitoring", "24/7 dedicated support", "API access", "White-label reports"],
                popular: false
              }
            ].map((plan, index) => (
              <div key={index} className={`relative bg-white rounded-2xl p-8 ${plan.popular ? 'border-2 border-[#2403fc] shadow-2xl scale-105' : 'border border-gray-200 shadow-sm'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#2403fc] text-white px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-black mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-5xl font-bold text-black">${plan.price}</span>
                    <span className="text-gray-500 ml-2">/month</span>
                  </div>
                  <p className="text-sm text-[#2403fc] font-semibold">{plan.frequency}</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-[#2403fc] mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href="/auth/signup"
                  className={`block text-center w-full py-3 rounded-lg font-semibold transition ${plan.popular ? 'bg-[#2403fc] hover:bg-[#1d02c7] text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200 text-black border border-gray-200'}`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="py-12 px-4 bg-yellow-50 border-y border-yellow-200">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong className="font-semibold">Legal Notice:</strong> This service only monitors publicly visible appointment availability information. 
            We do not interact with, alter, or bypass official appointment systems. We are not affiliated with any government agency or embassy.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-[#2403fc] rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">TerminWatch</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Never miss an appointment again with automated 24/7 monitoring.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="text-gray-400 hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Roadmap</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Disclaimer</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Status</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Community</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 TerminWatch. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}