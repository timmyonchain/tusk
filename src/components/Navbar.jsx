import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const TuskLogo = () => (
  <svg width="28" height="49" viewBox="0 0 48 88" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M 24 8 L 36 10 C 42 14 44 26 42 40 C 40 54 34 66 28 74 L 24 80 L 20 74 C 14 66 8 54 6 40 C 4 26 6 14 12 10 Z"
      fill="#00d4ff"
    />
  </svg>
)

export default function Navbar() {
  const { user, signOut } = useAuth()

  const navLinkStyle = ({ isActive }) => ({
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '0.95rem',
    fontWeight: 500,
    color: isActive ? '#f8fafc' : '#64748b',
    textDecoration: 'none',
    transition: 'color 0.2s',
  })

  const truncateEmail = (email) =>
    email && email.length > 20 ? `${email.slice(0, 20)}…` : email

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #1e2130',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Logo */}
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
        >
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
          {[
            { label: 'Home',      to: '/' },
            { label: 'Builder',   to: '/builder' },
            { label: 'Dashboard', to: '/admin' },
          ].map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={navLinkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.color = '#64748b'
                }
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
                fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
                color: '#64748b', maxWidth: '180px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {truncateEmail(user.email)}
              </span>
              <button
                onClick={signOut}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#64748b')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
                style={{
                  background: 'transparent', border: '1px solid #1e2130',
                  borderRadius: '8px', padding: '7px 14px',
                  color: '#94a3b8', fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px', cursor: 'pointer',
                  transition: 'border-color 0.15s',
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
                  display: 'inline-block',
                  border: '1px solid #00d4ff', borderRadius: '8px',
                  padding: '7px 16px', color: '#00d4ff',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
                  fontWeight: 500, textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                style={{
                  display: 'inline-block',
                  background: '#00d4ff', borderRadius: '8px',
                  padding: '7px 16px', color: '#0a0a0f',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
                  fontWeight: 700, textDecoration: 'none',
                  transition: 'opacity 0.15s',
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
