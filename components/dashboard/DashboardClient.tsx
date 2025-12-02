// components/dashboard/DashboardClient.tsx
'use client'

import { Calendar, Plus, Bell, LogOut, User as UserIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardClientProps {
  user: User
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">TerminWatch</span>
            </Link>
            <div className="flex items-center space-x-4">
              <button className="text-gray-300 hover:text-white transition p-2 rounded-lg hover:bg-white/10">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-white/10">
                <UserIcon className="w-5 h-5 text-purple-400" />
                <span className="text-white text-sm">{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-300 hover:text-white transition p-2 rounded-lg hover:bg-white/10"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back!</h1>
          <p className="text-gray-300">Manage your appointment monitors</p>
        </div>

        {/* Empty State */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
          <Calendar className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No monitors yet</h2>
          <p className="text-gray-300 mb-6">Create your first appointment monitor to get started</p>
          <button className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition transform hover:scale-105 shadow-lg shadow-purple-500/50">
            <Plus className="w-5 h-5" />
            <span>Create Monitor</span>
          </button>
        </div>
      </div>
    </div>
  )
}