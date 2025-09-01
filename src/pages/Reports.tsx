import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, FileSpreadsheet, Calendar, Calculator } from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase, type Member, type Deposit, type Bazar, type Meal } from '../lib/supabase'
import { getCurrentMonth, formatCurrency, calculateMessBalance } from '../lib/utils'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

const Reports: React.FC = () => {
  const { t, language } = useLanguage()
  const [members, setMembers] = useState<Member[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [bazarEntries, setBazarEntries] = useState<Bazar[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [generating, setGenerating] = useState(false)

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

  // Calculate monthly statistics
  const monthlyStats = calculateMessBalance(members, deposits, bazarEntries, meals, selectedMonth)

  // Get available months
  const availableMonths = Array.from(new Set([
    ...deposits.map(d => d.month),
    ...bazarEntries.map(b => b.date.substring(0, 7)),
    ...meals.map(m => m.date.substring(0, 7))
  ])).sort().reverse()

  // Generate PDF Report
  const generatePDFReport = async () => {
    try {
      setGenerating(true)
      const doc = new jsPDF()

      // Header
      doc.setFontSize(20)
      doc.text(language === 'bn' ? 'মেস ব্যবস্থাপনা রিপোর্ট' : 'Mess Management Report', 20, 20)
      
      // Month
      const monthName = new Date(selectedMonth + '-01').toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { 
        year: 'numeric', 
        month: 'long' 
      })
      doc.setFontSize(14)
      doc.text(`${language === 'bn' ? 'মাস' : 'Month'}: ${monthName}`, 20, 35)

      // Summary section
      doc.setFontSize(16)
      doc.text(language === 'bn' ? 'সারসংক্ষেপ' : 'Summary', 20, 55)
      
      doc.setFontSize(12)
      const summaryData = [
        [language === 'bn' ? 'মোট সদস্য' : 'Total Members', members.length.toString()],
        [language === 'bn' ? 'মোট জমা' : 'Total Deposits', formatCurrency(monthlyStats.totalDeposits)],
        [language === 'bn' ? 'মোট বাজার খরচ' : 'Total Bazar Expenses', formatCurrency(monthlyStats.totalBazar)],
        [language === 'bn' ? 'মোট খাবার' : 'Total Meals', monthlyStats.totalMeals.toString()],
        [language === 'bn' ? 'প্রতি খাবারের দাম' : 'Per Meal Rate', formatCurrency(monthlyStats.mealRate)]
      ]

      doc.autoTable({
        startY: 65,
        head: [[language === 'bn' ? 'বিবরণ' : 'Description', language === 'bn' ? 'পরিমাণ' : 'Amount']],
        body: summaryData,
        theme: 'grid'
      })

      // Member details table
      let finalY = (doc as any).lastAutoTable.finalY + 20
      doc.setFontSize(16)
      doc.text(language === 'bn' ? 'সদস্যদের বিস্তারিত হিসাব' : 'Member Details', 20, finalY)

      const tableData = monthlyStats.memberBalances.map(mb => [
        mb.member.name,
        formatCurrency(mb.deposit),
        formatCurrency(mb.bazarSpent),
        mb.mealsEaten.toString(),
        formatCurrency(mb.mealCost),
        formatCurrency(mb.balance),
        mb.balance >= 0 ? (language === 'bn' ? 'পাবেন' : 'Refund') : (language === 'bn' ? 'দিতে হবে' : 'Pay')
      ])

      doc.autoTable({
        startY: finalY + 10,
        head: [[
          language === 'bn' ? 'সদস্য' : 'Member',
          language === 'bn' ? 'জমা' : 'Deposit',
          language === 'bn' ? 'বাজার' : 'Bazar',
          language === 'bn' ? 'খাবার' : 'Meals',
          language === 'bn' ? 'খাবারের খরচ' : 'Meal Cost',
          language === 'bn' ? 'ব্যালেন্স' : 'Balance',
          language === 'bn' ? 'অবস্থা' : 'Status'
        ]],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10 }
      })

      // Footer
      finalY = (doc as any).lastAutoTable.finalY + 20
      doc.setFontSize(10)
      doc.text(`${language === 'bn' ? 'রিপোর্ট তৈরি হয়েছে' : 'Generated on'}: ${new Date().toLocaleDateString()}`, 20, finalY)

      // Save PDF
      const fileName = `mess-report-${selectedMonth}.pdf`
      doc.save(fileName)
      
      toast.success(language === 'bn' ? 'পিডিএফ ডাউনলোড সম্পন্ন!' : 'PDF downloaded successfully!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setGenerating(false)
    }
  }

  // Generate Excel Report
  const generateExcelReport = async () => {
    try {
      setGenerating(true)
      
      const workbook = XLSX.utils.book_new()

      // Summary sheet
      const summaryData = [
        [language === 'bn' ? 'মেস রিপোর্ট' : 'Mess Report'],
        [language === 'bn' ? 'মাস' : 'Month', new Date(selectedMonth + '-01').toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long' })],
        [''],
        [language === 'bn' ? 'সারসংক্ষেপ' : 'Summary'],
        [language === 'bn' ? 'মোট সদস্য' : 'Total Members', members.length],
        [language === 'bn' ? 'মোট জমা' : 'Total Deposits', monthlyStats.totalDeposits],
        [language === 'bn' ? 'মোট বাজার খরচ' : 'Total Bazar', monthlyStats.totalBazar],
        [language === 'bn' ? 'মোট খাবার' : 'Total Meals', monthlyStats.totalMeals],
        [language === 'bn' ? 'প্রতি খাবারের দাম' : 'Per Meal Rate', monthlyStats.mealRate]
      ]

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, language === 'bn' ? 'সারসংক্ষেপ' : 'Summary')

      // Member details sheet
      const memberHeaders = [
        language === 'bn' ? 'সদস্য' : 'Member',
        language === 'bn' ? 'জমা' : 'Deposit',
        language === 'bn' ? 'বাজার' : 'Bazar Spent',
        language === 'bn' ? 'খাবার সংখ্যা' : 'Meals Count',
        language === 'bn' ? 'খাবারের খরচ' : 'Meal Cost',
        language === 'bn' ? 'মোট পেমেন্ট' : 'Total Paid',
        language === 'bn' ? 'ব্যালেন্স' : 'Balance',
        language === 'bn' ? 'অবস্থা' : 'Status'
      ]

      const memberData = [
        memberHeaders,
        ...monthlyStats.memberBalances.map(mb => [
          mb.member.name,
          mb.deposit,
          mb.bazarSpent,
          mb.mealsEaten,
          mb.mealCost,
          mb.totalPaid,
          mb.balance,
          mb.balance >= 0 ? (language === 'bn' ? 'পাবেন' : 'Refund') : (language === 'bn' ? 'দিতে হবে' : 'Pay')
        ])
      ]

      const memberSheet = XLSX.utils.aoa_to_sheet(memberData)
      XLSX.utils.book_append_sheet(workbook, memberSheet, language === 'bn' ? 'সদস্যদের তথ্য' : 'Member Details')

      // Save Excel file
      const fileName = `mess-report-${selectedMonth}.xlsx`
      XLSX.writeFile(workbook, fileName)
      
      toast.success(language === 'bn' ? 'এক্সেল ফাইল ডাউনলোড সম্পন্ন!' : 'Excel file downloaded successfully!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setGenerating(false)
    }
  }

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
            {t('reports.title')}
          </h1>
          <p className={`text-muted-foreground mt-2 ${language === 'bn' ? 'bengali' : 'english'}`}>
            {language === 'bn' 
              ? 'মাসিক রিপোর্ট তৈরি করুন এবং পিডিএফ বা এক্সেল ফরম্যাটে ডাউনলোড করুন' 
              : 'Generate monthly reports and download in PDF or Excel format'
            }
          </p>
        </div>
      </motion.div>

      {/* Month Selection and Export Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className={language === 'bn' ? 'bengali' : 'english'}>
              {t('reports.generateReport')}
            </CardTitle>
            <CardDescription className={language === 'bn' ? 'bengali' : 'english'}>
              {language === 'bn' 
                ? 'রিপোর্ট তৈরি করতে মাস নির্বাচন করুন'
                : 'Select month to generate report'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className={`text-sm font-medium ${language === 'bn' ? 'bengali' : 'english'}`}>
                  {t('reports.selectMonth')}
                </label>
                {availableMonths.length > 0 ? (
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
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
                ) : (
                  <div className="mt-1 p-3 border rounded-md text-muted-foreground text-center">
                    {language === 'bn' ? 'কোন তথ্য নেই' : 'No data available'}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={generatePDFReport}
                  disabled={generating || availableMonths.length === 0}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span className={language === 'bn' ? 'bengali' : 'english'}>
                    {t('reports.exportPDF')}
                  </span>
                  {generating && <Download className="h-4 w-4 animate-spin" />}
                </Button>
                
                <Button
                  onClick={generateExcelReport}
                  disabled={generating || availableMonths.length === 0}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className={language === 'bn' ? 'bengali' : 'english'}>
                    {t('reports.exportExcel')}
                  </span>
                  {generating && <Download className="h-4 w-4 animate-spin" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Report Preview */}
      {availableMonths.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${language === 'bn' ? 'bengali' : 'english'}`}>
                <Calendar className="h-5 w-5" />
                {new Date(selectedMonth + '-01').toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })} {language === 'bn' ? 'এর রিপোর্ট প্রিভিউ' : 'Report Preview'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyStats.memberBalances.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(monthlyStats.totalDeposits)}</div>
                      <div className={`text-sm ${language === 'bn' ? 'bengali' : 'english'}`}>
                        {language === 'bn' ? 'মোট জমা' : 'Total Deposits'}
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">{formatCurrency(monthlyStats.totalBazar)}</div>
                      <div className={`text-sm ${language === 'bn' ? 'bengali' : 'english'}`}>
                        {language === 'bn' ? 'মোট বাজার' : 'Total Bazar'}
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{monthlyStats.totalMeals}</div>
                      <div className={`text-sm ${language === 'bn' ? 'bengali' : 'english'}`}>
                        {language === 'bn' ? 'মোট খাবার' : 'Total Meals'}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(monthlyStats.mealRate)}</div>
                      <div className={`text-sm ${language === 'bn' ? 'bengali' : 'english'}`}>
                        {language === 'bn' ? 'প্রতি খাবারের দাম' : 'Per Meal Rate'}
                      </div>
                    </div>
                  </div>

                  {/* Balance Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className={`text-lg text-green-600 ${language === 'bn' ? 'bengali' : 'english'}`}>
                          {t('reports.toReceive')} ({language === 'bn' ? 'পাবেন' : 'Refund'})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {monthlyStats.memberBalances
                          .filter(mb => mb.balance > 0)
                          .map(mb => (
                            <div key={mb.member.id} className="flex justify-between items-center py-2 border-b last:border-0">
                              <span className={language === 'bn' ? 'bengali' : 'english'}>{mb.member.name}</span>
                              <span className="font-semibold text-green-600">+{formatCurrency(mb.balance)}</span>
                            </div>
                          ))}
                        {monthlyStats.memberBalances.filter(mb => mb.balance > 0).length === 0 && (
                          <p className="text-muted-foreground text-center py-4">
                            {language === 'bn' ? 'কেউ টাকা পাবেন না' : 'No one to receive money'}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className={`text-lg text-red-600 ${language === 'bn' ? 'bengali' : 'english'}`}>
                          {t('reports.toPay')} ({language === 'bn' ? 'দিতে হবে' : 'Pay'})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {monthlyStats.memberBalances
                          .filter(mb => mb.balance < 0)
                          .map(mb => (
                            <div key={mb.member.id} className="flex justify-between items-center py-2 border-b last:border-0">
                              <span className={language === 'bn' ? 'bengali' : 'english'}>{mb.member.name}</span>
                              <span className="font-semibold text-red-600">{formatCurrency(Math.abs(mb.balance))}</span>
                            </div>
                          ))}
                        {monthlyStats.memberBalances.filter(mb => mb.balance < 0).length === 0 && (
                          <p className="text-muted-foreground text-center py-4">
                            {language === 'bn' ? 'কাউকে টাকা দিতে হবে না' : 'No one needs to pay'}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Table */}
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
                <div className="text-center py-12">
                  <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className={`text-muted-foreground ${language === 'bn' ? 'bengali' : 'english'}`}>
                    {language === 'bn' 
                      ? 'এই মাসের জন্য কোন তথ্য পাওয়া যায়নি। সদস্য, জমা এবং খাবারের তথ্য যোগ করুন।'
                      : 'No data available for this month. Add members, deposits and meal data.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className={`text-muted-foreground text-center ${language === 'bn' ? 'bengali' : 'english'}`}>
              {language === 'bn' 
                ? 'রিপোর্ট তৈরি করতে প্রথমে সদস্য এবং তথ্য যোগ করুন।'
                : 'Add members and data first to generate reports.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Reports