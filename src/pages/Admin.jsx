import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Search, Download, ChevronDown, ChevronRight, ChevronUp, Copy,
  Plus, FileText, BarChart2, XCircle, CheckCircle,
  Globe, Lock, Eye, EyeOff, Link2, Trash2, AlertTriangle,
  FileSpreadsheet, ClipboardList,
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

const fmtAnswerExport = (val, field) => {
  if (val === undefined || val === null || val === '') return ''
  if (val && typeof val === 'object' && val.name) return val.name
  if (Array.isArray(val)) return val.join(', ') || ''
  if (field?.type === 'star-rating') return `${val} / ${field?.maxStars || 5} ★`
  return String(val)
}

const exportCSV = (form, subs) => {
  const date        = new Date().toISOString().slice(0, 10)
  const fieldLabels = (form.fields || []).map(f => f.label)
  const colCount    = 4 + fieldLabels.length
  const q           = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

  const rows = [
    [q(form.title || 'Untitled Form'), ...Array(colCount - 1).fill('""')],
    [q(`Exported on: ${new Date().toLocaleString()}`), ...Array(colCount - 1).fill('""')],
    Array(colCount).fill('""'),
    ['#', 'Submitted', 'Status', 'Receipt ID', ...fieldLabels].map(q),
    ...subs.map((sub, i) => [
      i + 1,
      fmtDateFull(sub.submitted_at),
      sub.status || 'Open',
      sub.receipt_id || '',
      ...(form.fields || []).map(f => fmtAnswerExport(sub.answers?.[f.id], f)),
    ].map(q)),
  ]

  const csv  = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const slug = (form.title || 'form').replace(/[^a-z0-9]/gi, '-').toLowerCase()
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: `${slug}-responses-${date}.csv`,
  })
  a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV exported successfully')
}

const exportPDF = (form, subs) => {
  const date  = new Date().toLocaleString()
  const stats = {
    total:    subs.length,
    open:     subs.filter(s => (s.status || 'Open') === 'Open').length,
    inReview: subs.filter(s => s.status === 'In Review').length,
    resolved: subs.filter(s => s.status === 'Resolved').length,
  }

  const cards = subs.map((sub, i) => `
    <div class="card">
      <div class="card-head">
        <span class="num">#${i + 1}</span>
        <span class="dt">${fmtDateFull(sub.submitted_at)}</span>
        <span class="badge">${sub.status || 'Open'}</span>
        <span class="rid">ID: ${(sub.receipt_id || 'N/A').slice(0, 16)}…</span>
      </div>
      <table>
        ${(form.fields || []).map(f => `
          <tr>
            <td class="lbl">${f.label}</td>
            <td class="val">${fmtAnswerExport(sub.answers?.[f.id], f) || '—'}</td>
          </tr>`).join('')}
      </table>
    </div>`).join('')

  const html = `
    <div class="hd">
      <div class="logo">TUSK</div>
      <h1>${form.title || 'Untitled Form'}</h1>
      <p class="meta">Generated on ${date} &nbsp;·&nbsp; ${stats.total} response${stats.total !== 1 ? 's' : ''}</p>
    </div>
    <div class="stats">
      ${[['Total', stats.total], ['Open', stats.open], ['In Review', stats.inReview], ['Resolved', stats.resolved]]
        .map(([l, v]) => `<div class="sb"><div class="sv">${v}</div><div class="sl">${l}</div></div>`).join('')}
    </div>
    <div class="subs">${cards}</div>
    <div class="ft">Generated by TUSK &bull; tusk.ink</div>`

  const style = `
    @media print {
      body > *:not(#tusk-print) { display: none !important; }
      #tusk-print { display: block !important; }
    }
    #tusk-print {
      display: none;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #111; background: #fff; padding: 24px; font-size: 13px;
    }
    #tusk-print .hd { margin-bottom: 20px; }
    #tusk-print .logo { font-size: 10px; font-weight: 700; letter-spacing: .2em; color: #888; margin-bottom: 6px; }
    #tusk-print h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    #tusk-print .meta { font-size: 11px; color: #666; margin: 0 0 20px; }
    #tusk-print .stats { display: flex; gap: 10px; margin-bottom: 24px; }
    #tusk-print .sb { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 10px; text-align: center; }
    #tusk-print .sv { font-size: 20px; font-weight: 700; }
    #tusk-print .sl { font-size: 10px; color: #666; margin-top: 2px; }
    #tusk-print .card { border: 1px solid #ddd; border-radius: 6px; padding: 14px; margin-bottom: 14px; break-inside: avoid; }
    #tusk-print .card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
    #tusk-print .num { font-weight: 700; font-size: 13px; }
    #tusk-print .dt  { font-size: 11px; color: #555; }
    #tusk-print .badge { font-size: 10px; padding: 2px 8px; border: 1px solid #ccc; border-radius: 10px; }
    #tusk-print .rid { font-size: 10px; color: #999; font-family: monospace; margin-left: auto; }
    #tusk-print table { width: 100%; border-collapse: collapse; font-size: 12px; }
    #tusk-print tr { border-top: 1px solid #eee; }
    #tusk-print .lbl { padding: 5px 8px 5px 0; color: #555; width: 32%; vertical-align: top; font-weight: 500; }
    #tusk-print .val { padding: 5px 0; word-break: break-word; }
    #tusk-print .ft { margin-top: 28px; padding-top: 14px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #aaa; }
    @page { margin: 18mm; }`

  document.getElementById('tusk-print')?.remove()
  document.getElementById('tusk-print-style')?.remove()

  const styleEl = Object.assign(document.createElement('style'), { id: 'tusk-print-style', textContent: style })
  document.head.appendChild(styleEl)

  const div = Object.assign(document.createElement('div'), { id: 'tusk-print', innerHTML: html })
  document.body.appendChild(div)

  window.onafterprint = () => {
    document.getElementById('tusk-print')?.remove()
    document.getElementById('tusk-print-style')?.remove()
    window.onafterprint = null
  }
  window.print()
  toast.success('Print dialog opened — save as PDF')
}

