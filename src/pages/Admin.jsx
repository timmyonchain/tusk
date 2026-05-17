import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Search, Download, ChevronDown, ChevronRight, Copy,
  Plus, FileText, BarChart2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CYCLE = ['Open', 'In Review', 'Resolved']

const STATUS_STYLE = {
  'Open':      { bg: 'rgba(0,212,255,0.1)',    color: '#00d4ff', border: 'rgba(0,212,255,0.2)' },
  'In Review': { bg: 'rgba(124,58,237,0.1)',   color: '#a78bfa', border: 'rgba(124,58,237,0.2)' },
  'Resolved':  { bg: 'rgba(16,185,129,0.1)',   color: '#10b981', border: 'rgba(16,185,129,0.2)' },
}

const COL = '48px 1fr 150px 180px 135px 56px'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const fmtDateFull = (iso) =>
  new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

const fmtWallet = (wallet) => {
  if (!wallet || !wallet.trim()) return 'Anonymous'
  const w = wallet.trim()
  return w.length <= 12 ? w : `${w.slice(0, 6)}…${w.slice(-4)}`
}

const findWallet = (form, sub) => {
  const field = (form.fields || []).find(f =>
    f.label.toLowerCase().includes('wallet') || f.label.toLowerCase().includes('address')
  )
  return field ? sub.answers?.[field.id] || '' : ''
}

const fmtAnswer = (val, field) => {
  if (val === undefined || val === null || val === '') return '—'
  if (Array.isArray(val)) return val.join(', ') || '—'
  if (field?.type === 'star-rating') return `${val} / ${field?.maxStars || 5} ★`
  return String(val)
}

