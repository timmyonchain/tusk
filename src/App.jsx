import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Builder from './pages/Builder'
import Admin from './pages/Admin'
import FormView from './pages/FormView'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/admin" element={<Admin />} />
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
    </>
  )
}
