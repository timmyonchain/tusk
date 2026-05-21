import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-hot-toast'
import QRCode from 'qrcode'
import {
  Star, Upload, Link as LinkIcon, Share2, Copy,
  CheckCircle, ChevronDown, ChevronUp, Lock, Eye, EyeOff, X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'

// ─── Brand kit helpers ────────────────────────────────────────────────────────

function isLight(hex) {
  if (!hex || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
}

function loadFont(name) {
  if (!name || name === 'DM Sans' || name === 'Syne') return
  const id = `gfont-${name.toLowerCase().replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/\s+/g, '+')}:wght@400;500;700&display=swap`
  document.head.appendChild(link)
}

// ─── Shared input style (uses CSS vars — falls back to defaults when no brand kit) ─

const INPUT = {
  width: '100%',
  background: "var(--brand-surface, #0f1117)",
  borderRadius: '8px',
  color: "var(--brand-text, #f8fafc)",
  fontFamily: "var(--brand-font, 'DM Sans'), sans-serif",
  fontSize: '14px',
  padding: '12px 16px',
  outline: 'none',
  boxSizing: 'border-box',
  display: 'block',
  transition: 'border-color 0.15s',
}

// ─── QR Code canvas ───────────────────────────────────────────────────────────

function QRCodeCanvas({ url }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !url) return
    QRCode.toCanvas(ref.current, url, {
      width: 120,
      margin: 1,
      color: { dark: '#00d4ff', light: '#0f1117' },
    }).catch(() => {})
  }, [url])

  return (
    <canvas ref={ref} style={{ borderRadius: '8px', border: '1px solid #1e2130' }} />
  )
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRatingField({ field, value, onChange, primaryColor = '#00d4ff' }) {
  const [hovered, setHovered] = useState(0)
  const count = field.maxStars || 5

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {Array.from({ length: count }).map((_, i) => {
        const n = i + 1
        const active = n <= (hovered || value || 0)
        return (
          <Star
            key={i}
            size={32}
            color={active ? primaryColor : '#475569'}
            fill={active ? primaryColor : '#1e2130'}
            style={{ cursor: 'pointer', transition: 'color 0.1s, fill 0.1s' }}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
          />
        )
      })}
    </div>
  )
}

// ─── File Dropzone ────────────────────────────────────────────────────────────

function FileDropzoneField({ field, value, onChange, error, formId, fieldId }) {
  const [uploading, setUploading] = useState(false)

  const fmtSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const onDrop = async (files) => {
    const file = files[0]
    if (!file) return
    setUploading(true)
    const filePath = `uploads/${formId}/${fieldId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })
    if (uploadError) {
      toast.error('File upload failed. Please try again.')
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath)
    onChange({ url: urlData.publicUrl, name: file.name, size: file.size, type: file.type })
    setUploading(false)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop,
    disabled: uploading,
  })

  // Success state
  if (value?.url) {
    return (
      <div style={{
        border: '2px dashed #10b981',
        borderRadius: '8px', padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'rgba(16,185,129,0.04)',
      }}>
        <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "var(--brand-font, 'DM Sans'), sans-serif", fontSize: '14px',
            color: "var(--brand-text, #f8fafc)", margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {value.name}
          </p>
          <p style={{ fontFamily: "var(--brand-font, 'DM Sans'), sans-serif", fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
            {fmtSize(value.size)}
          </p>
        </div>
        <button
          onClick={() => onChange(null)}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          style={{
            background: 'transparent', border: 'none', padding: '4px',
            color: '#64748b', cursor: 'pointer', display: 'flex',
            alignItems: 'center', borderRadius: '4px', transition: 'color 0.15s',
          }}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  // Uploading state
  if (uploading) {
    return (
      <div style={{
        border: '2px dashed #1e2130', borderRadius: '8px',
        padding: '32px 24px', textAlign: 'center',
      }}>
        <span style={{
          width: 28, height: 28,
          border: '3px solid #1e2130', borderTopColor: 'var(--brand-primary, #00d4ff)',
          borderRadius: '50%', display: 'inline-block',
          animation: 'spin 0.65s linear infinite', marginBottom: '12px',
        }} />
        <p style={{ color: '#64748b', fontSize: '14px', fontFamily: "var(--brand-font, 'DM Sans'), sans-serif", margin: 0 }}>
          Uploading...
        </p>
      </div>
    )
  }

  // Default dropzone
  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${isDragActive ? 'var(--brand-primary, #00d4ff)' : error ? '#ef4444' : '#1e2130'}`,
        borderRadius: '8px', padding: '32px 24px', textAlign: 'center',
        cursor: 'pointer',
        background: isDragActive ? 'rgba(0,212,255,0.04)' : 'transparent',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <input {...getInputProps()} />
      <Upload
        size={28}
        color={isDragActive ? 'var(--brand-primary, #00d4ff)' : '#64748b'}
        style={{ margin: '0 auto 12px', display: 'block' }}
      />
      <p style={{ color: '#64748b', fontSize: '14px', fontFamily: "var(--brand-font, 'DM Sans'), sans-serif", margin: 0 }}>
        Drop file here or click to upload
      </p>
    </div>
  )
}

