import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, UtensilsCrossed, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase, type Member, type Meal } from '../lib/supabase'
import { formatDate } from '../lib/utils'

const Meals: React.FC = () => {
  const { t, language } = useLanguage()
  const [meals, setMeals] = useState<(Meal & { members: Member })[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [formData, setFormData] = useState({ 
    member_id: '', 
    date: new Date().toISOString().split('T')[0], 
    lunch: 0,
    dinner: 0
  })

  // Fetch meals with member information
  const fetchMeals = async () => {
    try {
      const { data, error } = await supabase
        .from('meals')
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
      setMeals(data || [])
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

  // Add or update meal entry
  const handleSaveMeal = async () => {
    try {
      if (!formData.member_id) {
        toast.error(language === 'bn' ? 'সদস্য নির্বাচন করুন' : 'Please select a member')
        return
      }

      const totalMeals = formData.lunch + formData.dinner
      if (totalMeals <= 0) {
        toast.error(language === 'bn' ? 'অন্তত একটি খাবার নির্বাচন করুন' : 'Please select at least one meal')
        return
      }

      // Check if meal entry already exists for this member and date (when adding new)
      if (!editingMeal) {
        const { data: existingMeal } = await supabase
          .from('meals')
          .select('*')
          .eq('member_id', formData.member_id)
          .eq('date', formData.date)
          .single()

        if (existingMeal) {
          toast.error(language === 'bn' ? 'এই তারিখের জন্য সদস্যের খাবার ইতিমধ্যে আছে' : 'Meal entry for this member and date already exists')
          return
        }
      }

      if (editingMeal) {
        // Update existing meal entry
        const { error } = await supabase
          .from('meals')
          .update({
            member_id: formData.member_id,
            date: formData.date,
            lunch: formData.lunch,
            dinner: formData.dinner
          })
          .eq('id', editingMeal.id)

        if (error) throw error
        toast.success(language === 'bn' ? 'খাবারের তথ্য আপডেট হয়েছে!' : 'Meal entry updated successfully!')
      } else {
        // Add new meal entry
        const { error } = await supabase
          .from('meals')
          .insert([{
            member_id: formData.member_id,
            date: formData.date,
            lunch: formData.lunch,
            dinner: formData.dinner
          }])

        if (error) throw error
        toast.success(language === 'bn' ? 'নতুন খাবার এন্ট্রি যোগ হয়েছে!' : 'New meal entry added successfully!')
      }

      setDialogOpen(false)
      setFormData({ 
        member_id: '', 
        date: new Date().toISOString().split('T')[0], 
        lunch: 0,
        dinner: 0
      })
      setEditingMeal(null)
      fetchMeals()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Delete meal entry
  const handleDeleteMeal = async (id: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success(language === 'bn' ? 'খাবার এন্ট্রি মুছে ফেলা হয়েছে!' : 'Meal entry deleted successfully!')
      fetchMeals()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Open edit dialog
  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal)
    setFormData({ 
      member_id: meal.member_id, 
      date: meal.date, 
      lunch: meal.lunch,
      dinner: meal.dinner
    })
    setDialogOpen(true)
  }

  // Open add dialog
  const handleAddMeal = () => {
    setEditingMeal(null)
    setFormData({ 
      member_id: '', 
      date: new Date().toISOString().split('T')[0], 
      lunch: 0,
      dinner: 0
    })
    setDialogOpen(true)
  }

  useEffect(() => {
    fetchMembers()
    fetchMeals()
  }, [])

  // Group meals by month
  const mealsByMonth = meals.reduce((acc, meal) => {
    const monthKey = meal.date.substring(0, 7) // YYYY-MM format
    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(meal)
    return acc
  }, {} as Record<string, typeof meals>)

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
            {t('meals.title')}
          </h1>
          <p className={`text-muted-foreground mt-2 ${language === 'bn' ? 'bengali' : 'english'}`}>
            {language === 'bn' 
              ? 'দৈনিক খাবার ট্র্যাকিং - শুধুমাত্র দুপুর ও রাতের খাবার' 
              : 'Daily meal tracking - Lunch and dinner only'
            }
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddMeal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className={language === 'bn' ? 'bengali' : 'english'}>
                {t('meals.addMeal')}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className={language === 'bn' ? 'bengali' : 'english'}>
                {editingMeal
                  ? (language === 'bn' ? 'খাবারের তথ্য সম্পাদনা' : 'Edit Meal Entry')
                  : (language === 'bn' ? 'নতুন খাবার এন্ট্রি যোগ করুন' : 'Add New Meal Entry')
                }
              </DialogTitle>
              <DialogDescription className={language === 'bn' ? 'bengali' : 'english'}>
                {language === 'bn' 
                  ? 'সদস্য, তারিখ এবং খাবারের সংখ্যা লিখুন'
                  : 'Enter member, date and number of meals'
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-medium ${language === 'bn' ? 'bengali' : 'english'}`}>
                    {t('meals.lunch')}
                  </label>
                  <Select 
                    value={formData.lunch.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, lunch: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={`text-sm font-medium ${language === 'bn' ? 'bengali' : 'english'}`}>
                    {t('meals.dinner')}
                  </label>
                  <Select 
                    value={formData.dinner.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, dinner: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className={language === 'bn' ? 'bengali' : 'english'}>
                  {t('meals.total')}: {formData.lunch + formData.dinner} {language === 'bn' ? 'টি খাবার' : 'meals'}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                <span className={language === 'bn' ? 'bengali' : 'english'}>
                  {t('common.cancel')}
                </span>
              </Button>
              <Button onClick={handleSaveMeal}>
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
        {meals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
              <p className={`text-muted-foreground text-center ${language === 'bn' ? 'bengali' : 'english'}`}>
                {language === 'bn' 
                  ? 'এখনো কোন খাবার এন্ট্রি যোগ করা হয়নি। প্রথম খাবার এন্ট্রি যোগ করুন।'
                  : 'No meal entries added yet. Add your first meal entry to get started.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.keys(mealsByMonth)
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
              .map((month) => {
                const monthMeals = mealsByMonth[month]
                const totalMeals = monthMeals.reduce((sum, meal) => sum + meal.lunch + meal.dinner, 0)
                
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
                              {monthMeals.length} {language === 'bn' ? 'টি এন্ট্রি' : 'entries'} • {totalMeals} {language === 'bn' ? 'টি খাবার' : 'total meals'}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {monthMeals
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((meal, index) => (
                            <motion.div
                              key={meal.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                        <UtensilsCrossed className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className={`font-medium ${language === 'bn' ? 'bengali' : 'english'}`}>
                                            {meal.members.name}
                                          </span>
                                          <span className="text-sm text-muted-foreground">
                                            {formatDate(meal.date)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                          <span className="flex items-center gap-1">
                                            <span className={language === 'bn' ? 'bengali' : 'english'}>
                                              {t('meals.lunch')}:
                                            </span>
                                            <span className="font-medium">{meal.lunch}</span>
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <span className={language === 'bn' ? 'bengali' : 'english'}>
                                              {t('meals.dinner')}:
                                            </span>
                                            <span className="font-medium">{meal.dinner}</span>
                                          </span>
                                          <span className="flex items-center gap-1 text-purple-600 font-semibold">
                                            <span className={language === 'bn' ? 'bengali' : 'english'}>
                                              {t('meals.total')}:
                                            </span>
                                            <span>{meal.lunch + meal.dinner}</span>
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditMeal(meal)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteMeal(meal.id)}
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

export default Meals