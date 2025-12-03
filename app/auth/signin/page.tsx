'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Calendar, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        throw new Error('Session not available yet')
      }

      router.push('/dashboard')
    } catch (err: unknown) {
      let message = 'Failed to sign in'
      if (err instanceof Error) message = err.message
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (err: unknown) {
      let message = 'Failed to sign in with Google'
      if (err instanceof Error) {
        message = err.message
      }  
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          {/* Back to Home */}
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-black transition mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
            <span className="font-medium">Back to home</span>
          </Link>

          {/* Logo */}
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-[#2403fc] rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-black">TerminWatch</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">Welcome back</h1>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-3 border border-gray-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email Sign In Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg py-3 pl-11 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2403fc] focus:border-transparent transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg py-3 pl-11 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2403fc] focus:border-transparent transition"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-[#2403fc] focus:ring-[#2403fc] focus:ring-offset-0"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-[#2403fc] hover:text-[#1d02c7] font-semibold transition"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2403fc] hover:bg-[#1d02c7] text-white font-semibold py-3 px-4 rounded-lg transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-[#2403fc] hover:text-[#1d02c7] font-semibold transition">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Info */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#2403fc] to-[#1d02c7] items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Monitor appointments 24/7
            </h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Get instant notifications when your desired appointment slots become available. Never miss an opportunity again.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Real-time monitoring</h3>
                <p className="text-white/80 text-sm">Check availability every minute with our premium plans</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Instant alerts</h3>
                <p className="text-white/80 text-sm">Get notified via email, SMS, or WhatsApp immediately</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Safe & secure</h3>
                <p className="text-white/80 text-sm">Only monitors public data, no login required</p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/30 border-2 border-[#2403fc]"></div>
                <div className="w-10 h-10 rounded-full bg-white/30 border-2 border-[#2403fc]"></div>
                <div className="w-10 h-10 rounded-full bg-white/30 border-2 border-[#2403fc]"></div>
              </div>
              <div>
                <p className="font-semibold">Join 10,000+ users</p>
                <p className="text-white/80 text-sm">Already monitoring appointments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}