// ─── URL Field ────────────────────────────────────────────────────────────────

function URLField({ field, value, onChange, onClearError, error }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{
      display: 'flex',
      background: "var(--brand-surface, #0f1117)",
      border: `1px solid ${error ? '#ef4444' : focused ? 'var(--brand-primary, #00d4ff)' : '#1e2130'}`,
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      <div style={{
        padding: '0 14px',
        display: 'flex', alignItems: 'center',
        borderRight: '1px solid #1e2130', flexShrink: 0,
      }}>
        <LinkIcon size={14} color="#64748b" />
      </div>
      <input
        type="url"
        value={value || ''}
        placeholder={field.placeholder || 'https://'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => { onChange(e.target.value); onClearError() }}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          padding: '12px 16px', color: "var(--brand-text, #f8fafc)",
          fontFamily: "var(--brand-font, 'DM Sans'), sans-serif", fontSize: '14px',
        }}
      />
    </div>
  )
}

// ─── Field Renderer ───────────────────────────────────────────────────────────

function FieldRenderer({ field, value, onChange, error, onClearError, formId, primaryColor = '#00d4ff' }) {
  const border = `1px solid ${error ? '#ef4444' : '#1e2130'}`

  const onFocus = (e) => (e.currentTarget.style.borderColor = error ? '#ef4444' : 'var(--brand-primary, #00d4ff)')
  const onBlur  = (e) => (e.currentTarget.style.borderColor = error ? '#ef4444' : '#1e2130')

  switch (field.type) {
    case 'short-text':
      return (
        <input
          type="text"
          value={value || ''}
          placeholder={field.placeholder || ''}
          onFocus={onFocus} onBlur={onBlur}
          onChange={(e) => { onChange(e.target.value); onClearError() }}
          style={{ ...INPUT, border }}
        />
      )

    case 'long-text':
      return (
        <textarea
          rows={4}
          value={value || ''}
          placeholder={field.placeholder || ''}
          onFocus={onFocus} onBlur={onBlur}
          onChange={(e) => { onChange(e.target.value); onClearError() }}
          style={{ ...INPUT, border, resize: 'vertical' }}
        />
      )

    case 'dropdown':
      return (
        <select
          value={value || ''}
          onFocus={onFocus} onBlur={onBlur}
          onChange={(e) => { onChange(e.target.value); onClearError() }}
          style={{ ...INPUT, border, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
        >
          <option value="" disabled>Select an option…</option>
          {field.options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      )

    case 'checkboxes': {
      const checked = value || []
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {field.options.map((opt, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={checked.includes(opt)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...checked, opt]
                    : checked.filter((o) => o !== opt)
                  onChange(next)
                  onClearError()
                }}
                style={{ accentColor: primaryColor, width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ fontFamily: "var(--brand-font, 'DM Sans'), sans-serif", fontSize: '14px', color: "var(--brand-text, #f8fafc)" }}>
                {opt}
              </span>
            </label>
          ))}
        </div>
      )
    }

    case 'star-rating':
      return (
        <StarRatingField
          field={field}
          value={value}
          onChange={(v) => { onChange(v); onClearError() }}
          primaryColor={primaryColor}
        />
      )

    case 'file-upload':
      return (
        <FileDropzoneField
          field={field}
          value={value}
          onChange={(v) => { onChange(v); onClearError() }}
          error={error}
          formId={formId}
          fieldId={field.id}
        />
      )

    case 'url':
      return (
        <URLField
          field={field}
          value={value}
          onChange={onChange}
          onClearError={onClearError}
          error={error}
        />
      )

    case 'number':
      return (
        <input
          type="number"
          value={value || ''}
          placeholder={field.placeholder || '0'}
          onFocus={onFocus} onBlur={onBlur}
          onChange={(e) => { onChange(e.target.value); onClearError() }}
          style={{ ...INPUT, border }}
        />
      )

    default:
      return null
  }
}

