# TUSK — Project Context

## What is TUSK
TUSK is a premium form builder and feedback platform. Live at https://www.tusk.ink. Built by Shepherd (https://x.com/xshephrd). GitHub: https://github.com/timmyonchain/tusk

## Tech Stack
- Frontend: React + Vite
- Styling: Tailwind CSS + custom design system
- Auth + Database: Supabase
- Animations: Framer Motion
- Icons: Lucide React
- Hosting: Vercel
- Domain: tusk.ink (Namecheap)

## Design System
- Background: #0a0a0f
- Primary accent: #00d4ff (cyan)
- Secondary: #7c3aed
- Card bg: #0f1117
- Border: #1e2130
- Text primary: #f8fafc
- Text muted: #64748b
- Fonts: Syne (headings, weight 700), DM Sans (body, weight 400/500)
- Dark theme throughout, premium minimal aesthetic, no Bootstrap

## Supabase
- Project URL: https://dcubmacqglaqjqmsgpyc.supabase.co
- Env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file
- Tables:
  * forms (id uuid, user_id uuid, title text, fields jsonb, is_active boolean default true, max_submissions integer, is_private boolean default false, form_password text, created_at timestamptz)
  * submissions (id uuid, form_id uuid, answers jsonb, receipt_id text, status text default Open, submitted_at timestamptz)
- RLS enabled on both tables
- Auth: email + password with email verification on signup
- Supabase auth redirect URL set to https://www.tusk.ink

## File Structure
src/
  lib/supabase.js — Supabase client
  context/AuthContext.jsx — auth provider + useAuth() hook
  components/Navbar.jsx — sticky glass navbar, hamburger menu on mobile
  components/ProtectedRoute.jsx — redirects to /login if not authenticated
  pages/Landing.jsx — public landing page
  pages/Login.jsx — email + password login
  pages/Signup.jsx — email + password signup with confirm password
  pages/Builder.jsx — form builder (3 columns desktop, tab layout mobile)
  pages/Admin.jsx — admin dashboard (2 columns desktop, accordion mobile)
  pages/FormView.jsx — public form submission page

## Routes
- / Landing page (public)
- /login Login (public)
- /signup Signup (public)
- /builder Form builder (protected — requires login)
- /admin Admin dashboard (protected — requires login)
- /form/:id Form view (public — no login needed, anyone can submit)

## Features Built
- Form builder with 8 field types: Short Text, Long Text, Dropdown, Checkboxes, Star Rating, File Upload, URL, Number
- 8 templates with full preset fields: Bug Report, Feature Request, Survey, Hackathon Application, Creator Application, User Feedback, Event Registration, Job Application
- Shareable form links with QR codes and copy link button
- Publish modal with public/private toggle and password setting
- Password gate on form view for private forms
- Submission limits — form closes automatically when limit reached
- Revoke links — admin can close/reopen form instantly
- Receipt ID on every submission — unique UUID proof of submission
- Admin dashboard: search, filter by status, CSV export, status management (Open/In Review/Resolved)
- Copy form link from dashboard
- Delete form with confirmation modal (deletes form + all submissions)
- Full mobile responsive — builder uses tab layout (Fields/Canvas/Settings), dashboard uses accordion layout
- Mobile hamburger menu with slide-in navigation
- Email auth with Supabase — email verification on signup
- Supabase RLS policies for security
- Custom favicon (tusk SVG icon in cyan)
- Browser tab title: tusk (lowercase)
- vercel.json with rewrites for React Router
- CONTEXT.md for session continuity

## Key Behaviors
- Forms are stored in Supabase forms table, submissions in submissions table
- localStorage is NOT used for forms or submissions — everything is in Supabase
- Form view is fully public — no auth required to submit
- Builder and Dashboard require login
- On mobile, builder shows 3 tabs: Fields, Canvas, Settings
- On mobile, dashboard shows accordion cards — one open at a time
- Navbar shows Sign In + Get Started when logged out, email + Sign Out when logged in
- Password show/hide toggle on all password inputs

## Roadmap (not built yet)
- Conditional logic (show/hide fields based on answers)
- Email/Slack notifications on new submission
- Webhook support
- One question at a time mode (Typeform style)
- Google Sheets sync
- NPS rating scale (1-10)
- Team workspaces (multiple admins)
- Completion rate and drop-off analytics
- Stripe payment collection
- Date/time picker field type
- Mobile app for form creators

## Owner
Built by Shepherd — https://x.com/xshephrd
