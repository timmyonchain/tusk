import { useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  Type, AlignLeft, ChevronDown, CheckSquare, Star, Upload, Link, Hash,
  FileText, GripVertical, Trash2, X, Plus, Eye,
} from 'lucide-react'

// ─── Field type registry ──────────────────────────────────────────────────────

const FIELD_TYPES = [
  { type: 'short-text',  label: 'Short Text',  icon: Type },
  { type: 'long-text',   label: 'Long Text',   icon: AlignLeft },
  { type: 'dropdown',    label: 'Dropdown',    icon: ChevronDown },
  { type: 'checkboxes',  label: 'Checkboxes',  icon: CheckSquare },
  { type: 'star-rating', label: 'Star Rating', icon: Star },
  { type: 'file-upload', label: 'File Upload', icon: Upload },
  { type: 'url',         label: 'URL',         icon: Link },
  { type: 'number',      label: 'Number',      icon: Hash },
]

const TEMPLATE_NAMES = ['Bug Report', 'Feature Request', 'Survey', 'Hackathon Application', 'Creator Application', 'User Feedback', 'Event Registration', 'Job Application']

let _fid = 0
const makeField = (type, label, opts = {}) => ({
  id: `f_${Date.now()}_${++_fid}`,
  type,
  label,
  placeholder: opts.placeholder ?? '',
  required:    opts.required    ?? false,
  options:     opts.options     ?? [],
  maxStars:    opts.maxStars    ?? 5,
  acceptedTypes: opts.acceptedTypes ?? [],
})

const TEMPLATE_FIELDS = {
  'Bug Report': () => [
    makeField('short-text',  'Title',               { required: true }),
    makeField('long-text',   'Description',          { required: true }),
    makeField('dropdown',    'Severity',             { required: true, options: ['Low', 'Medium', 'High', 'Critical'] }),
    makeField('long-text',   'Steps to Reproduce'),
    makeField('file-upload', 'Screenshot'),
    makeField('short-text',  'Your Wallet Address'),
  ],
  'Feature Request': () => [
    makeField('short-text',  'Feature Title',       { required: true }),
    makeField('long-text',   'Problem it Solves',   { required: true }),
    makeField('star-rating', 'Priority'),
    makeField('long-text',   'Additional Context'),
    makeField('short-text',  'Your Wallet Address'),
  ],
  'Survey': () => [
    makeField('short-text',  'Name'),
    makeField('star-rating', 'Overall Satisfaction', { required: true }),
    makeField('long-text',   'What did you like?'),
    makeField('long-text',   'What can be improved?'),
    makeField('dropdown',    'Recommend to others?', { options: ['Yes', 'No', 'Maybe'] }),
  ],
  'Hackathon Application': () => [
    makeField('short-text',  'Project Name',        { required: true }),
    makeField('short-text',  'Team Name'),
    makeField('long-text',   'Project Description', { required: true }),
    makeField('url',         'Demo URL',            { required: true }),
    makeField('url',         'Repo URL',            { required: true }),
    makeField('dropdown',    'Track',               { required: true, options: ['Builder Tools', 'DeFi', 'Gaming', 'Other'] }),
    makeField('url',         'Video Link'),
    makeField('short-text',  'Wallet Address',      { required: true }),
  ],
  'Creator Application': () => [
    makeField('short-text',  'Full Name',                          { required: true }),
    makeField('short-text',  'Email',                             { required: true }),
    makeField('url',         'Twitter/X Handle'),
    makeField('url',         'Portfolio or Website'),
    makeField('long-text',   'Why do you want to collaborate?',   { required: true }),
    makeField('long-text',   'What can you bring to the table?',  { required: true }),
    makeField('dropdown',    'Type of collaboration',             { required: true, options: ['Sponsored Content', 'Co-creation', 'Shoutout', 'Other'] }),
  ],
  'User Feedback': () => [
    makeField('short-text',  'Name'),
    makeField('short-text',  'Email'),
    makeField('star-rating', 'How would you rate your experience?', { required: true }),
    makeField('long-text',   'What did you enjoy most?'),
    makeField('long-text',   'What can we improve?',              { required: true }),
    makeField('dropdown',    'Would you recommend us?',           { required: true, options: ['Definitely', 'Maybe', 'Probably Not'] }),
    makeField('long-text',   'Any other thoughts?'),
  ],
  'Event Registration': () => [
    makeField('short-text',  'Full Name',                { required: true }),
    makeField('short-text',  'Email',                   { required: true }),
    makeField('short-text',  'Phone Number'),
    makeField('dropdown',    'How did you hear about us?', { options: ['Twitter', 'Instagram', 'Friend', 'Other'] }),
    makeField('short-text',  'Dietary requirements'),
    makeField('number',      'Number of tickets',        { required: true }),
    makeField('long-text',   'Special requests'),
  ],
  'Job Application': () => [
    makeField('short-text',  'Full Name',                { required: true }),
    makeField('short-text',  'Email',                   { required: true }),
    makeField('short-text',  'Position applying for',   { required: true }),
    makeField('url',         'LinkedIn Profile'),
    makeField('url',         'Portfolio/GitHub'),
    makeField('number',      'Years of experience',     { required: true }),
    makeField('long-text',   'Tell us about yourself',  { required: true }),
    makeField('long-text',   'Why do you want this role?', { required: true }),
    makeField('file-upload', 'Resume/CV',               { required: true }),
  ],
}

