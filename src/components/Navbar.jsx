import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'

const TuskLogo = () => (
  <svg width="28" height="49" viewBox="0 0 48 88" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M 24 8 L 36 10 C 42 14 44 26 42 40 C 40 54 34 66 28 74 L 24 80 L 20 74 C 14 66 8 54 6 40 C 4 26 6 14 12 10 Z"
      fill="#00d4ff"
    />
  </svg>
)

const navLinks = [
  { label: 'Home',      to: '/' },
  { label: 'Builder',   to: '/builder' },
  { label: 'Dashboard', to: '/admin' },
]

export default function Navbar() {
  const { user, signOut } = useAuth()
  const isMobile          = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  const initial = user?.email?.[0]?.toUpperCase() || ''

  const truncateEmail = (email) =>
    email && email.length > 20 ? `${email.slice(0, 20)}…` : email

  const navStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'rgba(10,10,15,0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid #1e2130',
  }

  const closeMenu = () => setMenuOpen(false)

  // ─── Mobile ───────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <nav style={navStyle}>
          <div style={{
            padding: '0 16px',
            height: 64,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <TuskLogo />
              <span style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: 20, color: '#f8fafc', letterSpacing: '0.15em',
              }}>
                TUSK
              </span>
            </Link>

            {/* Right: avatar + hamburger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {user && (
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(0,212,255,0.15)', border: '1px solid #00d4ff',
                  color: '#00d4ff', fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 700, fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {initial}
                </div>
              )}
              <button
                onClick={() => setMenuOpen(true)}
                style={{
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', padding: 4,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <Menu size={24} color="#00d4ff" />
              </button>
            </div>
          </div>
        </nav>

        {/* Dark overlay */}
        <div
          onClick={closeMenu}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 198,
            opacity: menuOpen ? 1 : 0,
            pointerEvents: menuOpen ? 'auto' : 'none',
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Slide-in panel */}
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '75vw', maxWidth: 320,
          background: '#0f1117',
          borderLeft: '1px solid #1e2130',
          padding: '32px 24px',
          zIndex: 199,
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Close button */}
          <button
            onClick={closeMenu}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'transparent', border: 'none',
              cursor: 'pointer', color: '#64748b',
              display: 'flex', alignItems: 'center', padding: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            <X size={22} />
          </button>

          {/* Logo */}
          <Link
            to="/"
            onClick={closeMenu}
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 40 }}
          >
            <TuskLogo />
            <span style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: 20, color: '#f8fafc', letterSpacing: '0.15em',
            }}>
              TUSK
            </span>
          </Link>

          {/* Nav links */}
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {navLinks.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={closeMenu}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center',
                  height: 48, minHeight: 48,
                  fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 500,
                  color: isActive ? '#f8fafc' : '#64748b',
                  textDecoration: 'none',
                  borderBottom: '1px solid #1e2130',
                  transition: 'color 0.15s',
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Auth section at bottom */}
          <div style={{ marginTop: 'auto', paddingTop: 24 }}>
            {user ? (
              <>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#64748b',
                  marginBottom: 12,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user.email}
                </p>
                <button
                  onClick={() => { closeMenu(); signOut() }}
                  style={{
                    width: '100%', background: 'transparent',
                    border: '1px solid #1e2130', borderRadius: 8,
                    padding: '13px', color: '#94a3b8',
                    fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                    cursor: 'pointer', transition: 'border-color 0.15s',
                    minHeight: 44,
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: 44,
                    border: '1px solid #00d4ff', borderRadius: 8,
                    color: '#00d4ff', fontFamily: 'DM Sans, sans-serif',
                    fontSize: 14, fontWeight: 500, textDecoration: 'none',
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={closeMenu}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: 44,
                    background: '#00d4ff', borderRadius: 8,
                    color: '#0a0a0f', fontFamily: 'DM Sans, sans-serif',
                    fontSize: 14, fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  // ─── Desktop ──────────────────────────────────────────────────────────────────
  return (
    <nav style={navStyle}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto', padding: '0 24px',
        height: '64px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Left: Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <TuskLogo />
          <span style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '22px', color: '#f8fafc', letterSpacing: '0.15em',
          }}>
            TUSK
          </span>
        </Link>

        {/* Center: Nav links */}
        <div style={{ display: 'flex', gap: '36px' }}>
          {navLinks.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', fontWeight: 500,
                color: isActive ? '#f8fafc' : '#64748b',
                textDecoration: 'none', transition: 'color 0.2s',
              })}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains('active'))
                  e.currentTarget.style.color = '#64748b'
              }}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right: Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user ? (
            <>
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#64748b',
                maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {truncateEmail(user.email)}
              </span>
              <button
                onClick={signOut}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#64748b')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
                style={{
                  background: 'transparent', border: '1px solid #1e2130',
                  borderRadius: '8px', padding: '7px 14px', color: '#94a3b8',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  display: 'inline-block', border: '1px solid #00d4ff', borderRadius: '8px',
                  padding: '7px 16px', color: '#00d4ff', fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px', fontWeight: 500, textDecoration: 'none', transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                style={{
                  display: 'inline-block', background: '#00d4ff', borderRadius: '8px',
                  padding: '7px 16px', color: '#0a0a0f', fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px', fontWeight: 700, textDecoration: 'none', transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
