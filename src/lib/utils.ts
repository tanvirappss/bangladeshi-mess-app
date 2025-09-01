import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility functions for mess calculations
export const calculateMessBalance = (
  members: any[],
  deposits: any[],
  bazar: any[],
  meals: any[],
  month: string
) => {
  const monthDeposits = deposits.filter(d => d.month === month)
  const monthBazar = bazar.filter(b => new Date(b.date).getMonth() === new Date(month + '-01').getMonth())
  const monthMeals = meals.filter(m => new Date(m.date).getMonth() === new Date(month + '-01').getMonth())

  const totalDeposits = monthDeposits.reduce((sum, d) => sum + Number(d.amount), 0)
  const totalBazar = monthBazar.reduce((sum, b) => sum + Number(b.amount), 0)
  const totalExpenses = totalBazar

  // Calculate total meals
  const totalMeals = monthMeals.reduce((sum, m) => sum + m.lunch + m.dinner, 0)
  const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0

  // Calculate each member's balance
  const memberBalances = members.map(member => {
    const memberDeposit = monthDeposits.find(d => d.member_id === member.id)?.amount || 0
    const memberBazar = monthBazar.filter(b => b.member_id === member.id).reduce((sum, b) => sum + Number(b.amount), 0)
    const memberMeals = monthMeals.filter(m => m.member_id === member.id).reduce((sum, m) => sum + m.lunch + m.dinner, 0)
    
    const mealCost = memberMeals * mealRate
    const totalPaid = Number(memberDeposit) + memberBazar
    const balance = totalPaid - mealCost

    return {
      member,
      deposit: Number(memberDeposit),
      bazarSpent: memberBazar,
      mealsEaten: memberMeals,
      mealCost,
      totalPaid,
      balance,
      status: balance >= 0 ? 'refund' : 'pay'
    }
  })

  return {
    totalDeposits,
    totalBazar,
    totalExpenses,
    totalMeals,
    mealRate,
    memberBalances
  }
}

// Date utilities
export const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-GB')
}

export const formatCurrency = (amount: number) => {
  return `৳${amount.toFixed(2)}`
}