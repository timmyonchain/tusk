import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Database, Hash, BarChart2, ArrowRight } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: 'easeOut', delay },
})

const featureCards = [
  {
    icon: Shield,
    title: 'Team Collaboration',
    desc: 'Invite your team, manage access, and review feedback together in one place.',
  },
  {
    icon: Database,
    title: 'Secure Storage',
    desc: 'Every submission is safely stored and organized, ready to access anytime.',
  },
  {
    icon: Hash,
    title: 'Submission Receipts',
    desc: 'Every respondent gets a unique receipt ID — proof their feedback was received.',
  },
  {
    icon: BarChart2,
    title: 'Team Dashboard',
    desc: 'Filter, prioritize, export, and turn raw feedback into actionable decisions.',
  },
]

const templates = [
  {
    accent: '#ef4444',
    title: 'Bug Report',
    desc: 'Structured form for reproducible bug submissions with severity tagging.',
  },
  {
    accent: '#00d4ff',
    title: 'Feature Request',
    desc: 'Capture user ideas with priority scoring and use-case context.',
  },
  {
    accent: '#f59e0b',
    title: 'Creator Application',
    desc: 'Accept applications from collaborators, sponsors, or community members.',
  },
  {
    accent: '#10b981',
    title: 'User Feedback',
    desc: 'Collect structured feedback from your users or customers.',
  },
  {
    accent: '#8b5cf6',
    title: 'Event Registration',
    desc: 'Gather attendee info and preferences for your next event.',
  },
  {
    accent: '#ef4444',
    title: 'Job Application',
    desc: 'Screen candidates with a clean, professional application form.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <main
      style={{
        height: 'calc(100vh - 64px)',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth',
      }}
    >
      {/* ── Hero ── */}
      <section
        style={{
          height: '100%',
          scrollSnapAlign: 'start',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          textAlign: 'center',
          padding: '0 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(0,212,255,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', maxWidth: '820px', width: '100%' }}>
          <motion.h1
            {...fadeUp(0)}
            style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(1.8rem, 3.5vw, 3.2rem)',
              color: '#f8fafc',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: '24px',
            }}
          >
            The Feedback Layer for Modern Teams
          </motion.h1>

          <motion.p
            {...fadeUp(0.1)}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              color: '#64748b',
              fontSize: '1.15rem',
              lineHeight: 1.65,
              marginBottom: '40px',
              maxWidth: '600px',
              margin: '0 auto 40px',
            }}
          >
            Create beautiful forms, collect structured feedback, and turn responses into real insights.
          </motion.p>

          <motion.p
            {...fadeUp(0.15)}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#475569',
              marginBottom: '28px',
            }}
          >
            Built by{' '}
            <a
              href="https://x.com/xshephrd"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#00d4ff', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Shepherd
            </a>
          </motion.p>

          <motion.div
            {...fadeUp(0.2)}
            style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <button
              onClick={() => navigate('/builder')}
              style={{
                background: '#00d4ff',
                color: '#0a0a0f',
                fontWeight: 700,
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '1rem',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 28px',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Start Building →
            </button>
            <button
              onClick={() => navigate('/admin')}
              style={{
                background: 'transparent',
                border: '1px solid #1e2130',
                color: '#f8fafc',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '1rem',
                fontWeight: 500,
                borderRadius: '8px',
                padding: '14px 28px',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#64748b')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
            >
              View Dashboard
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section
        style={{
          minHeight: '100%',
          scrollSnapAlign: 'start',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '80px 24px' }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '2rem',
            color: '#f8fafc',
            marginBottom: '40px',
            textAlign: 'center',
          }}
        >
          Built for Modern Teams
        </motion.h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          {featureCards.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                background: '#0f1117',
                border: '1px solid #1e2130',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <Icon size={28} color="#00d4ff" style={{ marginBottom: '16px' }} />
              <h3
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  color: '#f8fafc',
                  fontSize: '1.05rem',
                  marginBottom: '8px',
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                }}
              >
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      </section>

      {/* ── Templates + Footer ── */}
      <section
        style={{
          minHeight: '100%',
          scrollSnapAlign: 'start',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
        }}
      >
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '80px 24px 0' }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '2rem',
            color: '#f8fafc',
            marginBottom: '32px',
            textAlign: 'center',
          }}
        >
          Start from a template
        </motion.h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}
        >
          {templates.map(({ accent, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              onClick={() => navigate('/builder')}
              style={{
                background: '#0f1117',
                border: '1px solid #1e2130',
                borderLeft: `3px solid ${accent}`,
                borderRadius: '12px',
                padding: '20px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                transition: 'border-color 0.2s',
              }}
              whileHover={{ scale: 1.015 }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    color: '#f8fafc',
                    fontSize: '1rem',
                    marginBottom: '6px',
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    color: '#64748b',
                    fontSize: '0.875rem',
                    lineHeight: 1.55,
                  }}
                >
                  {desc}
                </p>
              </div>
              <ArrowRight size={18} color="#64748b" style={{ flexShrink: 0 }} />
            </motion.div>
          ))}
        </div>
      </div>

      <footer
        style={{
          borderTop: '1px solid #1e2130',
          padding: '40px 24px',
          textAlign: 'center',
          marginTop: 'auto',
        }}
      >
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            color: '#475569',
            fontSize: '14px',
          }}
        >
          Built by{' '}
            <a
              href="https://x.com/xshephrd"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#00d4ff', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Shepherd
            </a>
        </p>
      </footer>
      </section>
    </main>
  )
}