const exportCSV = (form, subs) => {
  const fieldLabels = (form.fields || []).map(f => f.label)
  const headers     = ['#', 'Date', 'Wallet', 'Receipt ID', 'Status', ...fieldLabels]

  const rows = subs.map((sub, i) => [
    i + 1,
    fmtDateFull(sub.submitted_at),
    fmtWallet(findWallet(form, sub)),
    sub.receipt_id || '',
    sub.status || 'Open',
    ...(form.fields || []).map(f => {
      const v = sub.answers?.[f.id]
      return Array.isArray(v) ? v.join('; ') : (v ?? '')
    }),
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `${form.title || 'form'}-submissions.csv`,
  })
  a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV exported successfully')
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
      <span style={{
        width: 28, height: 28,
        border: '3px solid #1e2130',
        borderTopColor: '#00d4ff',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.65s linear infinite',
      }} />
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, onClick }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE['Open']
  return (
    <span
      onClick={onClick}
      title="Click to change status"
      style={{
        display: 'inline-block',
        background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: '20px', padding: '4px 10px',
        fontSize: '12px', fontFamily: 'DM Sans, sans-serif',
        fontWeight: 500, cursor: 'pointer',
        whiteSpace: 'nowrap', userSelect: 'none',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
    >
      {status}
    </span>
  )
}

// ─── Expanded Detail ──────────────────────────────────────────────────────────

function ExpandedDetail({ sub, form, onCollapse }) {
  const copyReceiptId = () => {
    navigator.clipboard.writeText(sub.receipt_id || '').catch(() => {})
    toast.success('Receipt ID copied')
  }

  return (
    <div style={{
      background: '#080810',
      borderTop: '1px solid #1e2130',
      borderBottom: '1px solid #1e2130',
      padding: '20px 24px',
    }}>
      {/* Answers grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px 32px',
        marginBottom: '20px',
      }}>
        {(form.fields || []).map(field => (
          <div key={field.id}>
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: '11px',
              color: '#64748b', marginBottom: '4px', textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {field.label}
            </p>
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
              color: '#e2e8f0', lineHeight: 1.5, wordBreak: 'break-word',
            }}>
              {fmtAnswer(sub.answers?.[field.id], field)}
            </p>
          </div>
        ))}
      </div>

      {/* Receipt ID + collapse */}
      <div style={{
        borderTop: '1px solid #1e2130', paddingTop: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#64748b', flexShrink: 0 }}>
            Receipt ID
          </span>
          <code style={{
            fontFamily: 'monospace', fontSize: '11px', color: '#00d4ff',
            background: 'rgba(0,212,255,0.06)', padding: '3px 8px', borderRadius: '4px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '340px', display: 'block',
          }}>
            {sub.receipt_id || 'N/A'}
          </code>
          <button
            onClick={copyReceiptId}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#00d4ff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
            style={{
              background: 'transparent', border: 'none', padding: '2px',
              color: '#475569', cursor: 'pointer', display: 'flex',
              alignItems: 'center', transition: 'color 0.15s', flexShrink: 0,
            }}
          >
            <Copy size={13} />
          </button>
        </div>

        <button
          onClick={onCollapse}
          style={{
            background: 'transparent', border: '1px solid #1e2130',
            borderRadius: '6px', padding: '5px 12px',
            color: '#64748b', fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#64748b'; e.currentTarget.style.color = '#94a3b8' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e2130'; e.currentTarget.style.color = '#64748b' }}
        >
          Collapse
        </button>
      </div>
    </div>
  )
}

// ─── Submission Row ───────────────────────────────────────────────────────────

function SubmissionRow({ sub, index, form, expanded, onToggle, onStatusChange }) {
  const [hovered, setHovered]         = useState(false)
  const [receiptCopied, setReceiptCopied] = useState(false)

  const wallet = fmtWallet(findWallet(form, sub))

  const copyReceiptId = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(sub.receipt_id || '').catch(() => {})
    setReceiptCopied(true)
    setTimeout(() => setReceiptCopied(false), 1500)
  }

  const nextStatus = (e) => {
    e.stopPropagation()
    const cur = sub.status || 'Open'
    const idx = STATUS_CYCLE.indexOf(cur)
    onStatusChange(STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length])
  }

  const cellBase = {
    padding: '14px 16px',
    display: 'flex', alignItems: 'center',
    overflow: 'hidden',
  }

  return (
    <div>
      <div
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'grid', gridTemplateColumns: COL,
          background: hovered ? '#0f1117' : 'transparent',
          borderBottom: '1px solid #0f1117',
          cursor: 'pointer', transition: 'background 0.1s',
        }}
      >
        {/* # */}
        <div style={{ ...cellBase, color: '#475569', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>
          {index}
        </div>

        {/* Submitted */}
        <div style={{ ...cellBase, color: '#94a3b8', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}>
          {fmtDate(sub.submitted_at)}
        </div>

        {/* Wallet */}
        <div style={{ ...cellBase }}>
          <span style={{
            fontFamily: wallet === 'Anonymous' ? 'DM Sans, sans-serif' : 'monospace',
            fontSize: '12px',
            color: wallet === 'Anonymous' ? '#475569' : '#94a3b8',
          }}>
            {wallet}
          </span>
        </div>

        {/* Receipt ID */}
        <div style={{ ...cellBase, gap: '6px' }}>
          <code
            onClick={copyReceiptId}
            title={receiptCopied ? 'Copied!' : 'Click to copy'}
            style={{
              fontFamily: 'monospace', fontSize: '12px',
              color: '#00d4ff',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              cursor: 'copy', maxWidth: '140px', display: 'block',
              opacity: receiptCopied ? 0.6 : 1, transition: 'opacity 0.15s',
            }}
          >
            {sub.receipt_id ? `${sub.receipt_id.slice(0, 8)}…` : 'N/A'}
          </code>
        </div>

        {/* Status */}
        <div style={{ ...cellBase }}>
          <StatusBadge status={sub.status || 'Open'} onClick={nextStatus} />
        </div>

        {/* Expand toggle */}
        <div style={{ ...cellBase, justifyContent: 'center', color: '#475569' }}>
          {expanded
            ? <ChevronDown size={16} color="#00d4ff" />
            : <ChevronRight size={16} />
          }
        </div>
      </div>

      {expanded && (
        <ExpandedDetail sub={sub} form={form} onCollapse={onToggle} />
      )}
    </div>
  )
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatsRow({ submissions, mobile }) {
  const stats = [
    { label: 'Total Responses', value: submissions.length, color: '#f8fafc' },
    { label: 'Open',            value: submissions.filter(s => (s.status || 'Open') === 'Open').length, color: '#00d4ff' },
    { label: 'Resolved',        value: submissions.filter(s => s.status === 'Resolved').length, color: '#10b981' },
  ]

  return (
    <div style={{
      display: 'flex', gap: mobile ? 8 : 12,
      padding: mobile ? '12px 16px' : '16px 24px',
      borderBottom: '1px solid #1e2130',
      flexShrink: 0,
    }}>
      {stats.map(({ label, value, color }) => (
        <div key={label} style={{
          background: '#0f1117', border: '1px solid #1e2130',
          borderRadius: '8px',
          padding: mobile ? '10px 12px' : '14px 20px',
          flex: mobile ? 1 : undefined,
          minWidth: mobile ? 0 : '120px',
        }}>
          <p style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: mobile ? '20px' : '24px', color, marginBottom: '4px', lineHeight: 1,
          }}>
            {value}
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: mobile ? '10px' : '12px', color: '#64748b', lineHeight: 1.3 }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

function TopBar({ form, search, onSearch, statusFilter, onStatusFilter, onExport }) {
  return (
    <div style={{
      padding: '16px 24px', borderBottom: '1px solid #1e2130',
      display: 'flex', alignItems: 'center',
      gap: '12px', flexShrink: 0, flexWrap: 'wrap',
    }}>
      <h2 style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 700,
        fontSize: '20px', color: '#f8fafc',
        flexGrow: 1, minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {form.title || 'Untitled Form'}
      </h2>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: '#0f1117', border: '1px solid #1e2130',
        borderRadius: '8px', padding: '0 12px',
        width: '200px', flexShrink: 0,
      }}>
        <Search size={13} color="#475569" style={{ flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search submissions…"
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: '#f8fafc', fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px', padding: '8px 0', width: '100%',
          }}
        />
      </div>

      {/* Status filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilter(e.target.value)}
        style={{
          background: '#0f1117', border: '1px solid #1e2130',
          borderRadius: '8px', padding: '8px 12px',
          color: '#94a3b8', fontFamily: 'DM Sans, sans-serif',
          fontSize: '13px', outline: 'none', cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {['All', ...STATUS_CYCLE].map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Export CSV */}
      <button
        onClick={onExport}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00d4ff')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'transparent', border: '1px solid #1e2130',
          borderRadius: '8px', padding: '8px 14px',
          color: '#94a3b8', fontFamily: 'DM Sans, sans-serif',
          fontSize: '13px', cursor: 'pointer', flexShrink: 0,
          transition: 'border-color 0.15s',
        }}
      >
        <Download size={14} />
        Export CSV
      </button>
    </div>
  )
}

// ─── Empty Submissions ────────────────────────────────────────────────────────

function EmptySubmissions({ form }) {
  const copyLink = () => {
    const url = `${window.location.origin}/form/${form.id}`
    navigator.clipboard.writeText(url).catch(() => {})
    toast.success('Form link copied!')
  }

  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column',
      gap: '16px', textAlign: 'center', padding: '48px 24px',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: '#0f1117', border: '1px solid #1e2130',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FileText size={22} color="#475569" />
      </div>
      <div>
        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', color: '#94a3b8', marginBottom: '6px' }}>
          No submissions yet
        </p>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
          Share the form link to start collecting responses
        </p>
      </div>
      <button
        onClick={copyLink}
        style={{
          background: 'transparent', border: '1px solid #1e2130',
          borderRadius: '8px', padding: '10px 20px',
          color: '#00d4ff', fontFamily: 'DM Sans, sans-serif',
          fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00d4ff')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
      >
        Copy Form Link
      </button>
    </div>
  )
}

// ─── Submissions Table ────────────────────────────────────────────────────────

function SubmissionsTable({ form, submissions, search, statusFilter, onStatusUpdate, loading }) {
  const [expandedId, setExpandedId] = useState(null)

  if (loading) return <Spinner />

  const filtered = submissions.filter(sub => {
    const matchSearch = !search || Object.values(sub.answers || {}).some(v =>
      String(v).toLowerCase().includes(search.toLowerCase())
    ) || (sub.receipt_id || '').toLowerCase().includes(search.toLowerCase())

    const matchStatus = statusFilter === 'All' || (sub.status || 'Open') === statusFilter

    return matchSearch && matchStatus
  })

  if (submissions.length === 0) return <EmptySubmissions form={form} />

  const headerCell = {
    padding: '10px 16px',
    fontFamily: 'DM Sans, sans-serif', fontSize: '11px',
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em',
    display: 'flex', alignItems: 'center',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: COL,
        background: '#0f1117',
        borderBottom: '1px solid #1e2130',
        position: 'sticky', top: 0, zIndex: 2,
        flexShrink: 0,
      }}>
        <div style={headerCell}>#</div>
        <div style={headerCell}>Submitted</div>
        <div style={headerCell}>Wallet</div>
        <div style={headerCell}>Receipt ID</div>
        <div style={headerCell}>Status</div>
        <div style={{ ...headerCell, justifyContent: 'center' }}></div>
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#475569',
        }}>
          No submissions match your filter
        </div>
      ) : (
        filtered.map((sub, i) => (
          <SubmissionRow
            key={sub.id}
            sub={sub}
            index={i + 1}
            form={form}
            expanded={expandedId === sub.id}
            onToggle={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
            onStatusChange={(status) => onStatusUpdate(sub.id, status)}
          />
        ))
      )}
    </div>
  )
}

