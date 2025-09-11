import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'

import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { supabase } from './lib/supabase'

// Components
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Deposits from './pages/Deposits'
import BazarPage from './pages/Bazar'
import Meals from './pages/Meals'
import Reports from './pages/Reports'
import MessDashboard from './pages/MessDashboard'
import Layout from './components/Layout'
import ParticleBackground from './components/ParticleBackground'

const queryClient = new QueryClient()

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="mess-app-theme">
        <LanguageProvider>
          <Router>
            <div className="min-h-screen bg-background relative">
              <ParticleBackground />
              <Toaster position="top-right" />
              
              <Routes>
                {/* Public routes */}
                <Route 
                  path="/login" 
                  element={!session ? <Login /> : <Navigate to="/dashboard" />} 
                />
                <Route 
                  path="/" 
                  element={session ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
                />

                {/* Legacy/role routes redirected to dashboard */}
                <Route path="/role" element={<Navigate to="/dashboard" replace />} />
                <Route path="/roles" element={<Navigate to="/dashboard" replace />} />
                <Route path="/select-role" element={<Navigate to="/dashboard" replace />} />
                <Route path="/choose-role" element={<Navigate to="/dashboard" replace />} />

                {/* Authenticated routes */}
                <Route 
                  path="/*" 
                  element={
                    session ? (
                      <Layout>
                        <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/members" element={<Members />} />
                          <Route path="/deposits" element={<Deposits />} />
                          <Route path="/bazar" element={<BazarPage />} />
                          <Route path="/meals" element={<Meals />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/mess-dashboard" element={<MessDashboard />} />
                        </Routes>
                      </Layout>
                    ) : (
                      <Navigate to="/login" />
                    )
                  } 
                />
              </Routes>
            </div>
          </Router>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
