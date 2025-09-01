import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  UtensilsCrossed, 
  FileText, 
  LogOut,
  Sun,
  Moon,
  Languages
} from 'lucide-react'

import { Button } from '../components/ui/button'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabase'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: Home },
    { name: t('nav.members'), href: '/members', icon: Users },
    { name: t('nav.deposits'), href: '/deposits', icon: DollarSign },
    { name: t('nav.bazar'), href: '/bazar', icon: ShoppingCart },
    { name: t('nav.meals'), href: '/meals', icon: UtensilsCrossed },
    { name: t('nav.reports'), href: '/reports', icon: FileText },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en')
  }

  return (
    <div className=\"flex h-screen bg-background\">
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className=\"w-64 bg-card border-r border-border shadow-lg relative z-10\"
      >
        <div className=\"p-6\">
          <h1 className={`text-2xl font-bold text-primary ${language === 'bn' ? 'bengali' : 'english'}`}>
            {language === 'bn' ? 'মেস ম্যানেজমেন্ট' : 'Mess Management'}
          </h1>
        </div>
        
        <nav className=\"mt-6\">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <Link key={item.name} to={item.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`mx-3 mb-2 flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className=\"mr-3 h-5 w-5\" />
                  <span className={language === 'bn' ? 'bengali' : 'english'}>
                    {item.name}
                  </span>
                </motion.div>
              </Link>
            )
          })}
        </nav>
        
        {/* Theme and Language Controls */}
        <div className=\"absolute bottom-4 left-4 right-4 space-y-2\">
          <div className=\"flex gap-2\">
            <Button
              variant=\"outline\"
              size=\"sm\"
              onClick={toggleTheme}
              className=\"flex-1\"
            >
              {theme === 'light' ? <Moon className=\"h-4 w-4\" /> : <Sun className=\"h-4 w-4\" />}
            </Button>
            <Button
              variant=\"outline\"
              size=\"sm\"
              onClick={toggleLanguage}
              className=\"flex-1\"
            >
              <Languages className=\"h-4 w-4 mr-1\" />
              {language.toUpperCase()}
            </Button>
          </div>
          <Button
            variant=\"destructive\"
            size=\"sm\"
            onClick={handleLogout}
            className=\"w-full\"
          >
            <LogOut className=\"mr-2 h-4 w-4\" />
            <span className={language === 'bn' ? 'bengali' : 'english'}>
              {t('nav.logout')}
            </span>
          </Button>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <div className=\"flex-1 flex flex-col overflow-hidden\">
        <main className=\"flex-1 overflow-y-auto p-6 relative z-10\">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default Layout"