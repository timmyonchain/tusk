import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  Type, AlignLeft, ChevronDown, CheckSquare, Star, Upload, Link, Hash,
  FileText, GripVertical, Trash2, X, Plus, Eye, EyeOff, Globe, Lock, Palette,
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

const TEMPLATES = {
  'Bug Report': {
    title: 'Bug Report',
    fields: [
      { id: 'f1', type: 'short-text',  label: 'Title',              placeholder: 'Brief title of the bug',        required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f2', type: 'long-text',   label: 'Description',        placeholder: 'Describe the bug in detail',    required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f3', type: 'dropdown',    label: 'Severity',           placeholder: '',                              required: true,  options: ['Low', 'Medium', 'High', 'Critical'], maxStars: 5, acceptedTypes: [] },
      { id: 'f4', type: 'long-text',   label: 'Steps to Reproduce', placeholder: '1. Go to… 2. Click…',          required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f5', type: 'file-upload', label: 'Screenshot',         placeholder: '',                              required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f6', type: 'short-text',  label: 'Your Email',         placeholder: 'your@email.com',               required: false, options: [], maxStars: 5, acceptedTypes: [] },
    ],
  },
  'Feature Request': {
    title: 'Feature Request',
    fields: [
      { id: 'f1', type: 'short-text',  label: 'Feature Title',      placeholder: 'Name your feature idea',        required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f2', type: 'long-text',   label: 'Problem it Solves',  placeholder: 'What problem does this solve?', required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f3', type: 'star-rating', label: 'Priority',           placeholder: '',                              required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f4', type: 'long-text',   label: 'Additional Context', placeholder: 'Any extra details or examples', required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f5', type: 'short-text',  label: 'Your Email',         placeholder: 'your@email.com',               required: false, options: [], maxStars: 5, acceptedTypes: [] },
    ],
  },
  'Survey': {
    title: 'Survey',
    fields: [
      { id: 'f1', type: 'short-text',  label: 'Name',                     placeholder: 'Your full name',                   required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f2', type: 'star-rating', label: 'Overall Satisfaction',      placeholder: '',                                 required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f3', type: 'long-text',   label: 'What did you like?',        placeholder: 'Tell us what went well',           required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f4', type: 'long-text',   label: 'What can be improved?',     placeholder: 'Be honest, we appreciate feedback',required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f5', type: 'dropdown',    label: 'Would you recommend us?',   placeholder: '',                                 required: true,  options: ['Definitely', 'Maybe', 'Probably Not'], maxStars: 5, acceptedTypes: [] },
    ],
  },
  'Hackathon Application': {
    title: 'Hackathon Application',
    fields: [
      { id: 'f1', type: 'short-text', label: 'Project Name',        placeholder: "What's your project called?",    required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f2', type: 'short-text', label: 'Team Name',           placeholder: 'Your team name',                 required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f3', type: 'long-text',  label: 'Project Description', placeholder: "Describe what you're building",  required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f4', type: 'url',        label: 'Demo URL',            placeholder: 'https://',                       required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f5', type: 'url',        label: 'Repository URL',      placeholder: 'https://github.com/…',           required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f6', type: 'dropdown',   label: 'Track',               placeholder: '',                               required: true,  options: ['Builder Tools', 'DeFi', 'Gaming', 'Other'], maxStars: 5, acceptedTypes: [] },
      { id: 'f7', type: 'url',        label: 'Video Link',          placeholder: 'https://youtube.com/…',          required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f8', type: 'short-text', label: 'Wallet Address',      placeholder: '0x…',                            required: true,  options: [], maxStars: 5, acceptedTypes: [] },
    ],
  },
  'Creator Application': {
    title: 'Creator Application',
    fields: [
      { id: 'f1', type: 'short-text', label: 'Full Name',                        placeholder: 'Your full name',             required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f2', type: 'short-text', label: 'Email',                            placeholder: 'your@email.com',             required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f3', type: 'url',        label: 'Twitter/X Handle',                 placeholder: 'https://x.com/…',            required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f4', type: 'url',        label: 'Portfolio or Website',             placeholder: 'https://',                   required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f5', type: 'long-text',  label: 'Why do you want to collaborate?',  placeholder: 'Tell us your motivation',    required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f6', type: 'long-text',  label: 'What can you bring to the table?', placeholder: 'Your skills, audience, value',required: true, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f7', type: 'dropdown',   label: 'Type of collaboration',            placeholder: '',                           required: true,  options: ['Sponsored Content', 'Co-creation', 'Shoutout', 'Other'], maxStars: 5, acceptedTypes: [] },
    ],
  },
  'User Feedback': {
    title: 'User Feedback',
    fields: [
      { id: 'f1', type: 'short-text',  label: 'Name',                                  placeholder: 'Your name (optional)',    required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f2', type: 'short-text',  label: 'Email',                                 placeholder: 'your@email.com',          required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f3', type: 'star-rating', label: 'How would you rate your experience?',   placeholder: '',                        required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f4', type: 'long-text',   label: 'What did you enjoy most?',              placeholder: 'What stood out to you?',  required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f5', type: 'long-text',   label: 'What can we improve?',                  placeholder: 'Be honest!',              required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f6', type: 'dropdown',    label: 'Would you recommend us?',               placeholder: '',                        required: true,  options: ['Definitely', 'Maybe', 'Probably Not'], maxStars: 5, acceptedTypes: [] },
    ],
  },
  'Event Registration': {
    title: 'Event Registration',
    fields: [
      { id: 'f1', type: 'short-text', label: 'Full Name',                  placeholder: 'Your full name',        required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f2', type: 'short-text', label: 'Email',                      placeholder: 'your@email.com',        required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f3', type: 'short-text', label: 'Phone Number',               placeholder: '+1 234 567 8900',       required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f4', type: 'dropdown',   label: 'How did you hear about us?', placeholder: '',                      required: false, options: ['Twitter', 'Instagram', 'Friend', 'Other'], maxStars: 5, acceptedTypes: [] },
      { id: 'f5', type: 'short-text', label: 'Dietary Requirements',       placeholder: 'Vegan, allergies, etc.',required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f6', type: 'number',     label: 'Number of Tickets',          placeholder: '1',                     required: true,  options: [], maxStars: 5, acceptedTypes: [] },
    ],
  },
  'Job Application': {
    title: 'Job Application',
    fields: [
      { id: 'f1', type: 'short-text',  label: 'Full Name',              placeholder: 'Your full name',                         required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f2', type: 'short-text',  label: 'Email',                  placeholder: 'your@email.com',                         required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f3', type: 'short-text',  label: 'Position Applying For',  placeholder: 'e.g. Frontend Developer',                required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f4', type: 'url',         label: 'LinkedIn Profile',       placeholder: 'https://linkedin.com/in/…',              required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f5', type: 'url',         label: 'Portfolio / GitHub',     placeholder: 'https://github.com/…',                   required: false, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f6', type: 'number',      label: 'Years of Experience',    placeholder: '3',                                      required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f7', type: 'long-text',   label: 'Tell us about yourself', placeholder: 'Brief intro about who you are',           required: true,  options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f8', type: 'long-text',   label: 'Why do you want this role?', placeholder: 'What excites you about this position?',required: true, options: [], maxStars: 5, acceptedTypes: [] },
      { id: 'f9', type: 'file-upload', label: 'Resume / CV',            placeholder: '',                                       required: true,  options: [], maxStars: 5, acceptedTypes: [] },
    ],
  },
}

// ─── Brand kit constants ──────────────────────────────────────────────────────

const DEFAULT_BRAND_KIT = {
  logo_url:           null,
  primary_color:      '#00d4ff',
  background_color:   '#0a0a0f',
  surface_color:      '#0f1117',
  text_color:         '#f8fafc',
  font_family:        'DM Sans',
  button_radius:      8,
  header_style:       'minimal',
  theme_preset:       null,
  show_tusk_branding: true,
  custom_footer_text: '',
}

const THEMES = [
  { name: 'TUSK',     primary_color: '#00d4ff', background_color: '#0a0a0f', surface_color: '#0f1117', text_color: '#f8fafc', font_family: 'DM Sans',          button_radius: 8  },
  { name: 'Midnight', primary_color: '#7c3aed', background_color: '#09090b', surface_color: '#18181b', text_color: '#fafafa', font_family: 'Inter',            button_radius: 8  },
  { name: 'Forest',   primary_color: '#10b981', background_color: '#0a0f0c', surface_color: '#0f1a14', text_color: '#f0fdf4', font_family: 'DM Sans',          button_radius: 12 },
  { name: 'Crimson',  primary_color: '#ef4444', background_color: '#0f0a0a', surface_color: '#1a0f0f', text_color: '#fef2f2', font_family: 'Syne',             button_radius: 4  },
  { name: 'Sand',     primary_color: '#d97706', background_color: '#fdf8f0', surface_color: '#fff7ed', text_color: '#1c1917', font_family: 'DM Sans',          button_radius: 12 },
  { name: 'Ocean',    primary_color: '#0ea5e9', background_color: '#0c1a2e', surface_color: '#112240', text_color: '#e2e8f0', font_family: 'Inter',            button_radius: 8  },
]

const FONTS = [
  'DM Sans', 'Inter', 'Syne', 'Outfit',
  'Space Grotesk', 'Manrope', 'Plus Jakarta Sans', 'Raleway',
]

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

// ─── Utilities ────────────────────────────────────────────────────────────────

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

// ─── Color picker ─────────────────────────────────────────────────────────────

function ColorPicker({ label, value, onChange }) {
  const ref = useRef(null)
  const safe = value || '#000000'

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.panelLabel}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        <div
          onClick={() => ref.current?.click()}
          style={{
            width: 32, height: 32, borderRadius: 6,
            background: safe, border: '1px solid #1e2130',
            cursor: 'pointer', flexShrink: 0,
          }}
        />
        <input
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...S.panelInput, flex: 1, fontFamily: 'monospace', fontSize: 11, display: 'block' }}
        />
        <input
          ref={ref}
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        />
      </div>
    </div>
  )
}

// ─── Field preview (read-only, used in canvas cards) ─────────────────────────

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

      <div style={{ pointerEvents: 'none' }}>
        <FieldPreview field={field} />
      </div>
    </div>
  )
}

// ─── Left sidebar ─────────────────────────────────────────────────────────────

function LeftSidebar({ onAddField, onLoadTemplate, mobile = false }) {
  const [hoveredType, setHoveredType]         = useState(null)
  const [hoveredTemplate, setHoveredTemplate] = useState(null)

  return (
    <aside style={{
      width: mobile ? '100%' : 260,
      flexShrink: mobile ? undefined : 0,
      background: '#0f1117',
      borderRight: mobile ? 'none' : '1px solid #1e2130',
      overflowY: mobile ? 'visible' : 'auto',
    }}>
      <div style={{ padding: '20px 14px' }}>
        <p style={{ ...S.sectionHeader, marginBottom: '12px' }}>Add Fields</p>

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
          {Object.keys(TEMPLATES).map((name) => (
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

function RightPanel({ field, onUpdate, mobile = false, onBack }) {
  if (!field) {
    return (
      <aside style={{
        width: mobile ? '100%' : 280,
        flexShrink: mobile ? undefined : 0,
        background: '#0f1117',
        borderLeft: mobile ? 'none' : '1px solid #1e2130',
        display: 'flex', flexDirection: 'column',
        alignItems: mobile ? undefined : 'center',
        justifyContent: mobile ? undefined : 'center',
        padding: '24px',
      }}>
        {mobile && onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#64748b', fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
              padding: 0, display: 'flex', alignItems: 'center', gap: '6px',
              marginBottom: '24px', alignSelf: 'flex-start',
            }}
          >
            ← Back to Canvas
          </button>
        )}
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
      width: mobile ? '100%' : 280,
      flexShrink: mobile ? undefined : 0,
      background: '#0f1117',
      borderLeft: mobile ? 'none' : '1px solid #1e2130',
      overflowY: mobile ? 'visible' : 'auto',
    }}>
      <div style={{ padding: '20px 16px' }}>
        {mobile && onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#64748b', fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
              padding: 0, display: 'flex', alignItems: 'center', gap: '6px',
              marginBottom: '20px',
            }}
          >
            ← Back to Canvas
          </button>
        )}
        <p style={{ ...S.sectionHeader, marginBottom: '20px' }}>Field Settings</p>

        <div style={{ marginBottom: '14px' }}>
          <label style={S.panelLabel}>Field Label</label>
          <input value={field.label} onChange={(e) => onUpdate({ label: e.target.value })} style={S.panelInput} />
        </div>

        {!hidePlaceholder && (
          <div style={{ marginBottom: '14px' }}>
            <label style={S.panelLabel}>Placeholder text</label>
            <input value={field.placeholder} onChange={(e) => onUpdate({ placeholder: e.target.value })} style={S.panelInput} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#94a3b8' }}>
            Required field
          </span>
          <Toggle value={field.required} onChange={(val) => onUpdate({ required: val })} />
        </div>

        <div style={{ borderTop: '1px solid #1e2130', marginBottom: '16px' }} />

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

// ─── Brand preview field renderer ─────────────────────────────────────────────

function renderFieldPreview(field, { surface, text, primary, font, mutedColor }) {
  const border = `1px solid rgba(${isLight(surface) ? '0,0,0,0.1' : '255,255,255,0.08'})`
  const input = {
    width: '100%', background: surface,
    border, borderRadius: 8, padding: '9px 12px',
    color: mutedColor, fontFamily: `${font}, sans-serif`,
    fontSize: 13, outline: 'none',
    boxSizing: 'border-box', cursor: 'default',
  }

  switch (field.type) {
    case 'short-text':
      return <input disabled placeholder={field.placeholder || 'Short answer…'} style={input} />
    case 'long-text':
      return <textarea disabled rows={2} placeholder={field.placeholder || 'Long answer…'} style={{ ...input, resize: 'none', display: 'block' }} />
    case 'dropdown':
      return (
        <select disabled style={{ ...input, appearance: 'none', WebkitAppearance: 'none' }}>
          <option>{field.placeholder || 'Select an option…'}</option>
        </select>
      )
    case 'checkboxes': {
      const opts = field.options.length ? field.options.slice(0, 3) : ['Option 1', 'Option 2']
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {opts.map((o, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'default' }}>
              <input type="checkbox" disabled style={{ accentColor: primary }} />
              <span style={{ color: mutedColor, fontSize: 12, fontFamily: `${font}, sans-serif` }}>{o}</span>
            </label>
          ))}
        </div>
      )
    }
    case 'star-rating':
      return (
        <div style={{ display: 'flex', gap: 5 }}>
          {Array.from({ length: field.maxStars || 5 }).map((_, i) => (
            <Star key={i} size={18} color={mutedColor} />
          ))}
        </div>
      )
    case 'file-upload':
      return (
        <div style={{ border: `1px dashed rgba(${isLight(surface) ? '0,0,0,0.15' : '255,255,255,0.1'})`, borderRadius: 8, padding: '14px', textAlign: 'center' }}>
          <Upload size={16} color={mutedColor} style={{ margin: '0 auto 5px', display: 'block' }} />
          <p style={{ color: mutedColor, fontSize: 11, fontFamily: `${font}, sans-serif`, margin: 0 }}>
            Drop files here or click to upload
          </p>
        </div>
      )
    case 'url':
      return (
        <div style={{ display: 'flex', alignItems: 'center', border, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '0 10px', display: 'flex', alignItems: 'center', borderRight: border, alignSelf: 'stretch' }}>
            <Link size={12} color={mutedColor} />
          </div>
          <input disabled placeholder="https://" style={{ ...input, border: 'none', flex: 1 }} />
        </div>
      )
    case 'number':
      return <input type="number" disabled placeholder="0" style={input} />
    default:
      return null
  }
}

