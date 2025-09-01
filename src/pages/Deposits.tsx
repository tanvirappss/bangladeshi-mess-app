import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, DollarSign, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase, type Member, type Deposit } from '../lib/supabase'
import { getCurrentMonth, formatCurrency } from '../lib/utils'

const Deposits: React.FC = () => {
  const { t, language } = useLanguage()
  const [deposits, setDeposits] = useState<(Deposit & { members: Member })[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null)
  const [formData, setFormData] = useState({ 
    member_id: '', 
    month: getCurrentMonth(), 
    amount: '' 
  })

  // Fetch deposits with member information
  const fetchDeposits = async () => {
    try {
      const { data, error } = await supabase
        .from('deposits')
        .select(`
          *,
          members (
            id,
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDeposits(data || [])
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Fetch members for the dropdown
  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Add or update deposit
  const handleSaveDeposit = async () => {
    try {
      if (!formData.member_id) {
        toast.error(language === 'bn' ? 'সদস্য নির্বাচন করুন' : 'Please select a member')
        return
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        toast.error(language === 'bn' ? 'বৈধ পরিমাণ লিখুন' : 'Please enter valid amount')
        return
      }

      // Check if deposit already exists for this member and month
      if (!editingDeposit) {
        const { data: existingDeposit } = await supabase
          .from('deposits')
          .select('*')
          .eq('member_id', formData.member_id)
          .eq('month', formData.month)
          .single()

        if (existingDeposit) {
          toast.error(language === 'bn' ? 'এই মাসের জন্য সদস্যের জমা ইতিমধ্যে আছে' : 'Deposit for this member and month already exists')
          return
        }
      }

      if (editingDeposit) {
        // Update existing deposit
        const { error } = await supabase
          .from('deposits')
          .update({
            member_id: formData.member_id,
            month: formData.month,
            amount: parseFloat(formData.amount)
          })
          .eq('id', editingDeposit.id)

        if (error) throw error
        toast.success(language === 'bn' ? 'জমা আপডেট হয়েছে!' : 'Deposit updated successfully!')
      } else {
        // Add new deposit
        const { error } = await supabase
          .from('deposits')
          .insert([{
            member_id: formData.member_id,
            month: formData.month,
            amount: parseFloat(formData.amount)
          }])

        if (error) throw error
        toast.success(language === 'bn' ? 'নতুন জমা যোগ হয়েছে!' : 'New deposit added successfully!')
      }

      setDialogOpen(false)
      setFormData({ member_id: '', month: getCurrentMonth(), amount: '' })
      setEditingDeposit(null)
      fetchDeposits()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Delete deposit
  const handleDeleteDeposit = async (id: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('deposits')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success(language === 'bn' ? 'জমা মুছে ফেলা হয়েছে!' : 'Deposit deleted successfully!')
      fetchDeposits()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Open edit dialog
  const handleEditDeposit = (deposit: Deposit) => {
    setEditingDeposit(deposit)
    setFormData({ 
      member_id: deposit.member_id, 
      month: deposit.month, 
      amount: deposit.amount.toString() 
    })
    setDialogOpen(true)
  }

  // Open add dialog
  const handleAddDeposit = () => {
    setEditingDeposit(null)
    setFormData({ member_id: '', month: getCurrentMonth(), amount: '' })
    setDialogOpen(true)
  }

  useEffect(() => {
    fetchMembers()
    fetchDeposits()
  }, [])

  // Group deposits by month
  const depositsByMonth = deposits.reduce((acc, deposit) => {
    if (!acc[deposit.month]) {
      acc[deposit.month] = []
    }
    acc[deposit.month].push(deposit)
    return acc
  }, {} as Record<string, typeof deposits>)

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className={`text-3xl font-bold ${language === 'bn' ? 'bengali' : 'english'}`}>
            {t('deposits.title')}
          </h1>
          <p className={`text-muted-foreground mt-2 ${language === 'bn' ? 'bengali' : 'english'}`}>
            {language === 'bn' 
              ? 'মাসিক জমা যোগ, সম্পাদনা এবং পরিচালনা করুন' 
              : 'Add, edit and manage monthly deposits'
            }
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddDeposit} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className={language === 'bn' ? 'bengali' : 'english'}>
                {t('deposits.addDeposit')}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className={language === 'bn' ? 'bengali' : 'english'}>
                {editingDeposit
                  ? (language === 'bn' ? 'জমার তথ্য সম্পাদনা' : 'Edit Deposit Information')
                  : (language === 'bn' ? 'নতুন জমা যোগ করুন' : 'Add New Deposit')
                }
              </DialogTitle>
              <DialogDescription className={language === 'bn' ? 'bengali' : 'english'}>
                {language === 'bn' 
                  ? 'সদস্য, মাস এবং জমার পরিমাণ লিখুন'
                  : 'Enter member, month and deposit amount'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${language === 'bn' ? 'bengali' : 'english'}`}>
                  {t('deposits.member')} *
                </label>
                <Select value={formData.member_id} onValueChange={(value) => setFormData({ ...formData, member_id: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t('deposits.selectMember')} />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={`text-sm font-medium ${language === 'bn' ? 'bengali' : 'english'}`}>
                  {t('deposits.month')} *
                </label>
                <Input
                  type="month"
                  value={formData.month}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, month: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${language === 'bn' ? 'bengali' : 'english'}`}>
                  {t('deposits.amount')} * (৳)
                </label>
                <Input
                  type="number"
                  placeholder={t('deposits.enterAmount')}
                  value={formData.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <span className={language === 'bn' ? 'bengali' : 'english'}>
                  {t('common.cancel')}
                </span>
              </Button>
              <Button onClick={handleSaveDeposit}>
                <span className={language === 'bn' ? 'bengali' : 'english'}>
                  {t('common.save')}
                </span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {deposits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className={`text-muted-foreground text-center ${language === 'bn' ? 'bengali' : 'english'}`}>
                {language === 'bn' 
                  ? 'এখনো কোন জমা যোগ করা হয়নি। প্রথম জমা যোগ করুন।'
                  : 'No deposits added yet. Add your first deposit to get started.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.keys(depositsByMonth)
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
              .map((month) => {
                const monthDeposits = depositsByMonth[month]
                const totalAmount = monthDeposits.reduce((sum, deposit) => sum + deposit.amount, 0)
                
                return (
                  <motion.div
                    key={month}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className={`flex items-center gap-2 ${language === 'bn' ? 'bengali' : 'english'}`}>
                              <Calendar className="h-5 w-5" />
                              {new Date(month + '-01').toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { 
                                year: 'numeric', 
                                month: 'long' 
                              })}
                            </CardTitle>
                            <CardDescription>
                              {monthDeposits.length} {language === 'bn' ? 'জন সদস্য' : 'members'} • {formatCurrency(totalAmount)}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {monthDeposits.map((deposit, index) => (
                            <motion.div
                              key={deposit.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                                      </div>
                                      <div>
                                        <CardTitle className={`text-base ${language === 'bn' ? 'bengali' : 'english'}`}>
                                          {deposit.members.name}
                                        </CardTitle>
                                        <CardDescription className="text-lg font-semibold text-green-600">
                                          {formatCurrency(deposit.amount)}
                                        </CardDescription>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditDeposit(deposit)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteDeposit(deposit.id)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Deposits