// ─── Share Bar ────────────────────────────────────────────────────────────────

function ShareBar({ url }) {
  const [open, setOpen]     = useState(false)
  const [copied, setCopied] = useState(false)
  const isMobile            = useIsMobile()

  const copyLink = () => {
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      marginBottom: '40px',
      background: "var(--brand-surface, #0f1117)",
      border: '1px solid #1e2130',
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: 'transparent', border: 'none',
          padding: '11px 16px',
          display: 'flex', alignItems: 'center', gap: '8px',
          cursor: 'pointer', color: '#64748b',
        }}
      >
        <Share2 size={14} color="#64748b" />
        <span style={{ fontFamily: "var(--brand-font, 'DM Sans'), sans-serif", fontSize: '13px', color: '#64748b' }}>
          Share this form
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          {open
            ? <ChevronUp size={14} color="#475569" />
            : <ChevronDown size={14} color="#475569" />
          }
        </span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #1e2130', padding: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexDirection: isMobile ? 'column' : 'row' }}>
            <input
              readOnly
              value={url}
              style={{
                flex: 1, background: '#0a0a0f',
                border: '1px solid #1e2130', borderRadius: '6px',
                padding: '8px 12px', color: '#94a3b8',
                fontFamily: "var(--brand-font, 'DM Sans'), sans-serif", fontSize: '12px',
                outline: 'none',
              }}
            />
            <button
              onClick={copyLink}
              style={{
                background: copied ? 'rgba(0,212,255,0.12)' : 'transparent',
                border: `1px solid ${copied ? '#00d4ff' : '#1e2130'}`,
                borderRadius: '6px', padding: '8px 14px',
                color: copied ? '#00d4ff' : '#64748b',
                fontFamily: "var(--brand-font, 'DM Sans'), sans-serif", fontSize: '12px',
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                width: isMobile ? '100%' : undefined,
              }}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
            <QRCodeCanvas url={url} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Submission Receipt ───────────────────────────────────────────────────────