// ─── Form preview (live brand kit preview) ────────────────────────────────────

function FormPreview({ form, kit }) {
  const bg          = kit.background_color || '#0a0a0f'
  const surface     = kit.surface_color    || '#0f1117'
  const primary     = kit.primary_color    || '#00d4ff'
  const text        = kit.text_color       || '#f8fafc'
  const font        = kit.font_family      || 'DM Sans'
  const radius      = kit.button_radius    ?? 8
  const headerStyle = kit.header_style     || 'minimal'
  const logoUrl     = kit.logo_url
  const btnText     = isLight(primary) ? '#0a0a0f' : '#f8fafc'
  const mutedColor  = isLight(bg)
    ? 'rgba(0,0,0,0.4)'
    : 'rgba(255,255,255,0.38)'

  const fields = (form.fields || []).slice(0, 4)

  return (
    <div style={{
      flexGrow: 1, background: '#060609',
      overflowY: 'auto', padding: '20px 24px 40px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Live preview badge */}
      <div style={{ width: '100%', maxWidth: 580, display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <span style={{
          background: 'rgba(0,212,255,0.08)', color: '#00d4ff',
          fontSize: 10, padding: '3px 10px', borderRadius: 999,
          fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Live Preview
        </span>
      </div>

      {/* Preview card */}
      <div style={{
        width: '100%', maxWidth: 580,
        background: bg, borderRadius: 16,
        border: `1px solid ${isLight(bg) ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
        overflow: 'hidden', fontFamily: `${font}, sans-serif`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>

        {/* Banner header */}
        {headerStyle === 'banner' && (
          <div style={{ background: primary, padding: '32px 32px 24px' }}>
            {logoUrl && (
              <img src={logoUrl} alt="Logo" style={{ height: 32, marginBottom: 12, objectFit: 'contain', display: 'block' }} />
            )}
            <h1 style={{ fontFamily: `${font}, sans-serif`, fontWeight: 700, fontSize: '1.4rem', color: btnText, margin: 0 }}>
              {form.title || 'Untitled Form'}
            </h1>
          </div>
        )}

        {/* Minimal / centered header */}
        {headerStyle !== 'banner' && (
          <div style={{ padding: '32px 32px 0', textAlign: headerStyle === 'centered' ? 'center' : 'left' }}>
            {logoUrl && (
              <img
                src={logoUrl} alt="Logo"
                style={{
                  height: 32, marginBottom: 14, objectFit: 'contain',
                  display: headerStyle === 'centered' ? 'block' : 'inline-block',
                  margin: headerStyle === 'centered' ? '0 auto 14px' : '0 0 14px',
                }}
              />
            )}
            <h1 style={{ fontFamily: `${font}, sans-serif`, fontWeight: 700, fontSize: '1.4rem', color: text, marginBottom: 6 }}>
              {form.title || 'Untitled Form'}
            </h1>
            <p style={{ fontFamily: `${font}, sans-serif`, fontSize: 12, color: mutedColor, marginBottom: 18 }}>
              Powered by TUSK · Responses securely stored
            </p>
            <div style={{ height: 1, background: primary, opacity: 0.25, marginBottom: 24 }} />
          </div>
        )}

        {/* Fields + submit */}
        <div style={{ padding: headerStyle === 'banner' ? '24px 32px 28px' : '0 32px 28px' }}>
          {headerStyle === 'banner' && (
            <p style={{ fontFamily: `${font}, sans-serif`, fontSize: 12, color: mutedColor, marginBottom: 20 }}>
              Powered by TUSK · Responses securely stored
            </p>
          )}

          {fields.length === 0 ? (
            <p style={{ color: mutedColor, fontFamily: `${font}, sans-serif`, fontSize: 13, fontStyle: 'italic' }}>
              Add fields in Build tab to see them here
            </p>
          ) : (
            fields.map((field) => (
              <div key={field.id} style={{ marginBottom: 18 }}>
                <label style={{
                  display: 'block', fontFamily: `${font}, sans-serif`,
                  fontSize: 13, fontWeight: 500, color: text, marginBottom: 6,
                }}>
                  {field.label}
                  {field.required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
                </label>
                {renderFieldPreview(field, { surface, text, primary, font, mutedColor })}
              </div>
            ))
          )}

          {fields.length > 0 && (
            <button disabled style={{
              marginTop: 8, width: '100%', background: primary,
              border: 'none', borderRadius: radius, padding: '12px',
              color: btnText, fontFamily: `${font}, sans-serif`,
              fontSize: 14, fontWeight: 700, cursor: 'default',
            }}>
              Submit Response →
            </button>
          )}

          {(kit.custom_footer_text || kit.show_tusk_branding !== false) && (
            <div style={{ marginTop: 18, textAlign: 'center' }}>
              {kit.custom_footer_text && (
                <p style={{ fontFamily: `${font}, sans-serif`, fontSize: 11, color: mutedColor, marginBottom: 3 }}>
                  {kit.custom_footer_text}
                </p>
              )}
              {kit.show_tusk_branding !== false && (
                <p style={{ fontFamily: `${font}, sans-serif`, fontSize: 10, color: mutedColor, letterSpacing: '0.05em', opacity: 0.7 }}>
                  Built with TUSK
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Brand kit panel ──────────────────────────────────────────────────────────

function BrandKitPanel({ kit, onChange, publishedFormId, onSave, saving, mobile = false }) {
  const logoRef             = useRef(null)
  const [logoUploading, setLogoUploading] = useState(false)

  const set = (key, val) => onChange({ ...kit, [key]: val, theme_preset: null })

  const applyTheme = (theme) => {
    const { name, ...rest } = theme
    onChange({ ...kit, ...rest, theme_preset: name })
    loadFont(theme.font_family)
  }

  const handleLogoFile = async (file) => {
    if (!publishedFormId || !file) return
    setLogoUploading(true)
    const ext = file.name.split('.').pop().toLowerCase()
    const filePath = `logos/${publishedFormId}/logo.${ext}`
    const { error } = await supabase.storage.from('uploads').upload(filePath, file, { cacheControl: '3600', upsert: true })
    if (error) { toast.error('Logo upload failed'); setLogoUploading(false); return }
    const { data } = supabase.storage.from('uploads').getPublicUrl(filePath)
    onChange({ ...kit, logo_url: data.publicUrl })
    setLogoUploading(false)
  }

  const divider = <div style={{ height: 1, background: '#1e2130', margin: '20px 0' }} />

  return (
    <aside style={{
      width: mobile ? '100%' : 380,
      flexShrink: mobile ? undefined : 0,
      background: '#0f1117',
      borderRight: mobile ? 'none' : '1px solid #1e2130',
      overflowY: mobile ? 'visible' : 'auto',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '20px', flex: 1 }}>

        {/* Quick themes */}
        <p style={{ ...S.sectionHeader, marginBottom: 12 }}>Quick Themes</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 4 }}>
          {THEMES.map((theme) => {
            const active = kit.theme_preset === theme.name
            return (
              <button
                key={theme.name}
                onClick={() => applyTheme(theme)}
                style={{
                  background: theme.background_color,
                  border: `2px solid ${active ? '#00d4ff' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 10, padding: '12px 8px',
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'border-color 0.15s', outline: 'none',
                }}
              >
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: theme.primary_color, margin: '0 auto 6px' }} />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: theme.text_color, fontWeight: 500 }}>
                  {theme.name}
                </span>
              </button>
            )
          })}
        </div>

        {divider}

        {/* Logo */}
        <p style={{ ...S.sectionHeader, marginBottom: 12 }}>Logo</p>
        {kit.logo_url ? (
          <div style={{
            background: '#0a0a0f', border: '1px solid #1e2130',
            borderRadius: 10, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4,
          }}>
            <img src={kit.logo_url} alt="Logo" style={{ height: 36, maxWidth: 120, objectFit: 'contain', borderRadius: 4 }} />
            <div style={{ flex: 1 }} />
            <button
              onClick={() => onChange({ ...kit, logo_url: null })}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, transition: 'color 0.15s' }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (!publishedFormId) { toast.error('Publish your form first to upload a logo'); return }
              logoRef.current?.click()
            }}
            disabled={logoUploading}
            onMouseEnter={(e) => { if (publishedFormId) e.currentTarget.style.borderColor = '#64748b' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e2130' }}
            style={{
              width: '100%', background: '#0a0a0f',
              border: '1px dashed #1e2130', borderRadius: 10,
              padding: '18px', cursor: publishedFormId ? 'pointer' : 'not-allowed',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
              opacity: logoUploading ? 0.6 : 1, transition: 'border-color 0.15s', marginBottom: 4,
            }}
          >
            {logoUploading ? (
              <>
                <span style={{ width: 18, height: 18, border: '2px solid #1e2130', borderTopColor: '#00d4ff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.65s linear infinite' }} />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#64748b' }}>Uploading…</span>
              </>
            ) : (
              <>
                <Upload size={16} color={publishedFormId ? '#64748b' : '#3a4154'} />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: publishedFormId ? '#64748b' : '#3a4154', textAlign: 'center' }}>
                  {publishedFormId ? 'Upload logo' : 'Publish form to upload logo'}
                </span>
              </>
            )}
          </button>
        )}
        <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && handleLogoFile(e.target.files[0])} />

        {divider}

        {/* Colors */}
        <p style={{ ...S.sectionHeader, marginBottom: 12 }}>Colors</p>
        <ColorPicker label="Primary"    value={kit.primary_color}    onChange={(v) => set('primary_color', v)} />
        <ColorPicker label="Background" value={kit.background_color} onChange={(v) => set('background_color', v)} />
        <ColorPicker label="Surface"    value={kit.surface_color}    onChange={(v) => set('surface_color', v)} />
        <ColorPicker label="Text"       value={kit.text_color}       onChange={(v) => set('text_color', v)} />

        {divider}

        {/* Typography */}
        <p style={{ ...S.sectionHeader, marginBottom: 12 }}>Typography</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 4 }}>
          {FONTS.map((f) => {
            const active = kit.font_family === f
            return (
              <button
                key={f}
                onClick={() => { set('font_family', f); loadFont(f) }}
                style={{
                  background: active ? 'rgba(0,212,255,0.08)' : '#0a0a0f',
                  border: `1px solid ${active ? '#00d4ff' : '#1e2130'}`,
                  borderRadius: 8, padding: '10px 12px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s', outline: 'none',
                }}
              >
                <span style={{
                  fontFamily: `${f}, sans-serif`, fontSize: 13,
                  color: active ? '#00d4ff' : '#94a3b8',
                  display: 'block', fontWeight: 500,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {f}
                </span>
              </button>
            )
          })}
        </div>

        {divider}

        {/* Button style */}
        <p style={{ ...S.sectionHeader, marginBottom: 12 }}>Button Style</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#64748b' }}>Corner Radius</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{kit.button_radius}px</span>
        </div>
        <input
          type="range" min={0} max={24} step={1}
          value={kit.button_radius}
          onChange={(e) => set('button_radius', parseInt(e.target.value))}
          style={{ width: '100%', accentColor: '#00d4ff', cursor: 'pointer', marginBottom: 12 }}
        />
        <div style={{
          background: kit.primary_color, borderRadius: kit.button_radius,
          padding: '10px', textAlign: 'center',
          fontFamily: `${kit.font_family}, sans-serif`, fontSize: 13, fontWeight: 700,
          color: isLight(kit.primary_color) ? '#0a0a0f' : '#f8fafc',
        }}>
          Submit Response →
        </div>

        {divider}

        {/* Header style */}
        <p style={{ ...S.sectionHeader, marginBottom: 12 }}>Header Style</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          {[
            { value: 'minimal',  label: 'Minimal',  desc: 'Clean, above form' },
            { value: 'banner',   label: 'Banner',   desc: 'Colored strip' },
            { value: 'centered', label: 'Centered', desc: 'Logo + centered' },
          ].map(({ value, label, desc }) => {
            const active = kit.header_style === value
            return (
              <button
                key={value}
                onClick={() => set('header_style', value)}
                style={{
                  flex: 1,
                  background: active ? 'rgba(0,212,255,0.08)' : '#0a0a0f',
                  border: `1px solid ${active ? '#00d4ff' : '#1e2130'}`,
                  borderRadius: 10, padding: '12px 6px',
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.15s', outline: 'none',
                }}
              >
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: active ? '#00d4ff' : '#94a3b8', display: 'block', marginBottom: 3 }}>
                  {label}
                </span>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#475569', lineHeight: 1.3, display: 'block' }}>
                  {desc}
                </span>
              </button>
            )
          })}
        </div>

        {divider}

        {/* Footer */}
        <p style={{ ...S.sectionHeader, marginBottom: 12 }}>Footer</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#94a3b8' }}>Show "Built with TUSK"</span>
          <Toggle value={!!kit.show_tusk_branding} onChange={(v) => set('show_tusk_branding', v)} />
        </div>
        <div>
          <label style={S.panelLabel}>Custom footer text</label>
          <input
            value={kit.custom_footer_text || ''}
            onChange={(e) => set('custom_footer_text', e.target.value)}
            placeholder="e.g. © 2025 Your Company"
            style={S.panelInput}
          />
        </div>

      </div>

      {/* Sticky save */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid #1e2130', background: '#0f1117', flexShrink: 0 }}>
        {!publishedFormId && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#475569', textAlign: 'center', marginBottom: 10 }}>
            Publish your form first to save the brand kit
          </p>
        )}
        <button
          onClick={onSave}
          disabled={!publishedFormId || saving}
          style={{
            width: '100%',
            background: publishedFormId ? '#00d4ff' : '#1e2130',
            border: 'none', borderRadius: 8, padding: '11px',
            color: publishedFormId ? '#0a0a0f' : '#475569',
            fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700,
            cursor: publishedFormId && !saving ? 'pointer' : 'not-allowed',
            opacity: saving ? 0.7 : 1, transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {saving ? (
            <>
              <span style={{ width: 13, height: 13, border: '2px solid rgba(10,10,15,0.3)', borderTopColor: '#0a0a0f', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.65s linear infinite' }} />
              Saving…
            </>
          ) : 'Save Brand Kit'}
        </button>
      </div>
    </aside>
  )
}

// ─── Publish Modal ────────────────────────────────────────────────────────────

function PublishModal({ formTitle, fields, user, onClose, onReset, onPublished }) {
  const [isPrivate, setIsPrivate]     = useState(false)
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPw, setShowPw]           = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [publishing, setPublishing]   = useState(false)
  const [publishedId, setPublishedId] = useState(null)
  const [copied, setCopied]           = useState(false)

  const publishedUrl = publishedId ? `https://www.tusk.ink/form/${publishedId}` : ''

  const handlePublish = async () => {
    if (isPrivate) {
      if (!password) { toast.error('Enter a password for the private form'); return }
      if (password !== confirm) { toast.error('Passwords do not match'); return }
    }
    setPublishing(true)
    const { data, error } = await supabase
      .from('forms')
      .insert({
        user_id:       user.id,
        title:         formTitle || 'Untitled Form',
        fields,
        is_private:    isPrivate,
        form_password: isPrivate ? password : null,
      })
      .select()
      .single()
    setPublishing(false)
    if (error) { toast.error('Failed to publish form'); return }
    toast.success('Form published!')
    if (onPublished) onPublished(data.id)
    setPublishedId(data.id)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(publishedUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
  }

  const cardStyle = {
    background: '#0f1117', border: '1px solid #1e2130',
    borderRadius: '16px', padding: '28px',
    width: '100%', maxWidth: '460px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  }

  const outlineBtn = {
    flex: 1, background: 'transparent',
    border: '1px solid #1e2130', borderRadius: '8px',
    padding: '12px', color: '#94a3b8',
    fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
    cursor: 'pointer', transition: 'border-color 0.15s',
  }

  if (publishedId) {
    return (
      <div onClick={(e) => e.target === e.currentTarget && onClose()} style={overlayStyle}>
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '20px', color: '#f8fafc', marginBottom: '8px' }}>
            Form Published!
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            Your form is live. Share the link below.
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              readOnly value={publishedUrl}
              style={{ flex: 1, background: '#0a0a0f', border: '1px solid #1e2130', borderRadius: '8px', padding: '10px 14px', color: '#94a3b8', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', outline: 'none', minWidth: 0 }}
            />
            <button
              onClick={copyLink}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: copied ? 'rgba(0,212,255,0.12)' : '#00d4ff',
                border: `1px solid ${copied ? '#00d4ff' : 'transparent'}`,
                borderRadius: '8px', padding: '10px 16px',
                color: copied ? '#00d4ff' : '#0a0a0f',
                fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
              }}
            >
              <Link size={14} />
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.open(publishedUrl, '_blank')}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#64748b')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
              style={{ ...outlineBtn, color: '#f8fafc' }}
            >
              View Form →
            </button>
            <button
              onClick={onReset}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#64748b')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
              style={outlineBtn}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  const inputRow = { display: 'flex', alignItems: 'center', background: '#0a0a0f', border: '1px solid #1e2130', borderRadius: '8px', overflow: 'hidden' }
  const pwInput  = { flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '11px 14px', color: '#f8fafc', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' }
  const eyeBtn   = { background: 'transparent', border: 'none', padding: '0 12px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={overlayStyle}>
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '20px', color: '#f8fafc', marginBottom: '24px' }}>
          Form Settings
        </h2>

        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#f8fafc', fontWeight: 500, marginBottom: '12px' }}>
          Who can access this form?
        </p>
        <div style={{ display: 'flex', gap: '12px', marginBottom: isPrivate ? '24px' : '32px' }}>
          {[
            { val: false, Icon: Globe, title: 'Public',  desc: 'Anyone with the link can submit' },
            { val: true,  Icon: Lock,  title: 'Private', desc: 'Requires a password to submit' },
          ].map(({ val, Icon, title, desc }) => {
            const sel = isPrivate === val
            return (
              <div
                key={title}
                onClick={() => setIsPrivate(val)}
                style={{
                  flex: 1, border: `1px solid ${sel ? '#00d4ff' : '#1e2130'}`,
                  borderRadius: '10px', padding: '16px', cursor: 'pointer',
                  background: sel ? 'rgba(0,212,255,0.06)' : '#0a0a0f',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <Icon size={20} color={sel ? '#00d4ff' : '#64748b'} style={{ marginBottom: '8px' }} />
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500, color: sel ? '#f8fafc' : '#94a3b8', marginBottom: '4px' }}>
                  {title}
                </p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                  {desc}
                </p>
              </div>
            )
          })}
        </div>

        {isPrivate && (
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#94a3b8', fontWeight: 500, marginBottom: '10px' }}>
              Set a password
            </p>
            <div style={{ ...inputRow, marginBottom: '10px' }}>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={pwInput} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={eyeBtn}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div style={{ ...inputRow, marginBottom: '10px' }}>
              <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" onKeyDown={(e) => e.key === 'Enter' && handlePublish()} style={pwInput} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeBtn}>
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              Share this password with people you want to have access
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#64748b')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
            style={outlineBtn}
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            onMouseEnter={(e) => !publishing && (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = publishing ? '0.8' : '1')}
            style={{
              flex: 2, background: '#00d4ff', border: 'none',
              borderRadius: '8px', padding: '12px',
              color: '#0a0a0f', fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px', fontWeight: 700,
              cursor: publishing ? 'default' : 'pointer',
              opacity: publishing ? 0.8 : 1, transition: 'opacity 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {publishing ? (
              <>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(10,10,15,0.3)', borderTopColor: '#0a0a0f', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.65s linear infinite' }} />
                Publishing…
              </>
            ) : 'Publish Form →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Builder page ─────────────────────────────────────────────────────────────

export default function Builder() {
  const { user } = useAuth()
  const isMobile = useIsMobile()

  const [formTitle, setFormTitle]               = useState('')
  const [fields, setFields]                     = useState([])
  const [selectedFieldId, setSelectedFieldId]   = useState(null)
  const [draggedId, setDraggedId]               = useState(null)
  const [showPublishModal, setShowPublishModal]  = useState(false)
  const [activeTab, setActiveTab]               = useState('canvas')
  const [brandKit, setBrandKit]                 = useState(DEFAULT_BRAND_KIT)
  const [publishedFormId, setPublishedFormId]   = useState(null)
  const [builderView, setBuilderView]           = useState('build')
  const [savingKit, setSavingKit]               = useState(false)

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null
  const hasContent    = fields.length > 0 || formTitle.trim().length > 0

  // Load font when brand kit font changes
  useEffect(() => {
    if (brandKit.font_family) loadFont(brandKit.font_family)
  }, [brandKit.font_family])

  const addField = (type) => {
    const field = makeField(type, getTypeInfo(type)?.label ?? type)
    if (type === 'dropdown' || type === 'checkboxes') field.options = ['Option 1', 'Option 2']
    setFields((prev) => [...prev, field])
    setSelectedFieldId(field.id)
  }

  const loadTemplate = (name) => {
    const tpl = TEMPLATES[name]
    if (!tpl) return
    setFormTitle(tpl.title)
    setFields(tpl.fields.map(f => ({
      ...f,
      id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    })))
    setSelectedFieldId(null)
  }

  const updateField = (id, changes) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...changes } : f)))
  }

  const deleteField = (id) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
    if (selectedFieldId === id) setSelectedFieldId(null)
  }

  const openPublishModal = () => {
    if (!user) { toast.error('Please sign in to publish'); return }
    setShowPublishModal(true)
  }

  const resetBuilder = () => {
    setFormTitle('')
    setFields([])
    setSelectedFieldId(null)
    setShowPublishModal(false)
    setPublishedFormId(null)
    setBrandKit(DEFAULT_BRAND_KIT)
    setBuilderView('build')
  }

  const saveKit = async () => {
    if (!publishedFormId) return
    setSavingKit(true)
    const { error } = await supabase.from('forms').update({ brand_kit: brandKit }).eq('id', publishedFormId)
    setSavingKit(false)
    if (error) { toast.error('Failed to save brand kit'); return }
    toast.success('Brand kit saved!')
  }

  const preview = () => {
    localStorage.setItem('tusk_preview', JSON.stringify({ title: formTitle, fields }))
    window.open('/form/preview', '_blank')
  }

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    const mobileTabs = [
      { key: 'fields',   label: 'Fields' },
      { key: 'canvas',   label: 'Canvas' },
      { key: 'settings', label: 'Settings' },
      ...(hasContent ? [{ key: 'customize', label: 'Customize' }] : []),
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: '#0f1117', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ height: 56, padding: '0 16px', borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Untitled Form"
            style={{ background: 'transparent', border: 'none', color: '#f8fafc', fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, outline: 'none', flexGrow: 1, minWidth: 0 }}
          />
          <button
            onClick={preview}
            style={{ background: 'transparent', border: '1px solid #1e2130', color: '#f8fafc', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#64748b')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e2130')}
          >
            <Eye size={14} />
          </button>
          <button
            onClick={openPublishModal}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            style={{ background: '#00d4ff', border: 'none', color: '#0a0a0f', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 700, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.15s' }}
          >
            Publish →
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', height: 44, background: '#0a0a0f', borderBottom: '1px solid #1e2130', flexShrink: 0 }}>
          {mobileTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                borderBottom: `2px solid ${activeTab === key ? '#00d4ff' : 'transparent'}`,
                color: activeTab === key ? '#00d4ff' : '#64748b',
                fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 500,
                cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              {key === 'customize' && <Palette size={12} />}
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'fields' && (
            <LeftSidebar
              mobile
              onAddField={(type) => { addField(type); setActiveTab('canvas') }}
              onLoadTemplate={(name) => { loadTemplate(name); setActiveTab('canvas') }}
            />
          )}

          {activeTab === 'canvas' && (
            <div style={{ padding: '16px' }}>
              {fields.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                    Tap + to add fields<br />or switch to the Fields tab
                  </p>
                </div>
              ) : (
                <div onDragEnd={() => setDraggedId(null)}>
                  {fields.map((field) => (
                    <FieldCard
                      key={field.id}
                      field={field}
                      isSelected={selectedFieldId === field.id}
                      onSelect={() => { setSelectedFieldId(field.id); setActiveTab('settings') }}
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
              <div style={{ height: 80 }} />
            </div>
          )}

          {activeTab === 'settings' && (
            <RightPanel
              mobile
              onBack={() => setActiveTab('canvas')}
              field={selectedField}
              onUpdate={(changes) => selectedField && updateField(selectedField.id, changes)}
            />
          )}

          {activeTab === 'customize' && (
            <BrandKitPanel
              mobile
              kit={brandKit}
              onChange={setBrandKit}
              publishedFormId={publishedFormId}
              onSave={saveKit}
              saving={savingKit}
            />
          )}
        </div>

        {/* FAB — only on canvas tab */}
        {activeTab === 'canvas' && (
          <button
            onClick={() => setActiveTab('fields')}
            style={{
              position: 'fixed', bottom: 24, right: 24,
              width: 52, height: 52, borderRadius: '50%',
              background: '#00d4ff', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10,
              boxShadow: '0 4px 20px rgba(0,212,255,0.35)',
            }}
          >
            <Plus size={24} color="#0a0a0f" />
          </button>
        )}

        {showPublishModal && (
          <PublishModal
            formTitle={formTitle}
            fields={fields}
            user={user}
            onClose={() => setShowPublishModal(false)}
            onReset={resetBuilder}
            onPublished={(id) => setPublishedFormId(id)}
          />
        )}
      </div>
    )
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* Top bar — always visible */}
      <div style={{
        height: 56, padding: '0 24px',
        borderBottom: '1px solid #1e2130',
        display: 'flex', alignItems: 'center', gap: '12px',
        flexShrink: 0, background: '#0f1117',
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

        {/* Build / Customize view switcher */}
        {hasContent && (
          <div style={{
            display: 'flex', background: '#0a0a0f',
            border: '1px solid #1e2130', borderRadius: 8,
            padding: 3, gap: 2, flexShrink: 0,
          }}>
            {[
              { key: 'build',     label: 'Build' },
              { key: 'customize', label: 'Customize', Icon: Palette },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setBuilderView(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: builderView === key ? '#0f1117' : 'transparent',
                  border: `1px solid ${builderView === key ? '#1e2130' : 'transparent'}`,
                  borderRadius: 6, padding: '5px 12px',
                  color: builderView === key ? '#f8fafc' : '#64748b',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {Icon && <Icon size={13} />}
                {label}
              </button>
            ))}
          </div>
        )}

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
          onClick={openPublishModal}
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

      {/* Content area — switches between Build and Customize */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {builderView === 'build' ? (
          <>
            <LeftSidebar onAddField={addField} onLoadTemplate={loadTemplate} />

            {/* Canvas */}
            <div style={{ flexGrow: 1, background: '#0f1117', display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }}>
                {fields.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ border: '1.5px dashed #1e2130', borderRadius: '16px', padding: '52px 48px', textAlign: 'center', maxWidth: '380px' }}>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
                        Add fields from the left panel<br />or pick a template
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ maxWidth: '640px', margin: '0 auto' }} onDragEnd={() => setDraggedId(null)}>
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
          </>
        ) : (
          <>
            <BrandKitPanel
              kit={brandKit}
              onChange={setBrandKit}
              publishedFormId={publishedFormId}
              onSave={saveKit}
              saving={savingKit}
            />
            <FormPreview form={{ title: formTitle, fields }} kit={brandKit} />
          </>
        )}
      </div>

      {showPublishModal && (
        <PublishModal
          formTitle={formTitle}
          fields={fields}
          user={user}
          onClose={() => setShowPublishModal(false)}
          onReset={resetBuilder}
          onPublished={(id) => setPublishedFormId(id)}
        />
      )}
    </div>
  )
}
