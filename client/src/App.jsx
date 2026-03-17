import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import WelcomeScreen from './screens/WelcomeScreen'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import DashboardScreen from './screens/DashboardScreen'
import LogScreen from './screens/LogScreen'
import TransactionsScreen from './screens/TransactionsScreen'
import PatternsScreen from './screens/PatternsScreen'
import ReportScreen from './screens/ReportScreen'
import SettingsScreen from './screens/SettingsScreen'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

function PublicAuthRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/login" element={<PublicAuthRoute><LoginScreen /></PublicAuthRoute>} />
        <Route path="/signup" element={<PublicAuthRoute><SignupScreen /></PublicAuthRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingScreen /></ProtectedRoute>} />
        <Route path="/dashboard"     element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
        <Route path="/log"           element={<ProtectedRoute><LogScreen /></ProtectedRoute>} />
        <Route path="/transactions"  element={<ProtectedRoute><TransactionsScreen /></ProtectedRoute>} />
        <Route path="/patterns"      element={<ProtectedRoute><PatternsScreen /></ProtectedRoute>} />
        <Route path="/report"        element={<ProtectedRoute><ReportScreen /></ProtectedRoute>} />
        <Route path="/settings"      element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