const getTypeInfo = (type) => FIELD_TYPES.find(ft => ft.type === type)

const reorder = (list, fromId, toId) => {
  const from = list.findIndex(f => f.id === fromId)
  const to   = list.findIndex(f => f.id === toId)
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// ─── Shared style tokens ──────────────────────────────────────────────────────

const S = {
  panelInput: {
    width: '100%',
    background: '#0a0a0f',
    border: '1px solid #1e2130',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#f8fafc',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    display: 'block',
  },
  previewInput: {
    width: '100%',
    background: 'transparent',
    border: '1px solid #1e2130',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#475569',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '13px',
    outline: 'none',
    cursor: 'default',
    boxSizing: 'border-box',
  },
  sectionHeader: {
    fontFamily: 'Syne, sans-serif',
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    margin: 0,
  },
  panelLabel: {
    display: 'block',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '11px',
    color: '#64748b',
    marginBottom: '6px',
  },
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  return (
    <div
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: value ? '#00d4ff' : '#1e2130',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2,
        left: value ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: '#f8fafc', transition: 'left 0.2s',
      }} />
    </div>
  )
}

// ─── Field preview (read-only input representation) ───────────────────────────

function FieldPreview({ field }) {
  const opts = field.options.length ? field.options : ['Option 1', 'Option 2']

  switch (field.type) {
    case 'short-text':
      return <input disabled placeholder={field.placeholder || 'Short answer…'} style={S.previewInput} />

    case 'long-text':
      return <textarea disabled rows={3} placeholder={field.placeholder || 'Long answer…'} style={{ ...S.previewInput, resize: 'none', display: 'block' }} />

    case 'dropdown':
      return (
        <select disabled style={{ ...S.previewInput, appearance: 'none', WebkitAppearance: 'none' }}>
          <option>{field.placeholder || 'Select an option…'}</option>
          {field.options.map((o, i) => <option key={i}>{o}</option>)}
        </select>
      )

    case 'checkboxes':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {opts.slice(0, 3).map((o, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'default' }}>
              <input type="checkbox" disabled style={{ accentColor: '#00d4ff' }} />
              <span style={{ color: '#475569', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>{o}</span>
            </label>
          ))}
        </div>
      )

    case 'star-rating':
      return (
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: field.maxStars || 5 }).map((_, i) => (
            <Star key={i} size={20} color="#64748b" />
          ))}
        </div>
      )

    case 'file-upload':
      return (
        <div style={{ border: '1px dashed #1e2130', borderRadius: 8, padding: '20px', textAlign: 'center' }}>
          <Upload size={18} color="#64748b" style={{ margin: '0 auto 8px', display: 'block' }} />
          <p style={{ color: '#64748b', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
            Drop files here or click to upload
          </p>
        </div>
      )

    case 'url':
      return (
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #1e2130', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '0 10px', display: 'flex', alignItems: 'center', borderRight: '1px solid #1e2130', alignSelf: 'stretch' }}>
            <Link size={13} color="#64748b" />
          </div>
          <input disabled placeholder={field.placeholder || 'https://'} style={{ ...S.previewInput, border: 'none', flex: 1 }} />
        </div>
      )

    case 'number':
      return <input type="number" disabled placeholder={field.placeholder || '0'} style={S.previewInput} />

    default:
      return null
  }
}

