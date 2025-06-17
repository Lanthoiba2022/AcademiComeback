import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PremiumProvider } from './contexts/PremiumContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Landing } from './pages/Landing'
import { Dashboard } from './pages/Dashboard'
import { Profile } from './pages/Profile'
import { StudyRoom } from './pages/StudyRoom'
import { QuizPage } from './pages/QuizPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { CalendarPage } from './pages/CalendarPage'
import { FilesPage } from './pages/FilesPage'
import { UnderDevelopment } from './pages/UnderDevelopment'
import { PremiumSettingsPage } from './pages/PremiumSettingsPage'
import { PricingPage } from './pages/PricingPage'
import { AchievementsList } from './components/gamification/AchievementsList'
import { RewardsMarketplace } from './components/gamification/RewardsMarketplace'
import { Leaderboard } from './components/gamification/Leaderboard'
import { Sidebar } from './components/dashboard/Sidebar'
import { ToastContainer } from './components/ui/Toast'
import { PremiumOnboarding } from './components/premium/PremiumOnboarding'
import { useGamification } from './hooks/useGamification'

// Gamification Pages
export const AchievementsPage = () => {
  const { achievements } = useGamification()
  
  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      <div className="lg:ml-64 p-4 lg:p-8">
        <AchievementsList achievements={achievements} />
      </div>
    </div>
  )
}

export const RewardsPage = () => {
  const { rewards, stats, redeemedRewards, redeemReward } = useGamification()
  
  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      <div className="lg:ml-64 p-4 lg:p-8">
        <RewardsMarketplace
          rewards={rewards}
          availablePoints={stats?.availablePoints || 0}
          redeemedRewards={redeemedRewards}
          onRedeemReward={redeemReward}
        />
      </div>
    </div>
  )
}

export const LeaderboardPage = () => {
  const { leaderboard } = useGamification()
  
  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      <div className="lg:ml-64 p-4 lg:p-8">
        <Leaderboard
          entries={leaderboard}
          currentUserId="current-user-id" // This should come from auth context
          timeframe="weekly"
          onTimeframeChange={() => {}}
        />
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <PremiumProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/premium" 
              element={
                <ProtectedRoute>
                  <PremiumSettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pricing" 
              element={
                <ProtectedRoute>
                  <PricingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/room/:roomId" 
              element={
                <ProtectedRoute>
                  <StudyRoom />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/quiz" 
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/files" 
              element={
                <ProtectedRoute>
                  <FilesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/achievements" 
              element={
                <ProtectedRoute>
                  <AchievementsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rewards" 
              element={
                <ProtectedRoute>
                  <RewardsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leaderboard" 
              element={
                <ProtectedRoute>
                  <LeaderboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/under-development" 
              element={
                <ProtectedRoute>
                  <UnderDevelopment />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
          <PremiumOnboarding />
        </Router>
      </PremiumProvider>
    </AuthProvider>
  )
}

export default App