function BlobReceipt({ receiptId, timestamp }) {
  const [copied, setCopied] = useState(false)

  const copyReceiptId = () => {
    navigator.clipboard.writeText(receiptId).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background: '#0f1117',
      border: '1px solid rgba(0,212,255,0.4)',
      borderRadius: '12px',
      padding: '24px',
      marginTop: '32px',
      textAlign: 'left',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <CheckCircle size={14} color="#00d4ff" />
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 600, color: '#00d4ff', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Submission Receipt
        </span>
        <span style={{ marginLeft: 'auto', background: 'rgba(0,212,255,0.1)', color: '#00d4ff', fontSize: '10px', padding: '2px 10px', borderRadius: '999px', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
          Stored
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
          Receipt ID
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <code style={{ fontFamily: 'monospace', fontSize: '12px', color: '#00d4ff', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(0,212,255,0.06)', padding: '6px 10px', borderRadius: '6px', display: 'block' }}>
            {receiptId}
          </code>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={copyReceiptId}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#00d4ff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              style={{ background: 'transparent', border: 'none', padding: '6px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            >
              <Copy size={14} />
            </button>
            {copied && (
              <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '4px', background: '#1e2130', color: '#94a3b8', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                Copied!
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1e2130', paddingTop: '16px' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Received at</p>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#94a3b8' }}>
          {new Date(timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

// ─── Password Gate ────────────────────────────────────────────────────────────

function PasswordGateScreen({ form, onUnlock }) {
  const [pw, setPw]           = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [shaking, setShaking] = useState(false)

  const handleAccess = () => {
    if (pw === form.form_password) {
      onUnlock()
    } else {
      toast.error('Incorrect password. Please try again.')
      setShaking(true)
      setTimeout(() => setShaking(false), 600)
      setPw('')
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '40px 24px' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px', color: '#00d4ff', letterSpacing: '0.15em' }}>
          TUSK
        </span>
      </div>

      <div style={{ background: '#0f1117', border: '1px solid #1e2130', borderRadius: '16px', padding: '40px 32px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Lock size={24} color="#00d4ff" />
        </div>

        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.4rem', color: '#f8fafc', marginBottom: '8px' }}>
          This form is private
        </h2>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#64748b', marginBottom: '28px', lineHeight: 1.6 }}>
          Enter the password to access this form
        </p>

        <div style={{ display: 'flex', alignItems: 'center', background: '#0a0a0f', border: '1px solid #1e2130', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', animation: shaking ? 'shake 0.5s ease' : 'none' }}>
          <input
            type={showPw ? 'text' : 'password'}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAccess()}
            placeholder="Enter password"
            autoFocus
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '12px 16px', color: '#f8fafc', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' }}
          />
          <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'transparent', border: 'none', padding: '0 14px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button
          onClick={handleAccess}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          style={{ width: '100%', background: '#00d4ff', border: 'none', borderRadius: '8px', padding: '14px', color: '#0a0a0f', fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }}
        >
          Access Form →
        </button>
      </div>
    </div>
  )
}

// ─── Closed / Limit Screens ───────────────────────────────────────────────────

function ClosedScreen() {
  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: '52px', lineHeight: 1 }}>😔</div>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.6rem', color: '#f8fafc', marginBottom: 0 }}>
        Submissions Closed
      </h2>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#64748b', lineHeight: 1.6, maxWidth: '360px', margin: 0 }}>
        This form is no longer accepting responses.
      </p>
    </div>
  )
}

function LimitReachedScreen() {
  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: '52px', lineHeight: 1 }}>😔</div>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.6rem', color: '#f8fafc', marginBottom: 0 }}>
        Submission Limit Reached
      </h2>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#64748b', lineHeight: 1.6, maxWidth: '360px', margin: 0 }}>
        This form has reached its maximum number of submissions.
      </p>
    </div>
  )
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ receiptId, onReset, navigate }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: '8px' }}>
      <div style={{ display: 'inline-block', animation: 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards', marginBottom: '28px' }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="38" stroke="#00d4ff" strokeWidth="1.5" />
          <circle cx="40" cy="40" r="38" fill="rgba(0,212,255,0.06)" />
          <path d="M 23 40 L 35 52 L 57 28" stroke="#00d4ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" strokeDashoffset="100" style={{ animation: 'drawCheck 0.45s 0.35s ease forwards' }} />
        </svg>
      </div>

      <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.8rem', color: '#f8fafc', marginBottom: '10px' }}>
        Response Submitted
      </h2>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>
        Your response has been received and securely stored.
      </p>

      <BlobReceipt receiptId={receiptId} timestamp={new Date().toISOString()} />

      <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={onReset}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#64748b')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
          style={{ background: 'transparent', border: '1px solid #1e2130', borderRadius: '8px', padding: '12px 24px', color: '#f8fafc', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'border-color 0.15s' }}
        >
          Submit another response
        </button>
        <button
          onClick={() => navigate('/builder')}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#475569' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#1e2130' }}
          style={{ background: 'transparent', border: '1px solid #1e2130', borderRadius: '8px', padding: '12px 24px', color: '#475569', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s' }}
        >
          View all forms
        </button>
      </div>
    </div>
  )
}

// ─── Form View Page ───────────────────────────────────────────────────────────

export default function FormView() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const isMobile                        = useIsMobile()
  const [form, setForm]                 = useState(null)
  const [loading, setLoading]           = useState(true)
  const [notFound, setNotFound]         = useState(false)
  const [formClosed, setFormClosed]     = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [unlocked, setUnlocked]         = useState(false)
  const [answers, setAnswers]           = useState({})
  const [errors, setErrors]             = useState([])
  const [submitting, setSubmitting]     = useState(false)
  const [submitted, setSubmitted]       = useState(false)
  const [receiptId, setReceiptId]       = useState('')

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return }

    if (id === 'preview') {
      const found = JSON.parse(localStorage.getItem('tusk_preview') || 'null')
      if (found) { setForm({ ...found, id: 'preview' }) }
      else { setNotFound(true) }
      setLoading(false)
      return
    }

    async function fetchForm() {
      const { data, error } = await supabase.from('forms').select('*').eq('id', id).single()
      if (error || !data) { setNotFound(true); setLoading(false); return }

      if (data.is_active === false) { setForm(data); setFormClosed(true); setLoading(false); return }

      if (data.max_submissions != null) {
        const { count } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('form_id', id)
        if (count >= data.max_submissions) { setForm(data); setLimitReached(true); setLoading(false); return }
      }

      setForm(data)
      setLoading(false)
    }

    fetchForm()
  }, [id])

  // Load brand font when form arrives
  useEffect(() => {
    const font = form?.brand_kit?.font_family
    if (font) loadFont(font)
  }, [form?.brand_kit?.font_family])

  const setAnswer  = (fieldId, val) => setAnswers((prev) => ({ ...prev, [fieldId]: val }))
  const clearError = (fieldId) => setErrors((prev) => prev.filter(id => id !== fieldId))

  const handleSubmit = async () => {
    const missingFields = (form.fields || []).filter(f => f.required && !answers[f.id])
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields')
      setErrors(missingFields.map(f => f.id))
      return
    }

    setSubmitting(true)

    try {
      const receipt = crypto.randomUUID()

      if (id === 'preview') {
        setReceiptId(receipt)
        setSubmitted(true)
        return
      }

      const { error } = await supabase
        .from('submissions')
        .insert({
          form_id:    form.id,
          answers:    answers,
          receipt_id: receipt,
          status:     'Open',
        })

      if (error) {
        console.error('Submission error:', error)
        toast.error('Failed to submit. Please try again.')
        return
      }

      setReceiptId(receipt)
      setSubmitted(true)

    } catch (err) {
      console.error('Unexpected error:', err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setAnswers({})
    setErrors([])
    setSubmitted(false)
    setReceiptId('')
    setSubmitting(false)
  }

  const shareUrl = `${window.location.origin}/form/${id}`

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 32, height: 32, border: '3px solid #1e2130', borderTopColor: '#00d4ff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.65s linear infinite' }} />
      </div>
    )
  }

  if (formClosed) return <ClosedScreen />
  if (limitReached) return <LimitReachedScreen />
  if (form?.is_private && !unlocked) return <PasswordGateScreen form={form} onUnlock={() => setUnlocked(true)} />

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#0f1117', border: '1px solid #1e2130', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '22px', color: '#475569' }}>⚠</span>
        </div>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', color: '#64748b', maxWidth: '320px', lineHeight: 1.6 }}>
          Form not found or has been removed.
        </p>
        <button
          onClick={() => navigate('/builder')}
          style={{ background: '#00d4ff', border: 'none', borderRadius: '8px', padding: '12px 28px', color: '#0a0a0f', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
        >
          Go to Builder
        </button>
      </div>
    )
  }

  // ── Brand kit values (computed after early returns — not hooks) ─────────────
  const kit          = form?.brand_kit || null
  const primaryColor = kit?.primary_color    || '#00d4ff'
  const bgColor      = kit?.background_color || undefined
  const fontFamily   = kit?.font_family      || 'DM Sans'
  const radius       = kit?.button_radius    ?? 8
  const btnTextColor = isLight(primaryColor) ? '#0a0a0f' : '#f8fafc'
  const headingFont  = kit ? `${fontFamily}, sans-serif` : 'Syne, sans-serif'
  const bodyFont     = kit ? `${fontFamily}, sans-serif` : 'DM Sans, sans-serif'

  const kitVars = kit ? {
    '--brand-primary': primaryColor,
    '--brand-bg':      kit.background_color || '#0a0a0f',
    '--brand-surface': kit.surface_color    || '#0f1117',
    '--brand-text':    kit.text_color       || '#f8fafc',
    '--brand-font':    fontFamily,
    '--brand-radius':  `${radius}px`,
  } : {}

  const showBranding = kit?.show_tusk_branding !== false

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: bgColor, ...kitVars }}>

      {/* Full-width banner header */}
      {kit?.header_style === 'banner' && !submitted && (
        <div style={{ background: primaryColor, padding: isMobile ? '28px 20px 24px' : '40px 24px 32px' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            {kit.logo_url && (
              <img src={kit.logo_url} alt="Logo" style={{ height: 36, marginBottom: 14, objectFit: 'contain', display: 'block' }} />
            )}
            <h1 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: isMobile ? '1.5rem' : '2rem', color: btnTextColor, margin: 0 }}>
              {form.title || 'Untitled Form'}
            </h1>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: isMobile ? '32px 16px 60px' : '60px 24px 80px' }}>

        {/* Header — minimal and centered styles */}
        {!submitted && kit?.header_style !== 'banner' && (
          <div style={{ marginBottom: '40px', textAlign: kit?.header_style === 'centered' ? 'center' : 'left' }}>
            {kit?.logo_url && (
              <img
                src={kit.logo_url} alt="Logo"
                style={{
                  height: 40, objectFit: 'contain',
                  display: 'block',
                  margin: kit?.header_style === 'centered' ? '0 auto 20px' : '0 0 16px',
                }}
              />
            )}
            <h1 style={{
              fontFamily: headingFont, fontWeight: 700,
              fontSize: isMobile ? '1.5rem' : '2rem',
              color: 'var(--brand-text, #f8fafc)', marginBottom: '10px',
            }}>
              {form.title || 'Untitled Form'}
            </h1>
            {showBranding && (
              <p style={{
                fontFamily: bodyFont, fontSize: '13px',
                color: 'var(--brand-text, #475569)', opacity: 0.5,
                marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
                justifyContent: kit?.header_style === 'centered' ? 'center' : 'flex-start',
              }}>
                Powered by TUSK
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: primaryColor, display: 'inline-block', flexShrink: 0 }} />
                Responses securely stored
              </p>
            )}
            <div style={{ height: 1, background: primaryColor, opacity: 0.3 }} />
          </div>
        )}

        {/* After banner: subtitle + divider */}
        {!submitted && kit?.header_style === 'banner' && (
          <div style={{ marginBottom: '32px' }}>
            {showBranding && (
              <p style={{ fontFamily: bodyFont, fontSize: '13px', color: 'var(--brand-text, #475569)', opacity: 0.45, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                Powered by TUSK
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: primaryColor, display: 'inline-block', flexShrink: 0 }} />
                Responses securely stored
              </p>
            )}
            <div style={{ height: 1, background: primaryColor, opacity: 0.3 }} />
          </div>
        )}

        {/* Default header — no brand kit */}
        {!submitted && !kit && (
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: isMobile ? '1.5rem' : '2rem', color: '#f8fafc', marginBottom: '10px' }}>
              {form.title || 'Untitled Form'}
            </h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#475569', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              Powered by TUSK
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d4ff', display: 'inline-block', flexShrink: 0 }} />
              Responses securely stored
            </p>
            <div style={{ height: 1, background: 'rgba(0,212,255,0.3)' }} />
          </div>
        )}

        {/* Success or form */}
        {submitted ? (
          <SuccessScreen receiptId={receiptId} onReset={reset} navigate={navigate} />
        ) : (
          <>
            <ShareBar url={shareUrl} />

            {(form.fields || []).map((field) => (
              <div key={field.id} style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block',
                  fontFamily: bodyFont,
                  fontSize: '15px', fontWeight: 500,
                  color: 'var(--brand-text, #f8fafc)', marginBottom: '10px',
                }}>
                  {field.label}
                  {field.required && (
                    <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                  )}
                </label>

                <FieldRenderer
                  field={field}
                  value={answers[field.id]}
                  onChange={(val) => setAnswer(field.id, val)}
                  error={errors.includes(field.id)}
                  onClearError={() => clearError(field.id)}
                  formId={id}
                  primaryColor={primaryColor}
                />

                {errors.includes(field.id) && (
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>
                    This field is required
                  </p>
                )}
              </div>
            ))}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              onMouseEnter={(e) => !submitting && (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => !submitting && (e.currentTarget.style.opacity = '1')}
              style={{
                width: '100%', background: primaryColor, border: 'none',
                borderRadius: radius,
                padding: '16px',
                minHeight: isMobile ? 52 : undefined,
                color: btnTextColor, fontFamily: bodyFont,
                fontSize: '16px', fontWeight: 700,
                cursor: submitting ? 'default' : 'pointer',
                opacity: submitting ? 0.8 : 1,
                transition: 'opacity 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              }}
            >
              {submitting ? (
                <>
                  <span style={{
                    width: 18, height: 18,
                    border: `2.5px solid ${isLight(primaryColor) ? 'rgba(10,10,15,0.3)' : 'rgba(248,250,252,0.3)'}`,
                    borderTopColor: btnTextColor,
                    borderRadius: '50%', display: 'inline-block',
                    animation: 'spin 0.65s linear infinite',
                  }} />
                  Storing your response…
                </>
              ) : (
                'Submit Response →'
              )}
            </button>

            {/* Brand footer */}
            {kit && (kit.custom_footer_text || showBranding) && (
              <div style={{ marginTop: 48, textAlign: 'center' }}>
                {kit.custom_footer_text && (
                  <p style={{ fontFamily: bodyFont, fontSize: 12, color: 'var(--brand-text, #64748b)', opacity: 0.5, marginBottom: 4 }}>
                    {kit.custom_footer_text}
                  </p>
                )}
                {showBranding && (
                  <p style={{ fontFamily: bodyFont, fontSize: 11, color: 'var(--brand-text, #64748b)', opacity: 0.3, letterSpacing: '0.05em' }}>
                    Built with TUSK
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