// ─── Field card (canvas item) ─────────────────────────────────────────────────

function FieldCard({ field, isSelected, onSelect, onDelete, onUpdate, onDragStart, onDragOver, onDrop }) {
  const [hovered, setHovered] = useState(false)
  const info = getTypeInfo(field.type)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#0a0a0f',
        border: `1px solid ${isSelected ? '#00d4ff' : hovered ? '#2d3748' : '#1e2130'}`,
        borderRadius: '10px',
        padding: '16px 20px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        userSelect: 'none',
      }}
    >
      {/* Header row: handle · label · required star · type badge · delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <GripVertical size={15} color="#475569" style={{ flexShrink: 0, cursor: 'grab' }} />

        <input
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Field label"
          style={{
            background: 'transparent', border: 'none',
            color: '#f8fafc', fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px', fontWeight: 500,
            padding: 0, flexGrow: 1, minWidth: 0,
            outline: 'none', cursor: 'text', userSelect: 'text',
          }}
        />

        {field.required && (
          <span style={{ color: '#ef4444', fontSize: '14px', flexShrink: 0, lineHeight: 1 }}>*</span>
        )}

        <span style={{
          background: 'rgba(0,212,255,0.08)',
          color: '#00d4ff', fontSize: '10px',
          padding: '2px 8px', borderRadius: '999px',
          fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
          flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          {info?.label}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
          style={{
            background: 'transparent', border: 'none',
            color: '#475569', cursor: 'pointer',
            padding: '2px', display: 'flex', alignItems: 'center',
            flexShrink: 0, transition: 'color 0.15s',
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Preview — pointer-events off so it doesn't intercept card clicks */}
      <div style={{ pointerEvents: 'none' }}>
        <FieldPreview field={field} />
      </div>
    </div>
  )
}

// ─── Left sidebar ─────────────────────────────────────────────────────────────

