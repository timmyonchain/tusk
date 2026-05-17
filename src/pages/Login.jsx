import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

const TuskLogo = () => (
  <svg width="28" height="49" viewBox="0 0 48 88" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M 24 8 L 36 10 C 42 14 44 26 42 40 C 40 54 34 66 28 74 L 24 80 L 20 74 C 14 66 8 54 6 40 C 4 26 6 14 12 10 Z"
      fill="#00d4ff"
    />
  </svg>
)

export default function Login() {
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  const [emailFocused,    setEmailFocused]    = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [showPassword,    setShowPassword]    = useState(false)

  const inputStyle = (focused) => ({
    width: '100%',
    background: '#0a0a0f',
    border: `1px solid ${focused ? '#00d4ff' : '#1e2130'}`,
    borderRadius: '8px',
    padding: '12px 44px 12px 16px',
    color: '#f8fafc',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      navigate('/builder')
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: '#0f1117',
        border: '1px solid #1e2130',
        borderRadius: '16px',
        padding: '40px',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          justifyContent: 'center', marginBottom: '32px',
        }}>
          <TuskLogo />
          <span style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '22px', color: '#f8fafc', letterSpacing: '0.15em',
          }}>
            TUSK
          </span>
        </div>

        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: '1.6rem', color: '#f8fafc',
          marginBottom: '8px', textAlign: 'center',
        }}>
          Welcome back
        </h1>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
          color: '#64748b', textAlign: 'center', marginBottom: '32px',
        }}>
          Sign in to your TUSK account
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block', fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px', color: '#64748b', marginBottom: '6px',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              placeholder="you@example.com"
              required
              style={inputStyle(emailFocused)}
            />
          </div>

          <div>
            <label style={{
              display: 'block', fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px', color: '#64748b', marginBottom: '6px',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="••••••••"
                required
                style={inputStyle(passwordFocused)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#00d4ff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', color: '#64748b',
                  display: 'flex', alignItems: 'center',
                  padding: 0, transition: 'color 0.15s',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            style={{
              width: '100%', background: '#00d4ff', border: 'none',
              borderRadius: '8px', padding: '14px',
              color: '#0a0a0f', fontFamily: 'DM Sans, sans-serif',
              fontSize: '15px', fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.8 : 1,
              marginTop: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16,
                  border: '2.5px solid rgba(10,10,15,0.3)',
                  borderTopColor: '#0a0a0f',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.65s linear infinite',
                }} />
                Signing in…
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
          color: '#64748b', textAlign: 'center', marginTop: '24px',
        }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#00d4ff', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
