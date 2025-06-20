import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/dashboard/Sidebar'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { PhoneNumberInput } from '../components/ui/PhoneNumberInput'
import { usePremium } from '../contexts/PremiumContext'
import { useAuth } from '../contexts/AuthContext'
import { getProfile, updateProfile } from '../lib/supabase'
import { Database } from '../types/database'
import { 
  User, 
  Bell, 
  Shield, 
  BookOpen, 
  Settings as SettingsIcon,
  Mail,
  GraduationCap,
  MapPin,
  Save,
  CheckCircle,
  AlertCircle,
  Crown,
  Sparkles,
  Phone
} from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

export const Settings = () => {
  const navigate = useNavigate()
  const { subscriptionLevel, customerInfo } = usePremium()
  const { user: authUser } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
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
  const [isPhoneValid, setIsPhoneValid] = useState(false)

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
            phoneNumber: profile.phone_number ? profile.phone_number.replace(/^\+/, '') : '',
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
            phoneNumber: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authUser) return

    // Validate phone number before submitting
    if (formData.phoneNumber && !isPhoneValid) {
      setError('Please enter a valid phone number')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: updateError } = await updateProfile(authUser.id, {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber ? `+${formData.phoneNumber}` : null,
        university: formData.university,
        major: formData.major,
        year: formData.year,
        location: formData.location,
        bio: formData.bio
      }, authUser.email)

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const getSubscriptionBadge = () => {
    switch (subscriptionLevel) {
      case 'pro':
        return {
          icon: Crown,
          label: 'Pro',
          className: 'bg-gradient-to-r from-primary-500 to-secondary-500'
        }
      case 'student':
        return {
          icon: GraduationCap,
          label: 'Student',
          className: 'bg-gradient-to-r from-blue-500 to-purple-500'
        }
      default:
        return {
          icon: Sparkles,
          label: 'Free',
          className: 'bg-gradient-to-r from-dark-600 to-dark-700'
        }
    }
  }

  const subscriptionBadge = getSubscriptionBadge()
  const SubscriptionIcon = subscriptionBadge.icon

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      <div className="lg:ml-64 p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-dark-300">Manage your account settings and preferences.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Profile Information */}
          <Card>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Profile Information</h2>
            </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-dark-400 mb-2">Full Name</label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    icon={User}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-dark-400 mb-2">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    icon={Mail}
                  />
                  <p className="text-xs text-dark-400 mt-1">Email cannot be changed from settings</p>
                </div>

                <div>
                  <label className="block text-sm text-dark-400 mb-2">Phone Number</label>
                  <PhoneNumberInput
                    value={formData.phoneNumber}
                    onChange={(value) => setFormData(prev => ({ ...prev, phoneNumber: value }))}
                    onValidationChange={setIsPhoneValid}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm text-dark-400 mb-2">University</label>
                  <Input
                    type="text"
                    value={formData.university}
                    onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                    icon={GraduationCap}
                    placeholder="Enter your university"
                  />
                </div>

                <div>
                  <label className="block text-sm text-dark-400 mb-2">Major</label>
                  <Input
                    type="text"
                    value={formData.major}
                    onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
                    icon={BookOpen}
                    placeholder="Enter your major"
                  />
                </div>

                <div>
                  <label className="block text-sm text-dark-400 mb-2">Year</label>
                  <Input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="Enter your year"
                  />
                </div>

                <div>
                  <label className="block text-sm text-dark-400 mb-2">Location</label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    icon={MapPin}
                    placeholder="Enter your location"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-dark-400 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  placeholder="Tell us about yourself"
                />
              </div>

              <Button
                type="submit"
                className="w-full md:w-auto"
                loading={saving}
                icon={Save}
              >
                Save Changes
              </Button>
            </form>
          </Card>

          {/* Subscription Status */}
          <Card>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Subscription Status</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-lg border border-dark-700">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${subscriptionBadge.className}`}>
                    <SubscriptionIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Current Plan</h3>
                    <p className="text-dark-300 text-sm">
                      {subscriptionLevel === 'pro' ? 'Pro Plan ($19/month)' :
                       subscriptionLevel === 'student' ? 'Student Plan ($9/month)' :
                       'Free Plan'}
                    </p>
                    {customerInfo?.entitlements.active['premium']?.expirationDate && (
                      <p className="text-xs text-dark-400 mt-1">
                        Renews on {new Date(customerInfo.entitlements.active['premium'].expirationDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {subscriptionLevel !== 'pro' && (
                  <Button
                    variant="primary"
                    onClick={() => navigate('/premium')}
                  >
                    Upgrade Plan
                  </Button>
                )}
              </div>

              {customerInfo?.entitlements.active && (
                <div className="p-4 bg-dark-800/50 rounded-lg border border-dark-700">
                  <h3 className="text-white font-medium mb-2">Active Features</h3>
                  <div className="space-y-2">
                    {Object.entries(customerInfo.entitlements.active).map(([key, entitlement]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-dark-300 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-green-400 text-sm">
                          {entitlement.expirationDate ? 
                            `Active until ${new Date(entitlement.expirationDate).toLocaleDateString()}` :
                            'Active'
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Other Settings Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Notifications</h2>
              </div>
              <p className="text-dark-300">Coming soon...</p>
            </Card>

            <Card>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Privacy</h2>
              </div>
              <p className="text-dark-300">Coming soon...</p>
            </Card>

            <Card>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Study Preferences</h2>
              </div>
              <p className="text-dark-300">Coming soon...</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 