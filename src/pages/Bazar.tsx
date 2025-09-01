import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, ShoppingCart, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase, type Member, type Bazar } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/utils'

const BazarPage: React.FC = () => {
  const { t, language } = useLanguage()
  const [bazarEntries, setBazarEntries] = useState<(Bazar & { members: Member })[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBazar, setEditingBazar] = useState<Bazar | null>(null)
  const [formData, setFormData] = useState({ 
    member_id: '', 
    date: new Date().toISOString().split('T')[0], 
    amount: '',
    description: ''
  })

  // Fetch bazar entries with member information
  const fetchBazarEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('bazar')
        .select(`
          *,
          members (
            id,
            name,
            phone
          )
        `)
        .order('date', { ascending: false })

      if (error) throw error
      setBazarEntries(data || [])
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

  // Add or update bazar entry
  const handleSaveBazar = async () => {
    try {
      if (!formData.member_id) {
        toast.error(language === 'bn' ? 'সদস্য নির্বাচন করুন' : 'Please select a member')
        return
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        toast.error(language === 'bn' ? 'বৈধ পরিমাণ লিখুন' : 'Please enter valid amount')
        return
      }

      if (editingBazar) {
        // Update existing bazar entry
        const { error } = await supabase
          .from('bazar')
          .update({
            member_id: formData.member_id,
            date: formData.date,
            amount: parseFloat(formData.amount),
            description: formData.description.trim() || null
          })
          .eq('id', editingBazar.id)

        if (error) throw error
        toast.success(language === 'bn' ? 'বাজার তথ্য আপডেট হয়েছে!' : 'Bazar entry updated successfully!')
      } else {
        // Add new bazar entry
        const { error } = await supabase
          .from('bazar')
          .insert([{
            member_id: formData.member_id,
            date: formData.date,
            amount: parseFloat(formData.amount),
            description: formData.description.trim() || null
          }])

        if (error) throw error
        toast.success(language === 'bn' ? 'নতুন বাজার এন্ট্রি যোগ হয়েছে!' : 'New bazar entry added successfully!')
      }

      setDialogOpen(false)
      setFormData({ 
        member_id: '', 
        date: new Date().toISOString().split('T')[0], 
        amount: '',
        description: ''
      })
      setEditingBazar(null)
      fetchBazarEntries()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Delete bazar entry
  const handleDeleteBazar = async (id: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('bazar')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success(language === 'bn' ? 'বাজার এন্ট্রি মুছে ফেলা হয়েছে!' : 'Bazar entry deleted successfully!')
      fetchBazarEntries()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Open edit dialog
  const handleEditBazar = (bazar: Bazar) => {
    setEditingBazar(bazar)
    setFormData({ 
      member_id: bazar.member_id, 
      date: bazar.date, 
      amount: bazar.amount.toString(),
      description: bazar.description || ''
    })
    setDialogOpen(true)
  }

  // Open add dialog
  const handleAddBazar = () => {
    setEditingBazar(null)
    setFormData({ 
      member_id: '', 
      date: new Date().toISOString().split('T')[0], 
      amount: '',
      description: ''
    })
    setDialogOpen(true)
  }

  useEffect(() => {
    fetchMembers()
    fetchBazarEntries()
  }, [])

  // Group bazar entries by month
  const entriesByMonth = bazarEntries.reduce((acc, entry) => {
    const monthKey = entry.date.substring(0, 7) // YYYY-MM format
    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(entry)
    return acc
  }, {} as Record<string, typeof bazarEntries>)

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
            {t('bazar.title')}
          </h1>
          <p className={`text-muted-foreground mt-2 ${language === 'bn' ? 'bengali' : 'english'}`}>
            {language === 'bn' 
              ? 'দৈনিক বাজারের খরচ যোগ, সম্পাদনা এবং পরিচালনা করুন' 
              : 'Add, edit and manage daily bazar expenses'
            }
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddBazar} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className={language === 'bn' ? 'bengali' : 'english'}>
                {t('bazar.addBazar')}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className={language === 'bn' ? 'bengali' : 'english'}>
                {editingBazar
                  ? (language === 'bn' ? 'বাজারের তথ্য সম্পাদনা' : 'Edit Bazar Entry')
                  : (language === 'bn' ? 'নতুন বাজার এন্ট্রি যোগ করুন' : 'Add New Bazar Entry')
                }
              </DialogTitle>
              <DialogDescription className={language === 'bn' ? 'bengali' : 'english'}>
                {language === 'bn' 
                  ? 'সদস্য, তারিখ, পরিমাণ এবং বিবরণ লিখুন'
                  : 'Enter member, date, amount and description'
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
                  {t('bazar.date')} *
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, date: e.target.value })}
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
              <div>
                <label className={`text-sm font-medium ${language === 'bn' ? 'bengali' : 'english'}`}>
                  {t('bazar.description')}
                </label>
                <Input
                  placeholder={t('bazar.enterDescription')}
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
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
              <Button onClick={handleSaveBazar}>
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
        {bazarEntries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className={`text-muted-foreground text-center ${language === 'bn' ? 'bengali' : 'english'}`}>
                {language === 'bn' 
                  ? 'এখনো কোন বাজার এন্ট্রি যোগ করা হয়নি। প্রথম বাজার এন্ট্রি যোগ করুন।'
                  : 'No bazar entries added yet. Add your first bazar entry to get started.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.keys(entriesByMonth)
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
              .map((month) => {
                const monthEntries = entriesByMonth[month]
                const totalAmount = monthEntries.reduce((sum, entry) => sum + entry.amount, 0)
                
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
                              {monthEntries.length} {language === 'bn' ? 'টি এন্ট্রি' : 'entries'} • {formatCurrency(totalAmount)}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {monthEntries
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((entry, index) => (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                                        <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className={`font-medium ${language === 'bn' ? 'bengali' : 'english'}`}>
                                            {entry.members.name}
                                          </span>
                                          <span className="text-sm text-muted-foreground">
                                            {formatDate(entry.date)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-lg font-semibold text-orange-600">
                                            {formatCurrency(entry.amount)}
                                          </span>
                                          {entry.description && (
                                            <span className="text-sm text-muted-foreground">
                                              • {entry.description}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditBazar(entry)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteBazar(entry.id)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
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

export default BazarPage