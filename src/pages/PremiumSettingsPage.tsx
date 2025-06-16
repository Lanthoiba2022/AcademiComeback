import { Sidebar } from '../components/dashboard/Sidebar'
import { PremiumSettings } from '../components/premium/PremiumSettings'

export const PremiumSettingsPage = () => {
  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      <div className="lg:ml-64 p-4 lg:p-8">
        <PremiumSettings />
      </div>
    </div>
  )
}