const copySummary = (form, subs) => {
  const date  = new Date().toLocaleString()
  const stats = {
    total:    subs.length,
    open:     subs.filter(s => (s.status || 'Open') === 'Open').length,
    inReview: subs.filter(s => s.status === 'In Review').length,
    resolved: subs.filter(s => s.status === 'Resolved').length,
  }
  const D = '═══════════════════════════════'
  const d = '─────────────────────────────'

  const responses = subs.map((sub, i) => {
    const fields = (form.fields || []).map(f => `${f.label}: ${fmtAnswerExport(sub.answers?.[f.id], f) || '—'}`).join('\n')
    return `#${i + 1} — ${fmtDateFull(sub.submitted_at)} — ${sub.status || 'Open'}\nReceipt ID: ${sub.receipt_id || 'N/A'}\n${fields}`
  }).join('\n\n')

  const text = [
    D, 'TUSK FORM SUMMARY',
    `Form: ${form.title || 'Untitled Form'}`,
    `Exported: ${date}`, D, '',
    'OVERVIEW',
    `Total Responses: ${stats.total}`,
    `Open: ${stats.open}`,
    `In Review: ${stats.inReview}`,
    `Resolved: ${stats.resolved}`, '',
    d, 'RESPONSES', d, '',
    responses, '',
    D, 'Generated by TUSK • tusk.ink', D,
  ].join('\n')

  navigator.clipboard.writeText(text).catch(() => {})
  toast.success('Summary copied to clipboard — paste anywhere')
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

// ─── File Answer Renderer ─────────────────────────────────────────────────────

function FileAnswerRenderer({ value }) {
  if (!value || value === '—') {
    return (
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#475569' }}>—</p>
    )
  }

  // Old format: plain string filename (file no longer available)
  if (typeof value === 'string') {
    return (
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#64748b', margin: 0 }}>
        {value}{' '}
        <span style={{ color: '#334155', fontStyle: 'italic' }}>(file not available)</span>
      </p>
    )
  }

  // New format: { url, name, size, type }
  const { url, name, type } = value
  if (!url) {
    return <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#475569' }}>—</p>
  }

  const ext = (name || '').split('.').pop().toLowerCase()
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) || (type || '').startsWith('image/')
  const isPDF   = ext === 'pdf' || type === 'application/pdf'
  const isVideo = ['mp4', 'mov', 'webm'].includes(ext) || (type || '').startsWith('video/')

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
        <img
          src={url}
          alt={name}
          style={{ maxHeight: 200, borderRadius: 8, cursor: 'pointer', display: 'block' }}
        />
      </a>
    )
  }

  if (isPDF) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00d4ff')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          border: '1px solid rgba(0,212,255,0.3)', borderRadius: 6,
          padding: '6px 12px', color: '#00d4ff',
          fontFamily: 'DM Sans, sans-serif', fontSize: 13,
          textDecoration: 'none', transition: 'border-color 0.15s',
        }}
      >
        <FileText size={14} /> View PDF
      </a>
    )
  }

  if (isVideo) {
    return (
      <video
        src={url}
        controls
        style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, display: 'block' }}
      />
    )
  }

  return (
    <a
      href={url}
      download={name}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#64748b')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        border: '1px solid #1e2130', borderRadius: 6,
        padding: '6px 12px', color: '#94a3b8',
        fontFamily: 'DM Sans, sans-serif', fontSize: 13,
        textDecoration: 'none', transition: 'border-color 0.15s',
      }}
    >
      <Download size={14} /> {name || 'Download File'}
    </a>
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
            {field.type === 'file-upload' ? (
              <FileAnswerRenderer value={sub.answers?.[field.id]} />
            ) : (
              <p style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
                color: '#e2e8f0', lineHeight: 1.5, wordBreak: 'break-word',
              }}>
                {fmtAnswer(sub.answers?.[field.id], field)}
              </p>
            )}
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

