import { Link, NavLink } from 'react-router-dom'

const TuskLogo = () => (
  <svg width="28" height="49" viewBox="0 0 48 88" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M 24 8 L 36 10 C 42 14 44 26 42 40 C 40 54 34 66 28 74 L 24 80 L 20 74 C 14 66 8 54 6 40 C 4 26 6 14 12 10 Z"
      fill="#00d4ff"
    />
  </svg>
)

export default function Navbar() {
  const navLinkStyle = ({ isActive }) => ({
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '0.95rem',
    fontWeight: 500,
    color: isActive ? '#f8fafc' : '#64748b',
    textDecoration: 'none',
    transition: 'color 0.2s',
  })

  return (
    <>
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            <TuskLogo />
            <span
              style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: '22px',
                color: '#f8fafc',
                letterSpacing: '0.15em',
              }}
            >
              TUSK
            </span>
          </Link>

          {/* Center: Nav links */}
          <div style={{ display: 'flex', gap: '36px' }}>
            {[
              { label: 'Home', to: '/' },
              { label: 'Builder', to: '/builder' },
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

        </div>
      </nav>
    </>
  )
}
