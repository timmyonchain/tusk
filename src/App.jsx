import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Builder from './pages/Builder'
import Admin from './pages/Admin'
import FormView from './pages/FormView'
import Login from './pages/Login'
import Signup from './pages/Signup'

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/"        element={<Landing />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/signup"  element={<Signup />} />
        <Route path="/builder" element={<ProtectedRoute><Builder /></ProtectedRoute>} />
        <Route path="/admin"   element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/form/:id" element={<FormView />} />
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0f1117',
            color: '#f8fafc',
            border: '1px solid #1e2130',
            fontFamily: 'DM Sans, sans-serif',
          },
        }}
      />
    </AuthProvider>
  )
}
