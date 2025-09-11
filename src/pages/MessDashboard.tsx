import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase, type Mess, type MessMember } from '../lib/supabase'
import { getMessDetails, getMessMembers } from '../lib/mess'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useLanguage } from '../contexts/LanguageContext'

const MessDashboard: React.FC = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [mess, setMess] = useState<Mess | null>(null)
  const [members, setMembers] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const messId = localStorage.getItem('mess_id')

  useEffect(() => {
    const fetchMessData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in to view this page.')
        navigate('/login')
        return
      }

      if (!messId) {
        setError('No mess selected. Please join or create a mess first.')
        setLoading(false)
        toast.error('No mess selected.')
        navigate('/')
        return
      }

      try {
        const messDetails = await getMessDetails(messId)
        const messMembers = await getMessMembers(messId)

        const isMember = messMembers?.some(member => member.user_id === session.user.id)
        if (!isMember) {
            toast.error("You are not a member of this mess.")
            navigate('/')
            return
        }

        setMess(messDetails)
        setMembers(messMembers)
      } catch (err: any) {
        setError(err.message)
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMessData()
  }, [messId, navigate])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <div className="text-red-500">
        <p>{error}</p>
        <Button onClick={() => navigate('/')}>Go to Home</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{mess?.name || 'Mess Dashboard'}</CardTitle>
          <CardDescription>Mess ID: {mess?.id}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.totalMembers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Email</th>
                <th className="text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((member) => (
                <tr key={member.user_id}>
                  <td>{member.users.email}</td>
                  <td>{member.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

export default MessDashboard
