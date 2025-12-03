'use client';

import { useState } from 'react';
import { Calendar, Plus, Bell, LogOut, User as UserIcon, Search, Filter, Clock, Globe, CheckCircle, Pause, Play, Trash2, Edit, Settings, CreditCard, BarChart3, Zap } from 'lucide-react';
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
    { label: 'Active Monitors', value: '2', icon: <Calendar className="w-5 h-5" />, trend: '+12%', trendUp: true },
    { label: 'Slots Found', value: '7', icon: <CheckCircle className="w-5 h-5" />, trend: '+25%', trendUp: true },
    { label: 'Checks Today', value: '342', icon: <Clock className="w-5 h-5" />, trend: '+8%', trendUp: true },
    { label: 'Success Rate', value: '94%', icon: <BarChart3 className="w-5 h-5" />, trend: '+2%', trendUp: true }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]'
      case 'paused': return 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]'
      case 'error': return 'bg-[var(--error-light)] text-[var(--error)] border-[var(--error)]'
      default: return 'bg-[var(--gray-100)] text-[var(--gray-600)] border-[var(--gray-300)]'
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'Premium': return 'bg-gradient-primary text-white shadow-primary'
      case 'Standard': return 'badge-primary'
      case 'Basic': return 'badge bg-[var(--gray-100)] text-[var(--gray-600)]'
      default: return 'badge bg-[var(--gray-100)] text-[var(--gray-600)]'
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--gray-50)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--gray-200)] border-t-[var(--primary)] mx-auto mb-4"></div>
          <p className="text-[var(--gray-600)] text-lg font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      {/* Navigation */}
      <nav className="bg-white border-b border-[var(--gray-200)] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-[var(--primary)] rounded-lg flex items-center justify-center shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[var(--foreground)]">TerminWatch</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <button className="relative text-[var(--gray-600)] hover:text-[var(--foreground)] transition p-2 rounded-lg hover:bg-[var(--gray-100)]">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--error)] rounded-full ring-2 ring-white"></span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-[var(--gray-100)] transition"
                >
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[var(--foreground)] text-sm font-medium hidden md:block">
                    {profile.full_name || user?.email?.split('@')[0]}
                  </span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[var(--gray-200)] rounded-xl shadow-lg py-2 animate-scale-in">
                    <div className="px-4 py-3 border-b border-[var(--gray-200)]">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{profile.full_name}</p>
                      <p className="text-xs text-[var(--gray-500)] truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center space-x-3 px-4 py-2.5 text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-medium">Settings</span>
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      className="flex items-center space-x-3 px-4 py-2.5 text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm font-medium">Billing</span>
                    </Link>
                    <hr className="my-2 border-[var(--gray-200)]" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-3 px-4 py-2.5 text-[var(--error)] hover:bg-[var(--error-light)] w-full transition"
                    >
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
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Dashboard</h1>
          <p className="text-[var(--gray-600)]">Monitor and manage your appointment trackers</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="card bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-[var(--primary-50)]">
                  <div className="text-[var(--primary)]">{stat.icon}</div>
                </div>
                <div className={`flex items-center space-x-1 text-xs font-semibold ${stat.trendUp ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                  <span>{stat.trend}</span>
                  <svg className={`w-3 h-3 ${stat.trendUp ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-[var(--foreground)] mb-1">{stat.value}</div>
              <div className="text-sm text-[var(--gray-600)] font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--gray-400)]" />
              <input
                type="text"
                placeholder="Search monitors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--gray-400)]" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none pl-10 pr-10 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary w-full md:w-auto">
            <Plus className="w-5 h-5 mr-2" />
            <span>Create Monitor</span>
          </button>
        </div>

        {/* Monitors List */}
        <div className="space-y-4">
          {monitors.map((monitor) => (
            <div key={monitor.id} className="card bg-white p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section - Main Info */}
                <div className="flex-grow space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-[var(--foreground)]">{monitor.name}</h3>
                        <span className={`badge ${getPlanBadgeColor(monitor.plan)}`}>
                          {monitor.plan}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-[var(--gray-600)]">
                        <Globe className="w-4 h-4 text-[var(--gray-400)]" />
                        <span className="truncate max-w-md">{monitor.url}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-[var(--gray-700)] font-medium">{monitor.dateRange}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-[var(--gray-700)] font-medium">Every {monitor.frequency}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-[var(--gray-400)]" />
                      <span className="text-[var(--gray-600)]">Last checked: {monitor.lastChecked}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full border font-semibold ${getStatusColor(monitor.status)}`}>
                      {monitor.status === 'active' && <Play className="w-3 h-3" />}
                      {monitor.status === 'paused' && <Pause className="w-3 h-3" />}
                      <span className="capitalize">{monitor.status}</span>
                    </span>
                    
                    {monitor.found > 0 && (
                      <span className="badge-success inline-flex items-center space-x-1.5">
                        <CheckCircle className="w-3 h-3" />
                        <span>{monitor.found} slots found</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex lg:flex-col items-center gap-2">
                  <button className="btn-secondary flex items-center justify-center space-x-2 flex-1 lg:flex-none lg:w-32">
                    <Edit className="w-4 h-4" />
                    <span className="text-sm font-semibold">Edit</span>
                  </button>
                  
                  {monitor.status === 'active' ? (
                    <button className="flex items-center justify-center space-x-2 bg-[var(--warning-light)] hover:bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)] px-4 py-2 rounded-lg transition flex-1 lg:flex-none lg:w-32 font-semibold text-sm">
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button className="flex items-center justify-center space-x-2 bg-[var(--success-light)] hover:bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)] px-4 py-2 rounded-lg transition flex-1 lg:flex-none lg:w-32 font-semibold text-sm">
                      <Play className="w-4 h-4" />
                      <span>Resume</span>
                    </button>
                  )}
                  
                  <button className="flex items-center justify-center bg-[var(--error-light)] hover:bg-[var(--error-light)] text-[var(--error)] border border-[var(--error)] p-2 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (if no monitors) */}
        {monitors.length === 0 && (
          <div className="card bg-white p-12 text-center">
            <div className="w-16 h-16 bg-[var(--gray-100)] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-[var(--gray-400)]" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">No monitors yet</h3>
            <p className="text-[var(--gray-600)] mb-8 max-w-md mx-auto">
              Create your first appointment monitor to start tracking available slots
            </p>
            <button className="btn btn-primary">
              <Plus className="w-5 h-5 mr-2" />
              <span>Create Your First Monitor</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}