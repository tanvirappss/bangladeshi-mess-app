import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, User } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase, type Member } from '../lib/supabase'

const Members: React.FC = () => {
  const { t, language } = useLanguage()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState({ name: '', phone: '' })

  // Fetch members
  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembers(data || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Add or update member
  const handleSaveMember = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error(language === 'bn' ? 'নাম আবশ্যক' : 'Name is required')
        return
      }

      if (editingMember) {
        // Update existing member
        const { error } = await supabase
          .from('members')
          .update({
            name: formData.name.trim(),
            phone: formData.phone.trim() || null
          })
          .eq('id', editingMember.id)

        if (error) throw error
        toast.success(language === 'bn' ? 'সদস্য আপডেট হয়েছে!' : 'Member updated successfully!')
      } else {
        // Add new member
        const { error } = await supabase
          .from('members')
          .insert([{
            name: formData.name.trim(),
            phone: formData.phone.trim() || null
          }])

        if (error) throw error
        toast.success(language === 'bn' ? 'নতুন সদস্য যোগ হয়েছে!' : 'New member added successfully!')
      }

      setDialogOpen(false)
      setFormData({ name: '', phone: '' })
      setEditingMember(null)
      fetchMembers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Delete member
  const handleDeleteMember = async (id: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success(language === 'bn' ? 'সদস্য মুছে ফেলা হয়েছে!' : 'Member deleted successfully!')
      fetchMembers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Open edit dialog
  const handleEditMember = (member: Member) => {
    setEditingMember(member)
    setFormData({ name: member.name, phone: member.phone || '' })
    setDialogOpen(true)
  }

  // Open add dialog
  const handleAddMember = () => {
    setEditingMember(null)
    setFormData({ name: '', phone: '' })
    setDialogOpen(true)
  }

  useEffect(() => {
    fetchMembers()
  }, [])

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
            {t('members.title')}
          </h1>
          <p className={`text-muted-foreground mt-2 ${language === 'bn' ? 'bengali' : 'english'}`}>
            {language === 'bn' 
              ? 'মেস সদস্যদের তথ্য যোগ, সম্পাদনা এবং মুছে ফেলুন' 
              : 'Add, edit, and manage mess members'
            }
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddMember} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className={language === 'bn' ? 'bengali' : 'english'}>
                {t('members.addMember')}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className={language === 'bn' ? 'bengali' : 'english'}>
                {editingMember
                  ? (language === 'bn' ? 'সদস্যের তথ্য সম্পাদনা' : 'Edit Member Information')
                  : (language === 'bn' ? 'নতুন সদস্য যোগ করুন' : 'Add New Member')
                }
              </DialogTitle>
              <DialogDescription className={language === 'bn' ? 'bengali' : 'english'}>
                {language === 'bn' 
                  ? 'সদস্যের নাম এবং ফোন নম্বর লিখুন'
                  : 'Enter member name and phone number'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${language === 'bn' ? 'bengali' : 'english'}`}>
                  {t('members.name')} *
                </label>
                <Input
                  placeholder={t('members.enterName')}
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  className={`mt-1 ${language === 'bn' ? 'bengali' : 'english'}`}
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${language === 'bn' ? 'bengali' : 'english'}`}>
                  {t('members.phone')}
                </label>
                <Input
                  placeholder={t('members.enterPhone')}
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
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
              <Button onClick={handleSaveMember}>
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
        {members.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className={`text-muted-foreground text-center ${language === 'bn' ? 'bengali' : 'english'}`}>
                {language === 'bn' 
                  ? 'এখনো কোন সদস্য যোগ করা হয়নি। প্রথম সদস্য যোগ করুন।'
                  : 'No members added yet. Add your first member to get started.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className={`text-lg ${language === 'bn' ? 'bengali' : 'english'}`}>
                            {member.name}
                          </CardTitle>
                          {member.phone && (
                            <CardDescription>
                              {member.phone}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMember(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMember(member.id)}
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
        )}
      </motion.div>
    </div>
  )
}

export default Members