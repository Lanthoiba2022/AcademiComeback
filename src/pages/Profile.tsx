import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Sidebar } from '../components/dashboard/Sidebar'
import { User, Mail, BookOpen, GraduationCap, MapPin, Save, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getProfile, updateProfile } from '../lib/supabase'
import { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export const Profile = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    university: '',
    major: '',
    year: '',
    location: '',
    bio: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!authUser) {
        navigate('/auth')
        return
      }

      try {
        const { data: profile, error: profileError } = await getProfile(authUser.id)
        
        if (profileError) {
          console.error('Error loading profile:', profileError)
          setError('Failed to load profile data')
          return
        }

        if (profile) {
          setFormData({
            fullName: profile.full_name || '',
            email: authUser.email || '',
            university: profile.university || '',
            major: profile.major || '',
            year: profile.year || '',
            location: profile.location || '',
            bio: profile.bio || ''
          })
        } else {
          // If no profile exists, use auth user data
          setFormData({
            fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
            email: authUser.email || '',
            university: '',
            major: '',
            year: '',
            location: '',
            bio: ''
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setError('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [authUser, navigate])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!authUser) {
      setError('User not authenticated')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)
    
    try {
      const updates = {
        full_name: formData.fullName.trim(),
        university: formData.university.trim() || null,
        major: formData.major.trim() || null,
        year: formData.year || null,
        location: formData.location.trim() || null,
        bio: formData.bio.trim() || null
      }

      const { data, error: updateError } = await updateProfile(authUser.id, updates)
      
      if (updateError) {
        console.error('Error updating profile:', updateError)
        setError('Failed to save profile. Please try again.')
        return
      }

      if (data) {
        setSuccess(true)
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setError('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient">
        <Sidebar />
        <div className="lg:ml-64 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      
      <div className="lg:ml-64 p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-dark-300">Manage your personal information and preferences.</p>
        </div>

        <div className="max-w-2xl">
          <Card className="animate-slide-up">
            {/* Success/Error Messages */}
            {success && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400">Profile updated successfully!</span>
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    icon={User}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    icon={Mail}
                    disabled
                    className="opacity-60"
                  />
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Academic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="University/School"
                    type="text"
                    placeholder="Enter your institution"
                    value={formData.university}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    icon={GraduationCap}
                  />
                  <Input
                    label="Major/Field of Study"
                    type="text"
                    placeholder="Enter your major"
                    value={formData.major}
                    onChange={(e) => handleInputChange('major', e.target.value)}
                    icon={BookOpen}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Academic Year
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      className="w-full px-4 py-3 bg-dark-800/50 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Select your year</option>
                      <option value="freshman">Freshman</option>
                      <option value="sophomore">Sophomore</option>
                      <option value="junior">Junior</option>
                      <option value="senior">Senior</option>
                      <option value="graduate">Graduate</option>
                      <option value="phd">PhD</option>
                    </select>
                  </div>
                  <Input
                    label="Location"
                    type="text"
                    placeholder="City, Country"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    icon={MapPin}
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us a bit about yourself, your study interests, and goals..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-dark-800/50 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                />
                <div className="text-right text-xs text-dark-400 mt-1">
                  {formData.bio.length}/500 characters
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                >
                  Back to Dashboard
                </Button>
                <Button 
                  type="submit" 
                  size="lg"
                  loading={saving}
                  icon={Save}
                  disabled={!formData.fullName.trim()}
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}