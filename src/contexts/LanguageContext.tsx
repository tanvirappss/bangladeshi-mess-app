import React, { createContext, useContext, useState } from 'react'

type Language = 'en' | 'bn'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.members': 'Members',
    'nav.deposits': 'Deposits',
    'nav.bazar': 'Bazar',
    'nav.meals': 'Meals',
    'nav.reports': 'Reports',
    'nav.logout': 'Logout',
    
    // Auth
    'auth.login': 'Login',
    'auth.loginWithGoogle': 'Login with Google',
    'auth.loginWithEmail': 'Login with Email',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.enterEmail': 'Enter your email',
    'auth.enterPassword': 'Enter your password',
    'auth.sendOTP': 'Send OTP',
    'auth.verifyOTP': 'Verify OTP',
    'auth.enterOTP': 'Enter OTP',
    
    // Dashboard
    'dashboard.title': 'Mess Management Dashboard',
    'dashboard.totalMembers': 'Total Members',
    'dashboard.totalDeposits': 'Total Deposits',
    'dashboard.totalExpenses': 'Total Expenses',
    'dashboard.mealRate': 'Meal Rate',
    'dashboard.monthlyOverview': 'Monthly Overview',
    
    // Members
    'members.title': 'Mess Members',
    'members.addMember': 'Add Member',
    'members.name': 'Name',
    'members.phone': 'Phone',
    'members.actions': 'Actions',
    'members.edit': 'Edit',
    'members.delete': 'Delete',
    'members.enterName': 'Enter member name',
    'members.enterPhone': 'Enter phone number',
    
    // Deposits
    'deposits.title': 'Monthly Deposits',
    'deposits.addDeposit': 'Add Deposit',
    'deposits.member': 'Member',
    'deposits.month': 'Month',
    'deposits.amount': 'Amount',
    'deposits.selectMember': 'Select a member',
    'deposits.enterAmount': 'Enter amount',
    
    // Bazar
    'bazar.title': 'Daily Bazar Expenses',
    'bazar.addBazar': 'Add Bazar Entry',
    'bazar.date': 'Date',
    'bazar.description': 'Description',
    'bazar.enterDescription': 'Enter description',
    
    // Meals
    'meals.title': 'Daily Meals Tracking',
    'meals.addMeal': 'Add Meal Entry',
    'meals.lunch': 'Lunch',
    'meals.dinner': 'Dinner',
    'meals.total': 'Total',
    
    // Reports
    'reports.title': 'Monthly Reports',
    'reports.generateReport': 'Generate Report',
    'reports.exportPDF': 'Export PDF',
    'reports.exportExcel': 'Export Excel',
    'reports.selectMonth': 'Select Month',
    'reports.balance': 'Balance',
    'reports.toPay': 'To Pay',
    'reports.toReceive': 'To Receive',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
  },
  bn: {
    // Navigation
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.members': 'সদস্যগণ',
    'nav.deposits': 'জমা',
    'nav.bazar': 'বাজার',
    'nav.meals': 'খাবার',
    'nav.reports': 'রিপোর্ট',
    'nav.logout': 'লগআউট',
    
    // Auth
    'auth.login': 'লগইন',
    'auth.loginWithGoogle': 'গুগল দিয়ে লগইন',
    'auth.loginWithEmail': 'ইমেইল দিয়ে লগইন',
    'auth.email': 'ইমেইল',
    'auth.password': 'পাসওয়ার্ড',
    'auth.enterEmail': 'আপনার ইমেইল লিখুন',
    'auth.enterPassword': 'আপনার পাসওয়ার্ড লিখুন',
    'auth.sendOTP': 'ওটিপি পাঠান',
    'auth.verifyOTP': 'ওটিপি যাচাই',
    'auth.enterOTP': 'ওটিপি লিখুন',
    
    // Dashboard
    'dashboard.title': 'মেস ব্যবস্থাপনা ড্যাশবোর্ড',
    'dashboard.totalMembers': 'মোট সদস্য',
    'dashboard.totalDeposits': 'মোট জমা',
    'dashboard.totalExpenses': 'মোট খরচ',
    'dashboard.mealRate': 'খাবারের রেট',
    'dashboard.monthlyOverview': 'মাসিক পর্যালোচনা',
    
    // Members
    'members.title': 'মেস সদস্যগণ',
    'members.addMember': 'সদস্য যোগ করুন',
    'members.name': 'নাম',
    'members.phone': 'ফোন',
    'members.actions': 'কার্যক্রম',
    'members.edit': 'সম্পাদনা',
    'members.delete': 'মুছুন',
    'members.enterName': 'সদস্যের নাম লিখুন',
    'members.enterPhone': 'ফোন নম্বর লিখুন',
    
    // Deposits
    'deposits.title': 'মাসিক জমা',
    'deposits.addDeposit': 'জমা যোগ করুন',
    'deposits.member': 'সদস্য',
    'deposits.month': 'মাস',
    'deposits.amount': 'পরিমাণ',
    'deposits.selectMember': 'একজন সদস্য নির্বাচন করুন',
    'deposits.enterAmount': 'পরিমাণ লিখুন',
    
    // Bazar
    'bazar.title': 'দৈনিক বাজারের খরচ',
    'bazar.addBazar': 'বাজার এন্ট্রি যোগ করুন',
    'bazar.date': 'তারিখ',
    'bazar.description': 'বিবরণ',
    'bazar.enterDescription': 'বিবরণ লিখুন',
    
    // Meals
    'meals.title': 'দৈনিক খাবার ট্র্যাকিং',
    'meals.addMeal': 'খাবার এন্ট্রি যোগ করুন',
    'meals.lunch': 'দুপুরের খাবার',
    'meals.dinner': 'রাতের খাবার',
    'meals.total': 'মোট',
    
    // Reports
    'reports.title': 'মাসিক রিপোর্ট',
    'reports.generateReport': 'রিপোর্ট তৈরি করুন',
    'reports.exportPDF': 'পিডিএফ এক্সপোর্ট',
    'reports.exportExcel': 'এক্সেল এক্সপোর্ট',
    'reports.selectMonth': 'মাস নির্বাচন করুন',
    'reports.balance': 'ব্যালেন্স',
    'reports.toPay': 'দিতে হবে',
    'reports.toReceive': 'পাবেন',
    
    // Common
    'common.save': 'সংরক্ষণ',
    'common.cancel': 'বাতিল',
    'common.edit': 'সম্পাদনা',
    'common.delete': 'মুছুন',
    'common.add': 'যোগ করুন',
    'common.loading': 'লোডিং...',
    'common.error': 'ত্রুটি',
    'common.success': 'সফল',
    'common.confirm': 'নিশ্চিত',
    'common.close': 'বন্ধ',
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key
  }
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}