// ─── No Form Selected ─────────────────────────────────────────────────────────

function NoFormSelected({ forms, onSelectForm }) {
  if (forms.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '16px', textAlign: 'center', padding: '48px 24px',
      }}>
        <BarChart2 size={40} color="#1e2130" />
        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', color: '#475569' }}>
          No forms yet
        </p>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#334155' }}>
          Build your first form to start collecting submissions
        </p>
      </div>
    )
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '24px', padding: '48px 24px', maxWidth: '560px', margin: '0 auto', width: '100%',
    }}>
      <div style={{ textAlign: 'center' }}>
        <BarChart2 size={36} color="#1e2130" style={{ marginBottom: '12px' }} />
        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', color: '#64748b', marginBottom: '6px' }}>
          Select a form to view submissions
        </p>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#334155' }}>
          Choose from your forms on the left
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {forms.slice(0, 4).map(form => (
          <div
            key={form.id}
            onClick={() => onSelectForm(form.id)}
            style={{
              background: '#0f1117', border: '1px solid #1e2130',
              borderRadius: '8px', padding: '14px 18px',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '12px',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2d3748')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
          >
            <FileText size={16} color="#475569" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
                color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {form.title || 'Untitled Form'}
              </p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#475569' }}>
                {form.submissionCount} response{form.submissionCount !== 1 ? 's' : ''}
              </p>
            </div>
            <ChevronRight size={14} color="#334155" style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Forms Sidebar ────────────────────────────────────────────────────────────

function FormsSidebar({ forms, selectedFormId, onSelectForm, navigate, loading }) {
  return (
    <aside style={{
      width: 280, flexShrink: 0,
      background: '#0a0a0f',
      borderRight: '1px solid #1e2130',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid #1e2130',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'Syne, sans-serif', fontSize: '11px',
          color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          My Forms
        </span>
        <button
          onClick={() => navigate('/builder')}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#00d4ff'; e.currentTarget.style.color = '#0a0a0f' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00d4ff' }}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'transparent', border: '1px solid #00d4ff',
            borderRadius: '6px', padding: '4px 10px',
            color: '#00d4ff', fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          <Plus size={12} />
          New Form
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Spinner />
        ) : forms.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
              No forms yet
            </p>
            <button
              onClick={() => navigate('/builder')}
              style={{
                background: 'transparent', border: 'none',
                color: '#00d4ff', fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px', cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              Create your first form →
            </button>
          </div>
        ) : (
          forms.map(form => {
            const selected = form.id === selectedFormId
            return (
              <div
                key={form.id}
                onClick={() => onSelectForm(form.id)}
                style={{
                  padding: '14px 16px',
                  background: selected ? '#0f1117' : 'transparent',
                  borderLeft: `3px solid ${selected ? '#00d4ff' : 'transparent'}`,
                  borderBottom: '1px solid #0f1117',
                  cursor: 'pointer', transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = '#0c0c14' }}
                onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent' }}
              >
                <p style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
                  color: selected ? '#f8fafc' : '#e2e8f0',
                  marginBottom: '4px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {form.title || 'Untitled Form'}
                </p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
                  {form.submissionCount} response{form.submissionCount !== 1 ? 's' : ''}
                </p>
                {form.created_at && (
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#334155' }}>
                    {new Date(form.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}

// ─── Mobile Submission Card ───────────────────────────────────────────────────

function MobileSubmissionCard({ sub, index, form, expanded, onToggle, onStatusChange }) {
  const nextStatus = (e) => {
    e.stopPropagation()
    const cur = sub.status || 'Open'
    const idx = STATUS_CYCLE.indexOf(cur)
    onStatusChange(STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length])
  }

  return (
    <div style={{ borderBottom: '1px solid #1e2130' }}>
      <div
        onClick={onToggle}
        style={{ padding: '14px 16px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#94a3b8' }}>
            {fmtDate(sub.submitted_at)}
          </span>
          <StatusBadge status={sub.status || 'Open'} onClick={nextStatus} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <code style={{
            fontFamily: 'monospace', fontSize: '11px', color: '#00d4ff',
            background: 'rgba(0,212,255,0.06)', padding: '2px 8px', borderRadius: '4px',
          }}>
            {sub.receipt_id ? `${sub.receipt_id.slice(0, 8)}…` : 'N/A'}
          </code>
          {expanded
            ? <ChevronDown size={14} color="#00d4ff" />
            : <ChevronRight size={14} color="#475569" />
          }
        </div>
      </div>
      {expanded && (
        <ExpandedDetail sub={sub} form={form} onCollapse={onToggle} />
      )}
    </div>
  )
}

function MobileSubmissionsView({ form, submissions, search, statusFilter, onStatusUpdate, loading }) {
  const [expandedId, setExpandedId] = useState(null)

  if (loading) return <Spinner />
  if (submissions.length === 0) return <EmptySubmissions form={form} />

  const filtered = submissions.filter(sub => {
    const matchSearch = !search || Object.values(sub.answers || {}).some(v =>
      String(v).toLowerCase().includes(search.toLowerCase())
    ) || (sub.receipt_id || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || (sub.status || 'Open') === statusFilter
    return matchSearch && matchStatus
  })

  if (filtered.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#475569' }}>
        No submissions match your filter
      </div>
    )
  }

  return (
    <div>
      {filtered.map((sub, i) => (
        <MobileSubmissionCard
          key={sub.id}
          sub={sub}
          index={i + 1}
          form={form}
          expanded={expandedId === sub.id}
          onToggle={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
          onStatusChange={(status) => onStatusUpdate(sub.id, status)}
        />
      ))}
    </div>
  )
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

export default function Admin() {
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const isMobile    = useIsMobile()

  const [forms, setForms]               = useState([])
  const [formsLoading, setFormsLoading] = useState(false)
  const [selectedFormId, setSelectedFormId] = useState(null)
  const [submissions, setSubmissions]   = useState([])
  const [subsLoading, setSubsLoading]   = useState(false)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Load forms + submission counts
  useEffect(() => {
    if (!user) return

    async function load() {
      setFormsLoading(true)
      try {
        const { data: formsData, error } = await supabase
          .from('forms')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          toast.error('Failed to load forms')
          return
        }

        const withCounts = await Promise.all(
          (formsData || []).map(async (form) => {
            const { count } = await supabase
              .from('submissions')
              .select('id', { count: 'exact', head: true })
              .eq('form_id', form.id)
            return { ...form, submissionCount: count || 0 }
          })
        )

        setForms(withCounts)
      } catch {
        toast.error('Failed to load forms')
      } finally {
        setFormsLoading(false)
      }
    }

    load()
  }, [user])

  // Load submissions when form changes
  useEffect(() => {
    if (!selectedFormId) { setSubmissions([]); return }
    setSubsLoading(true)
    setSearch('')
    setStatusFilter('All')

    supabase
      .from('submissions')
      .select('*')
      .eq('form_id', selectedFormId)
      .order('submitted_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error('Failed to load submissions')
        else setSubmissions(data || [])
        setSubsLoading(false)
      })
  }, [selectedFormId])

  const selectedForm = forms.find(f => f.id === selectedFormId) ?? null

  const updateStatus = async (subId, newStatus) => {
    setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, status: newStatus } : s))
    const { error } = await supabase
      .from('submissions')
      .update({ status: newStatus })
      .eq('id', subId)
    if (error) toast.error('Failed to update status')
  }

  const handleExport = () => {
    if (selectedForm && submissions.length > 0) exportCSV(selectedForm, submissions)
    else toast.error('No submissions to export')
  }

  // ── Mobile layout ─────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden', background: '#0a0a0f' }}>

        {/* Forms section — max-height 220px, scrollable */}
        <div style={{ flexShrink: 0, background: '#0a0a0f', borderBottom: '1px solid #1e2130', maxHeight: 220, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '12px 16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', borderBottom: '1px solid #1e2130', flexShrink: 0,
            background: '#0a0a0f',
          }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              My Forms
            </span>
            <button
              onClick={() => navigate('/builder')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: '#00d4ff', border: 'none', borderRadius: 6,
                padding: '4px 12px', color: '#0a0a0f',
                fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={12} /> New Form
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {formsLoading ? (
              <Spinner />
            ) : forms.length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#475569' }}>No forms yet</p>
              </div>
            ) : (
              forms.map(form => {
                const selected = form.id === selectedFormId
                return (
                  <div
                    key={form.id}
                    onClick={() => setSelectedFormId(form.id)}
                    style={{
                      padding: '10px 16px', cursor: 'pointer',
                      background: selected ? '#0f1117' : 'transparent',
                      borderLeft: `3px solid ${selected ? '#00d4ff' : 'transparent'}`,
                      borderBottom: '1px solid #0f1117',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
                        color: selected ? '#f8fafc' : '#e2e8f0',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginBottom: 2,
                      }}>
                        {form.title || 'Untitled Form'}
                      </p>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#64748b' }}>
                        {form.submissionCount} response{form.submissionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronRight size={13} color={selected ? '#00d4ff' : '#334155'} style={{ flexShrink: 0 }} />
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Submissions section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {!selectedForm ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
              <div>
                <BarChart2 size={36} color="#1e2130" style={{ marginBottom: 12 }} />
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', color: '#64748b', marginBottom: 6 }}>
                  Select a form above
                </p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#334155' }}>
                  Tap a form to view its submissions
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile top bar */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2130', background: '#0f1117', flexShrink: 0 }}>
                <h2 style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '16px',
                  color: '#f8fafc', marginBottom: 10,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {selectedForm.title}
                </h2>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#0a0a0f', border: '1px solid #1e2130',
                  borderRadius: 8, padding: '0 12px', marginBottom: 8,
                }}>
                  <Search size={13} color="#475569" style={{ flexShrink: 0 }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search submissions…"
                    style={{
                      background: 'transparent', border: 'none', outline: 'none',
                      color: '#f8fafc', fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px', padding: '8px 0', width: '100%',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      flex: 1, background: '#0a0a0f', border: '1px solid #1e2130',
                      borderRadius: 8, padding: '7px 10px',
                      color: '#94a3b8', fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px', outline: 'none', cursor: 'pointer',
                    }}
                  >
                    {['All', ...STATUS_CYCLE].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={handleExport}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                      background: 'transparent', border: '1px solid #1e2130',
                      borderRadius: 8, padding: '7px 12px', color: '#94a3b8',
                      fontFamily: 'DM Sans, sans-serif', fontSize: '12px', cursor: 'pointer',
                    }}
                  >
                    <Download size={13} /> Export
                  </button>
                </div>
              </div>

              <StatsRow submissions={submissions} mobile />

              <div style={{ flex: 1, overflowY: 'auto' }}>
                <MobileSubmissionsView
                  form={selectedForm}
                  submissions={submissions}
                  search={search}
                  statusFilter={statusFilter}
                  onStatusUpdate={updateStatus}
                  loading={subsLoading}
                />
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      <FormsSidebar
        forms={forms}
        selectedFormId={selectedFormId}
        onSelectForm={setSelectedFormId}
        navigate={navigate}
        loading={formsLoading}
      />

      {/* Right main area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        minWidth: 0, overflow: 'hidden',
      }}>
        {!selectedForm ? (
          <NoFormSelected forms={forms} onSelectForm={setSelectedFormId} />
        ) : (
          <>
            <TopBar
              form={selectedForm}
              search={search}
              onSearch={setSearch}
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
              onExport={handleExport}
            />
            <StatsRow submissions={submissions} />
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <SubmissionsTable
                form={selectedForm}
                submissions={submissions}
                search={search}
                statusFilter={statusFilter}
                onStatusUpdate={updateStatus}
                loading={subsLoading}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
