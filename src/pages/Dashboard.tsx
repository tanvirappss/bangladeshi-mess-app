import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, ShoppingCart, UtensilsCrossed, TrendingUp, Calculator } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import toast from 'react-hot-toast'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase, type Member, type Deposit, type Bazar, type Meal } from '../lib/supabase'
import { getCurrentMonth, formatCurrency, calculateMessBalance } from '../lib/utils'

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage()
  const [members, setMembers] = useState<Member[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [bazarEntries, setBazarEntries] = useState<Bazar[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())

  // Local mess/role context
  const [messId, setMessId] = useState<string | null>(() => localStorage.getItem('mess_id'))
  const [role, setRole] = useState<string | null>(() => localStorage.getItem('role'))
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  // Fetch all data
  const fetchAllData = async () => {
    try {
      const [membersRes, depositsRes, bazarRes, mealsRes] = await Promise.all([
        supabase.from('members').select('*'),
        supabase.from('deposits').select('*'),
        supabase.from('bazar').select('*'),
        supabase.from('meals').select('*')
      ])

      if (membersRes.error) throw membersRes.error
      if (depositsRes.error) throw depositsRes.error
      if (bazarRes.error) throw bazarRes.error
      if (mealsRes.error) throw mealsRes.error

      setMembers(membersRes.data || [])
      setDeposits(depositsRes.data || [])
      setBazarEntries(bazarRes.data || [])
      setMeals(mealsRes.data || [])
    } catch (error: any) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  // Role/Mess actions (frontend-only context preservation)
  const generateMessId = () => {
    return Math.random().toString(36).slice(2, 8).toUpperCase()
  }

  const handleCreateMess = () => {
    const newMessId = generateMessId()
    localStorage.setItem('mess_id', newMessId)
    localStorage.setItem('role', 'manager')
    setMessId(newMessId)
    setRole('manager')
    toast.success(language === 'bn' ? 'নতুন মেস তৈরি হয়েছে!' : 'Mess created!')
  }

  const handleJoinMess = () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) {
      toast.error(language === 'bn' ? 'মেস আইডি দিন' : 'Please enter a mess ID')
      return
    }
    localStorage.setItem('mess_id', code)
    localStorage.setItem('role', 'member')
    setMessId(code)
    setRole('member')
    setJoinDialogOpen(false)
    setJoinCode('')
    toast.success(language === 'bn' ? 'মেসে যোগ হয়েছে!' : 'Joined mess!')
  }

  // Calculate monthly statistics
  const monthlyStats = calculateMessBalance(members, deposits, bazarEntries, meals, selectedMonth)

  // Get available months
  const availableMonths = Array.from(new Set([
    ...deposits.map(d => d.month),
    ...bazarEntries.map(b => b.date.substring(0, 7)),
    ...meals.map(m => m.date.substring(0, 7))
  ])).sort().reverse()

  // Chart data
  const expenseChartData = monthlyStats.memberBalances.map(mb => ({
    name: mb.member.name.length > 8 ? mb.member.name.substring(0, 8) + '...' : mb.member.name,
    deposit: mb.deposit,
    bazar: mb.bazarSpent,
    meals: mb.mealCost
  }))

  const balanceChartData = monthlyStats.memberBalances.map(mb => ({
    name: mb.member.name.length > 8 ? mb.member.name.substring(0, 8) + '...' : mb.member.name,
    balance: mb.balance,
    status: mb.status
  }))

  const mealDistribution = monthlyStats.memberBalances.map(mb => ({
    name: mb.member.name,
    meals: mb.mealsEaten
  }))

  // Colors for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316']

  const stats = [
    {
      title: t('dashboard.totalMembers'),
      value: members.length.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      title: t('dashboard.totalDeposits'),
      value: formatCurrency(monthlyStats.totalDeposits),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900'
    },
    {
      title: t('dashboard.totalExpenses'),
      value: formatCurrency(monthlyStats.totalBazar),
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900'
    },
    {
      title: t('dashboard.mealRate'),
      value: formatCurrency(monthlyStats.mealRate),
      icon: UtensilsCrossed,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!messId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className={language === 'bn' ? 'bengali' : 'english'}>
                {language === 'bn' ? 'আপনি কী করতে চান?' : 'What would you like to do?'}
              </CardTitle>
              <CardDescription className={language === 'bn' ? 'bengali' : 'english'}>
                {language === 'bn'
                  ? 'লগইন করার পর সরাসরি একটি বিকল্প নির্বাচন করুন'
                  : 'Choose an option directly after login — no extra steps'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleCreateMess} className="w-full sm:w-auto">
                  {language === 'bn' ? 'মেস তৈরি করুন (ম্যানেজার)' : 'Create a Mess (Manager)'}
                </Button>
                <Button variant="outline" onClick={() => setJoinDialogOpen(true)} className="w-full sm:w-auto">
                  {language === 'bn' ? 'মেসে যোগ দিন (মেম্বার)' : 'Join a Mess (Member)'}
                </Button>
              </div>
              {role && messId && (
                <p className={`mt-3 text-sm text-muted-foreground ${language === 'bn' ? 'bengali' : 'english'}`}>
                  {language === 'bn' ? 'বর্তমান ভূমিকা' : 'Current role'}: {role.toUpperCase()} • ID: {messId}
                </p>
              )}
            </CardContent>
          </Card>

          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className={language === 'bn' ? 'bengali' : 'english'}>
                  {language === 'bn' ? 'মেস আইডি দিন' : 'Enter Mess ID'}
                </DialogTitle>
                <DialogDescription className={language === 'bn' ? 'bengali' : 'english'}>
                  {language === 'bn' ? 'আপনার বন্ধু যে আইডি শেয়ার করেছে তা দিন' : 'Enter the ID shared with you'}
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2">
                <Input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder={language === 'bn' ? 'উদাহরণ: ABC123' : 'e.g., ABC123'} />
                <Button onClick={handleJoinMess}>{language === 'bn' ? 'যোগ দিন' : 'Join'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className={`text-3xl font-bold ${language === 'bn' ? 'bengali' : 'english'}`}>
            {t('dashboard.title')}
          </h1>
          <p className={`text-muted-foreground mt-2 ${language === 'bn' ? 'bengali' : 'english'}`}>
            {language === 'bn' 
              ? 'আপনার মেসের মাসিক পরিসংখ্যান এবং হিসাব নিকাশ' 
              : 'Your mess monthly statistics and calculations'
            }
          </p>
        </div>
        
        {availableMonths.length > 0 && (
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(month => (
                <SelectItem key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={`text-sm font-medium ${language === 'bn' ? 'bengali' : 'english'}`}>
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
            <p className={`text-muted-foreground text-center ${language === 'bn' ? 'bengali' : 'english'}`}>
              {language === 'bn' 
                ? 'ড্যাশবোর্ড দেখতে প্রথমে সদস্য এবং তথ্য যোগ করুন।'
                : 'Add members and data first to see dashboard analytics.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Expense Breakdown Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className={language === 'bn' ? 'bengali' : 'english'}>
                  {language === 'bn' ? 'সদস্যদের খরচের বিবরণ' : 'Member Expense Breakdown'}
                </CardTitle>
                <CardDescription className={language === 'bn' ? 'bengali' : 'english'}>
                  {language === 'bn' 
                    ? 'প্রতিটি সদস্যের জমা, বাজার এবং খাবারের খরচ'
                    : 'Each member\'s deposit, bazar spending, and meal cost'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expenseChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={expenseChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="deposit" fill="#10B981" name={language === 'bn' ? 'জমা' : 'Deposit'} />
                      <Bar dataKey="bazar" fill="#F59E0B" name={language === 'bn' ? 'বাজার' : 'Bazar'} />
                      <Bar dataKey="meals" fill="#EF4444" name={language === 'bn' ? 'খাবার' : 'Meals'} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    {language === 'bn' ? 'এই মাসের কোন তথ্য নেই' : 'No data available for this month'}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Balance and Meal Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Balance Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className={language === 'bn' ? 'bengali' : 'english'}>
                    {language === 'bn' ? 'সদস্যদের ব্যালেন্স' : 'Member Balances'}
                  </CardTitle>
                  <CardDescription className={language === 'bn' ? 'bengali' : 'english'}>
                    {language === 'bn' 
                      ? 'কে কত টাকা পাবে বা দিতে হবে'
                      : 'Who will receive or pay money'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {balanceChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={balanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [
                            formatCurrency(Math.abs(Number(value))), 
                            Number(value) >= 0 ? (language === 'bn' ? 'পাবেন' : 'Refund') : (language === 'bn' ? 'দিবেন' : 'Pay')
                          ]} 
                        />
                        <Bar 
                          dataKey="balance" 
                          fill="#3B82F6"
                          name={language === 'bn' ? 'ব্যালেন্স' : 'Balance'}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      {language === 'bn' ? 'এই মাসের কোন তথ্য নেই' : 'No data available'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Meal Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className={language === 'bn' ? 'bengali' : 'english'}>
                    {language === 'bn' ? 'খাবার বন্টন' : 'Meal Distribution'}
                  </CardTitle>
                  <CardDescription className={language === 'bn' ? 'bengali' : 'english'}>
                    {language === 'bn' 
                      ? 'সদস্যদের খাবারের সংখ্যা'
                      : 'Number of meals per member'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {mealDistribution.length > 0 && mealDistribution.some(m => m.meals > 0) ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={mealDistribution.filter(m => m.meals > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.meals}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="meals"
                        >
                          {mealDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      {language === 'bn' ? 'এই মাসের কোন খাবারের তথ্য নেই' : 'No meal data available'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Monthly Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className={language === 'bn' ? 'bengali' : 'english'}>
                  {language === 'bn' ? 'মাসিক সারসংক্ষেপ' : 'Monthly Summary'}
                </CardTitle>
                <CardDescription className={language === 'bn' ? 'bengali' : 'english'}>
                  {language === 'bn' 
                    ? 'এই মাসের সম্পূর্ণ হিসাব নিকাশ'
                    : 'Complete calculation for this month'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyStats.memberBalances.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(monthlyStats.totalDeposits)}</div>
                        <div className={`text-sm ${language === 'bn' ? 'bengali' : 'english'}`}>
                          {language === 'bn' ? 'মোট জমা' : 'Total Deposits'}
                        </div>
                      </div>
                      <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(monthlyStats.totalBazar)}</div>
                        <div className={`text-sm ${language === 'bn' ? 'bengali' : 'english'}`}>
                          {language === 'bn' ? 'মোট বাজার' : 'Total Bazar'}
                        </div>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{monthlyStats.totalMeals}</div>
                        <div className={`text-sm ${language === 'bn' ? 'bengali' : 'english'}`}>
                          {language === 'bn' ? 'মোট খাবার' : 'Total Meals'}
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(monthlyStats.mealRate)}</div>
                        <div className={`text-sm ${language === 'bn' ? 'bengali' : 'english'}`}>
                          {language === 'bn' ? 'প্রতি খাবারের দাম' : 'Per Meal Rate'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className={`p-3 text-left ${language === 'bn' ? 'bengali' : 'english'}`}>
                              {language === 'bn' ? 'সদস্য' : 'Member'}
                            </th>
                            <th className={`p-3 text-right ${language === 'bn' ? 'bengali' : 'english'}`}>
                              {language === 'bn' ? 'জমা' : 'Deposit'}
                            </th>
                            <th className={`p-3 text-right ${language === 'bn' ? 'bengali' : 'english'}`}>
                              {language === 'bn' ? 'বাজার' : 'Bazar'}
                            </th>
                            <th className={`p-3 text-right ${language === 'bn' ? 'bengali' : 'english'}`}>
                              {language === 'bn' ? 'খাবার' : 'Meals'}
                            </th>
                            <th className={`p-3 text-right ${language === 'bn' ? 'bengali' : 'english'}`}>
                              {language === 'bn' ? 'খরচ' : 'Cost'}
                            </th>
                            <th className={`p-3 text-right ${language === 'bn' ? 'bengali' : 'english'}`}>
                              {language === 'bn' ? 'ব্যালেন্স' : 'Balance'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyStats.memberBalances.map((mb, index) => (
                            <tr key={mb.member.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                              <td className={`p-3 ${language === 'bn' ? 'bengali' : 'english'}`}>
                                {mb.member.name}
                              </td>
                              <td className="p-3 text-right">{formatCurrency(mb.deposit)}</td>
                              <td className="p-3 text-right">{formatCurrency(mb.bazarSpent)}</td>
                              <td className="p-3 text-right">{mb.mealsEaten}</td>
                              <td className="p-3 text-right">{formatCurrency(mb.mealCost)}</td>
                              <td className={`p-3 text-right font-bold ${mb.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {mb.balance >= 0 ? '+' : ''}{formatCurrency(mb.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'bn' 
                      ? 'এই মাসের জন্য কোন তথ্য নেই। সদস্য, জমা এবং খাবারের তথ্য যোগ করুন।'
                      : 'No data available for this month. Add members, deposits and meal data.'
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  )
}

export default Dashboard