import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Chrome, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { supabase, setupDatabase } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const { t, language } = useLanguage()

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) {
        toast.error(error.message)
      } else {
        // Setup database after successful login
        await setupDatabase()
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success(language === 'bn' ? 'OTP পাঠানো হয়েছে!' : 'OTP sent to your email!')
        setStep('otp')
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOtpVerification = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success(language === 'bn' ? 'সফলভাবে লগইন!' : 'Login successful!')
        // Setup database after successful login
        await setupDatabase()
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-lg bg-card/90 border-border/50 shadow-2xl">
          <CardHeader className="space-y-1">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <CardTitle className={`text-2xl text-center ${language === 'bn' ? 'bengali' : 'english'}`}>
                {language === 'bn' ? 'মেস ম্যানেজমেন্ট সিস্টেম' : 'Mess Management System'}
              </CardTitle>
              <CardDescription className={`text-center ${language === 'bn' ? 'bengali' : 'english'}`}>
                {language === 'bn' 
                  ? 'আপনার মেস অ্যাকাউন্টে প্রবেশ করুন' 
                  : 'Sign in to your mess account'
                }
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'email' ? (
              <>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full"
                    variant="outline"
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    <span className={language === 'bn' ? 'bengali' : 'english'}>
                      {t('auth.loginWithGoogle')}
                    </span>
                  </Button>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="relative"
                >
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {language === 'bn' ? 'অথবা' : 'Or'}
                    </span>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <Input
                    type="email"
                    placeholder={t('auth.enterEmail')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={language === 'bn' ? 'bengali' : 'english'}
                  />
                  <Button
                    onClick={handleEmailLogin}
                    disabled={loading || !email}
                    className="w-full"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    <span className={language === 'bn' ? 'bengali' : 'english'}>
                      {t('auth.sendOTP')}
                    </span>
                  </Button>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <p className={`text-sm text-muted-foreground text-center ${language === 'bn' ? 'bengali' : 'english'}`}>
                  {language === 'bn' 
                    ? `আপনার ইমেইল ${email} এ পাঠানো OTP কোড লিখুন` 
                    : `Enter the OTP sent to ${email}`
                  }
                </p>
                <Input
                  type="text"
                  placeholder={t('auth.enterOTP')}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={`text-center text-lg tracking-widest ${language === 'bn' ? 'bengali' : 'english'}`}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => setStep('email')}
                    variant="outline"
                    className="flex-1"
                  >
                    <span className={language === 'bn' ? 'bengali' : 'english'}>
                      {language === 'bn' ? 'ফিরে যান' : 'Back'}
                    </span>
                  </Button>
                  <Button
                    onClick={handleOtpVerification}
                    disabled={loading || otp.length < 6}
                    className="flex-1"
                  >
                    <span className={language === 'bn' ? 'bengali' : 'english'}>
                      {t('auth.verifyOTP')}
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                />
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default Login