function LeftSidebar({ onAddField, onLoadTemplate }) {
  const [hoveredType, setHoveredType]         = useState(null)
  const [hoveredTemplate, setHoveredTemplate] = useState(null)

  return (
    <aside style={{
      width: 260, flexShrink: 0,
      background: '#0f1117',
      borderRight: '1px solid #1e2130',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '20px 14px' }}>
        <p style={{ ...S.sectionHeader, marginBottom: '12px' }}>Add Fields</p>

        {/* 2-col field type grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px' }}>
          {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => onAddField(type)}
              onMouseEnter={() => setHoveredType(type)}
              onMouseLeave={() => setHoveredType(null)}
              style={{
                background: '#0a0a0f',
                border: `1px solid ${hoveredType === type ? '#00d4ff' : '#1e2130'}`,
                borderRadius: '8px', padding: '12px 8px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '6px',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
            >
              <Icon size={18} color="#00d4ff" />
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: '11px',
                color: '#94a3b8', textAlign: 'center', lineHeight: 1.2,
              }}>
                {label}
              </span>
            </button>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #1e2130', marginBottom: '20px' }} />

        <p style={{ ...S.sectionHeader, marginBottom: '10px' }}>Templates</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {TEMPLATE_NAMES.map((name) => (
            <button
              key={name}
              onClick={() => onLoadTemplate(name)}
              onMouseEnter={() => setHoveredTemplate(name)}
              onMouseLeave={() => setHoveredTemplate(null)}
              style={{
                width: '100%', background: 'transparent',
                border: `1px solid ${hoveredTemplate === name ? '#64748b' : '#1e2130'}`,
                borderRadius: '8px', padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: '8px',
                cursor: 'pointer', textAlign: 'left',
                transition: 'border-color 0.15s',
              }}
            >
              <FileText size={14} color="#64748b" style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#94a3b8' }}>
                {name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

// ─── Right settings panel ─────────────────────────────────────────────────────

function RightPanel({ field, onUpdate }) {
  if (!field) {
    return (
      <aside style={{
        width: 280, flexShrink: 0,
        background: '#0f1117',
        borderLeft: '1px solid #1e2130',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '24px',
      }}>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
          color: '#475569', textAlign: 'center', lineHeight: 1.6,
        }}>
          Select a field to edit its settings
        </p>
      </aside>
    )
  }

  const hidePlaceholder = ['star-rating', 'checkboxes', 'file-upload'].includes(field.type)
  const hasOptions      = ['dropdown', 'checkboxes'].includes(field.type)

  return (
    <aside style={{
      width: 280, flexShrink: 0,
      background: '#0f1117',
      borderLeft: '1px solid #1e2130',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '20px 16px' }}>
        <p style={{ ...S.sectionHeader, marginBottom: '20px' }}>Field Settings</p>

        {/* Label */}
        <div style={{ marginBottom: '14px' }}>
          <label style={S.panelLabel}>Field Label</label>
          <input value={field.label} onChange={(e) => onUpdate({ label: e.target.value })} style={S.panelInput} />
        </div>

        {/* Placeholder */}
        {!hidePlaceholder && (
          <div style={{ marginBottom: '14px' }}>
            <label style={S.panelLabel}>Placeholder text</label>
            <input value={field.placeholder} onChange={(e) => onUpdate({ placeholder: e.target.value })} style={S.panelInput} />
          </div>
        )}

        {/* Required */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#94a3b8' }}>
            Required field
          </span>
          <Toggle value={field.required} onChange={(val) => onUpdate({ required: val })} />
        </div>

        <div style={{ borderTop: '1px solid #1e2130', marginBottom: '16px' }} />

        {/* Options — dropdown & checkboxes */}
        {hasOptions && (
          <div style={{ marginBottom: '16px' }}>
            <label style={S.panelLabel}>Options</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
              {field.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...field.options]
                      next[i] = e.target.value
                      onUpdate({ options: next })
                    }}
                    style={{ ...S.panelInput, flexGrow: 1, width: 'auto' }}
                  />
                  <button
                    onClick={() => onUpdate({ options: field.options.filter((_, idx) => idx !== i) })}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                    style={{
                      background: 'transparent', border: 'none',
                      color: '#475569', cursor: 'pointer',
                      padding: '4px', display: 'flex', alignItems: 'center',
                      flexShrink: 0, transition: 'color 0.15s',
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => onUpdate({ options: [...field.options, `Option ${field.options.length + 1}`] })}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#64748b'; e.currentTarget.style.color = '#94a3b8' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e2130'; e.currentTarget.style.color = '#64748b' }}
              style={{
                width: '100%', background: 'transparent',
                border: '1px dashed #1e2130', borderRadius: '6px',
                padding: '7px 12px', color: '#64748b',
                fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '6px', transition: 'border-color 0.15s, color 0.15s',
              }}
            >
              <Plus size={12} />
              Add Option
            </button>
          </div>
        )}

        {/* Max Stars */}
        {field.type === 'star-rating' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={S.panelLabel}>Max Stars</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => onUpdate({ maxStars: n })}
                  style={{
                    flex: 1, borderRadius: '6px', padding: '7px',
                    fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: field.maxStars === n ? 'rgba(0,212,255,0.12)' : '#0a0a0f',
                    border: `1px solid ${field.maxStars === n ? '#00d4ff' : '#1e2130'}`,
                    color: field.maxStars === n ? '#00d4ff' : '#64748b',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Accepted types */}
        {field.type === 'file-upload' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={S.panelLabel}>Accepted types</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Images', 'Videos', 'Documents'].map((t) => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={field.acceptedTypes.includes(t)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...field.acceptedTypes, t]
                        : field.acceptedTypes.filter((x) => x !== t)
                      onUpdate({ acceptedTypes: next })
                    }}
                    style={{ accentColor: '#00d4ff', cursor: 'pointer' }}
                  />
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#94a3b8' }}>{t}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

// ─── Builder page ─────────────────────────────────────────────────────────────

export default function Builder() {
  const [formTitle, setFormTitle]           = useState('')
  const [fields, setFields]                 = useState([])
  const [selectedFieldId, setSelectedFieldId] = useState(null)
  const [draggedId, setDraggedId]           = useState(null)

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null

  const addField = (type) => {
    const field = makeField(type, getTypeInfo(type)?.label ?? type)
    if (type === 'dropdown' || type === 'checkboxes') field.options = ['Option 1', 'Option 2']
    setFields((prev) => [...prev, field])
    setSelectedFieldId(field.id)
  }

  const loadTemplate = (name) => {
    const tfields = TEMPLATE_FIELDS[name]?.()
    if (!tfields) return
    setFields(tfields)
    setFormTitle(name)
    setSelectedFieldId(null)
  }

  const updateField = (id, changes) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...changes } : f)))
  }

  const deleteField = (id) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
    if (selectedFieldId === id) setSelectedFieldId(null)
  }

  const publish = () => {
    const id   = `form_${Date.now()}`
    const form = { id, title: formTitle || 'Untitled Form', fields, createdAt: new Date().toISOString() }
    const existing = JSON.parse(localStorage.getItem('tusk_forms') || '[]')
    localStorage.setItem('tusk_forms', JSON.stringify([...existing, form]))
    const url = `http://localhost:5173/form/${id}`
    navigator.clipboard.writeText(url).catch(() => {})
    toast.success('🎉 Form published! Link copied to clipboard')
  }

  const preview = () => {
    localStorage.setItem('tusk_preview', JSON.stringify({ title: formTitle, fields }))
    window.open('/form/preview', '_blank')
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      <LeftSidebar onAddField={addField} onLoadTemplate={loadTemplate} />

      {/* ── Center canvas ── */}
      <div style={{
        flexGrow: 1, background: '#0f1117',
        display: 'flex', flexDirection: 'column',
        minWidth: 0, overflow: 'hidden',
      }}>
        {/* Top bar */}
        <div style={{
          height: 56, padding: '0 24px',
          borderBottom: '1px solid #1e2130',
          display: 'flex', alignItems: 'center', gap: '12px',
          flexShrink: 0,
        }}>
          <input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Untitled Form"
            style={{
              background: 'transparent', border: 'none',
              color: '#f8fafc', fontFamily: 'Syne, sans-serif',
              fontSize: '18px', fontWeight: 700,
              outline: 'none', flexGrow: 1, minWidth: 0,
            }}
          />

          <button
            onClick={preview}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#64748b')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
            style={{
              background: 'transparent', border: '1px solid #1e2130',
              color: '#f8fafc', fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px', fontWeight: 500,
              borderRadius: '8px', padding: '7px 14px',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: '6px', flexShrink: 0, transition: 'border-color 0.15s',
            }}
          >
            <Eye size={14} />
            Preview
          </button>

          <button
            onClick={publish}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            style={{
              background: '#00d4ff', border: 'none',
              color: '#0a0a0f', fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px', fontWeight: 700,
              borderRadius: '8px', padding: '7px 18px',
              cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.15s',
            }}
          >
            Publish →
          </button>
        </div>

        {/* Field canvas (scrolls independently) */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }}>
          {fields.length === 0 ? (
            <div style={{
              height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                border: '1.5px dashed #1e2130', borderRadius: '16px',
                padding: '52px 48px', textAlign: 'center', maxWidth: '380px',
              }}>
                <p style={{
                  fontFamily: 'Syne, sans-serif', fontSize: '15px',
                  color: '#475569', margin: 0, lineHeight: 1.6,
                }}>
                  Add fields from the left panel<br />or pick a template
                </p>
              </div>
            </div>
          ) : (
            <div
              style={{ maxWidth: '640px', margin: '0 auto' }}
              onDragEnd={() => setDraggedId(null)}
            >
              {fields.map((field) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  isSelected={selectedFieldId === field.id}
                  onSelect={() => setSelectedFieldId(field.id)}
                  onDelete={() => deleteField(field.id)}
                  onUpdate={(changes) => updateField(field.id, changes)}
                  onDragStart={() => setDraggedId(field.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedId && draggedId !== field.id) {
                      setFields((prev) => reorder(prev, draggedId, field.id))
                    }
                    setDraggedId(null)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <RightPanel
        field={selectedField}
        onUpdate={(changes) => selectedField && updateField(selectedField.id, changes)}
      />
    </div>
  )
}
