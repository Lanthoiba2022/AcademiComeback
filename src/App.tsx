import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { PremiumProvider } from './contexts/PremiumContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Landing } from './pages/Landing'
import { Dashboard } from './pages/Dashboard'
import { Profile } from './pages/Profile'
import { StudyRoom } from './pages/StudyRoom'
import { StudyRooms } from './pages/StudyRooms'
import { QuizPage } from './pages/QuizPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { CalendarPage } from './pages/CalendarPage'
import { FilesPage } from './pages/FilesPage'
import { UnderDevelopment } from './pages/UnderDevelopment'
import { PremiumSettingsPage } from './pages/PremiumSettingsPage'
import { PricingPage } from './pages/PricingPage'
import { Settings } from './pages/Settings'
import { AchievementsList } from './components/gamification/AchievementsList'
import { RewardsMarketplace } from './components/gamification/RewardsMarketplace'
import { Leaderboard } from './components/gamification/Leaderboard'
import { Sidebar } from './components/dashboard/Sidebar'
import { ToastContainer } from './components/ui/Toast'
import { PremiumOnboarding } from './components/premium/PremiumOnboarding'
import { useGamification } from './hooks/useGamification'
import { Premium } from './pages/Premium'
import { scheduleChatCleanup } from './lib/chatCleanup'
import { stopChatCleanup } from './lib/chatCleanup'
import { Footer } from './components/ui/Footer'
import { MemoryMonitor } from './components/dev/MemoryMonitor'

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

// ScrollTo component
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  useEffect(() => {
    scheduleChatCleanup()
    // Cleanup function
    return () => {
      stopChatCleanup()
    }
  }, [])

  return (
    <AuthProvider>
      <PremiumProvider>
        <Router>
          {process.env.NODE_ENV === 'development' && <MemoryMonitor />}
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<><Landing /><Footer /></>} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                  <Footer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                  <Footer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/premium" 
              element={
                <ProtectedRoute>
                  <Premium />
                  <Footer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                  <Footer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pricing" 
              element={
                <ProtectedRoute>
                  <PricingPage />
                  <Footer />
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
              path="/study-rooms" 
              element={
                <ProtectedRoute>
                  <StudyRooms />
                  <Footer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/quiz" 
              element={
                <ProtectedRoute>
                  <QuizPage />
                  <Footer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                  <Footer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <ProtectedRoute>
                  <CalendarPage />
                  <Footer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/files" 
              element={
                <ProtectedRoute>
                  <FilesPage />
                  <Footer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/achievements" 
              element={
                <ProtectedRoute>
                  <AchievementsPage />
                  <Footer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rewards" 
              element={
                <ProtectedRoute>
                  <RewardsPage />
                  <Footer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leaderboard" 
              element={
                <ProtectedRoute>
                  <LeaderboardPage />
                  <Footer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/under-development" 
              element={
                <ProtectedRoute>
                  <UnderDevelopment />
                  <Footer />
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