// ─── Export Menu ──────────────────────────────────────────────────────────────

function ExportMenu({ form, submissions }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const pick = (action) => { setOpen(false); action() }
  const hasData = submissions.length > 0
  const guard = (fn) => () => hasData ? fn(form, submissions) : toast.error('No submissions to export')

  const items = [
    { Icon: FileSpreadsheet, label: 'Export as CSV',  desc: 'Download all responses as a spreadsheet',     action: guard(exportCSV)     },
    { Icon: FileText,        label: 'Export as PDF',  desc: 'Download a formatted, printable report',      action: guard(exportPDF)     },
    { Icon: ClipboardList,   label: 'Copy Summary',   desc: 'Copy a plain text summary to clipboard',      action: guard(copySummary)   },
  ]

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00d4ff')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = open ? '#00d4ff' : '#1e2130')}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'transparent',
          border: `1px solid ${open ? '#00d4ff' : '#1e2130'}`,
          borderRadius: '8px', padding: '8px 14px',
          color: '#94a3b8', fontFamily: 'DM Sans, sans-serif',
          fontSize: '13px', cursor: 'pointer', transition: 'border-color 0.15s',
        }}
      >
        <Download size={14} />
        Export
        <ChevronDown
          size={13}
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: '#0f1117', border: '1px solid #1e2130',
          borderRadius: '10px', padding: '6px',
          minWidth: '220px', zIndex: 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {items.map(({ Icon, label, desc, action }) => (
            <button
              key={label}
              onClick={() => pick(action)}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1e2130')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                borderRadius: '8px', padding: '10px 14px',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
              }}
            >
              <Icon size={16} color="#64748b" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#f8fafc', margin: 0, fontWeight: 500 }}>
                  {label}
                </p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>
                  {desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

function TopBar({ form, search, onSearch, statusFilter, onStatusFilter, submissions, onCopyLink }) {
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

      {/* Copy Link */}
      <button
        onClick={onCopyLink}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00d4ff')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'transparent', border: '1px solid #1e2130',
          borderRadius: '8px', padding: '8px 14px',
          color: '#00d4ff', fontFamily: 'DM Sans, sans-serif',
          fontSize: '13px', cursor: 'pointer', flexShrink: 0,
          transition: 'border-color 0.15s',
        }}
      >
        <Link2 size={13} />
        Copy Link
      </button>

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

      <ExportMenu form={form} submissions={submissions} />
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

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ form, onConfirm, onCancel, deleting }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{
        background: '#0f1117', border: '1px solid #1e2130',
        borderRadius: '16px', padding: '28px',
        width: '100%', maxWidth: '400px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <AlertTriangle size={24} color="#ef4444" />
        </div>
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: '18px', color: '#f8fafc', marginBottom: '12px',
        }}>
          Delete this form?
        </h2>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
          color: '#94a3b8', lineHeight: 1.6, marginBottom: '28px',
        }}>
          This will permanently delete{' '}
          <span style={{ color: '#f8fafc', fontWeight: 500 }}>
            {form.title || 'Untitled Form'}
          </span>{' '}
          and all its submissions. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#64748b')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
            style={{
              flex: 1, background: 'transparent',
              border: '1px solid #1e2130', borderRadius: '8px',
              padding: '12px', color: '#94a3b8',
              fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1, background: '#ef4444', border: 'none',
              borderRadius: '8px', padding: '12px',
              color: '#fff', fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px', fontWeight: 700,
              cursor: deleting ? 'default' : 'pointer',
              opacity: deleting ? 0.7 : 1, transition: 'opacity 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {deleting ? (
              <>
                <span style={{
                  width: 14, height: 14,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.65s linear infinite',
                }} />
                Deleting…
              </>
            ) : 'Delete Forever'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Forms Sidebar ────────────────────────────────────────────────────────────

function FormsSidebar({ forms, selectedFormId, onSelectForm, navigate, loading, onCopyLink, onDelete }) {
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
                  padding: '12px 12px 12px 16px',
                  background: selected ? '#0f1117' : 'transparent',
                  borderLeft: `3px solid ${selected ? '#00d4ff' : 'transparent'}`,
                  borderBottom: '1px solid #0f1117',
                  cursor: 'pointer', transition: 'background 0.1s',
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                }}
                onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = '#0c0c14' }}
                onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Text content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: form.is_active !== false ? '#10b981' : '#ef4444',
                    }} />
                    <p style={{
                      fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
                      color: selected ? '#f8fafc' : '#e2e8f0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flex: 1, minWidth: 0, margin: 0,
                    }}>
                      {form.title || 'Untitled Form'}
                    </p>
                  </div>
                  {form.is_active === false && (
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#ef4444', marginBottom: '2px' }}>
                      Revoked
                    </p>
                  )}
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
                    {form.submissionCount} response{form.submissionCount !== 1 ? 's' : ''}
                  </p>
                  {form.created_at && (
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#334155' }}>
                      {new Date(form.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0, paddingTop: '2px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCopyLink(form.id) }}
                    title="Copy form link"
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#00d4ff'; e.currentTarget.style.background = 'rgba(0,212,255,0.08)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent' }}
                    style={{
                      background: 'transparent', border: 'none',
                      borderRadius: '5px', padding: '5px',
                      color: '#475569', cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                      transition: 'color 0.15s, background 0.15s',
                    }}
                  >
                    <Link2 size={13} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(form) }}
                    title="Delete form"
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent' }}
                    style={{
                      background: 'transparent', border: 'none',
                      borderRadius: '5px', padding: '5px',
                      color: '#475569', cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                      transition: 'color 0.15s, background 0.15s',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
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

// ─── Form Settings ────────────────────────────────────────────────────────────

function FormSettings({ form, onUpdateForm }) {
  const [confirming, setConfirming] = useState(false)
  const [maxInput, setMaxInput]     = useState(
    form.max_submissions != null ? String(form.max_submissions) : ''
  )
  const [saving, setSaving] = useState(false)

  const [privacyOpen, setPrivacyOpen]       = useState(false)
  const [privacyMode, setPrivacyMode]       = useState(form.is_private ? 'private' : 'public')
  const [privacyPw, setPrivacyPw]           = useState('')
  const [showPrivacyPw, setShowPrivacyPw]   = useState(false)
  const [savingPrivacy, setSavingPrivacy]   = useState(false)

  const isActive = form.is_active !== false

  const savePrivacy = async () => {
    const newPrivate = privacyMode === 'private'
    if (newPrivate && !privacyPw && !form.is_private) {
      toast.error('Enter a password for the private form')
      return
    }
    setSavingPrivacy(true)
    const updates = {
      is_private:    newPrivate,
      form_password: newPrivate ? (privacyPw || form.form_password) : null,
    }
    onUpdateForm(form.id, updates)
    const { error } = await supabase.from('forms').update(updates).eq('id', form.id)
    if (error) {
      toast.error('Failed to update privacy settings')
      onUpdateForm(form.id, { is_private: form.is_private, form_password: form.form_password })
    } else {
      toast.success(newPrivate ? 'Form is now private' : 'Form is now public')
      setPrivacyPw('')
      setPrivacyOpen(false)
    }
    setSavingPrivacy(false)
  }

  const toggleActive = async () => {
    if (!confirming) { setConfirming(true); return }
    setConfirming(false)
    const newActive = !isActive
    onUpdateForm(form.id, { is_active: newActive })
    const { error } = await supabase.from('forms').update({ is_active: newActive }).eq('id', form.id)
    if (error) {
      toast.error('Failed to update form')
      onUpdateForm(form.id, { is_active: isActive })
    } else {
      toast.success(newActive ? 'Form link reactivated' : 'Form link revoked')
    }
  }

  const saveLimit = async () => {
    const trimmed = maxInput.trim()
    const val = trimmed === '' ? null : parseInt(trimmed, 10)
    if (trimmed !== '' && (isNaN(val) || val < 1)) {
      toast.error('Enter a valid number or leave empty for no limit')
      return
    }
    setSaving(true)
    onUpdateForm(form.id, { max_submissions: val })
    const { error } = await supabase.from('forms').update({ max_submissions: val }).eq('id', form.id)
    if (error) {
      toast.error('Failed to save limit')
    } else {
      toast.success(val != null ? `Limit set to ${val} submissions` : 'Submission limit removed')
    }
    setSaving(false)
  }

  return (
    <div style={{
      padding: '10px 24px',
      borderBottom: '1px solid #1e2130',
      background: '#080810',
      display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      flexShrink: 0,
    }}>
      {/* Revoke / Activate */}
      {!confirming ? (
        <button
          onClick={toggleActive}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = isActive ? '#ef4444' : '#10b981'
            e.currentTarget.style.color = isActive ? '#ef4444' : '#10b981'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isActive ? '#334155' : '#1e2130'
            e.currentTarget.style.color = isActive ? '#94a3b8' : '#10b981'
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'transparent',
            border: `1px solid ${isActive ? '#334155' : '#1e2130'}`,
            borderRadius: '6px', padding: '5px 12px',
            color: isActive ? '#94a3b8' : '#10b981',
            fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 500,
            cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
          }}
        >
          {isActive ? <XCircle size={13} /> : <CheckCircle size={13} />}
          {isActive ? 'Revoke Link' : 'Reactivate Link'}
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#94a3b8' }}>
            {isActive ? 'Revoke this form link?' : 'Reactivate this form?'}
          </span>
          <button
            onClick={toggleActive}
            style={{
              background: isActive ? '#ef4444' : '#10b981',
              border: 'none', borderRadius: '6px', padding: '5px 12px',
              color: '#fff', fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Confirm
          </button>
          <button
            onClick={() => setConfirming(false)}
            style={{
              background: 'transparent', border: '1px solid #1e2130',
              borderRadius: '6px', padding: '5px 10px',
              color: '#64748b', fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div style={{ width: 1, height: 24, background: '#1e2130', flexShrink: 0 }} />

      {/* Privacy indicator */}
      <button
        onClick={() => setPrivacyOpen(!privacyOpen)}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = form.is_private ? '#f59e0b' : '#64748b')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'transparent', border: '1px solid #1e2130',
          borderRadius: '6px', padding: '5px 12px',
          color: form.is_private ? '#f59e0b' : '#64748b',
          fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 500,
          cursor: 'pointer', transition: 'border-color 0.15s',
        }}
      >
        {form.is_private ? <Lock size={12} /> : <Globe size={12} />}
        {form.is_private ? 'Private' : 'Public'}
      </button>

      {/* Privacy modal */}
      {privacyOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && setPrivacyOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div style={{
            background: '#0f1117', border: '1px solid #1e2130',
            borderRadius: '12px', padding: '20px',
            width: '100%', maxWidth: '280px',
            boxShadow: '0 16px 60px rgba(0,0,0,0.6)',
          }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 500, color: '#f8fafc', marginBottom: '12px' }}>
              Form visibility
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {[
                { mode: 'public',  Icon: Globe, label: 'Public',  col: '#00d4ff' },
                { mode: 'private', Icon: Lock,  label: 'Private', col: '#f59e0b' },
              ].map(({ mode, Icon, label, col }) => {
                const sel = privacyMode === mode
                return (
                  <button
                    key={mode}
                    onClick={() => setPrivacyMode(mode)}
                    style={{
                      flex: 1, borderRadius: '6px', padding: '7px',
                      fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: sel ? `rgba(${mode === 'private' ? '245,158,11' : '0,212,255'},0.1)` : '#0a0a0f',
                      border: `1px solid ${sel ? col : '#1e2130'}`,
                      color: sel ? col : '#64748b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    }}
                  >
                    <Icon size={12} /> {label}
                  </button>
                )
              })}
            </div>

            {privacyMode === 'private' && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: '#0a0a0f', border: '1px solid #1e2130',
                  borderRadius: '6px', overflow: 'hidden',
                }}>
                  <input
                    type={showPrivacyPw ? 'text' : 'password'}
                    value={privacyPw}
                    onChange={(e) => setPrivacyPw(e.target.value)}
                    placeholder={form.is_private ? 'New password (blank = keep)' : 'Set a password'}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      padding: '8px 10px', color: '#f8fafc',
                      fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPrivacyPw(!showPrivacyPw)}
                    style={{
                      background: 'transparent', border: 'none',
                      padding: '0 8px', color: '#64748b', cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPrivacyPw ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPrivacyOpen(false)}
                style={{
                  flex: 1, background: 'transparent', border: '1px solid #1e2130',
                  borderRadius: '6px', padding: '8px',
                  color: '#64748b', fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={savePrivacy}
                disabled={savingPrivacy}
                style={{
                  flex: 2, background: '#00d4ff', border: 'none',
                  borderRadius: '6px', padding: '8px',
                  color: '#0a0a0f', fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px', fontWeight: 700,
                  cursor: savingPrivacy ? 'default' : 'pointer',
                  opacity: savingPrivacy ? 0.7 : 1,
                }}
              >
                {savingPrivacy ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ width: 1, height: 24, background: '#1e2130', flexShrink: 0 }} />

      {/* Submission limit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
          Submission limit
        </span>
        <input
          type="number"
          min="1"
          value={maxInput}
          onChange={(e) => setMaxInput(e.target.value)}
          placeholder="No limit"
          onFocus={(e) => (e.currentTarget.style.borderColor = '#00d4ff')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
          style={{
            width: '80px', background: '#0f1117',
            border: '1px solid #1e2130', borderRadius: '6px',
            padding: '5px 10px', color: '#f8fafc',
            fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
            outline: 'none', transition: 'border-color 0.15s',
          }}
        />
        <button
          onClick={saveLimit}
          disabled={saving}
          onMouseEnter={(e) => !saving && (e.currentTarget.style.borderColor = '#00d4ff')}
          onMouseLeave={(e) => !saving && (e.currentTarget.style.borderColor = '#1e2130')}
          style={{
            background: 'transparent', border: '1px solid #1e2130',
            borderRadius: '6px', padding: '5px 12px',
            color: '#00d4ff', fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px', fontWeight: 500, cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.6 : 1, transition: 'border-color 0.15s',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ─── Mobile Submissions View ──────────────────────────────────────────────────

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

// ─── Mobile Accordion Card ───────────────────────────────────────────────────

function MobileAccordionCard({ form, expanded, onToggle, onCopyLink, onDelete, onUpdateForm }) {
  const [submissions, setSubmissions]   = useState([])
  const [subsLoading, setSubsLoading]   = useState(false)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const cardRef = useRef(null)

  useEffect(() => {
    if (!expanded) return
    setSubsLoading(true)
    setSearch('')
    setStatusFilter('All')
    supabase
      .from('submissions')
      .select('*')
      .eq('form_id', form.id)
      .order('submitted_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error('Failed to load submissions')
        else setSubmissions(data || [])
        setSubsLoading(false)
      })
    setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        window.scrollTo({ top: window.pageYOffset + rect.top - 60, behavior: 'smooth' })
      }
    }, 50)
  }, [expanded, form.id])

  const handleStatusUpdate = async (subId, newStatus) => {
    setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, status: newStatus } : s))
    const { error } = await supabase
      .from('submissions').update({ status: newStatus }).eq('id', subId)
    if (error) toast.error('Failed to update status')
  }

  return (
    <div
      ref={cardRef}
      style={{
        background: '#0f1117',
        border: '1px solid #1e2130',
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
      }}
    >
      {/* Always-visible header row */}
      <div
        onClick={onToggle}
        style={{
          padding: 16, display: 'flex', alignItems: 'center',
          gap: 10, cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: form.is_active !== false ? '#10b981' : '#ef4444',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#f8fafc',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0,
          }}>
            {form.title || 'Untitled Form'}
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            {form.submissionCount} response{form.submissionCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onCopyLink(form.id) }}
          title="Copy form link"
          onMouseEnter={(e) => { e.currentTarget.style.color = '#00d4ff'; e.currentTarget.style.background = 'rgba(0,212,255,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent' }}
          style={{
            background: 'transparent', border: 'none', borderRadius: 6,
            padding: 6, color: '#64748b', cursor: 'pointer',
            display: 'flex', alignItems: 'center', flexShrink: 0,
            transition: 'color 0.15s, background 0.15s',
          }}
        >
          <Link2 size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(form) }}
          title="Delete form"
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent' }}
          style={{
            background: 'transparent', border: 'none', borderRadius: 6,
            padding: 6, color: '#64748b', cursor: 'pointer',
            display: 'flex', alignItems: 'center', flexShrink: 0,
            transition: 'color 0.15s, background 0.15s',
          }}
        >
          <Trash2 size={14} />
        </button>
        <ChevronDown
          size={16}
          color="#64748b"
          style={{
            flexShrink: 0,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}
        />
      </div>

      {/* Expandable body — max-height transition for smooth open */}
      <div style={{
        maxHeight: expanded ? 2000 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
      }}>
        {expanded && (
          <div style={{ borderTop: '1px solid #1e2130' }}>
            {/* Search */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2130' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#0a0a0f', border: '1px solid #1e2130',
                borderRadius: 8, padding: '0 12px',
              }}>
                <Search size={13} color="#475569" style={{ flexShrink: 0 }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search submissions…"
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: '#f8fafc', fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13, padding: '8px 0', width: '100%',
                  }}
                />
              </div>
            </div>

            {/* Status filter + Export CSV */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e2130', display: 'flex', gap: 8 }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  flex: 1, background: '#0a0a0f', border: '1px solid #1e2130',
                  borderRadius: 8, padding: '7px 10px',
                  color: '#94a3b8', fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12, outline: 'none', cursor: 'pointer',
                }}
              >
                {['All', ...STATUS_CYCLE].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ExportMenu form={form} submissions={submissions} />
            </div>

            {/* Form settings (revoke, privacy, limit) */}
            <FormSettings key={form.id} form={form} onUpdateForm={onUpdateForm} />

            {/* Stats */}
            <StatsRow submissions={submissions} mobile />

            {/* Submissions list */}
            <MobileSubmissionsView
              form={form}
              submissions={submissions}
              search={search}
              statusFilter={statusFilter}
              onStatusUpdate={handleStatusUpdate}
              loading={subsLoading}
            />

            {/* Collapse button */}
            <button
              onClick={onToggle}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                borderTop: '1px solid #1e2130', padding: '14px 16px',
                color: '#64748b', fontFamily: 'DM Sans, sans-serif', fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, transition: 'color 0.15s',
              }}
            >
              <ChevronUp size={14} /> Collapse
            </button>
          </div>
        )}
      </div>
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
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)
  const [mobileExpandedId, setMobileExpandedId] = useState(null)

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

  const updateForm = (formId, updates) => {
    setForms(prev => prev.map(f => f.id === formId ? { ...f, ...updates } : f))
  }

  const handleCopyLink = (formId) => {
    const url = `https://www.tusk.ink/form/${formId}`
    navigator.clipboard.writeText(url).catch(() => {})
    toast.success('Link copied!')
  }

  const deleteForm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('submissions').delete().eq('form_id', deleteTarget.id)
    const { error } = await supabase.from('forms').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error('Failed to delete form')
      setDeleting(false)
      return
    }
    setForms(prev => prev.filter(f => f.id !== deleteTarget.id))
    if (selectedFormId === deleteTarget.id) {
      setSelectedFormId(null)
      setSubmissions([])
    }
    setDeleteTarget(null)
    setDeleting(false)
    toast.success('Form deleted')
  }

  // ── Mobile layout ─────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ background: '#0a0a0f', minHeight: 'calc(100vh - 64px)' }}>

        {/* Sticky header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: '#0a0a0f', borderBottom: '1px solid #1e2130',
          padding: '12px 16px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontSize: 11, color: '#64748b',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            My Forms
          </span>
          <button
            onClick={() => navigate('/builder')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#00d4ff', border: 'none', borderRadius: 6,
              padding: '5px 12px', color: '#0a0a0f',
              fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={12} /> New Form
          </button>
        </div>

        {/* Accordion list */}
        <div style={{ padding: '12px 16px', paddingBottom: 40 }}>
          {formsLoading ? (
            <Spinner />
          ) : forms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px' }}>
              <BarChart2 size={40} color="#1e2130" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, color: '#475569', marginBottom: 8 }}>
                No forms yet
              </p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#334155', marginBottom: 20 }}>
                Build your first form to start collecting feedback
              </p>
              <button
                onClick={() => navigate('/builder')}
                style={{
                  background: 'transparent', border: '1px solid #00d4ff',
                  borderRadius: 8, padding: '10px 20px',
                  color: '#00d4ff', fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                Create your first form →
              </button>
            </div>
          ) : (
            forms.map(form => (
              <MobileAccordionCard
                key={form.id}
                form={form}
                expanded={mobileExpandedId === form.id}
                onToggle={() => setMobileExpandedId(mobileExpandedId === form.id ? null : form.id)}
                onCopyLink={handleCopyLink}
                onDelete={setDeleteTarget}
                onUpdateForm={updateForm}
              />
            ))
          )}
        </div>

        {deleteTarget && (
          <DeleteModal
            form={deleteTarget}
            onConfirm={deleteForm}
            onCancel={() => setDeleteTarget(null)}
            deleting={deleting}
          />
        )}
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
        onCopyLink={handleCopyLink}
        onDelete={setDeleteTarget}
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
              submissions={submissions}
              onCopyLink={() => handleCopyLink(selectedForm.id)}
            />
            <FormSettings key={selectedForm.id} form={selectedForm} onUpdateForm={updateForm} />
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

      {deleteTarget && (
        <DeleteModal
          form={deleteTarget}
          onConfirm={deleteForm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  )
}
