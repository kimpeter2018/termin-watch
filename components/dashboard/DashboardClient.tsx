'use client';

import { useState } from 'react';
import { Calendar, Plus, Bell, LogOut, User as UserIcon, Search, Filter, Clock, Globe, CheckCircle, Pause, Play, Trash2, Edit, Settings, CreditCard } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardClient() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  // Mock data for monitors
  const monitors = [
    {
      id: 1,
      name: 'German Visa Appointment - Frankfurt',
      url: 'https://service2.diplo.de/rktermin/extern/...',
      status: 'active',
      frequency: '10 min',
      lastChecked: '2 minutes ago',
      dateRange: 'Jan 15 - Feb 28, 2024',
      notifications: ['email', 'sms'],
      found: 0,
      plan: 'Standard'
    },
    {
      id: 2,
      name: 'US Passport Renewal',
      url: 'https://passportappointment.travel.state.gov/...',
      status: 'active',
      frequency: '30 min',
      lastChecked: '5 minutes ago',
      dateRange: 'Feb 1 - Mar 15, 2024',
      notifications: ['email'],
      found: 2,
      plan: 'Basic'
    },
    {
      id: 3,
      name: 'Spain Schengen Visa - Berlin',
      url: 'https://blsspain-germany.com/...',
      status: 'paused',
      frequency: '1 min',
      lastChecked: '1 hour ago',
      dateRange: 'Dec 20 - Jan 31, 2024',
      notifications: ['email', 'sms', 'whatsapp'],
      found: 5,
      plan: 'Premium'
    }
  ];

  const stats = [
    { label: 'Active Monitors', value: '2', icon: <Calendar className="w-5 h-5" />, color: 'purple' },
    { label: 'Slots Found', value: '7', icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
    { label: 'Checks Today', value: '342', icon: <Clock className="w-5 h-5" />, color: 'blue' },
    { label: 'Success Rate', value: '94%', icon: <Globe className="w-5 h-5" />, color: 'pink' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'Premium': return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
      case 'Standard': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      case 'Basic': return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm bg-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">TerminWatch</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <button className="relative text-gray-300 hover:text-white transition p-2 rounded-lg hover:bg-white/10">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition"
                >
                  <UserIcon className="w-5 h-5 text-purple-400" />
                  <span className="text-white text-sm hidden md:block">
                    {profile.full_name || user?.email?.split('@')[0]}
                  </span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-xl py-2">
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Billing</span>
                    </Link>
                    <hr className="my-2 border-white/10" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 px-4 py-2 text-red-400 hover:bg-red-500/10 w-full transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
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
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-300">Manage your appointment monitors</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-500/20`}>
                  <div className={`text-${stat.color}-400`}>{stat.icon}</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search monitors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 bg-white/5 border border-white/20 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none bg-white/5 border border-white/20 rounded-lg py-2 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>

          <button className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-6 rounded-lg transition transform hover:scale-105 shadow-lg shadow-purple-500/50 w-full md:w-auto justify-center">
            <Plus className="w-5 h-5" />
            <span>Create Monitor</span>
          </button>
        </div>

        {/* Monitors List */}
        <div className="space-y-4">
          {monitors.map((monitor) => (
            <div key={monitor.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section - Main Info */}
                <div className="flex-grow space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{monitor.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPlanBadgeColor(monitor.plan)}`}>
                          {monitor.plan}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Globe className="w-4 h-4" />
                        <span className="truncate max-w-md">{monitor.url}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300">{monitor.dateRange}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">Every {monitor.frequency}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Last checked:</span>
                      <span className="text-gray-300">{monitor.lastChecked}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center space-x-2 text-xs px-3 py-1 rounded-full border ${getStatusColor(monitor.status)}`}>
                      {monitor.status === 'active' && <Play className="w-3 h-3" />}
                      {monitor.status === 'paused' && <Pause className="w-3 h-3" />}
                      <span className="capitalize">{monitor.status}</span>
                    </span>
                    
                    {monitor.found > 0 && (
                      <span className="inline-flex items-center space-x-2 text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                        <CheckCircle className="w-3 h-3" />
                        <span>{monitor.found} slots found</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex lg:flex-col items-center gap-2">
                  <button className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition flex-1 lg:flex-none lg:w-full">
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">Edit</span>
                  </button>
                  
                  {monitor.status === 'active' ? (
                    <button className="flex items-center justify-center space-x-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-lg transition flex-1 lg:flex-none lg:w-full">
                      <Pause className="w-4 h-4" />
                      <span className="text-sm">Pause</span>
                    </button>
                  ) : (
                    <button className="flex items-center justify-center space-x-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg transition flex-1 lg:flex-none lg:w-full">
                      <Play className="w-4 h-4" />
                      <span className="text-sm">Resume</span>
                    </button>
                  )}
                  
                  <button className="flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 p-2 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
