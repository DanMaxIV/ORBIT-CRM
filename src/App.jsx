import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from './lib/supabase';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapApp } from '@capacitor/app';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import listPlugin from '@fullcalendar/react/list';
import interactionPlugin from '@fullcalendar/react/interaction';
import '@fullcalendar/react/skeleton.css';
import { LayoutDashboard, Users, Kanban, CalendarCheck, BarChart3, Settings, Bell, Search, Plus, ArrowUpRight, MoreHorizontal, Menu, X, UserRound, Pencil, Receipt, LogOut, UserCog, MessageCircle, UserPlus, Mail, CalendarDays, FileText, Workflow, TrendingUp, Tags, DollarSign, CreditCard, Upload, Download, Play, Target, CheckCircle2, ArrowLeft, ChevronRight, Building2, RefreshCw, GripVertical, MapPin } from 'lucide-react';


const IS_NATIVE = Capacitor.isNativePlatform();
const NATIVE_REDIRECT = 'com.storhet.crm://auth';
// Lets every page heading refresh the latest workspace data without prop-drilling.
const RefreshContext = createContext(null);

// Light / dark appearance. The choice is stored on this device and applied to <html>
// before the first render so the page never flashes the wrong theme.
const THEME_STORAGE_KEY = 'orbit_theme';
const PAGE_STORAGE_KEY = 'orbit_current_page';
const readStoredTheme = () => {
  try { return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
};
const readStoredPage = () => {
  try {
    const storedPage = localStorage.getItem(PAGE_STORAGE_KEY);
    return storedPage || 'Dashboard';
  } catch {
    return 'Dashboard';
  }
};
if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', readStoredTheme());

// Internal staff roles. `value` is what is stored in authorized_users.role.
const ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager (MD)' },
  { value: 'admin', label: 'Admin' },
  { value: 'hr', label: 'HR' },
  { value: 'head_of_sales', label: 'Head of Sales' },
  { value: 'sales', label: 'Sales' },
  { value: 'technical_support', label: 'Technical Support' }
];
const DEFAULT_ROLE = 'sales';
// Roles that get the admin-only controls (User Management, deleting other people's records, etc.).
// To give another role the same powers, add its value here, e.g. ['admin', 'manager'].
const ADMIN_ROLES = ['admin'];
const isAdminRole = role => ADMIN_ROLES.includes(role);
const isSystemAdminOrMD = role => ['admin', 'manager'].includes(role);

// PostgREST returns at most 1,000 rows per request, so any list longer than that was being cut off
// silently. This pages through the table in chunks so lists (and totals built from them) stay complete.
// `id` is added as a tie-breaker so rows never repeat or go missing between pages.
async function fetchAllRows(makeQuery, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await makeQuery().order('id', { ascending: true }).range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return { data: rows, error: null };
}
const isCommercialDeleter = role => ['admin', 'manager', 'head_of_sales'].includes(role);
const isCommercialEditor = role => ['admin', 'manager'].includes(role);
const ROLE_PANEL_PAGE = {
  manager: 'MD Panel',
  head_of_sales: 'HOS Panel',
  hr: 'HR Panel',
  technical_support: 'Technical Support Panel'
};
const rolePanelFor = role => ROLE_PANEL_PAGE[role] || null;
const approvalRequirement = amount => {
  const value = Number(amount) || 0;
  if (value >= 50000) return { band: 'HOS_MD', label: 'HOS → MD' };
  if (value >= 20000) return { band: 'HOS', label: 'HOS' };
  return { band: 'SALES', label: 'Sales Rep' };
};
const canApproveForRole = (role, amount, approvalStatus = 'PENDING') => {
  const effectiveRole = role === 'admin' ? 'manager' : role;
  const requirement = approvalRequirement(amount).band;
  if (approvalStatus === 'HOS_PENDING' && effectiveRole === 'head_of_sales') return requirement === 'HOS' || requirement === 'HOS_MD';
  if (approvalStatus === 'MD_PENDING' && effectiveRole === 'manager') return requirement === 'HOS_MD';
  if (approvalStatus === 'SALES_PENDING' && effectiveRole === 'sales') return requirement === 'SALES';
  return false;
};
const roleLabel = role => {
  if (!role) return 'Staff';
  const known = ROLE_OPTIONS.find(option => option.value === role);
  if (known) return known.label;
  return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' '); // e.g. a legacy "member" row
};

function distanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = value => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Accuracy (metres) above which a GPS fix is flagged LOW_ACCURACY instead of trusted.
const LOW_ACCURACY_METERS = 150;

// Waits for a good GPS fix instead of trusting the first (often coarse) one.
// Listens up to maxWaitMs, stops early once accuracy <= targetAccuracy metres,
// otherwise resolves with the most accurate fix seen. Resolves a plain
// { latitude, longitude, accuracy } object.
function captureCurrentLocation(onSuccess, onFailure, { targetAccuracy = 50, maxWaitMs = 20000 } = {}) {
  if (!navigator.geolocation) {
    onFailure?.(new Error('Location is not supported by this browser.'));
    return;
  }
  let best = null;
  let done = false;
  let watchId = null;
  let timer = null;

  const stop = () => {
    done = true;
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    clearTimeout(timer);
  };
  const finish = () => {
    if (done) return;
    stop();
    if (best) onSuccess?.(best);
    else onFailure?.(new Error('Unable to get your current location.'));
  };

  watchId = navigator.geolocation.watchPosition(
    position => {
      const c = position.coords;
      if (!best || c.accuracy < best.accuracy) {
        best = { latitude: c.latitude, longitude: c.longitude, accuracy: c.accuracy };
      }
      if (c.accuracy <= targetAccuracy) finish();
    },
    error => {
      if (done) return;
      if (error.code === 1) {
        stop();
        onFailure?.(new Error('Location permission was denied.'));
      }
      // Other errors (timeout, position unavailable): keep waiting until the timer ends.
    },
    { enableHighAccuracy: true, timeout: maxWaitMs, maximumAge: 0 }
  );
  timer = setTimeout(finish, maxWaitMs);
}

function AuthScreen({ onGoogleSignIn, onMicrosoftSignIn, onEmailSignIn, onEmailSignUp, onPortalSignUp, authMode, setAuthMode, email, setEmail, password, setPassword,
  error,
  notice,
  loading,
  staffInvite, staffInviteChecking, staffInviteError, onStaffInviteSignUp
}) {

  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showPortalSignup, setShowPortalSignup] = useState(false);
  const [portalFullName, setPortalFullName] = useState('');
  const [staffInviteName, setStaffInviteName] = useState('');
  const [staffInvitePassword, setStaffInvitePassword] = useState('');

  const staffRoleLabel = roleValue => ROLE_OPTIONS.find(r => r.value === roleValue)?.label || roleValue;

  // A valid, still-open staff invitation replaces the normal sign-in screen.
  if (staffInviteChecking) {
    return <div className="auth-page"><div className="auth-card auth-loading"><div className="auth-brand"><div className="brand-mark"><img src="/storhetLogo.png" alt="Storhet CRM" /></div><span className="brand-name">Storhet<span className="brand-accent">CRM</span></span></div><p>Checking your invitation…</p></div></div>;
  }
  if (staffInviteError) {
    return <div className="auth-page"><div className="auth-card"><div className="auth-brand"><div className="brand-mark"><img src="/storhetLogo.png" alt="Storhet CRM" /></div><span className="brand-name">Storhet<span className="brand-accent">CRM</span></span></div><div className="auth-error" role="alert">{staffInviteError}</div><p className="authSignUp"><button type="button" className="auth-toggle-btn" onClick={() => window.location.href = window.location.pathname}>Go to sign in</button></p></div></div>;
  }
  if (staffInvite) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand"><div className="brand-mark"><img src="/storhetLogo.png" alt="Storhet CRM" /></div><span className="brand-name">Storhet<span className="brand-accent">CRM</span></span></div>
          <div className="auth-heading"><h1>You're invited to join the team</h1><p>You've been invited to Storhet CRM as <strong>{staffRoleLabel(staffInvite.role)}</strong>.</p></div>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <form className="email-login-form" onSubmit={event => { event.preventDefault(); onStaffInviteSignUp(event, staffInviteName, staffInvitePassword); }}>
            <label>Full name
              <input type="text" autoComplete="name" placeholder="Your full name" value={staffInviteName} onChange={e => setStaffInviteName(e.target.value)} required />
            </label>
            <label>Email address
              <input type="email" value={staffInvite.email} readOnly disabled />
            </label>
            <label>Password
              <input type="password" autoComplete="new-password" placeholder="At least 6 characters" value={staffInvitePassword} onChange={e => setStaffInvitePassword(e.target.value)} minLength={6} required />
            </label>
            <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</button>
          </form>
          <p className="invite-expiry">This invitation expires {new Date(staffInvite.expires_at).toLocaleDateString()}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><img src="/storhetLogo.png" alt="Storhet CRM" /></div>
          <span className="brand-name">
            Storhet<span className="brand-accent">CRM</span>
          </span>
        </div>
        <div className="auth-heading">
          <h1>Welcome back</h1>
          <p>Sign in to access your Storhet CRM workspace.</p>
        </div>
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="auth-notice" role="status">
            {notice}
          </div>
        )}

        <form className="email-login-form" onSubmit={authMode === 'signup' ? onEmailSignUp : onEmailSignIn}>
          <label>
            Email address
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in with email'}
          </button>
          <div className="createSignUp">
            <p className='authSignUp'>Don't have an account?
              {' '}
              <button
                type="button"
                className="auth-toggle-btn"
                onClick={() => setShowSignupModal(true)}
                disabled={loading}
              >
                Create
              </button>
            </p>
          </div>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          className="google-signin-btn"
          onClick={onGoogleSignIn}
          disabled={loading}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z"
            />
            <path
              fill="#34A853"
              d="M12 21.7c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.7Z"
            />
            <path
              fill="#FBBC05"
              d="M6.54 13.79A5.85 5.85 0 0 1 6.23 12c0-.62.11-1.23.31-1.79V7.68H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.05 4.32l3.24-2.53Z"
            />
            <path
              fill="#EA4335"
              d="M12 6.18c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.28 14.63 2.3 12 2.3a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53c.77-2.31 2.92-4.03 5.46-4.03Z"
            />
          </svg>

          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <button
          className="microsoft-signin-btn"
          onClick={onMicrosoftSignIn}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true">
            <rect x="1" y="1" width="10" height="10" fill="#f25022" />
            <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
            <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
            <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
          </svg>
          {loading ? 'Signing in...' : 'Continue with Microsoft'}
        </button>

        <div className="portal-auth-entry">
          <span>Are you a customer?</span>
          <button type="button" className="auth-toggle-btn" onClick={() => setShowPortalSignup(true)} disabled={loading}>
            Create a customer portal account
          </button>
        </div>
        <p className="auth-footer">
          Access to the internal CRM is restricted to authorized Storhet CRM users.
        </p>
      </div>

      {showSignupModal && (
        <div
          className="modal-backdrop signup-backdrop"
          onClick={() => setShowSignupModal(false)}
        >
          <form
            className="modal signup-modal"
            onSubmit={(event) => {
              event.preventDefault();
              onEmailSignUp(event);
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2>Create your account</h2>
                <p>Sign up for Storhet CRM access.</p>
              </div>

              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowSignupModal(false)}
                aria-label="Close sign-up modal"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}
            {notice && (
              <div className="auth-notice" role="status">
                {notice}
              </div>
            )}

            <label>
              Email address
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </label>

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
            <p className='authSignUp'>
              Already have an account?
              {' '}
              <button
                type="button"
                className="auth-toggle-btn"
                onClick={() => setShowSignupModal(false)}
                disabled={loading}
              >
                Sign in
              </button>
            </p>

          </form>
        </div>
      )}

      {showPortalSignup && (
        <div className="modal-backdrop signup-backdrop" onClick={() => setShowPortalSignup(false)}>
          <form
            className="modal signup-modal portal-signup-modal"
            onSubmit={async (event) => {
              event.preventDefault();
              const succeeded = await onPortalSignUp(event, portalFullName);
              if (succeeded) setShowPortalSignup(false);
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2>Customer portal</h2>
                <p>Create an account to access information your company has shared with you.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setShowPortalSignup(false)} aria-label="Close customer portal registration"><X size={18} /></button>
            </div>
            {error && <div className="auth-error" role="alert">{error}</div>}
            {notice && <div className="auth-notice" role="status">{notice}</div>}
            <label>
              Full name
              <input type="text" autoComplete="name" placeholder="Your full name" value={portalFullName} onChange={(event) => setPortalFullName(event.target.value)} required />
            </label>
            <label>
              Email address
              <input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" autoComplete="new-password" placeholder="At least 6 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
            </label>
            <p className="portal-signup-help">We’ll email you a verification link. For your security, your portal will only show records linked to your verified customer account and shared by the Storhet CRM team.</p>
            <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Creating account...' : 'Create customer account'}</button>
            <p className="authSignUp">Already registered? <button type="button" className="auth-toggle-btn" onClick={() => setShowPortalSignup(false)} disabled={loading}>Return to sign in</button></p>
          </form>
        </div>
      )}
    </div>
  );
}

function PortalStatusScreen({ account, email, onSignOut }) {
  const needsVerification = !account;
  const isActive = account?.status === 'active';
  const isRejected = account?.status === 'revoked';
  return (
    <div className="auth-page">
      <div className="auth-card portal-status-card">
        <div className="auth-brand"><div className="brand-mark"><img src="/storhetLogo.png" alt="Storhet CRM" /></div><span className="brand-name">Storhet<span className="brand-accent">CRM</span></span></div>
        <div className="portal-status-icon">{needsVerification ? '✉' : isActive ? 'O' : isRejected ? '×' : '✓'}</div>
        <div className="auth-heading">
          <h1>{needsVerification ? 'Check your email' : isActive ? 'Finish setting up your portal' : isRejected ? 'Portal access rejected' : 'Portal access pending'}</h1>
          <p>{needsVerification
            ? 'Please verify your email address using the link we sent. If you have already verified it, sign out and sign back in to finish portal setup.'
            : isActive
              ? 'Your account is approved and linked. Your customer dashboard is being prepared.'
              : isRejected
                ? 'Your customer portal access request was rejected. Please contact the Storhet CRM team if you believe this is a mistake.'
                : 'Your email is verified. Your request is waiting for a Storhet CRM admin to review it. Portal access will remain blocked until it is approved.'}</p>
        </div>
        <p className="portal-status-email">{email || account?.email || ''}</p>
        <button type="button" className="primary-btn" onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  );
}

const PORTAL_TICKET_CATEGORIES = ['General', 'Technical', 'Billing', 'Account', 'Feature Request'];
const PORTAL_TICKET_PRIORITIES = ['Low', 'Medium', 'High'];
const PORTAL_RECORD_LABELS = { deal: 'Deal', quote: 'Quote', invoice: 'Invoice', document: 'Document' };

const portalPillClass = value => `portal-pill pill-${String(value || 'neutral').toLowerCase().replace(/[^a-z]+/g, '-')}`;
const portalDate = value => value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const portalDateTime = value => value ? new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

function portalErrorMessage(error) {
  if (!error) return '';
  // PostgREST reports a missing function as PGRST202; Postgres uses 42883.
  if (error.code === 'PGRST202' || error.code === '42883') {
    return 'Support tickets are not set up yet. Please ask your Storhet CRM administrator to finish the portal support setup.';
  }
  return error.message || 'Something went wrong. Please try again.';
}

function PortalTicketThread({ ticket, onBack, onChanged }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  async function loadThread({ silent = false } = {}) {
    if (!silent) setLoading(true);
    const { data, error: threadError } = await supabase.rpc('portal_get_ticket_thread', { p_ticket_id: ticket.id });
    if (threadError) {
      if (!silent) setError(portalErrorMessage(threadError));
    } else {
      setError('');
      setMessages(data || []);
    }
    if (!silent) setLoading(false);
  }

  useEffect(() => {
    loadThread();
    const timer = window.setInterval(() => loadThread({ silent: true }), 15000);
    return () => window.clearInterval(timer);
  }, [ticket.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages.length]);

  async function sendReply(event) {
    event.preventDefault();
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    const { error: replyError } = await supabase.rpc('portal_add_ticket_reply', { p_ticket_id: ticket.id, p_body: body });
    if (replyError) {
      setError(portalErrorMessage(replyError));
    } else {
      setReply('');
      await loadThread({ silent: true });
      onChanged();
    }
    setSending(false);
  }

  const closed = ticket.status === 'Closed';
  const handledBy = ticket.assignee_name || 'Support team';

  return (
    <div className="portal-thread">
      <div className="portal-thread-toolbar"><button type="button" className="portal-back-btn" onClick={onBack}>← All tickets</button><button type="button" className="secondary-btn" onClick={() => { loadThread({ silent: true }); onChanged(); }}><RefreshCw size={14} /> Refresh</button></div>
      <div className="portal-thread-header">
        <div>
          <span className="portal-record-type">Ticket #{ticket.ticket_number ?? '—'}</span>
          <h2>{ticket.title}</h2>
          <p>{ticket.category || 'General'} · Opened {portalDate(ticket.created_at)} · Handled by {handledBy}</p>
        </div>
        <div className="portal-thread-badges">
          <span className={portalPillClass(ticket.status)}>{ticket.status}</span>
          <span className={portalPillClass(ticket.priority)}>{ticket.priority} priority</span>
        </div>
      </div>

      <div className="portal-messages" aria-live="polite">
        <div className="portal-message mine">
          <div className="portal-message-meta"><strong>You</strong><time>{portalDateTime(ticket.created_at)}</time></div>
          <p>{ticket.description}</p>
        </div>
        {loading && <p className="portal-muted">Loading conversation…</p>}
        {messages.map(message => (
          <div key={message.id} className={`portal-message ${message.author_type === 'customer' ? 'mine' : 'theirs'}`}>
            <div className="portal-message-meta"><strong>{message.author_name}</strong><time>{portalDateTime(message.created_at)}</time></div>
            <p>{message.body}</p>
          </div>
        ))}
        {!loading && messages.length === 0 && <p className="portal-muted">No replies yet. Our team has been notified and will respond here.</p>}
        <div ref={endRef} />
      </div>

      {error && <div className="auth-error" role="alert">{error}</div>}
      {closed ? (
        <p className="portal-muted portal-closed-note">This ticket is closed. If you still need help, please open a new ticket.</p>
      ) : (
        <form className="portal-reply-form" onSubmit={sendReply}>
          <textarea
            rows="3"
            value={reply}
            onChange={event => setReply(event.target.value)}
            placeholder={ticket.status === 'Resolved' ? 'Replying will reopen this ticket…' : 'Write a reply…'}
            maxLength={5000}
            disabled={sending}
          />
          <button type="submit" className="primary-btn" disabled={sending || !reply.trim()}>{sending ? 'Sending…' : 'Send reply'}</button>
        </form>
      )}
    </div>
  );
}

function PortalNewTicketModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', category: 'General', priority: 'Medium', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    const title = form.title.trim();
    const description = form.description.trim();
    if (title.length < 3) { setError('Please enter a short subject (at least 3 characters).'); return; }
    if (description.length < 10) { setError('Please describe the issue in a little more detail (at least 10 characters).'); return; }
    setSaving(true);
    const { data, error: createError } = await supabase.rpc('portal_create_ticket', {
      p_title: title,
      p_description: description,
      p_category: form.category,
      p_priority: form.priority
    });
    setSaving(false);
    if (createError) { setError(portalErrorMessage(createError)); return; }
    onCreated(data);
  }

  return (
    <div className="modal-backdrop signup-backdrop">
      <form className="modal signup-modal portal-signup-modal" onSubmit={submit}>
        <div className="modal-heading">
          <div><h2>New support ticket</h2><p>Tell us what you need help with. A member of our team will reply here.</p></div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={saving} aria-label="Close new ticket form"><X size={18} /></button>
        </div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <label>Subject
          <input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="e.g. I can't download my latest invoice" maxLength={200} required />
        </label>
        <div className="portal-form-row">
          <label>Category
            <select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>
              {PORTAL_TICKET_CATEGORIES.map(category => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label>Priority
            <select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })}>
              {PORTAL_TICKET_PRIORITIES.map(priority => <option key={priority}>{priority}</option>)}
            </select>
          </label>
        </div>
        <label>Describe the issue
          <textarea rows="6" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} maxLength={5000} placeholder="Include any details that will help us resolve this quickly." required />
        </label>
        <p className="portal-char-count">{form.description.length}/5000</p>
        <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Submitting…' : 'Submit ticket'}</button>
      </form>
    </div>
  );
}

function PortalSupport({ tickets, loading, error, onReload }) {
  const [selectedId, setSelectedId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState('open');

  const selected = tickets.find(ticket => ticket.id === selectedId) || null;
  const isOpen = ticket => ticket.status !== 'Resolved' && ticket.status !== 'Closed';
  const visible = tickets.filter(ticket => filter === 'all' ? true : filter === 'open' ? isOpen(ticket) : !isOpen(ticket));

  if (selected) {
    return <PortalTicketThread ticket={selected} onBack={() => setSelectedId(null)} onChanged={onReload} />;
  }

  return (
    <section className="portal-records-section">
      <div className="portal-section-heading">
        <div><h2>Support</h2><p>Create a ticket and follow the conversation with our team.</p></div>
        <div className="toolbar-actions"><button type="button" className="secondary-btn" onClick={onReload}><RefreshCw size={14} /> Refresh</button><button type="button" className="primary-btn" onClick={() => setShowNew(true)}><Plus size={15} /> New ticket</button></div>
      </div>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <div className="filter-tabs" role="tablist" aria-label="Filter tickets">
        {[['open', 'Open'], ['done', 'Resolved'], ['all', 'All']].map(([key, label]) => (
          <button key={key} type="button" className={`filter-tab ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
            {label} ({key === 'all' ? tickets.length : tickets.filter(ticket => key === 'open' ? isOpen(ticket) : !isOpen(ticket)).length})
          </button>
        ))}
      </div>
      {loading ? (
        <div className="panel portal-loading">Loading your tickets…</div>
      ) : visible.length === 0 ? (
        <div className="panel portal-empty-state">
          <div className="portal-empty-mark">?</div>
          <h3>{tickets.length === 0 ? 'No tickets yet' : 'Nothing here'}</h3>
          <p>{tickets.length === 0 ? 'Need help? Create a ticket and a member of our team will pick it up.' : 'No tickets match this filter.'}</p>
        </div>
      ) : (
        <div className="portal-ticket-list">
          {visible.map(ticket => (
            <button type="button" key={ticket.id} className="portal-ticket-row" onClick={() => setSelectedId(ticket.id)}>
              <div className="portal-ticket-main">
                <span className="portal-ticket-number">#{ticket.ticket_number ?? '—'}</span>
                <strong>{ticket.title}</strong>
                <small>{ticket.category || 'General'} · Updated {portalDate(ticket.updated_at || ticket.created_at)} · {ticket.assignee_name ? `Handled by ${ticket.assignee_name}` : 'Support team'}</small>
              </div>
              <div className="portal-ticket-badges">
                <span className={portalPillClass(ticket.priority)}>{ticket.priority}</span>
                <span className={portalPillClass(ticket.status)}>{ticket.status}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {showNew && (
        <PortalNewTicketModal
          onClose={() => setShowNew(false)}
          onCreated={newId => { setShowNew(false); onReload(); setSelectedId(newId); }}
        />
      )}
    </section>
  );
}




function CustomerPortalHome({ user, account, onSignOut }) {
  const [tab, setTab] = useState('overview');
  const [customer, setCustomer] = useState(null);
  const [records, setRecords] = useState([]);
  const [portalLoading, setPortalLoading] = useState(true);
  const [portalError, setPortalError] = useState('');
  const [recordFilter, setRecordFilter] = useState('all');
  const [refreshTick, setRefreshTick] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState('');
  const [currency, setCurrency] = useState(() => {
    try { return localStorage.getItem('orbit_portal_currency_v2') || 'USD'; } catch { return 'USD'; }
  });

  useEffect(() => {
    try { localStorage.setItem('orbit_portal_currency_v2', currency); } catch { /* storage unavailable */ }
  }, [currency]);

  async function loadTickets({ silent = false } = {}) {
    if (!silent) setTicketsLoading(true);
    const { data, error } = await supabase.rpc('portal_list_tickets');
    if (error) {
      if (!silent) setTicketsError(portalErrorMessage(error));
    } else {
      setTicketsError('');
      setTickets(data || []);
    }
    if (!silent) setTicketsLoading(false);
  }

  useEffect(() => {
    loadTickets();
    const timer = window.setInterval(() => loadTickets({ silent: true }), 30000);
    return () => window.clearInterval(timer);
  }, [user.id]);

  useEffect(() => {
    let cancelled = false;
    async function loadPortalData() {
      if (!customer) setPortalLoading(true);
      setPortalError('');
      try {
        const { data: accountData, error: accountError } = await supabase
          .from('customer_portal_accounts')
          .select('customer_id, full_name, email, status')
          .eq('user_id', user.id)
          .maybeSingle();
        if (accountError) throw accountError;
        if (!accountData || accountData.status !== 'active' || !accountData.customer_id) {
          throw new Error('Your portal account is not linked to an active customer record yet.');
        }

        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id, name, company, email, status, created_at')
          .eq('id', accountData.customer_id)
          .maybeSingle();
        if (customerError) throw customerError;
        if (!customerData) throw new Error('Your linked customer record could not be found. Please contact your account manager.');

        const { data: shared, error: sharedError } = await supabase
          .from('customer_portal_shared_records')
          .select('record_type, record_id, created_at')
          .eq('customer_id', accountData.customer_id)
          .order('created_at', { ascending: false });
        if (sharedError) throw sharedError;

        const grouped = { deal: [], quote: [], invoice: [], document: [] };
        (shared || []).forEach((record) => {
          if (grouped[record.record_type]) grouped[record.record_type].push(record.record_id);
        });
        const fetched = [];
        const configs = [
          ['deal', 'deals', 'id,title,stage,amount,created_at'],
          ['quote', 'quotes', 'id,title,quote_number,status,total,created_at'],
          ['invoice', 'invoices', 'id,title,invoice_number,status,amount,created_at'],
          ['document', 'documents', 'id,name,mime_type,created_at']
        ];
        for (const [type, table, columns] of configs) {
          if (!grouped[type].length) continue;
          const { data, error } = await supabase.from(table).select(columns).in('id', grouped[type]);
          if (error) throw error;
          (data || []).forEach((row) => fetched.push({ ...row, portalType: type }));
        }
        fetched.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        if (!cancelled) {
          setCustomer(customerData);
          setRecords(fetched);
        }
      } catch (error) {
        if (!cancelled) setPortalError(error.message || 'Unable to load your customer portal.');
      } finally {
        if (!cancelled) setPortalLoading(false);
      }
    }
    loadPortalData();
    return () => { cancelled = true; };
  }, [user.id, refreshTick]);

  useEffect(() => {
    const timer = window.setInterval(() => setRefreshTick(tick => tick + 1), 30000);
    return () => window.clearInterval(timer);
  }, []);

  // Amounts are stored in USD and converted for display, exactly like the internal CRM.
  const money = (value) => {
    const config = EXCHANGE_RATES[currency] || EXCHANGE_RATES.USD;
    return `${config.symbol}${((Number(value) || 0) * config.rate).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };
  const titleFor = (record) => record.portalType === 'deal' ? record.title : record.portalType === 'quote' ? (record.title || record.quote_number || 'Quote') : record.portalType === 'invoice' ? (record.title || record.invoice_number || 'Invoice') : (record.name || 'Document');
  const statusFor = (record) => record.portalType === 'deal' ? record.stage : record.portalType === 'document' ? '' : record.status;
  const detailFor = (record) => record.portalType === 'deal' ? money(record.amount) : record.portalType === 'quote' ? `${record.quote_number || 'Quote'} · ${money(record.total ?? record.amount)}` : record.portalType === 'invoice' ? `${record.invoice_number || 'Invoice'} · ${money(record.amount)}` : (record.mime_type || 'Shared document');

  const openTicketCount = tickets.filter(ticket => ticket.status !== 'Resolved' && ticket.status !== 'Closed').length;
  const recordCounts = records.reduce((acc, record) => ({ ...acc, [record.portalType]: (acc[record.portalType] || 0) + 1 }), {});
  const visibleRecords = recordFilter === 'all' ? records : records.filter(record => record.portalType === recordFilter);

  return (
    <div className="customer-portal-shell">
      <header className="customer-portal-topbar">
        <div className="auth-brand"><div className="brand-mark"><img src="/storhetLogo.png" alt="Storhet CRM" /></div><span className="brand-name">Storhet<span className="brand-accent">CRM</span></span></div>
        <div className="customer-portal-top-actions">
          <select className="portal-currency" value={currency} onChange={event => setCurrency(event.target.value)} aria-label="Display currency">
            {Object.keys(EXCHANGE_RATES).map(code => <option key={code} value={code}>{code}</option>)}
          </select>
          <span>{account?.full_name || user.email}</span>
          <button type="button" className="secondary-btn" onClick={onSignOut}><LogOut size={15} /> Sign out</button>
        </div>
      </header>
      <main className="customer-portal-content">
        <div className="customer-portal-welcome"><div><span className="portal-eyebrow">CUSTOMER PORTAL</span><h1>Welcome{account?.full_name ? `, ${account.full_name.split(' ')[0]}` : ''}</h1><p>View what your team has shared with you and get help when you need it.</p></div><div className="portal-customer-mark">{(customer?.name || account?.full_name || user.email || 'C').slice(0, 1).toUpperCase()}</div></div>
        {portalError && <div className="auth-error" role="alert">{portalError}</div>}
        {portalLoading ? <div className="panel portal-loading">Loading your customer information…</div> : customer && <>
          <section className="portal-customer-card"><div><span>ACCOUNT</span><h2>{customer.company || customer.name}</h2><p>{customer.name}{customer.email ? ` · ${customer.email}` : ''}</p></div><div><span>STATUS</span><strong>{customer.status || 'Active'}</strong></div><div><span>CUSTOMER SINCE</span><strong>{portalDate(customer.created_at)}</strong></div></section>

          <nav className="portal-tabs" role="tablist" aria-label="Portal sections">
            <button type="button" role="tab" aria-selected={tab === 'overview'} className={`portal-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview <span className="portal-tab-count">{records.length}</span></button>
            <button type="button" role="tab" aria-selected={tab === 'support'} className={`portal-tab ${tab === 'support' ? 'active' : ''}`} onClick={() => setTab('support')}>Support {openTicketCount > 0 && <span className="portal-tab-count highlight">{openTicketCount}</span>}</button>
          </nav>

          {tab === 'overview' && (
            <section className="portal-records-section">
              <div className="portal-section-heading"><div><h2>Shared with you</h2><p>Quotes and invoices your team sends you appear here, along with anything else they choose to share.</p></div><div className="toolbar-actions"><span className="portal-record-count">{records.length} records</span><button type="button" className="secondary-btn" onClick={() => { setRefreshTick(tick => tick + 1); loadTickets({ silent: true }); }}>Refresh</button></div></div>
              {records.length > 0 && (
                <div className="filter-tabs" role="tablist" aria-label="Filter records">
                  {[['all', 'All', records.length], ...Object.entries(PORTAL_RECORD_LABELS).map(([key, label]) => [key, `${label}s`, recordCounts[key] || 0])].filter(([key, , count]) => key === 'all' || count > 0).map(([key, label, count]) => (
                    <button key={key} type="button" className={`filter-tab ${recordFilter === key ? 'active' : ''}`} onClick={() => setRecordFilter(key)}>{label} ({count})</button>
                  ))}
                </div>
              )}
              {records.length === 0 ? (
                <div className="panel portal-empty-state"><div className="portal-empty-mark">O</div><h3>No shared records yet</h3><p>Your quotes, invoices, project updates and documents will appear here when your team shares them. Need something? Open a support ticket.</p><button type="button" className="secondary-btn portal-empty-action" onClick={() => setTab('support')}>Go to Support</button></div>
              ) : (
                <div className="portal-record-grid">{visibleRecords.map((record) => (
                  <article className="portal-record-card" key={`${record.portalType}-${record.id}`}>
                    <div className="portal-record-top"><span className="portal-record-type">{PORTAL_RECORD_LABELS[record.portalType]}</span>{statusFor(record) && <span className={portalPillClass(statusFor(record))}>{statusFor(record)}</span>}</div>
                    <h3>{titleFor(record)}</h3>
                    <p>{detailFor(record)}</p>
                    <time>{portalDate(record.created_at)}</time>
                  </article>
                ))}</div>
              )}
            </section>
          )}

          {tab === 'support' && (
            <PortalSupport
              tickets={tickets}
              loading={ticketsLoading}
              error={ticketsError}
              onReload={() => { loadTickets({ silent: true }); }}
            />
          )}
        </>}
      </main>
      <footer className="customer-portal-footer">Storhet CRM · Secure customer access</footer>
    </div>
  );
}

const navSections = [
  { title: 'Overview', items: [['Dashboard', LayoutDashboard], ['Reports', BarChart3]] },
  { title: 'Customers & Sales', items: [['Customers', Users], ['Leads', UserPlus], ['Pipeline', Kanban], ['Products', FileText], ['Quotes', FileText], ['Invoices', CreditCard], ['Forecast', TrendingUp]] },
  { title: 'Work & Support', items: [['Activities', CalendarCheck], ['Field Visits', MapPin], ['Calendar', CalendarDays], ['Technical Support', UserCog], ['Tickets', Receipt], ['Documents', FileText]] },
  { title: 'Communication', items: [['Email', Mail], ['Chat', MessageCircle]] },
  { title: 'Automation & Insights', items: [['Automation', Workflow], ['Segments', Tags]] },
  { title: 'System', items: [['Settings', Settings]] }
];

const rolePanelNav = [
  ['MD Panel', BarChart3, 'manager'],
  ['HOS Panel', CheckCircle2, 'head_of_sales'],
  ['HR Panel', Users, 'hr'],
  ['Technical Support Panel', UserCog, 'technical_support']
];

const EXCHANGE_RATES = {
  NGN: { symbol: '₦', rate: 1400 },
  USD: { symbol: '$', rate: 1 },
  EUR: { symbol: '€', rate: 0.92 }
};

const COMMERCIAL_CURRENCIES = [
  ['USD', 'US Dollar'], ['NGN', 'Nigerian Naira'], ['EUR', 'Euro'], ['GBP', 'British Pound'],
  ['GHS', 'Ghanaian Cedi'], ['ZAR', 'South African Rand'], ['KES', 'Kenyan Shilling'],
  ['XOF', 'West African CFA Franc'], ['CAD', 'Canadian Dollar'], ['AUD', 'Australian Dollar'],
  ['AED', 'UAE Dirham'], ['SAR', 'Saudi Riyal'], ['CHF', 'Swiss Franc'], ['JPY', 'Japanese Yen'],
  ['CNY', 'Chinese Yuan'], ['INR', 'Indian Rupee'], ['OTHER', 'Other currency']
];
const formatCommercialAmount = (value, currency = 'USD') => {
  const code = String(currency || 'USD').toUpperCase();
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: code === 'OTHER' ? 'USD' : code, maximumFractionDigits: 2 }).format(Number(value) || 0); }
  catch { return `${code} ${(Number(value) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`; }
};

// ── Currency model ───────────────────────────────────────────────────────────
// USD is the base currency of the whole CRM. Deal amounts are stored in USD.
// Quotes and invoices keep their totals in the document's own currency
// (currency_code) with exchange_rate = USD value of 1 unit of that currency.
// Rows saved before currencies existed have no currency_code and are USD.
const docRateToUsd = doc => {
  const code = String(doc?.currency_code || 'USD').toUpperCase();
  if (code === 'USD') return 1;
  const rate = Number(doc?.exchange_rate);
  return Number.isFinite(rate) && rate > 0 ? rate : 1;
};
const docAmountUsd = (doc, field = 'total') => (Number(doc?.[field]) || 0) * docRateToUsd(doc);
// Payments have no currency of their own: they are recorded in their invoice's currency.
const paymentAmountUsd = (payment, invoices = []) =>
  (Number(payment?.amount) || 0) * docRateToUsd(invoices.find(i => i.id === payment?.invoice_id));
const suggestedUsdRate = code => {
  const upper = String(code || 'USD').toUpperCase();
  if (upper === 'USD') return 1;
  const known = EXCHANGE_RATES[upper];
  return known ? Number((1 / known.rate).toFixed(6)) : 1;
};

// ── On-demand data loading ───────────────────────────────────────────────────
// Which datasets each page needs. App loads these when the page is opened
// (see ensureData) instead of fetching every table at login.
const PAGE_DATA = {
  Dashboard: ['customers', 'leads', 'deals', 'activities', 'tickets'],
  'MD Panel': ['deals', 'quotes', 'invoices', 'customers'],
  'HOS Panel': ['deals', 'quotes', 'invoices', 'tickets'],
  'HR Panel': ['activities', 'customers', 'leads'],
  'Technical Support Panel': ['tickets', 'customers'],
  Customers: ['customers', 'deals'],
  Products: ['products', 'support'],
  'Technical Support': ['support'],
  Leads: ['leads', 'customers', 'products'],
  Email: ['emailLogs', 'customers', 'emailIntegrations'],
  Calendar: ['calendarEvents', 'customers'],
  Quotes: ['quotes', 'products', 'deals', 'dealProducts', 'customers'],
  Invoices: ['invoices', 'customers', 'products', 'deals', 'dealProducts', 'quotes'],
  Documents: ['documents', 'customers'],
  Automation: ['workflows'],
  Segments: ['segments', 'customers'],
  Forecast: ['deals'],
  Pipeline: ['deals', 'customers', 'support', 'dealProducts', 'products'],
  Activities: ['activities', 'customers'],
  'Field Visits': ['fieldVisits', 'customers'],
  Tickets: ['tickets', 'customers'],
  Reports: ['customers', 'deals', 'activities', 'tickets', 'leads', 'quotes', 'invoices'],
  'Email Logs': ['emailLogs', 'customers']
};
const CUSTOMER_DETAIL_DATA = ['customers', 'deals', 'activities', 'tickets', 'quotes', 'invoices', 'emailLogs', 'documents'];
const GLOBAL_SEARCH_DATA = ['customers', 'deals', 'activities', 'tickets', 'leads', 'quotes', 'invoices'];



function App() {

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authorized, setAuthorized] = useState(false);
  const [authorizationLoading, setAuthorizationLoading] = useState(true);
  const [authorizationProfile, setAuthorizationProfile] = useState(null);
  const [portalAccount, setPortalAccount] = useState(null);
  const [portalSetupPending, setPortalSetupPending] = useState(false);
  const [portalSignUpName, setPortalSignUpName] = useState('');
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [pendingPortalAccounts, setPendingPortalAccounts] = useState([]);
  const [portalRequestsLoading, setPortalRequestsLoading] = useState(false);
  const [portalRequestsError, setPortalRequestsError] = useState('');
  const [portalRequestsNotice, setPortalRequestsNotice] = useState('');
  const [portalRequestActionId, setPortalRequestActionId] = useState(null);

  // Keep the user's current CRM page across browser refreshes.
  // resetWorkspace() still explicitly sends the user to Dashboard when they sign out.
  const [page, setPage] = useState(readStoredPage);
  const [commercialLaunch, setCommercialLaunch] = useState(null);
  const [commercialView, setCommercialView] = useState(null);
  useEffect(() => { if (authorizationProfile?.role === 'technical_support' && page === 'Tickets') setPage('Technical Support Panel'); }, [authorizationProfile?.role, page]);

  const launchQuoteFromDeal = deal => {
    if (!deal || deal.stage !== 'Won') return;
    setCommercialLaunch({ type: 'quote', dealId: deal.id });
    setCommercialView({ type: 'quotes', dealId: deal.id });
    setPage('Quotes');
  };
  const launchInvoiceFromQuote = quote => {
    if (!quote || quote.approval_status !== 'APPROVED') return;
    setCommercialLaunch({ type: 'invoice', dealId: quote.deal_id || '', quoteId: quote.id });
    setCommercialView({ type: 'invoices', dealId: quote.deal_id || '' });
    setPage('Invoices');
  };
  const viewDealCommercials = (type, deal) => {
    setCommercialLaunch(null);
    setCommercialView({ type, dealId: deal?.id || '' });
    setPage(type === 'quotes' ? 'Quotes' : 'Invoices');
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [supportEngineers, setSupportEngineers] = useState([]);
  const [solutionSupport, setSolutionSupport] = useState([]);
  const [dealSupport, setDealSupport] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationAudioContextRef = useRef(null);
  const notificationAudioUnlockedRef = useRef(false);
  const [profileName, setProfileName] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [ownerProfiles, setOwnerProfiles] = useState({});
  const [showDealForm, setShowDealForm] = useState(false);
  const [newDeal, setNewDeal] = useState({ title: '', company: '', amount: '', stage: 'New Lead', customer_id: '', contact_name: '', contact_email: '', contact_phone: '', new_customer_name: '', new_customer_email: '', new_customer_phone: '', new_customer_company: '', new_customer_job_title: '', new_customer_birthday: '', closure_start_at: '', closure_end_at: '' });
  const [dealProducts, setDealProducts] = useState([]);
  const [expandedDealVendor, setExpandedDealVendor] = useState(null);
  const [selectedDealProductIds, setSelectedDealProductIds] = useState([]);
  const [dealSaving, setDealSaving] = useState(false);
  const [dealError, setDealError] = useState('');
  const [editingDeal, setEditingDeal] = useState(null);
  const [editDealSaving, setEditDealSaving] = useState(false);
  const [editDealError, setEditDealError] = useState('');
  const [search, setSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', company: '', email: '', phone: '', job_title: '', birthday: '', location_address: '', latitude: '', longitude: '', status: 'Active' });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openCustomerMenu, setOpenCustomerMenu] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activities, setActivities] = useState([]);
  const [fieldVisits, setFieldVisits] = useState([]);
  const [fieldVisitError, setFieldVisitError] = useState('');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '', type: 'Task', activity_date: '', customer_id: '',
    notes: '', status: 'Scheduled', priority: 'Medium', assigned_to: ''
  });
  const [activityError, setActivityError] = useState('');
  const [activitySaving, setActivitySaving] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editActivitySaving, setEditActivitySaving] = useState(false);
  const [editActivityError, setEditActivityError] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [leads, setLeads] = useState([]);
  const [leadProducts, setLeadProducts] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [quoteItems, setQuoteItems] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [segments, setSegments] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [phase2Error, setPhase2Error] = useState('');
  const [emailIntegrations, setEmailIntegrations] = useState([]);
  const [composeDraft, setComposeDraft] = useState(null);
  const [emailIntegrationLoading, setEmailIntegrationLoading] = useState(false);
  const [emailIntegrationError, setEmailIntegrationError] = useState('');
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSaving, setTicketSaving] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [editingTicket, setEditingTicket] = useState(null);
  const [editTicketSaving, setEditTicketSaving] = useState(false);
  const [editTicketError, setEditTicketError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [staffUsers, setStaffUsers] = useState([]);
  const [newTicket, setNewTicket] = useState({
    title: '', description: '', customer_id: '', status: 'Open', priority: 'Medium',
    category: 'General', assigned_to: '', portal_visible: true
  });
  const [saving, setSaving] = useState(false);
  const [customerError, setCustomerError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const toastTimer = useRef(null);
  const justSignedUp = useRef(false);
  const searchInputRef = useRef(null);
  const lastRefreshRef = useRef(Date.now());
  const refreshingRef = useRef(false);
  const loadedDataRef = useRef(new Set());
  const [readyDatasets, setReadyDatasets] = useState(() => new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [staffInviteToken, setStaffInviteToken] = useState(null);
  const [staffInviteInfo, setStaffInviteInfo] = useState(null);
  const [staffInviteChecking, setStaffInviteChecking] = useState(false);
  const [staffInviteError, setStaffInviteError] = useState('');
  const [showStaffOnboarding, setShowStaffOnboarding] = useState(false);
  const [staffInvitations, setStaffInvitations] = useState([]);
  const [staffInvitationsLoading, setStaffInvitationsLoading] = useState(false);
  const [staffInvitationsError, setStaffInvitationsError] = useState('');
  const [staffInvitationActionId, setStaffInvitationActionId] = useState(null);
  const [toast, setToast] = useState('');

  const [theme, setTheme] = useState(readStoredTheme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* storage unavailable */ }
  }, [theme]);

  // Persist the active page so a browser refresh returns to the same CRM section
  // instead of always starting from Dashboard.
  useEffect(() => {
    try { localStorage.setItem(PAGE_STORAGE_KEY, page); } catch { /* storage unavailable */ }
  }, [page]);
  const [currency, setCurrency] = useState(() => {
    try { return localStorage.getItem('orbit_currency_v2') || 'USD'; } catch { return 'USD'; }
  });
  useEffect(() => {
    try { localStorage.setItem('orbit_currency_v2', currency); } catch { /* storage unavailable */ }
  }, [currency]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('email_connected');
    const emailError = params.get('email_error');
    if (connected) { showToast(`${connected === 'gmail' ? 'Gmail' : 'Outlook'} connected successfully.`); fetchEmailIntegrations(); window.history.replaceState({}, document.title, window.location.pathname); }
    if (emailError) { setEmailIntegrationError(emailError); setPage('Email'); window.history.replaceState({}, document.title, window.location.pathname); }
  }, [session]);

  useEffect(() => {
  if (!IS_NATIVE) return;
  const handle = CapApp.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith(NATIVE_REDIRECT)) return;
    await Browser.close();
    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
      return;
    }
    const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''));
    const access_token = hash.get('access_token');
    const refresh_token = hash.get('refresh_token');
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  });
  return () => { handle.then(h => h.remove()); };
}, []);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 5000);
  };

  const pageDataReady = (PAGE_DATA[page] || []).every(key => readyDatasets.has(key));

  const formatAmount = (amountInUSD) => {
    const numericAmount = Number(amountInUSD) || 0;
    const config = EXCHANGE_RATES[currency] || EXCHANGE_RATES.USD;
    const convertedAmount = numericAmount * config.rate;

    return `${config.symbol}${convertedAmount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  const filteredCustomers = useMemo(() => customers.filter(c => (statusFilter === 'All' || (c.status || 'Active') === statusFilter) && `${c.name} ${c.company || ''} ${c.email || ''}`.toLowerCase().includes(search.toLowerCase())), [customers, search, statusFilter]);
  const globalSearchResults = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();

    if (!query) return [];

    const results = [];
    customers.forEach(customer => {
      const text = `${customer.name} ${customer.company || ''} ${customer.email}`.toLowerCase();

      if (text.includes(query)) {
        results.push({
          type: 'Customer',
          title: customer.name,
          subtitle: customer.company || customer.email,
          page: 'Customers',
          customer
        });
      }
    });

    deals.forEach(deal => {
      const text = `${deal.title} ${deal.company || ''}`.toLowerCase();

      if (text.includes(query)) {
        results.push({
          type: 'Deal',
          title: deal.title,
          subtitle: deal.company || 'No company specified',
          page: 'Pipeline',
          deal
        });
      }
    });

    activities.forEach(activity => {
      const text = `${activity.title} ${activity.type || ''} ${activity.notes || ''}`.toLowerCase();

      if (text.includes(query)) {
        results.push({
          type: 'Activity',
          title: activity.title,
          subtitle: activity.type || 'Activity',
          page: 'Activities',
          activity
        });
      }
    });

    tickets.forEach(ticket => {
      const text = `${ticket.title} ${ticket.description || ''} ${ticket.category || ''}`.toLowerCase();

      if (text.includes(query)) {
        results.push({
          type: 'Ticket',
          title: ticket.title,
          subtitle: ticket.category || 'Support ticket',
          page: 'Tickets',
          ticket
        });
      }
    });

    leads.forEach(lead => { const text = `${lead.name || ''} ${lead.email || ''} ${lead.company || ''} ${lead.source || ''}`.toLowerCase(); if (text.includes(query)) results.push({ type: 'Lead', title: lead.name || lead.email, subtitle: lead.company || lead.source || 'Lead', page: 'Leads', lead }); });
    quotes.forEach(q => { const text = `${q.quote_number || ''} ${q.title || ''} ${q.customer_name || ''} ${q.company || ''} ${q.email || ''}`.toLowerCase(); if (text.includes(query)) results.push({ type: 'Quote', title: q.quote_number || q.title, subtitle: q.customer_name || q.company || 'Quote', page: 'Quotes', quote: q }); });
    invoices.forEach(i => { const text = `${i.invoice_number || ''} ${i.title || ''} ${i.customers?.name || ''}`.toLowerCase(); if (text.includes(query)) results.push({ type: 'Invoice', title: i.invoice_number || i.title, subtitle: i.customers?.name || 'Invoice', page: 'Invoices', invoice: i }); });
    return results.slice(0, 12);
  }, [globalSearch, customers, deals, activities, tickets, leads, quotes, invoices]);
  const revenue = deals
    .filter(d => d.stage === 'Won')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  // Fetching From supabase
  // async function signInWithGoogle() {
  //   setAuthError('');

  //   const { error } = await supabase.auth.signInWithOAuth({
  //     provider: 'google',
  //     options: {
  //       redirectTo: window.location.origin,
  //       queryParams: {
  //         prompt: 'select_account'
  //       }
  //     }
  //   });

  //   if (error) {
  //     console.error('Google sign-in error:', error);
  //     setAuthError(error.message);
  //   }
  // }
  // async function signInWithMicrosoft() {
  //   setAuthError('');

  //   const { error } = await supabase.auth.signInWithOAuth({
  //     provider: 'azure',
  //     options: {
  //       redirectTo: window.location.origin,
  //       scopes: 'email'
  //     }
  //   });

  //   if (error) {
  //     console.error('Microsoft sign-in error:', error);
  //     setAuthError(error.message);
  //   }
  // }
  async function oauthSignIn(provider, extraOptions = {}) {
    setAuthError('');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: IS_NATIVE ? NATIVE_REDIRECT : window.location.origin,
        skipBrowserRedirect: IS_NATIVE,
        ...extraOptions
      }
    });
    if (error) {
      console.error(`${provider} sign-in error:`, error);
      setAuthError(error.message);
      return;
    }
    if (IS_NATIVE && data?.url) await Browser.open({ url: data.url });
  }
  const signInWithGoogle = () => oauthSignIn('google', { queryParams: { prompt: 'select_account' } });
  const signInWithMicrosoft = () => oauthSignIn('azure', { scopes: 'email' });

  async function signInWithEmail(event) {
    event.preventDefault();
    justSignedUp.current = false;
    setAuthError('');
    setAuthNotice('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setAuthError('Please enter both your email address and password.');
      return;
    }

    setEmailLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password
      });

      if (error) {
        console.error('Email sign-in error:', error);
        setAuthError(error.message);
      } else if (data?.user) {
        // Re-verify workspace authorization status
        await checkAuthorization(data.session);
      }
    } catch (err) {
      console.error('Unexpected sign-in error:', err);
      setAuthError('An unexpected error occurred during sign in.');
    } finally {
      setEmailLoading(false);
    }
  }

  async function signUpWithEmail(event) {
    event.preventDefault();
    setAuthError('');
    setAuthNotice('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setAuthError('Please enter both an email address and a password.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setEmailLoading(true);

    try {
      // 1. Create Supabase Auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password
      });

      if (signUpError) {
        console.error('Email signup error:', signUpError);
        setAuthError(signUpError.message);
        return;
      }

      const newUser = authData?.user;

      if (newUser) {
        // 2. Insert user into authorized_users as 'pending' for admin approval
        const { error: insertError } = await supabase
          .from('authorized_users')
          .insert([
            {
              user_id: newUser.id,
              email: trimmedEmail,
              role: DEFAULT_ROLE,
              status: 'pending'
            }
          ]);

        if (insertError) {
          console.warn('Could not provision authorized_users entry:', insertError.message);
        }
      }

      justSignedUp.current = true;
      setAuthNotice(
        'Account created successfully! Check your inbox if email confirmation is required. An administrator must approve your account access before you can log in.'
      );

      // Sign out until approval is granted
      await supabase.auth.signOut();
      setPassword('');
    } catch (err) {
      console.error('Unexpected signup error:', err);
      setAuthError('An unexpected error occurred while creating your account.');
    } finally {
      setEmailLoading(false);
    }
  }
  async function signUpCustomerPortal(event, fullName) {
    setAuthError('');
    setAuthNotice('');
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password || !fullName.trim()) {
      setAuthError('Please enter your name, email address and password.');
      return false;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return false;
    }
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/?portal=1`,
          data: { account_type: 'customer_portal', full_name: fullName.trim() }
        }
      });
      if (error) throw error;
      setAuthNotice('Registration submitted. Verify your email if prompted, then wait for an Storhet CRM admin to review your customer portal access request.');
      setPassword('');
      setPortalSignUpName(fullName.trim());
      return true;
    } catch (error) {
      console.error('Customer portal sign-up error:', error);
      setAuthError(error.message || 'Unable to create your customer portal account.');
      return false;
    } finally {
      setEmailLoading(false);
    }
  }
  // A staff invite link (?staff_invite=<token>) is checked once, before sign-in.
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('staff_invite');
    if (!token) return;
    setStaffInviteToken(token);
    setStaffInviteChecking(true);
    supabase.rpc('staff_invitation_lookup', { p_token: token }).then(({ data, error }) => {
      setStaffInviteChecking(false);
      if (error || !data || data.length === 0) {
        setStaffInviteError('This invitation link is invalid or has expired. Please ask your MD or admin for a new one.');
        return;
      }
      setStaffInviteInfo({ ...data[0], token });
    });
  }, []);

  async function signUpStaffInvite(event, fullName, invitePassword) {
    event.preventDefault();
    setAuthError('');
    setAuthNotice('');
    if (!fullName.trim() || !invitePassword) { setAuthError('Please enter your name and a password.'); return; }
    if (invitePassword.length < 6) { setAuthError('Password must be at least 6 characters long.'); return; }
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: staffInviteInfo.email,
        password: invitePassword,
        options: {
          data: { account_type: 'staff_invite', full_name: fullName.trim(), staff_invite_token: staffInviteInfo.token }
        }
      });
      if (error) throw error;
      setAuthNotice('Account created. Verify your email if prompted, then you will be taken straight into Storhet CRM.');
    } catch (err) {
      console.error('Staff invite sign-up error:', err);
      setAuthError(err.message || 'Unable to create your account.');
    } finally {
      setEmailLoading(false);
    }
  }

  const resetWorkspace = () => {
    setPage('Dashboard');
    setCustomers([]);
    setDeals([]);
    setDealProducts([]);
    setSupportEngineers([]);
    setSolutionSupport([]);
    setDealSupport([]);
    setStaffUsers([]);
    setActivities([]);
    setTickets([]); setLeads([]); setLeadProducts([]); setEmailLogs([]); setCalendarEvents([]); setQuotes([]); setInvoices([]); setPayments([]); setDocuments([]); setWorkflows([]); setSegments([]);
    setNotifications([]);
    setQuoteItems([]);
    setUnreadNotificationCount(0);
    setAuthorizedUsers([]);
    setPortalAccount(null);
    setPortalSetupPending(false);
    setSelectedCustomer(null);
    setShowNotifications(false);
  };
  const handleSignOut = async () => {
    resetWorkspace();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      setAuthError('Unable to sign out. Please try again.');
    }
  };
  const checkAuthorization = async (currentSession, { silent = false } = {}) => {
    if (!currentSession?.user) {
      setAuthorized(false);
      setAuthorizationProfile(null);
      setPortalAccount(null);
      setPortalSetupPending(false);
      setAuthorizationLoading(false);
      return;
    }

    if (!silent) setAuthorizationLoading(true);
    setPortalAccount(null);
    setPortalSetupPending(false);

    const { data, error } = await supabase
      .from('authorized_users')
      .select('role, status')
      .eq('user_id', currentSession.user.id)
      .maybeSingle();

    if (error) {
      console.error('Authorization check failed:', error);
      setAuthError('Unable to verify your account access.');
      setAuthorized(false);
      setAuthorizationProfile(null);
      setAuthorizationLoading(false);
      return;
    }

    // A customer-portal account must never be routed into the internal CRM,
    // even if an older/stale authorized_users row marks the same user as a member.
    // Portal account_type takes precedence over internal role/status.
    if (
      data?.status === 'active' &&
      currentSession.user.user_metadata?.account_type !== 'customer_portal'
    ) {
      setAuthorized(true);
      setAuthorizationProfile(data);
      setPortalAccount(null);
      setPortalSetupPending(false);
      setAuthorizationLoading(false);
      return;
    }

    setAuthorized(false);
    setAuthorizationProfile(null);

    // Only accounts explicitly created for the customer portal may use this path.
    // Ordinary internal CRM sign-ups continue to require staff approval.
    if (currentSession.user.user_metadata?.account_type === 'customer_portal') {
      try {
        let { data: account, error: accountError } = await supabase
          .from('customer_portal_accounts')
          .select('user_id, customer_id, email, full_name, status, registration_source')
          .eq('user_id', currentSession.user.id)
          .maybeSingle();
        if (accountError) throw accountError;

        // Create/refresh the portal registration after email verification.
        // The database function always leaves self-registrations pending; only
        // an authorized CRM admin can approve access.
        if (
          currentSession.user.email_confirmed_at &&
          (!account || account.registration_source === 'signup')
        ) {
          const { error: completionError } = await supabase.rpc('complete_customer_portal_signup', {
            p_full_name: currentSession.user.user_metadata?.full_name || account?.full_name || portalSignUpName || null
          });
          if (completionError) throw completionError;
          const refreshed = await supabase
            .from('customer_portal_accounts')
            .select('user_id, customer_id, email, full_name, status, registration_source')
            .eq('user_id', currentSession.user.id)
            .maybeSingle();
          if (refreshed.error) throw refreshed.error;
          account = refreshed.data;
        }

        setPortalAccount(account || null);
        setPortalSetupPending(!account);
        setAuthorizationLoading(false);
        if (!account) setAuthNotice('Please verify your email address. Once verified, your request will remain pending until an Storhet CRM admin approves it.');
        return;
      } catch (portalError) {
        console.error('Customer portal authorization check failed:', portalError);
        setPortalAccount(null);
        setPortalSetupPending(true);
        setAuthError(portalError.message || 'Unable to finish customer portal setup.');
        setAuthorizationLoading(false);
        return;
      }
    }

    // An invited worker has no authorized_users row yet on their very first
    // sign-in; this is the only time this branch runs, since every later
    // login finds an active row and returns from the top of this function.
    if (
      !data &&
      currentSession.user.user_metadata?.account_type === 'staff_invite' &&
      currentSession.user.email_confirmed_at
    ) {
      try {
        const { error: inviteCompletionError } = await supabase.rpc('complete_staff_invitation_signup', {
          p_token: currentSession.user.user_metadata?.staff_invite_token,
          p_full_name: currentSession.user.user_metadata?.full_name || null
        });
        if (inviteCompletionError) throw inviteCompletionError;
        const refreshed = await supabase.from('authorized_users').select('role, status').eq('user_id', currentSession.user.id).maybeSingle();
        if (refreshed.error) throw refreshed.error;
        if (refreshed.data?.status === 'active') {
          setAuthorized(true);
          setAuthorizationProfile(refreshed.data);
          setAuthorizationLoading(false);
          setShowStaffOnboarding(true);
          return;
        }
      } catch (staffInviteCompletionError) {
        console.error('Staff invitation completion failed:', staffInviteCompletionError);
        setAuthError(staffInviteCompletionError.message || 'Unable to complete your invited sign-up.');
        setAuthorizationLoading(false);
        await supabase.auth.signOut();
        return;
      }
    }

    setAuthorizationLoading(false);
    await supabase.auth.signOut();
    if (!justSignedUp.current) {
      setAuthError('Your internal CRM account has not been approved yet. Please contact your administrator.');
    }
  };
  const fetchCustomers = async () => {
    setLoading(true);

    const { data, error } = await fetchAllRows(() => supabase
      .from("customers")
      .select("*")
      .order("created_at", {
        ascending: false,
      }));

    if (error) {
      console.error("Error fetching customers:", error);
    } else {
      setCustomers(data);
    }

    setLoading(false);
  };
  const fetchDeals = async () => {
    const { data, error } = await fetchAllRows(() => supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false }));

    if (error) {
      console.error('Error fetching deals:', error);
    } else {
      setDeals(data || []);
    }
  };
  async function fetchActivities() {
    const { data, error } = await fetchAllRows(() => supabase
      .from('activities')
      .select('*')
      .order('activity_date', { ascending: true }));
    if (error) {
      console.error('Error fetching activities:', error);
      return;
    }
    setActivities(data || []);
  }

  async function fetchFieldVisits() {
    const { data, error } = await supabase
      .from('field_visits')
      .select('*')
      .order('check_in_at', { ascending: false });
    if (error) {
      if (!['42P01', 'PGRST205'].includes(error.code)) console.error('Error fetching field visits:', error);
      setFieldVisitError(error.code === '42P01' || error.code === 'PGRST205' ? 'Field visits are not set up yet. Run the Phase 1 field-visit SQL migration.' : error.message);
      return;
    }
    setFieldVisitError('');
    setFieldVisits(data || []);
  }
  async function fetchTickets() {
    const { data, error } = await fetchAllRows(() => supabase
      .from('tickets')
      .select(`
      *,
      customers (
        name,
        company
      )
    `)
      .order('created_at', { ascending: false }));

    if (error) {
      console.error('Error fetching tickets:', error);
      return;
    }

    setTickets(data || []);
  }
  async function fetchEmailIntegrations() {
    if (!session?.user?.id) return;
    setEmailIntegrationLoading(true); setEmailIntegrationError('');
    const { data, error } = await supabase.from('email_integrations').select('id, provider, email_address, status, created_at, updated_at').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (error) { console.error('Error fetching email integrations:', error); setEmailIntegrationError(error.message); setEmailIntegrations([]); }
    else setEmailIntegrations(data || []);
    setEmailIntegrationLoading(false);
  }
  async function connectEmailProvider(provider) {
    setEmailIntegrationError('');
    try {
      const functionName = provider === 'gmail' ? 'gmail-oauth-start' : 'outlook-oauth-start';
      const { data, error } = await supabase.functions.invoke(functionName, { body: { return_to: window.location.origin } });
      if (error) throw error;
      if (!data?.url) throw new Error(`The ${provider} OAuth function did not return an authorization URL.`);
      window.location.href = data.url;
    } catch (error) { console.error(`Error connecting ${provider}:`, error); setEmailIntegrationError(error.message || `Could not start ${provider} connection.`); }
  }
  async function disconnectEmailProvider(id) {
    if (!window.confirm('Disconnect this email account?')) return;
    const { error } = await supabase.from('email_integrations').update({ status: 'disconnected' }).eq('id', id).eq('user_id', session.user.id);
    if (error) { setEmailIntegrationError(error.message); return; }
    fetchEmailIntegrations();
  }

  async function fetchLeads() {
    const { data, error } = await fetchAllRows(() => supabase.from('leads')
      .select('*, customers(name,company)')
      .order('created_at', { ascending: false }));
    if (error) {
      console.error('Error fetching leads:', error);
      return;
    } setLeads(data || []);
  }
  async function fetchLeadProducts() {
    const { data, error } = await supabase
      .from('lead_products')
      .select('lead_id, product_id');
    if (error) {
      console.error('Error fetching lead solutions:', error);
      return;
    }
    setLeadProducts(data || []);
  }
  async function fetchDealProducts() {
    const { data, error } = await supabase
      .from('deal_products')
      .select('deal_id, product_id');
    if (error) {
      console.error('Error fetching deal solutions:', error);
      return;
    }
    setDealProducts(data || []);
  }
  async function fetchEmailLogs() {
    if (!session?.user?.id) return;

    const { data, error } = await fetchAllRows(() => supabase
      .from('email_logs')
      .select('*, customers(name,company)')
      .eq('created_by', session.user.id) // <--- Adds privacy filter
      .order('sent_at', { ascending: false }));

    if (error) {
      console.error('Error fetching email logs:', error);
      return;
    }

    setEmailLogs(data || []);
  }
  async function createDueCalendarNotifications(calendarRows = []) {
    if (!session?.user?.id || !calendarRows.length) return;

    const now = Date.now();
    const EVENT_TIME_GRACE_MS = 2 * 60 * 1000;

    const upcoming = calendarRows.filter(event => {
      if (!event?.id || !event?.start_at || event.status === 'Cancelled' || event.reminder_minutes == null) return false;

      const start = new Date(event.start_at).getTime();
      const reminderMinutes = Number(event.reminder_minutes);
      if (!Number.isFinite(start) || !Number.isFinite(reminderMinutes) || reminderMinutes < 0) return false;

      const reminderAt = start - (reminderMinutes * 60 * 1000);

      // Normal reminders fire once their reminder time has been reached,
      // as long as the event itself has not already passed.
      if (reminderMinutes > 0) {
        return reminderAt <= now && start > now;
      }

      // "At event time" needs a small grace period because the browser's
      // polling/check will almost never happen at the exact millisecond of
      // the event start. This prevents the old `start > now` check from
      // silently skipping the reminder.
      return start <= now && start >= (now - EVENT_TIME_GRACE_MS);
    });

    if (!upcoming.length) return;

    const { data: existing, error: existingError } = await supabase
      .from('notifications')
      .select('message')
      .eq('user_id', session.user.id)
      .eq('type', 'calendar_reminder')
      .limit(500);

    if (existingError) {
      console.error('Failed to check calendar reminders:', existingError);
      return;
    }

    const existingMessages = new Set((existing || []).map(item => item.message || ''));
    const inserts = [];

    upcoming.forEach(event => {
      const key = `calendar-reminder:${event.id}:${event.reminder_minutes}`;
      if ([...existingMessages].some(message => message.includes(`[${key}]`))) return;

      const start = new Date(event.start_at);
      const diffMs = start.getTime() - now;
      const diffMinutes = Math.max(0, Math.ceil(diffMs / 60000));
      let whenText = 'starting now';

      if (diffMinutes >= 1440) {
        const days = Math.ceil(diffMinutes / 1440);
        whenText = `${days} day${days === 1 ? '' : 's'} to go`;
      } else if (diffMinutes >= 60) {
        const hours = Math.ceil(diffMinutes / 60);
        whenText = `${hours} hour${hours === 1 ? '' : 's'} to go`;
      } else if (diffMinutes > 0) {
        whenText = `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} to go`;
      }

      inserts.push({
        user_id: session.user.id,
        type: 'calendar_reminder',
        title: `Upcoming: ${event.title || 'Calendar event'}`,
        message: `${event.title || 'Calendar event'} — ${whenText} [${key}]`,
        link: 'Calendar'
      });
    });

    if (inserts.length) {
      const { error } = await supabase.from('notifications').insert(inserts);
      if (error) {
        console.error('Failed to create calendar reminders:', error);
      } else {
        await fetchNotifications();
      }
    }
  }

  async function fetchCalendarEvents() {
    const { data, error } = await fetchAllRows(() => supabase.from('calendar_events').select('*, customers(name,company)').order('start_at', { ascending: true }));
    if (error) { console.error('Error fetching calendar events:', error); return; }
    setCalendarEvents(data || []);
    createDueCalendarNotifications(data || []);
  }

  // Reminder poller: fetch only events that could be due (reminders go up to
  // 3 days ahead), never the whole calendar table.
  async function fetchDueCalendarReminders() {
    const now = Date.now();
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*, customers(name,company)')
      .not('reminder_minutes', 'is', null)
      .gte('start_at', new Date(now - 10 * 60 * 1000).toISOString())
      .lte('start_at', new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString())
      .limit(500);
    if (error) { console.error('Error checking calendar reminders:', error); return; }
    createDueCalendarNotifications(data || []);
  }
  async function fetchQuotes() {
    const { data, error } = await fetchAllRows(() => supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false }));
    if (error) { console.error('Error fetching quotes:', error); return; }
    setQuotes(data || []);
  }

  async function fetchQuoteItems() {
    const { data, error } = await supabase
      .from('quote_items')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) { console.error('Error fetching quote items:', error); return; }
    setQuoteItems(data || []);
  }

  async function resolvePersistedQuote(quote) {
    if (!quote?.id?.toString().startsWith('local-')) return quote;

    // Older optimistic quotes can remain in local state when the background
    // sync happened before a schema fix or while the request was still running.
    // Never send a temporary `local-*` id to Supabase, because quote ids are UUIDs.
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('quote_number', quote.quote_number)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data?.[0]) {
        const persisted = data[0];
        setQuotes(prev => prev.map(item => item.id === quote.id ? persisted : item));
        return persisted;
      }

      await new Promise(resolve => setTimeout(resolve, 250));
    }

    throw new Error('This quote is still being saved. Please wait a moment and try Edit again.');
  }

  async function loadQuoteItems(quoteOrId) {
    const quote = typeof quoteOrId === 'object' ? quoteOrId : { id: quoteOrId };
    const persistedQuote = await resolvePersistedQuote(quote);
    const quoteId = persistedQuote.id;

    const { data, error } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Keep the shared quote-items state in sync as well, so the edit form
    // and the rest of the Quotes page always see the same data.
    setQuoteItems(prev => [
      ...prev.filter(item => item.quote_id !== quoteId),
      ...(data || [])
    ]);

    return data || [];
  }
  async function fetchInvoices() { const { data, error } = await fetchAllRows(() => supabase.from('invoices').select('*, customers(name,company)').order('created_at', { ascending: false })); if (error) { console.error('Error fetching invoices:', error); return; } setInvoices(data || []); }
  async function fetchPayments() { const { data, error } = await fetchAllRows(() => supabase.from('payments').select('*').order('paid_at', { ascending: false })); if (error) { console.error('Error fetching payments:', error); return; } setPayments(data || []); }
  async function fetchDocuments() { const { data, error } = await fetchAllRows(() => supabase.from('documents').select('*, customers(name,company)').order('created_at', { ascending: false })); if (error) { console.error('Error fetching documents:', error); return; } setDocuments(data || []); }
  async function fetchWorkflows() { const { data, error } = await fetchAllRows(() => supabase.from('workflows').select('*').order('created_at', { ascending: false })); if (error) { console.error('Error fetching workflows:', error); return; } setWorkflows(data || []); }
  async function fetchSegments() { const { data, error } = await fetchAllRows(() => supabase.from('customer_segments').select('*').order('created_at', { ascending: false })); if (error) { console.error('Error fetching segments:', error); return; } setSegments(data || []); }
  async function fetchProducts() { const { data, error } = await fetchAllRows(() => supabase.from('products').select('*').order('created_at', { ascending: false })); if (error) { console.error('Error fetching products:', error); return; } setProducts(data || []); }
  async function fetchSupportEngineers() {
    const { data, error } = await supabase.from('support_engineers').select('*').order('name', { ascending: true });
    if (error) { console.error('Error fetching support engineers:', error); return; }
    setSupportEngineers(data || []);
  }
  async function fetchSolutionSupport() {
    const { data, error } = await supabase.from('solution_support_engineers').select('*, support_engineers(id,name,email,role,status)').order('created_at', { ascending: true });
    if (error) { console.error('Error fetching solution support:', error); return; }
    setSolutionSupport(data || []);
  }
  async function fetchDealSupport() {
    const { data, error } = await supabase.from('deal_support_engineers').select('*, support_engineers(id,name,email,role,status)').order('created_at', { ascending: true });
    if (error) { console.error('Error fetching deal support:', error); return; }
    setDealSupport(data || []);
  }

  async function addLead(payload, productIds = []) {
    const uniqueProductIds = [...new Set(productIds || [])];

    const { data: result, error: rpcError } = await supabase.rpc('create_lead_with_pipeline', {
      p_name: payload.name,
      p_email: payload.email,
      p_phone: payload.phone,
      p_company: payload.company,
      p_source: payload.source,
      p_status: payload.status,
      p_customer_id: payload.customer_id || null,
      p_product_ids: uniqueProductIds
    });

    if (rpcError) throw rpcError;

    if (!result?.lead_id || !result?.deal_id) {
      throw new Error('Lead was created, but the Pipeline record could not be confirmed.');
    }

    if (payload.job_title || payload.birthday) {
      const { error: contactError } = await supabase
        .from('leads')
        .update({ job_title: payload.job_title?.trim() || null, birthday: payload.birthday || null })
        .eq('id', result.lead_id);
      if (contactError) throw contactError;
    }

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*, customers(name,company)')
      .eq('id', result.lead_id)
      .single();

    if (leadError) throw leadError;

    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', result.deal_id)
      .single();

    if (dealError) throw dealError;

    setLeads(prev => [lead, ...prev]);
    setDeals(prev => [deal, ...prev]);

    // The database function already created the lead_products rows.
    // Keep local state in sync immediately without another insert.
    setLeadProducts(prev => [
      ...prev.filter(row => row.lead_id !== lead.id),
      ...uniqueProductIds.map(productId => ({
        lead_id: lead.id,
        product_id: productId
      }))
    ]);

    return lead;
  }

  async function updateLead(id, payload) {
    const { data, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', id)
      .select('*, customers(name,company)')
      .single();

    if (error) throw error;

    setLeads(prev => prev.map(x => x.id === id ? data : x));

    return data;
  }
  async function syncLeadProducts(leadId, productIds) {
    const { error: deleteError } = await supabase
      .from('lead_products')
      .delete()
      .eq('lead_id', leadId);
    if (deleteError) throw deleteError;

    const uniqueProductIds = [...new Set(productIds || [])];
    if (uniqueProductIds.length > 0) {
      const rows = uniqueProductIds.map(productId => ({
        lead_id: leadId,
        product_id: productId
      }));
      const { error: insertError } = await supabase
        .from('lead_products')
        .insert(rows);
      if (insertError) throw insertError;
    }

    setLeadProducts(prev => [
      ...prev.filter(row => row.lead_id !== leadId),
      ...uniqueProductIds.map(productId => ({ lead_id: leadId, product_id: productId }))
    ]);
  }
  async function deleteLead(id) { if (!window.confirm('Delete this lead?')) return; const { error } = await supabase.from('leads').delete().eq('id', id); if (error) { alert(error.message); return; } setLeads(prev => prev.filter(x => x.id !== id)); }

  function datasetLoaders(key) {
    switch (key) {
      case 'customers': return [fetchCustomers()];
      case 'deals': return [fetchDeals()];
      case 'activities': return [fetchActivities()];
      case 'tickets': return [fetchTickets()];
      case 'fieldVisits': return [fetchFieldVisits()];
      case 'leads': return [fetchLeads(), fetchLeadProducts()];
      case 'products': return [fetchProducts()];
      case 'support': return [fetchSupportEngineers(), fetchSolutionSupport(), fetchDealSupport()];
      case 'dealProducts': return [fetchDealProducts()];
      case 'quotes': return [fetchQuotes(), fetchQuoteItems()];
      case 'invoices': return [fetchInvoices(), fetchPayments()];
      case 'documents': return [fetchDocuments()];
      case 'workflows': return [fetchWorkflows()];
      case 'segments': return [fetchSegments()];
      case 'calendarEvents': return [fetchCalendarEvents()];
      case 'emailLogs': return [fetchEmailLogs()];
      case 'emailIntegrations': return [fetchEmailIntegrations()];
      default: return [];
    }
  }

  // Loads datasets the first time they are needed. Safe to call repeatedly:
  // anything already loaded (or loading) is skipped.
  async function ensureData(datasets = []) {
    const missing = datasets.filter(d => !loadedDataRef.current.has(d));
    if (!missing.length) return;
    missing.forEach(d => loadedDataRef.current.add(d));
    await Promise.all(missing.map(async key => {
      try {
        await Promise.all(datasetLoaders(key));
      } catch (error) {
        console.error(`Failed to load ${key}:`, error);
      } finally {
        setReadyDatasets(prev => new Set(prev).add(key));
      }
    }));
  }
  function openCompose(defaults = {}) {
    ensureData(['emailIntegrations']);
    setComposeDraft(defaults);
  }

  // Sends through the send-email Edge Function, which also records the email in the log.
  async function sendEmail(payload) {
    const { data, error } = await supabase.functions.invoke('send-email', { body: payload });
    if (error) {
      let message = error.message;
      try { const details = await error.context?.json(); if (details?.error) message = details.error; } catch { /* keep the default message */ }
      fetchEmailLogs();
      throw new Error(message);
    }
    if (data?.error) { fetchEmailLogs(); throw new Error(data.error); }
    fetchEmailLogs();
    showToast(data?.logged === false ? 'Email sent, but it could not be saved to the log.' : 'Email sent.');
  }
  async function addEmailLog(payload) { const { data, error } = await supabase.from('email_logs').insert([{ ...payload, created_by: session.user.id }]).select('*, customers(name,company)').single(); if (error) throw error; setEmailLogs(prev => [data, ...prev]); return data; }
  async function addCalendarEvent(payload) { const { data, error } = await supabase.from('calendar_events').insert([{ ...payload, created_by: session.user.id }]).select('*, customers(name,company)').single(); if (error) throw error; setCalendarEvents(prev => [...prev, data].sort((a, b) => new Date(a.start_at) - new Date(b.start_at))); return data; }
  async function updateCalendarEvent(id, payload) { const { data, error } = await supabase.from('calendar_events').update(payload).eq('id', id).select('*, customers(name,company)').single(); if (error) throw error; setCalendarEvents(prev => prev.map(x => x.id === id ? data : x)); return data; }
  async function deleteCalendarEvent(id) { const { error } = await supabase.from('calendar_events').delete().eq('id', id); if (error) throw error; setCalendarEvents(prev => prev.filter(x => x.id !== id)); }
  async function loadInvoiceItems(invoiceOrId) {
    const invoiceId = typeof invoiceOrId === 'object' ? invoiceOrId?.id : invoiceOrId;
    if (!invoiceId) return [];
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function addQuote(payload, items = []) {
    const linkedDeal = payload?.deal_id ? deals.find(deal => deal.id === payload.deal_id) : null;
    if (payload?.deal_id && (!linkedDeal || linkedDeal.stage !== 'Won')) throw new Error('A quote can only be linked to a Won Deal.');
    payload = { ...payload, customer_id: payload.customer_id || linkedDeal?.customer_id || null, sales_rep_id: payload.sales_rep_id || linkedDeal?.created_by || session.user.id };
    const quoteAmount = Number(payload?.total) || 0;
    payload = { ...payload, approval_status: null, approval_stage: null };
    // Generate the UUID on the client so the quote and its line items can be
    // saved with the same real UUID without relying on an INSERT ... RETURNING
    // SELECT permission. The human-facing quote number is separate and stays
    // immutable after creation.
    const quoteId = crypto.randomUUID();
    const quoteToInsert = {
      id: quoteId,
      ...payload,
      created_by: session.user.id
    };

    // Save the quote itself first. We intentionally do not chain .select()
    // here, so a missing SELECT policy cannot make a successful INSERT look
    // like a failed save.
    const { error: quoteError } = await supabase
      .from('quotes')
      .insert([quoteToInsert]);

    if (quoteError) throw quoteError;

    // Show the saved quote immediately and close the form. The line items are
    // persisted immediately afterwards using the same real UUID.
    setQuotes(prev => [quoteToInsert, ...prev.filter(quote => quote.id !== quoteId)]);

    const rows = (items || []).map(item => ({
      quote_id: quoteId,
      product_id: item.product_id || null,
      product_name: item.product_name,
      description: item.description || null,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      discount: Number(item.discount) || 0,
      discount_percent: Number(item.discount_percent) || 0,
      tax: Number(item.tax) || 0,
      total: Number(item.total) || 0
    }));

    if (rows.length) {
      // Do not require SELECT permission on quote_items just to save them.
      // The database INSERT is the important operation here.
      const { error: itemError } = await supabase
        .from('quote_items')
        .insert(rows);

      if (itemError) {
        console.error('Quote saved, but quote items could not be saved:', itemError);
        // Keep the quote visible. The error can be diagnosed without losing
        // the quote itself.
      } else {
        setQuoteItems(prev => [
          ...prev.filter(item => item.quote_id !== quoteId),
          ...rows.map((item, index) => ({
            ...item,
            id: `local-item-${quoteId}-${index}`,
            created_at: new Date().toISOString()
          }))
        ]);
      }
    }

    if (Number(quoteToInsert.total) >= 20000) await notifyRoles(['head_of_sales'], 'Quote approval required', `Quote ${quoteToInsert.quote_number} is waiting for HOS approval.`, 'Quotes');
    return quoteToInsert;
  }

  async function updateQuote(id, payload, items = []) {
    const currentQuote = quotes.find(quote => quote.id === id);
    const persistedQuote = currentQuote?.id?.toString().startsWith('local-')
      ? await resolvePersistedQuote(currentQuote)
      : currentQuote || { id };
    const realId = persistedQuote.id;
    const role = authorizationProfile?.role;
    if (!isCommercialEditor(role) && persistedQuote.created_by !== session.user.id) throw new Error('You can only edit your own quote.');
    if (persistedQuote.approval_status === 'REJECTED') {
      payload = { ...payload, approval_status: null, approval_stage: null, resubmission_note: payload.resubmission_note || null };
    }

    // Quote number is immutable after creation.
    const { quote_number: _ignoredQuoteNumber, ...editablePayload } = payload || {};

    // Do not require SELECT permission just to perform the update. We already
    // know the real UUID and can build the updated local row ourselves.
    const { error: quoteError } = await supabase
      .from('quotes')
      .update(editablePayload)
      .eq('id', realId);
    if (quoteError) throw quoteError;

    const finalQuote = {
      ...persistedQuote,
      ...editablePayload,
      id: realId,
      quote_number: persistedQuote.quote_number
    };

    // Insert the replacement items first. If this fails, the old items remain
    // intact, so editing a quote cannot accidentally wipe its products.
    const rows = (items || []).map(item => ({
      id: crypto.randomUUID(),
      quote_id: realId,
      product_id: item.product_id || null,
      product_name: item.product_name,
      description: item.description || null,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      discount: Number(item.discount) || 0,
      discount_percent: Number(item.discount_percent) || 0,
      tax: Number(item.tax) || 0,
      total: Number(item.total) || 0
    }));

    if (rows.length) {
      const { error: itemInsertError } = await supabase
        .from('quote_items')
        .insert(rows);
      if (itemInsertError) {
        throw new Error(`Quote details were saved, but the quoted items could not be updated: ${itemInsertError.message}`);
      }
    }

    // New items are safely stored, so remove the previous set.
    if (rows.length) {
      const keepIds = rows.map(row => row.id).join(',');
      const { error: itemDeleteError } = await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', realId)
        .not('id', 'in', `(${keepIds})`);
      if (itemDeleteError) throw itemDeleteError;
    } else {
      const { error: clearError } = await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', realId);
      if (clearError) throw clearError;
    }

    setQuotes(prev => prev.map(x => (x.id === id || x.id === realId) ? finalQuote : x));
    setQuoteItems(prev => [
      ...prev.filter(item => item.quote_id !== realId && item.quote_id !== id),
      ...rows
    ]);
    return finalQuote;
  }

  async function deleteQuote(id) {
    if (!isCommercialDeleter(authorizationProfile?.role)) throw new Error('You do not have permission to delete quotes.');
    const currentQuote = quotes.find(quote => quote.id === id);
    const persistedQuote = currentQuote?.id?.toString().startsWith('local-')
      ? await resolvePersistedQuote(currentQuote)
      : currentQuote || { id };
    const realId = persistedQuote.id;

    const { error: itemError } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', realId);
    if (itemError) throw itemError;

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', realId);
    if (error) throw error;

    setQuotes(prev => prev.filter(quote => quote.id !== id && quote.id !== realId));
    setQuoteItems(prev => prev.filter(item => item.quote_id !== id && item.quote_id !== realId));
  }

  async function approveCommercialRecord(type, id) {
    if (!['quote', 'invoice'].includes(type)) throw new Error('Deals do not use commercial approval.');
    const collection = type === 'deal' ? deals : type === 'quote' ? quotes : invoices;
    const before = collection.find(item => item.id === id);
    const { data, error } = await supabase.rpc('approve_commercial_record', { p_record_type: type, p_record_id: id });
    if (error) throw error;
    if (type === 'deal') await fetchDeals();
    if (type === 'quote') await fetchQuotes();
    if (type === 'invoice') await fetchInvoices();
    const link = type === 'deal' ? 'Pipeline' : type === 'quote' ? 'Quotes' : 'Invoices';
    const recordLabel = type === 'quote' ? 'Quote' : 'Invoice';
    const recordNumber = before?.title || before?.quote_number || before?.invoice_number || '';

    if (data?.approval_status === 'MD_PENDING') {
      await notifyRoles(
        ['manager'],
        'MD approval required',
        `${recordLabel} ${recordNumber} is waiting for final MD approval.`,
        link
      );

      if (before?.created_by && before.created_by !== session.user.id) {
        await notifyRolesByUser(
          [before.created_by],
          `${recordLabel} approved by HOS`,
          `${recordLabel} ${recordNumber} was approved by HOS and has been forwarded to the MD for final approval.`,
          link
        );
      }
    } else if (before?.created_by && before.created_by !== session.user.id) {
      const approverRole = authorizationProfile?.role === 'manager' ? 'MD' : 'HOS';

      await notifyRolesByUser(
        [before.created_by],
        `${recordLabel} approved by ${approverRole}`,
        `${recordLabel} ${recordNumber} has been approved by ${approverRole}. You can continue from your ${recordLabel === 'Quote' ? 'Quotes' : 'Invoices'} page.`,
        link
      );
    }
    showToast(`${type[0].toUpperCase() + type.slice(1)} approved.`);
    return data;
  }

  async function notifyRolesByUser(userIds, title, message, link) {
    const rows = [...new Set(userIds || [])].filter(Boolean).map(user_id => ({ user_id, type: 'approval', title, message, link, read: false }));
    if (!rows.length) return;
    const { error } = await supabase.from('notifications').insert(rows);
    if (error) {
      console.error('Could not create user notification:', error);
      return;
    }

    if (session?.user?.id && rows.some(row => row.user_id === session.user.id)) {
      await playNotificationSound();
    }
  }

  async function notifyRoles(roles, title, message, link) {
    const { data: recipients, error } = await supabase.from('authorized_users').select('user_id, role').eq('status', 'active').in('role', roles).not('user_id', 'is', null);
    if (error) { console.error('Could not find notification recipients:', error); return; }
    await notifyRolesByUser((recipients || []).map(row => row.user_id), title, message, link);
  }

  async function rejectCommercialRecord(type, id, note) {
    if (!['quote', 'invoice'].includes(type)) throw new Error('Deals do not use commercial approval.');
    const { data, error } = await supabase.rpc('reject_commercial_record', { p_record_type: type, p_record_id: id, p_note: note });
    if (error) throw error;
    if (type === 'deal') await fetchDeals();
    if (type === 'quote') await fetchQuotes();
    if (type === 'invoice') await fetchInvoices();

    const table = type === 'deal' ? deals : type === 'quote' ? quotes : invoices;
    const record = table.find(item => item.id === id);
    if (record?.created_by && record.created_by !== session.user.id) {
      const recordLabel = type === 'quote' ? 'Quote' : type === 'invoice' ? 'Invoice' : 'Record';
      const approverRole = authorizationProfile?.role === 'manager' ? 'MD' : 'HOS';

      await notifyRolesByUser(
        [record.created_by],
        `${recordLabel} rejected by ${approverRole}`,
        `${recordLabel} ${record.title || record.quote_number || record.invoice_number || ''} was rejected by ${approverRole}. Reason: ${note}`,
        type === 'deal' ? 'Pipeline' : type === 'quote' ? 'Quotes' : 'Invoices'
      );
    }
    showToast(`${type[0].toUpperCase() + type.slice(1)} rejected. The owner has been notified.`);
    return data;
  }

  async function addInvoice(payload, items = []) {
    const amount = Number(payload?.amount) || 0;
    const linkedDeal = payload?.deal_id ? deals.find(deal => deal.id === payload.deal_id) : null;
    if (payload?.deal_id && (!linkedDeal || linkedDeal.stage !== 'Won')) throw new Error('An invoice can only be linked to a Won Deal.');
    payload = {
      ...payload,
      customer_id: payload.customer_id || linkedDeal?.customer_id || null,
      sales_rep_id: payload.sales_rep_id || linkedDeal?.created_by || session.user.id,
      approval_status: null,
      approval_stage: null
    };
    const invoiceId = crypto.randomUUID();
    const invoiceToInsert = { id: invoiceId, ...payload, created_by: session.user.id };
    const { error } = await supabase.from('invoices').insert([invoiceToInsert]);
    if (error) throw error;
    setInvoices(prev => [invoiceToInsert, ...prev]);

    const rows = (items || []).map(item => ({
      invoice_id: invoiceId,
      product_id: item.product_id || null,
      product_name: item.product_name,
      description: item.description || null,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      discount: Number(item.discount) || 0,
      tax: Number(item.tax) || 0,
      total: Number(item.total) || 0
    }));
    if (rows.length) {
      const { error: itemError } = await supabase.from('invoice_items').insert(rows);
      if (itemError) throw new Error(`Invoice was created, but its line items could not be saved: ${itemError.message}`);
    }

    if (amount >= 20000) await notifyRoles(['head_of_sales'], 'Invoice approval required', `Invoice ${invoiceToInsert.invoice_number} is waiting for HOS approval.`, 'Invoices');
    return invoiceToInsert;
  }

  async function updateInvoice(id, payload, items = null) {
    const current = invoices.find(item => item.id === id);
    const role = authorizationProfile?.role;
    if (!isCommercialEditor(role) && current?.created_by !== session.user.id) throw new Error('You can only edit your own invoice.');
    const { error } = await supabase.from('invoices').update(payload).eq('id', id);
    if (error) throw error;

    if (items !== null) {
      const rows = (items || []).map(item => ({
        id: crypto.randomUUID(),
        invoice_id: id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        description: item.description || null,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        discount: Number(item.discount) || 0,
        discount_percent: Number(item.discount_percent) || 0,
        tax: Number(item.tax) || 0,
        total: Number(item.total) || 0
      }));
      if (rows.length) {
        const { error: insertError } = await supabase.from('invoice_items').insert(rows);
        if (insertError) throw new Error(`Invoice was updated, but its line items could not be updated: ${insertError.message}`);
      }
      const { error: deleteError } = await supabase.from('invoice_items').delete().eq('invoice_id', id).not('id', 'in', rows.length ? `(${rows.map(row => row.id).join(',')})` : '(null)');
      if (deleteError) throw deleteError;
    }

    const data = { ...(current || {}), ...payload, id };
    setInvoices(prev => prev.map(x => x.id === id ? data : x));
    return data;
  }

  async function sendQuoteToHOS(id) {
    const quote = quotes.find(item => item.id === id);
    if (!quote || quote.created_by !== session.user.id) throw new Error('You can only send your own quote for approval.');
    const amount = Number(quote.total || 0);
    if (quote.deal_id) { const linkedDeal = deals.find(deal => deal.id === quote.deal_id); if (!linkedDeal || linkedDeal.stage !== 'Won') throw new Error('If linked, the quote must reference a Won Deal.'); }
    const { error } = await supabase.from('quotes').update({
      approval_status: 'HOS_PENDING',
      approval_stage: 'HOS',
      status: quote.status === 'Draft' ? 'Sent' : quote.status
    }).eq('id', id);
    if (error) throw error;
    setQuotes(prev => prev.map(item => item.id === id ? { ...item, approval_status: 'HOS_PENDING', approval_stage: 'HOS', status: item.status === 'Draft' ? 'Sent' : item.status } : item));
    await notifyRoles(['head_of_sales'], 'Quote approval required', `Quote ${quote.quote_number || ''} from ${ownerProfiles[quote.created_by] || 'a Sales Rep'} is waiting for your approval.`, 'Quotes');
    showToast(`Quote ${quote.quote_number || ''} sent to HOS for approval.`);
  }

  async function sendInvoiceToHOS(id) {
    const invoice = invoices.find(item => item.id === id);
    if (!invoice || invoice.created_by !== session.user.id) throw new Error('You can only send your own invoice for approval.');
    if (invoice.deal_id) { const linkedDeal = deals.find(deal => deal.id === invoice.deal_id); if (!linkedDeal || linkedDeal.stage !== 'Won') throw new Error('If linked, the invoice must reference a Won Deal.'); }
    const { error } = await supabase.from('invoices').update({
      approval_status: 'HOS_PENDING',
      approval_stage: 'HOS',
      status: invoice.status === 'Draft' ? 'Sent' : invoice.status
    }).eq('id', id);
    if (error) throw error;
    setInvoices(prev => prev.map(item => item.id === id ? { ...item, approval_status: 'HOS_PENDING', approval_stage: 'HOS', status: item.status === 'Draft' ? 'Sent' : item.status } : item));
    await notifyRoles(['head_of_sales'], 'Invoice approval required', `Invoice ${invoice.invoice_number || ''} from ${ownerProfiles[invoice.created_by] || 'a Sales Rep'} is waiting for your approval.`, 'Invoices');
    showToast(`Invoice ${invoice.invoice_number || ''} sent to HOS for approval.`);
  }


  async function deleteInvoice(id) {
    if (!isCommercialDeleter(authorizationProfile?.role)) throw new Error('You do not have permission to delete invoices.');
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    setInvoices(prev => prev.filter(item => item.id !== id));
  }
  async function addPayment(payload) { const { data, error } = await supabase.from('payments').insert([{ ...payload, created_by: session.user.id }]).select('*').single(); if (error) throw error; setPayments(prev => [data, ...prev]); await fetchInvoices(); return data; }
  async function addWorkflow(payload) { const { data, error } = await supabase.from('workflows').insert([{ ...payload, created_by: session.user.id }]).select('*').single(); if (error) throw error; setWorkflows(prev => [data, ...prev]); return data; }
  async function updateWorkflow(id, payload) { const { data, error } = await supabase.from('workflows').update(payload).eq('id', id).select('*').single(); if (error) throw error; setWorkflows(prev => prev.map(x => x.id === id ? data : x)); return data; }
  async function addSegment(payload) { const { data, error } = await supabase.from('customer_segments').insert([{ ...payload, created_by: session.user.id }]).select('*').single(); if (error) throw error; setSegments(prev => [data, ...prev]); return data; }
  async function updateSegment(id, payload) { const { data, error } = await supabase.from('customer_segments').update(payload).eq('id', id).select('*').single(); if (error) throw error; setSegments(prev => prev.map(x => x.id === id ? data : x)); return data; }
  async function addProduct(payload) {
    const { data, error } = await supabase.from('products').insert([{ ...payload, created_by: session.user.id }]).select('*').single();
    if (error) throw error;
    setProducts(prev => [data, ...prev]);
    return data;
  }
  async function updateProduct(id, payload) {
    const { data, error } = await supabase.from('products').update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    setProducts(prev => prev.map(product => product.id === id ? data : product));
    return data;
  }
  async function deleteProduct(id) {
    if (!window.confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    setProducts(prev => prev.filter(product => product.id !== id));
  }
  async function addSupportEngineer(payload, solutionFamilies = []) {
    const { data, error } = await supabase.from('support_engineers').insert([{ ...payload, created_by: session.user.id }]).select('*').single();
    if (error) throw error;
    if (solutionFamilies.length) {
      const { error: linkError } = await supabase.from('solution_support_engineers').insert(solutionFamilies.map(solution_family => ({ solution_family, support_engineer_id: data.id })));
      if (linkError) throw linkError;
    }
    setSupportEngineers(prev => [...prev, data].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    await fetchSolutionSupport();
    return data;
  }
  async function updateSupportEngineer(id, payload, solutionFamilies = []) {
    const { data, error } = await supabase.from('support_engineers').update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    const { error: clearError } = await supabase.from('solution_support_engineers').delete().eq('support_engineer_id', id);
    if (clearError) throw clearError;
    if (solutionFamilies.length) {
      const { error: linkError } = await supabase.from('solution_support_engineers').insert(solutionFamilies.map(solution_family => ({ solution_family, support_engineer_id: id })));
      if (linkError) throw linkError;
    }
    setSupportEngineers(prev => prev.map(item => item.id === id ? data : item).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    await fetchSolutionSupport();
    return data;
  }
  async function deactivateSupportEngineer(id) {
    const { error } = await supabase.from('support_engineers').update({ status: 'Inactive' }).eq('id', id);
    if (error) throw error;
    setSupportEngineers(prev => prev.map(item => item.id === id ? { ...item, status: 'Inactive' } : item));
  }
  async function syncSolutionSupport(solutionFamily, engineerIds = []) {
    if (!isAdminRole(authorizationProfile?.role)) throw new Error('Only an admin can manage solution support assignments.');
    const { error: deleteError } = await supabase.from('solution_support_engineers').delete().eq('solution_family', solutionFamily);
    if (deleteError) throw deleteError;
    const uniqueIds = [...new Set(engineerIds || [])];
    if (uniqueIds.length) {
      const { error: insertError } = await supabase.from('solution_support_engineers').insert(uniqueIds.map(support_engineer_id => ({ solution_family: solutionFamily, support_engineer_id })));
      if (insertError) throw insertError;
    }
    await fetchSolutionSupport();
  }
  async function uploadDocument(file, customerId = '') { if (!file) return; const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); const path = `${session.user.id}/${Date.now()}_${safeName}`; const { error: uploadError } = await supabase.storage.from('crm-documents').upload(path, file, { upsert: false }); if (uploadError) throw uploadError; const { data, error } = await supabase.from('documents').insert([{ name: file.name, storage_path: path, mime_type: file.type || 'application/octet-stream', size_bytes: file.size, customer_id: customerId || null, created_by: session.user.id }]).select('*, customers(name,company)').single(); if (error) throw error; setDocuments(prev => [data, ...prev]); return data; }
  async function deleteDocument(doc) { if (!window.confirm('Delete this document?')) return; const { error: storageError } = await supabase.storage.from('crm-documents').remove([doc.storage_path]); if (storageError) { console.error(storageError); } const { error } = await supabase.from('documents').delete().eq('id', doc.id); if (error) { alert(error.message); return; } setDocuments(prev => prev.filter(x => x.id !== doc.id)); }
  async function downloadDocument(doc) { const { data, error } = await supabase.storage.from('crm-documents').download(doc.storage_path); if (error) { alert(error.message); return; } const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = doc.name; a.click(); URL.revokeObjectURL(url); }

  async function fetchStaffInvitations() {
    setStaffInvitationsLoading(true);
    setStaffInvitationsError('');
    const { data, error } = await supabase
      .from('staff_invitations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setStaffInvitationsLoading(false);
    if (error) { console.error('Error fetching staff invitations:', error); setStaffInvitationsError('Unable to load invitations. Run the staff_invitations.sql migration, then refresh.'); return; }
    setStaffInvitations(data || []);
  }

  // Generates the invite link and hands it back so the caller (the invite modal) can show it to copy or email.
  async function inviteStaffWorker(toEmail, role) {
    const { data, error } = await supabase.rpc('staff_invite_worker', { p_email: toEmail, p_role: role });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    const link = `${window.location.origin}${window.location.pathname}?staff_invite=${row.token}`;
    fetchStaffInvitations();
    return { link, expiresAt: row.expires_at };
  }

  async function revokeStaffInvitation(id) {
    setStaffInvitationActionId(id);
    const { error } = await supabase.rpc('revoke_staff_invitation', { p_invitation_id: id });
    setStaffInvitationActionId(null);
    if (error) { showToast(`Could not revoke invitation: ${error.message}`); return; }
    showToast('Invitation revoked.');
    fetchStaffInvitations();
  }

  async function fetchAuthorizedUsers() {
    setUsersLoading(true);
    setUsersError('');

    let { data, error } = await supabase
      .from('authorized_users')
      .select('id, email, role, status, created_at, user_id, parent_id')
      .order('created_at', { ascending: false });

    if (error && (error.code === '42703' || /parent_id/i.test(error.message || ''))) {
      const fallback = await supabase
        .from('authorized_users')
        .select('id, email, role, status, created_at, user_id')
        .order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('Failed to fetch authorized users:', error);
      setUsersError('Unable to load authorized users.');
      setAuthorizedUsers([]);
    } else {
      setAuthorizedUsers(data || []);
    }
    setUsersLoading(false);
  }
  async function updateAuthorizedUser(userId, updates) {
    const { error } = await supabase
      .from('authorized_users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Failed to update authorized user:', error);
      setUsersError('Unable to update user permissions.');
      return false;
    }

    await fetchAuthorizedUsers();
    return true;
  }
  async function fetchPendingPortalAccounts() {
    setPortalRequestsLoading(true);
    setPortalRequestsError('');
    setPortalRequestsNotice('');
    const { data, error } = await supabase
      .from('customer_portal_accounts')
      .select('id, user_id, email, full_name, status, created_at, registration_source')
      .eq('status', 'pending')
      .eq('registration_source', 'signup')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Failed to fetch pending customer portal requests:', error);
      setPortalRequestsError('Unable to load pending customer access requests. Apply the customer portal approval SQL migration, then refresh.');
      setPendingPortalAccounts([]);
    } else {
      setPendingPortalAccounts(data || []);
    }
    setPortalRequestsLoading(false);
  }

  async function reviewPortalRequest(userId, action) {
    const request = pendingPortalAccounts.find((item) => item.user_id === userId);
    if (!request || !['approve', 'reject'].includes(action)) return;
    const confirmed = window.confirm(action === 'approve'
      ? `Approve ${request.email} and create a customer record?`
      : `Reject customer portal access for ${request.email}?`);
    if (!confirmed) return;
    setPortalRequestActionId(userId);
    setPortalRequestsError('');
    setPortalRequestsNotice('');
    try {
      const { error } = await supabase.rpc(action === 'approve'
        ? 'approve_customer_portal_access'
        : 'reject_customer_portal_access', { p_user_id: userId });
      if (error) throw error;
      await fetchPendingPortalAccounts();
      setPortalRequestsNotice(action === 'approve'
        ? `Approved ${request.email}; a customer record was created and linked.`
        : `Rejected access for ${request.email}.`);
    } catch (error) {
      console.error(`Failed to ${action} customer portal request:`, error);
      setPortalRequestsError(error.message || `Unable to ${action} customer portal access.`);
    } finally {
      setPortalRequestActionId(null);
    }
  }
  useEffect(() => {
    if (page === 'UserManagement' && isAdminRole(authorizationProfile?.role)) {
      fetchPendingPortalAccounts();
    }
    if ((page === 'UserManagement' || page === 'MD Panel') && isSystemAdminOrMD(authorizationProfile?.role)) {
      fetchStaffInvitations();
    }
  }, [page, authorizationProfile?.role]);

  const displayUserName = profileName.trim() || session?.user?.email || 'Signed-in user';

  async function fetchStaffUsers() {
    const { data, error } = await supabase
      .from('authorized_users')
      .select('user_id, email, role')
      .eq('status', 'active')
      .not('user_id', 'is', null)
      .order('email', { ascending: true });
    if (error) { console.warn('Could not load staff list:', error.message); return; }
    setStaffUsers(data || []);
  }

  const staffName = userId => {
    if (!userId) return 'Unassigned';
    if (userId === session?.user?.id) return `${displayUserName} (you)`;
    const staff = staffUsers.find(u => u.user_id === userId);
    return ownerProfiles[userId] || staff?.email || 'Team member';
  };
  const getStaffOptions = () => {
    const list = [...staffUsers];
    if (session?.user?.id && !list.some(u => u.user_id === session.user.id)) list.unshift({ user_id: session.user.id, email: session.user.email });
    return list;
  };
  const canManageTicket = ticket => {
    if (authorizationProfile?.role === 'hr') return false;
    return ['admin', 'manager', 'head_of_sales'].includes(authorizationProfile?.role) ||
      ticket.created_by === session?.user?.id ||
      ticket.assigned_to === session?.user?.id ||
      (ticket.source === 'portal' && !ticket.assigned_to);
  };

  async function fetchProfile() {
    if (!session?.user?.id) return;
    const { data, error } = await supabase.from('user_profiles').select('full_name').eq('user_id', session.user.id).maybeSingle();
    if (error) { console.warn('Profile lookup failed:', error.message); return; }
    const name = data?.full_name || '';
    setProfileName(name);
    setProfileDraft(name);
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!session?.user?.id) return;
    setProfileSaving(true);
    try {
      const fullName = profileDraft.trim();
      const { error } = await supabase.from('user_profiles').upsert({ user_id: session.user.id, full_name: fullName || null, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw error;
      setProfileName(fullName);
      setProfileModalOpen(false);
      showToast('Profile updated.');
      await fetchOwnerProfiles();
    } catch (error) {
      showToast(`Could not save profile: ${error.message}`);
    } finally { setProfileSaving(false); }
  }

  async function fetchOwnerProfiles() {
    const { data, error } = await supabase.from('user_profiles').select('user_id, full_name');
    if (error) { console.warn('Could not load user names:', error.message); return; }
    setOwnerProfiles(Object.fromEntries((data || []).map(x => [x.user_id, x.full_name || ''])));
  }

  // Reload the workspace data in one pass so the page does not need a browser refresh.
  async function refreshAll({ silent = false } = {}) {
    if (refreshingRef.current || !session || !authorized) return;

    refreshingRef.current = true;
    setRefreshing(true);

    try {
      // Core lookups plus only the datasets that have been loaded so far.
      const jobs = [
        fetchStaffUsers(), fetchNotifications(), fetchOwnerProfiles(),
        ...Array.from(loadedDataRef.current).flatMap(datasetLoaders)
      ];

      if (isAdminRole(authorizationProfile?.role)) {
        jobs.push(fetchAuthorizedUsers(), fetchPendingPortalAccounts());
      }
      if (isSystemAdminOrMD(authorizationProfile?.role)) {
        jobs.push(fetchStaffInvitations());
      }

      await Promise.all(jobs);
      lastRefreshRef.current = Date.now();
      if (!silent) showToast('Up to date.');
    } catch (error) {
      console.error('Refresh failed:', error);
      if (!silent) showToast('Could not refresh. Please try again.');
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }

  async function unlockNotificationAudio() {
    if (typeof window === 'undefined') return false;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    try {
      if (!notificationAudioContextRef.current) {
        notificationAudioContextRef.current = new AudioContextClass();
      }
      const context = notificationAudioContextRef.current;
      if (context.state === 'suspended') await context.resume();
      notificationAudioUnlockedRef.current = context.state === 'running';
      return notificationAudioUnlockedRef.current;
    } catch (error) {
      console.warn('Notification sound could not be unlocked:', error);
      return false;
    }
  }

  async function playNotificationSound() {
    const unlocked = await unlockNotificationAudio();
    if (!unlocked) return;

    try {
      const context = notificationAudioContextRef.current;
      const now = context.currentTime + 0.02;
      const tones = [
        { frequency: 880, start: 0, duration: 0.18 },
        { frequency: 1174.66, start: 0.20, duration: 0.18 },
        { frequency: 880, start: 0.40, duration: 0.28 }
      ];

      tones.forEach(({ frequency, start, duration }) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now + start);
        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.16, now + start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now + start);
        oscillator.stop(now + start + duration + 0.02);
      });
    } catch (error) {
      console.warn('Notification sound failed:', error);
    }
  }

  // Unlock the alert sound after the user's first interaction. This keeps
  // later real-time approval/rejection alerts audible without violating
  // browser autoplay rules.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const unlock = () => {
      if (!notificationAudioUnlockedRef.current) unlockNotificationAudio();
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  async function clearNotification(id) {
    const { error } = await supabase.from('notifications').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) { showToast(`Could not clear notification: ${error.message}`); return; }
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadNotificationCount(prev => Math.max(0, prev - (notifications.find(n => n.id === id && !n.read) ? 1 : 0)));
  }

  async function clearAllNotifications() {
    const { error } = await supabase.from('notifications').delete().eq('user_id', session.user.id);
    if (error) { showToast(`Could not clear notifications: ${error.message}`); return; }
    setNotifications([]);
    setUnreadNotificationCount(0);
    showToast('Notifications cleared.');
  }

  async function createBirthdayReminderNotifications() {
    if (!session?.user?.id || !authorized || authorizationProfile?.role !== 'hr') return;

    const contacts = [...(customers || []), ...(leads || [])]
      .filter(contact => contact?.birthday && birthdayIsTomorrow(contact.birthday));
    if (!contacts.length) return;

    const { data: hrUsers, error: hrError } = await supabase
      .from('authorized_users')
      .select('user_id, role, status')
      .eq('role', 'hr')
      .eq('status', 'active')
      .not('user_id', 'is', null);

    if (hrError) {
      console.error('Failed to load HR users for birthday reminders:', hrError);
      return;
    }

    const recipientIds = [...new Set((hrUsers || []).map(user => user.user_id).filter(Boolean))];
    if (!recipientIds.length) return;

    const { data: existing, error: existingError } = await supabase
      .from('notifications')
      .select('user_id, message')
      .eq('type', 'birthday_reminder')
      .in('user_id', recipientIds)
      .limit(1000);

    if (existingError) {
      console.error('Failed to check existing birthday reminders:', existingError);
      return;
    }

    const existingKeys = new Set((existing || []).map(row => `${row.user_id}|${row.message || ''}`));
    const inserts = [];

    contacts.forEach(contact => {
      const birthday = formatBirthday(contact.birthday);
      const message = `${contact.name || 'Customer'}${contact.company ? ` at ${contact.company}` : ''} has a birthday tomorrow (${birthday}).`;
      recipientIds.forEach(user_id => {
        const key = `${user_id}|${message}`;
        if (!existingKeys.has(key)) {
          inserts.push({
            user_id,
            type: 'birthday_reminder',
            title: 'Birthday tomorrow',
            message,
            link: 'HR Panel',
            read: false
          });
          existingKeys.add(key);
        }
      });
    });

    if (!inserts.length) return;

    const { error: insertError } = await supabase.from('notifications').insert(inserts);
    if (insertError) {
      console.error('Failed to create birthday reminders:', insertError);
      return;
    }

    await fetchNotifications();
  }

  async function fetchNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to load notifications:', error);
      return;
    }

    setNotifications(data || []);
    setUnreadNotificationCount(
      (data || []).filter(notification => !notification.read).length
    );
  }
  // Real Time notification Updtates
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`notifications-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        },
        payload => {
          const newNotification = payload.new;

          // Every real-time notification is an active alert: play a sound and
          // show the title instead of silently updating the bell count.
          playNotificationSound();
          if (newNotification.title) showToast(newNotification.title);

          setNotifications(prev => {
            if (prev.some(notification => notification.id === newNotification.id)) {
              return prev;
            }

            return [newNotification, ...prev];
          });

          if (!newNotification.read) {
            setUnreadNotificationCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Error loading session:', error);

        if (mounted) {
          setAuthError(error.message);
          setAuthLoading(false);
        }

        return;
      }

      if (mounted) {
        setSession(session);
        setAuthLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const lastCheckedUserId = useRef(null);
  useEffect(() => {
    if (!session) {
      lastCheckedUserId.current = null;
      setAuthorized(false);
      setAuthorizationLoading(false);
      return;
    }

    const isSameUser = lastCheckedUserId.current === session.user.id;
    lastCheckedUserId.current = session.user.id;
    checkAuthorization(session, { silent: isSameUser });
  }, [session?.user?.id]);

  useEffect(() => {
    if (!authorized || !isAdminRole(authorizationProfile?.role)) {
      return;
    }

    fetchAuthorizedUsers();
  }, [authorized, authorizationProfile?.role]);
  useEffect(() => {
    if (!authorized) return;
    const role = authorizationProfile?.role;
    const allowedPanel = rolePanelFor(role);
    if (page === 'UserManagement' && !isAdminRole(role)) setPage('Dashboard');
    if (['MD Panel', 'HOS Panel', 'HR Panel', 'Technical Support Panel'].includes(page) && page !== allowedPanel) setPage('Dashboard');
  }, [authorized, authorizationProfile?.role, page]);
  // Fetch notifications 
  useEffect(() => {
    if (!session?.user?.id) return;

    fetchNotifications();
    fetchProfile();
    fetchOwnerProfiles();
  }, [session?.user?.id]);
  // Reset on-demand data when the signed-in user changes.
  useEffect(() => {
    loadedDataRef.current = new Set();
    setReadyDatasets(new Set());
  }, [session?.user?.id]);

  // Only small, always-needed lookups load at login. Everything else loads
  // when the page that needs it is opened (see PAGE_DATA).
  useEffect(() => {
    if (!session || !authorized) return;
    fetchStaffUsers();
  }, [session, authorized]);

  useEffect(() => {
    if (!session || !authorized) return;
    ensureData(PAGE_DATA[page] || []);
  }, [page, session, authorized]);

  // The customer drawer and global search pull in related records on demand.
  useEffect(() => {
    if (!session || !authorized || !selectedCustomer) return;
    ensureData(CUSTOMER_DETAIL_DATA);
  }, [selectedCustomer?.id, session, authorized]);

  useEffect(() => {
    if (!session || !authorized || !globalSearch.trim()) return;
    ensureData(GLOBAL_SEARCH_DATA);
  }, [Boolean(globalSearch.trim()), session, authorized]);

  // Calendar reminders need an active checker. Previously they were only
  // evaluated when the calendar was fetched/refreshed, which meant a reminder
  // could be missed completely if no refresh happened at the right time.
  // Check frequently while Storhet is open so reminders appear in the bell
  // without requiring a manual refresh.
  useEffect(() => {
    if (!session?.user?.id || !authorized) return;

    let running = false;

    const checkCalendarReminders = async () => {
      if (running || document.visibilityState !== 'visible') return;
      running = true;
      try {
        await fetchDueCalendarReminders();
      } finally {
        running = false;
      }
    };

    const intervalId = window.setInterval(checkCalendarReminders, 15000);

    // Check immediately as well, so a reminder is picked up quickly after
    // opening Storhet or returning to the tab.
    checkCalendarReminders();

    return () => window.clearInterval(intervalId);
  }, [session?.user?.id, authorized]);

  // Birthday reminder: HR gets one notification on the day before each stored
  // customer/lead birthday. Existing notifications are checked first so the same
  // birthday reminder is never inserted twice.
  useEffect(() => {
    if (!session?.user?.id || !authorized || authorizationProfile?.role !== 'hr') return;

    let running = false;
    const checkBirthdayReminders = async () => {
      if (running || document.visibilityState !== 'visible') return;
      running = true;
      try {
        await createBirthdayReminderNotifications();
      } finally {
        running = false;
      }
    };

    checkBirthdayReminders();
    const intervalId = window.setInterval(checkBirthdayReminders, 60000);
    return () => window.clearInterval(intervalId);
  }, [session?.user?.id, authorized, authorizationProfile?.role, customers, leads]);

  // Quietly refresh when the user returns to the CRM tab after it has been idle.
  useEffect(() => {
    if (!session || !authorized) return;

    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRefreshRef.current > 60000) {
        refreshAll({ silent: true });
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [session, authorized]);


  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setGlobalSearch('');
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function importCustomers(rows) {
    const existing = new Set(customers.map(c => (c.email || '').toLowerCase()));
    const seen = new Set();
    const valid = [];
    let invalid = 0;
    let duplicates = 0;

    rows.forEach(r => {
      if (!r.name || !/^\S+@\S+\.\S+$/.test(r.email)) { invalid++; return; }
      const key = r.email.toLowerCase();
      if (existing.has(key) || seen.has(key)) { duplicates++; return; }
      seen.add(key);
      valid.push({
        name: r.name,
        company: r.company || null,
        email: r.email,
        phone: r.phone || null,
        job_title: r.job_title || null,
        birthday: r.birthday || null,
        status: CUSTOMER_STATUSES.includes(r.status) ? r.status : 'Active'
      });
    });

    if (valid.length === 0) {
      showToast(`Nothing imported (${invalid} invalid, ${duplicates} duplicates). Your CSV needs the columns: name, company, email, status.`);
      return;
    }

    const { data, error } = await supabase.from('customers').insert(valid).select();
    if (error) {
      console.error('Import failed:', error);
      showToast(`Import failed: ${error.message}`);
      return;
    }
    setCustomers(prev => [...(data || []), ...prev]);
    showToast(`Imported ${(data || []).length} customers. Skipped ${invalid} invalid and ${duplicates} duplicates.`);
  }

  async function markAllNotificationsRead() {
    if (unreadNotificationCount === 0) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.user.id)
      .eq('read', false);
    if (error) {
      console.error('Failed to mark notifications as read:', error);
      return;
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadNotificationCount(0);
  }

  async function addCustomer(e) {
    e.preventDefault();
    if (!['admin', 'manager', 'head_of_sales', 'sales'].includes(authorizationProfile?.role)) { setCustomerError('You do not have permission to create customers.'); return; }
    setCustomerError('');

    if (!newCustomer.name.trim() || !newCustomer.email.trim()) {
      setCustomerError('Name and email are required.');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            name: newCustomer.name.trim(),
            company: newCustomer.company.trim() || null,
            email: newCustomer.email.trim(),
            phone: newCustomer.phone.trim() || null,
            job_title: newCustomer.job_title.trim() || null,
            birthday: newCustomer.birthday || null,
            location_address: newCustomer.location_address?.trim() || null,
            latitude: newCustomer.latitude || null,
            longitude: newCustomer.longitude || null,
            status: newCustomer.status || 'Active',
            created_by: session.user.id
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        setCustomerError(error.message);
        return;
      }

      setCustomers(prev => [data, ...prev]);

      setNewCustomer({
        name: '',
        company: '',
        email: '',
        phone: '',
        job_title: '',
        birthday: '',
        location_address: '',
        latitude: '',
        longitude: '',
        status: 'Active'
      });

      setShowCustomerForm(false);

    } catch (error) {
      console.error('Unexpected error:', error);
      setCustomerError('Something went wrong. Please try again.');

    } finally {
      setSaving(false);
    }
  }
  async function deleteCustomer(id) {
    if (!isCommercialDeleter(authorizationProfile?.role)) { showToast('You do not have permission to delete customers.'); return; }
    const confirmed = window.confirm(
      'Are you sure you want to delete this customer?'
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      alert(`Could not delete customer: ${error.message}`);
      return;
    }

    setCustomers(prev =>
      prev.filter(customer => customer.id !== id)
    );

    if (selectedCustomer?.id === id) {
      setSelectedCustomer(null);
    }
  }
  async function updateCustomer(e) {
    e.preventDefault();
    if (!isCommercialEditor(authorizationProfile?.role) && !(authorizationProfile?.role === 'sales' && editingCustomer?.created_by === session.user.id)) { showToast('You can only edit your own customer records.'); return; }

    if (!editingCustomer?.name.trim() || !editingCustomer?.email.trim()) {
      alert('Name and email are required.');
      return;
    }

    const { data, error } = await supabase
      .from('customers')
      .update({
        name: editingCustomer.name.trim(),
        company: editingCustomer.company?.trim() || null,
        email: editingCustomer.email.trim(),
        phone: editingCustomer.phone?.trim() || null,
        job_title: editingCustomer.job_title?.trim() || null,
        birthday: editingCustomer.birthday || null,
        location_address: editingCustomer.location_address?.trim() || null,
        latitude: editingCustomer.latitude || null,
        longitude: editingCustomer.longitude || null,
        status: editingCustomer.status || 'Active'
      })
      .eq('id', editingCustomer.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      alert(`Could not update customer: ${error.message}`);
      return;
    }

    setCustomers(prev =>
      prev.map(customer =>
        customer.id === data.id ? data : customer
      )
    );

    if (selectedCustomer?.id === data.id) {
      setSelectedCustomer(data);
    }

    setEditingCustomer(null);
  }
  async function addDeal(e) {
    e.preventDefault();

    setDealError('');

    if (!newDeal.title.trim()) {
      setDealError('Deal title is required.');
      return;
    }

    if (
      newDeal.amount === '' ||
      Number.isNaN(Number(newDeal.amount)) ||
      Number(newDeal.amount) < 0
    ) {
      setDealError('Enter a valid deal amount.');
      return;
    }

    if (newDeal.customer_id === '__new__' && (!newDeal.new_customer_name.trim() || !newDeal.new_customer_email.trim())) {
      setDealError('Enter the new customer name and email.');
      return;
    }

    setDealSaving(true);

    try {
      let customerId = newDeal.customer_id || null;
      let customerCompany = newDeal.company.trim() || null;
      if (newDeal.customer_id === '__new__') {
        const { data: customerData, error: customerError } = await supabase.from('customers').insert({
          name: newDeal.new_customer_name.trim(),
          email: newDeal.new_customer_email.trim(),
          phone: newDeal.new_customer_phone.trim() || null,
          company: newDeal.new_customer_company.trim() || newDeal.company.trim() || null,
          job_title: newDeal.new_customer_job_title.trim() || null,
          birthday: newDeal.new_customer_birthday || null,
          status: 'Active',
          created_by: session.user.id
        }).select().single();
        if (customerError) throw customerError;
        customerId = customerData.id;
        customerCompany = customerData.company || customerCompany;
        setCustomers(prev => [customerData, ...prev]);
        showToast(`Customer ${customerData.name} created.`);
      }
      const { data, error } = await supabase
        .from('deals')
        .insert([
          {
            title: newDeal.title.trim(),
            company: customerCompany,
            contact_name: newDeal.contact_name.trim() || (newDeal.customer_id === '__new__' ? newDeal.new_customer_name.trim() : null) || null,
            contact_email: newDeal.contact_email.trim() || (newDeal.customer_id === '__new__' ? newDeal.new_customer_email.trim() : null) || null,
            contact_phone: newDeal.contact_phone.trim() || (newDeal.customer_id === '__new__' ? newDeal.new_customer_phone.trim() : null) || null,
            amount: Number(newDeal.amount),
            stage: newDeal.stage === 'Won' ? 'New Lead' : newDeal.stage,
            customer_id: customerId,
            closure_start_at: newDeal.closure_start_at ? new Date(newDeal.closure_start_at).toISOString() : null,
            closure_end_at: newDeal.closure_end_at ? new Date(newDeal.closure_end_at).toISOString() : null,
            created_by: session.user.id
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding deal:', error);

        setDealError(error.message);
        return;
      }

      setDeals(prev => [data, ...prev]);
      const uniqueProductIds = [...new Set(selectedDealProductIds || [])];
      if (uniqueProductIds.length > 0) {
        const rows = uniqueProductIds.map(productId => ({
          deal_id: data.id,
          product_id: productId
        }));
        const { error: productError } = await supabase
          .from('deal_products')
          .insert(rows);
        if (productError) throw productError;
      }

      setDealProducts(prev => [
        ...prev,
        ...uniqueProductIds.map(productId => ({ deal_id: data.id, product_id: productId }))
      ]);
      const uniqueSupportIds = [...new Set(newDeal.support_engineer_ids || [])];
      if (uniqueSupportIds.length > 0) {
        const { error: supportError } = await supabase
          .from('deal_support_engineers')
          .insert(uniqueSupportIds.map(support_engineer_id => ({ deal_id: data.id, support_engineer_id })));
        if (supportError) throw supportError;
      }
      setDealSupport(prev => [
        ...prev,
        ...uniqueSupportIds.map(support_engineer_id => ({ deal_id: data.id, support_engineer_id }))
      ]);

      setNewDeal({
        title: '',
        company: '',
        amount: '',
        stage: 'New Lead',
        customer_id: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        new_customer_name: '',
        new_customer_email: '',
        new_customer_phone: '',
        new_customer_company: '',
        new_customer_job_title: '',
        new_customer_birthday: '',
        closure_start_at: '',
        closure_end_at: '',
        support_engineer_ids: []
      });
      setSelectedDealProductIds([]);
      setExpandedDealVendor(null);
      setShowDealForm(false);

    } catch (error) {
      console.error('Unexpected error:', error);

      setDealError('Something went wrong. Please try again.');

    } finally {
      setDealSaving(false);
    }
  }
  async function moveDeal(id, stage) {
    const previousDeal = deals.find(d => d.id === id);
    const previousStage = previousDeal?.stage;
    if (!previousDeal || previousStage === stage) return;

    // Deals have no commercial approval restriction.
    // Quotes and invoices are the only records governed by the approval workflow.

    // A deal entering Won must be converted/linked to a Customer.
    // Lead-created deals have the information needed to create the customer.
    if (stage === 'Won' && previousStage !== 'Won') {
      try {
        let deal = previousDeal;
        let lead = null;

        if (deal.lead_id) {
          const { data: leadData, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', deal.lead_id)
            .single();

          if (leadError) throw leadError;
          lead = leadData;
        }

        // If the deal/lead is already linked to a customer, simply keep that link.
        let customerId = deal.customer_id || lead?.customer_id || null;
        let customer = null;

        if (customerId) {
          const { data: existingCustomer, error: customerError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .single();

          if (customerError) throw customerError;
          customer = existingCustomer;
        } else if (lead?.email?.trim()) {
          // Avoid creating duplicate customers when the lead email already exists.
          const email = lead.email.trim();
          const { data: existingCustomer, error: lookupError } = await supabase
            .from('customers')
            .select('*')
            .ilike('email', email)
            .maybeSingle();

          if (lookupError) throw lookupError;

          if (existingCustomer) {
            customer = existingCustomer;
            customerId = existingCustomer.id;
          } else {
            const { data: newCustomer, error: createCustomerError } = await supabase
              .from('customers')
              .insert({
                name: lead.name?.trim() || lead.email.trim(),
                email,
                phone: lead.phone?.trim() || null,
                company: lead.company?.trim() || deal.company?.trim() || null,
                job_title: lead.job_title?.trim() || null,
                birthday: lead.birthday || null,
                status: 'Active'
              })
              .select()
              .single();

            if (createCustomerError) throw createCustomerError;

            customer = newCustomer;
            customerId = newCustomer.id;
          }
        }

        // Direct Pipeline deals can also become Customers. Use the contact
        // details captured on the deal to find or create the Customer.
        if (!customerId && !lead && deal.contact_email?.trim()) {
          const email = deal.contact_email.trim();
          const { data: existingCustomer, error: lookupError } = await supabase
            .from('customers')
            .select('*')
            .ilike('email', email)
            .maybeSingle();

          if (lookupError) throw lookupError;

          if (existingCustomer) {
            customer = existingCustomer;
            customerId = existingCustomer.id;
          } else {
            const { data: newCustomer, error: createCustomerError } = await supabase
              .from('customers')
              .insert({
                name: deal.contact_name?.trim() || deal.title?.trim() || email,
                email,
                phone: deal.contact_phone?.trim() || null,
                company: deal.company?.trim() || null,
                status: 'Active'
              })
              .select()
              .single();

            if (createCustomerError) throw createCustomerError;
            customer = newCustomer;
            customerId = newCustomer.id;
          }
        }

        if (!customerId && !lead) {
          alert('Add a contact email to this deal, or link it to a customer, before marking it Won.');
          return;
        }

        const { data: updatedDeal, error: dealError } = await supabase
          .from('deals')
          .update({
            stage: 'Won',
            customer_id: customerId
          })
          .eq('id', id)
          .select()
          .single();

        if (dealError) throw dealError;

        // Keep the originating lead as historical data, but mark it converted
        // and link it to the customer that now owns the won deal.
        let updatedLead = lead;
        if (lead) {
          const { data: leadData, error: leadUpdateError } = await supabase
            .from('leads')
            .update({
              status: 'Converted',
              customer_id: customerId
            })
            .eq('id', lead.id)
            .select('*, customers(name,company)')
            .single();

          if (leadUpdateError) throw leadUpdateError;
          updatedLead = leadData;
        }

        // Refresh local state so Customers, Leads and Pipeline immediately
        // reflect the conversion without requiring a page reload.
        if (customer) {
          setCustomers(prev => {
            const exists = prev.some(item => item.id === customer.id);
            return exists
              ? prev.map(item => item.id === customer.id ? customer : item)
              : [customer, ...prev];
          });
        }

        setDeals(prev => prev.map(item => item.id === updatedDeal.id ? updatedDeal : item));

        if (updatedLead) {
          setLeads(prev => prev.map(item => item.id === updatedLead.id ? updatedLead : item));
        }

        showToast(customer
          ? `${customer.name} is now a customer. Deal marked Won.`
          : 'Deal marked Won.');
      } catch (error) {
        console.error('Error converting won deal:', error);
        alert(`Could not mark deal as Won: ${error.message}`);
      }

      return;
    }

    // Normal stage movement for the other Pipeline stages.
    setDeals(prev =>
      prev.map(d =>
        d.id === id ? { ...d, stage } : d
      )
    );

    const { error } = await supabase
      .from('deals')
      .update({ stage })
      .eq('id', id);

    if (error) {
      console.error('Error updating deal stage:', error);
      setDeals(prev => prev.map(d => (d.id === id ? { ...d, stage: previousStage } : d)));
      alert(`Could not update deal stage: ${error.message}`);
    }
  }
  async function deleteDeal(id) {
    if (!isCommercialDeleter(authorizationProfile?.role)) { showToast('You do not have permission to delete deals.'); return; }
    const confirmed = window.confirm(
      'Are you sure you want to delete this deal?'
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting deal:', error);
      alert(`Could not delete deal: ${error.message}`);
      return;
    }

    setDeals(prev => prev.filter(deal => deal.id !== id));
  }
  async function updateDeal(e) {
    e.preventDefault();
    setEditDealError('');

    if (!editingDeal.title.trim()) {
      setEditDealError('Deal title is required.');
      return;
    }

    if (
      editingDeal.amount === '' ||
      Number.isNaN(Number(editingDeal.amount)) ||
      Number(editingDeal.amount) < 0
    ) {
      setEditDealError('Enter a valid deal amount.');
      return;
    }

    setEditDealSaving(true);

    try {
      const { data, error } = await supabase
        .from('deals')
        .update({
          title: editingDeal.title.trim(),
          company: editingDeal.company?.trim() || null,
          contact_name: editingDeal.contact_name?.trim() || null,
          contact_email: editingDeal.contact_email?.trim() || null,
          contact_phone: editingDeal.contact_phone?.trim() || null,
          amount: Number(editingDeal.amount),
          stage: editingDeal.stage,
          customer_id: editingDeal.customer_id || null,
          closure_start_at: editingDeal.closure_start_at ? new Date(editingDeal.closure_start_at).toISOString() : null,
          closure_end_at: editingDeal.closure_end_at ? new Date(editingDeal.closure_end_at).toISOString() : null
        })
        .eq('id', editingDeal.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating deal:', error);
        setEditDealError(error.message);
        return;
      }
      const selectedProductIds = [...new Set(editingDeal.product_ids || [])];
      const { error: deleteProductError } = await supabase
        .from('deal_products')
        .delete()
        .eq('deal_id', data.id);
      if (deleteProductError) throw deleteProductError;

      if (selectedProductIds.length > 0) {
        const { error: insertProductError } = await supabase
          .from('deal_products')
          .insert(selectedProductIds.map(productId => ({ deal_id: data.id, product_id: productId })));
        if (insertProductError) throw insertProductError;
      }

      setDealProducts(prev => [
        ...prev.filter(row => row.deal_id !== data.id),
        ...selectedProductIds.map(productId => ({ deal_id: data.id, product_id: productId }))
      ]);

      const selectedSupportIds = [...new Set(editingDeal.support_engineer_ids || [])];
      const { error: deleteSupportError } = await supabase
        .from('deal_support_engineers')
        .delete()
        .eq('deal_id', data.id);
      if (deleteSupportError) throw deleteSupportError;
      if (selectedSupportIds.length > 0) {
        const { error: insertSupportError } = await supabase
          .from('deal_support_engineers')
          .insert(selectedSupportIds.map(support_engineer_id => ({ deal_id: data.id, support_engineer_id })));
        if (insertSupportError) throw insertSupportError;
      }
      setDealSupport(prev => [
        ...prev.filter(row => row.deal_id !== data.id),
        ...selectedSupportIds.map(support_engineer_id => ({ deal_id: data.id, support_engineer_id }))
      ]);

      setDeals(prev =>
        prev.map(deal =>
          deal.id === data.id ? data : deal
        )
      );
      setEditingDeal(null);
    } catch (error) {
      console.error('Unexpected error:', error);
      setEditDealError('Something went wrong. Please try again.');
    } finally {
      setEditDealSaving(false);
    }
  }

  async function reverseGeocodeLocation(latitude, longitude) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=18&addressdetails=1`);
      if (!response.ok) return { address: '', street: '', city: '', state: '', country: '' };
      const result = await response.json();
      const a = result.address || {};
      const street = [a.house_number, a.road || a.pedestrian || a.footway].filter(Boolean).join(' ');
      return {
        address: result.display_name || '',
        street,
        city: a.city || a.town || a.village || a.suburb || a.county || '',
        state: a.state || a.region || '',
        country: a.country || ''
      };
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return { address: '', street: '', city: '', state: '', country: '' };
    }
  }

  async function startFieldVisit(visitForm = {}) {
    setFieldVisitError('');
    const {
      targetType = 'customer', customerId = '', targetName = '', targetOrganization = '',
      targetAddress = '', visitType = 'Customer visit', contactPerson = '', objective = '', notes = ''
    } = visitForm;

    if (targetType === 'customer' && !customerId) throw new Error('Select a customer before scheduling a field visit.');
    if (targetType === 'other' && !targetName.trim()) throw new Error('Enter the person or organization you are visiting.');
    if (!objective.trim()) throw new Error('Enter the visit objective before scheduling.');

    const customer = targetType === 'customer' ? customers.find(item => item.id === customerId) : null;
    if (targetType === 'customer' && !customer) throw new Error('Customer could not be found.');

    const activityId = crypto.randomUUID();
    const now = new Date().toISOString();
    const resolvedName = targetType === 'customer' ? customer.name : targetName.trim();
    const resolvedOrganization = targetType === 'customer' ? (customer.company || '') : targetOrganization.trim();
    const resolvedAddress = targetType === 'customer' ? (customer.location_address?.trim() || '') : targetAddress.trim();
    const title = `${visitType} — ${resolvedName}`;
    const visitNotes = [
      contactPerson ? `Contact: ${contactPerson}` : '',
      resolvedOrganization ? `Organization: ${resolvedOrganization}` : '',
      objective ? `Objective: ${objective}` : '',
      notes ? `Notes: ${notes}` : '',
      resolvedAddress ? `Visit address: ${resolvedAddress}` : '',
      'Field visit scheduled. GPS will be captured when Check In is pressed.'
    ].filter(Boolean).join('\n');

    const { error: activityError } = await supabase.from('activities').insert({
      id: activityId, title, type: 'Field Visit', activity_date: now, customer_id: customer?.id || null,
      notes: visitNotes, status: 'Scheduled', priority: 'Medium', assigned_to: session.user.id, created_by: session.user.id
    });
    if (activityError) throw activityError;

    const customerLat = customer && customer.latitude !== '' && customer.latitude != null ? Number(customer.latitude) : NaN;
    const customerLng = customer && customer.longitude !== '' && customer.longitude != null ? Number(customer.longitude) : NaN;
    const hasCustomerLocation = targetType === 'customer' && Number.isFinite(customerLat) && Number.isFinite(customerLng);
    const { data, error } = await supabase.from('field_visits').insert({
      activity_id: activityId, sales_rep_id: session.user.id, customer_id: customer?.id || null,
      target_type: targetType, target_name: resolvedName, target_organization: resolvedOrganization || null,
      target_address: resolvedAddress || null, purpose: visitType, contact_person: contactPerson.trim() || null,
      objective: objective.trim(), notes: notes.trim() || null,
      check_in_at: null, check_in_latitude: null, check_in_longitude: null, check_in_accuracy: null,
      check_in_location_url: null, check_out_at: null, check_out_latitude: null, check_out_longitude: null,
      check_out_accuracy: null, check_out_location_url: null,
      customer_latitude: hasCustomerLocation ? customerLat : null,
      customer_longitude: hasCustomerLocation ? customerLng : null,
      distance_from_customer: null, verification_status: 'PENDING'
    }).select().single();
    if (error) {
      await supabase.from('activities').delete().eq('id', activityId);
      throw error;
    }

    setActivities(prev => [{
      id: activityId, title, type: 'Field Visit', activity_date: now, customer_id: customer?.id || null,
      notes: visitNotes, status: 'Scheduled', priority: 'Medium', assigned_to: session.user.id, created_by: session.user.id
    }, ...prev]);
    setFieldVisits(prev => [data, ...prev]);
    return data;
  }

  async function checkInFieldVisit(visit) {
    return new Promise((resolve, reject) => {
      captureCurrentLocation(async coords => {
        try {
          const location = await reverseGeocodeLocation(coords.latitude, coords.longitude);
          const now = new Date().toISOString();
          const customerLat = Number(visit.customer_latitude);
          const customerLng = Number(visit.customer_longitude);
          const hasCustomerLocation = visit.customer_latitude != null && visit.customer_longitude != null && Number.isFinite(customerLat) && Number.isFinite(customerLng);
          const distance = hasCustomerLocation ? distanceInMeters(coords.latitude, coords.longitude, customerLat, customerLng) : null;
          const verification = coords.accuracy > LOW_ACCURACY_METERS ? 'LOW_ACCURACY' : visit.target_type === 'other' ? 'LOCATION_CAPTURED' : !hasCustomerLocation ? 'NOT_CONFIGURED' : distance <= 300 ? 'VERIFIED' : distance <= 1000 ? 'NEARBY' : 'MISMATCH';
          const { data, error } = await supabase.from('field_visits').update({
            check_in_at: now, check_in_latitude: coords.latitude, check_in_longitude: coords.longitude,
            check_in_accuracy: coords.accuracy || null,
            check_in_location_url: googleMapsLocationUrl(coords.latitude, coords.longitude, location.address),
            check_in_location_address: location.address || null, check_in_street: location.street || null,
            check_in_city: location.city || null, check_in_state: location.state || null, check_in_country: location.country || null,
            distance_from_customer: distance, verification_status: verification
          }).eq('id', visit.id).is('check_in_at', null).select().single();
          if (error) throw error;
          const activityNotes = `Field visit checked in at ${now}. Address: ${location.address || 'Address unavailable'}. GPS accuracy: ${Math.round(coords.accuracy || 0)}m.`;
          const { error: activityError } = await supabase.from('activities').update({ status: 'In Progress', notes: activityNotes }).eq('id', visit.activity_id);
          if (activityError) console.warn('Could not update related activity status:', activityError.message);
          setFieldVisits(prev => prev.map(item => item.id === data.id ? data : item));
          setActivities(prev => prev.map(item => item.id === visit.activity_id ? { ...item, status: 'In Progress', notes: activityNotes } : item));
          resolve(data);
        } catch (error) { reject(error); }
      }, reject);
    });
  }

  async function endFieldVisit(visit) {
    if (!visit.check_in_at) throw new Error('Check in to this visit before checking out.');
    return new Promise((resolve, reject) => {
      captureCurrentLocation(async coords => {
        try {
          const location = await reverseGeocodeLocation(coords.latitude, coords.longitude);
          const now = new Date().toISOString();
          const customerLat = Number(visit.customer_latitude);
          const customerLng = Number(visit.customer_longitude);
          const hasCustomerLocation = visit.customer_latitude != null && visit.customer_longitude != null && Number.isFinite(customerLat) && Number.isFinite(customerLng);
          const distance = hasCustomerLocation ? distanceInMeters(coords.latitude, coords.longitude, customerLat, customerLng) : null;
          const verification = coords.accuracy > LOW_ACCURACY_METERS ? 'LOW_ACCURACY' : visit.target_type === 'other' ? 'LOCATION_CAPTURED' : !hasCustomerLocation ? 'NOT_CONFIGURED' : distance <= 300 ? 'VERIFIED' : distance <= 1000 ? 'NEARBY' : 'MISMATCH';
          const { data, error } = await supabase.from('field_visits').update({
            check_out_at: now, check_out_latitude: coords.latitude, check_out_longitude: coords.longitude,
            check_out_accuracy: coords.accuracy || null,
            check_out_location_url: googleMapsLocationUrl(coords.latitude, coords.longitude, location.address),
            check_out_location_address: location.address || null, check_out_street: location.street || null,
            check_out_city: location.city || null, check_out_state: location.state || null, check_out_country: location.country || null,
            distance_from_customer: distance ?? visit.distance_from_customer, verification_status: verification
          }).eq('id', visit.id).is('check_out_at', null).select().single();
          if (error) throw error;
          const activityNotes = `Field visit completed. Check-out address: ${location.address || 'Address unavailable'}. GPS accuracy: ${Math.round(coords.accuracy || 0)}m.`;
          await supabase.from('activities').update({ status: 'Completed', notes: activityNotes }).eq('id', visit.activity_id);
          setFieldVisits(prev => prev.map(item => item.id === data.id ? data : item));
          setActivities(prev => prev.map(item => item.id === visit.activity_id ? { ...item, status: 'Completed', notes: activityNotes } : item));
          resolve(data);
        } catch (error) { reject(error); }
      }, reject);
    });
  }

  async function addActivity() {
    setActivityError('');

    if (!newActivity.title.trim()) {
      setActivityError('Please enter an activity title.');
      return;
    }

    setActivitySaving(true);

    const { error } = await supabase
      .from('activities')
      .insert([
        {
          title: newActivity.title.trim(),
          type: newActivity.type,
          activity_date: newActivity.activity_date
            ? newActivity.activity_date
            : new Date().toISOString(),
          customer_id: newActivity.customer_id || null,
          notes: newActivity.notes.trim() || null,
          status: newActivity.status,
          priority: newActivity.priority || 'Medium',
          assigned_to: newActivity.assigned_to || session.user.id,
          created_by: session.user.id
        }
      ]);

    setActivitySaving(false);
    if (error) {
      console.error('Error adding activity:', error);
      setActivityError(error.message);
      return;
    }
    setNewActivity({
      title: '',
      type: 'Task',
      activity_date: '',
      customer_id: '',
      notes: '',
      status: 'Scheduled',
      priority: 'Medium',
      assigned_to: ''
    });
    setShowActivityForm(false);
    fetchActivities();
  }
  async function updateActivity(e) {
    e.preventDefault();
    setEditActivityError('');
    if (!editingActivity?.title?.trim()) { setEditActivityError('Activity title is required.'); return; }
    setEditActivitySaving(true);
    try {
      const { data, error } = await supabase.from('activities').update({
        title: editingActivity.title.trim(), type: editingActivity.type,
        activity_date: editingActivity.activity_date || null,
        customer_id: editingActivity.customer_id || null,
        notes: editingActivity.notes?.trim() || null,
        status: editingActivity.status,
        priority: editingActivity.priority || 'Medium',
        assigned_to: editingActivity.assigned_to || null
      }).eq('id', editingActivity.id).select('*').single();
      if (error) { console.error('Error updating activity:', error); setEditActivityError(error.message); return; }
      setActivities(prev => prev.map(activity => activity.id === data.id ? data : activity));
      setEditingActivity(null);
      if (selectedActivity?.id === data.id) setSelectedActivity(data);
    } finally { setEditActivitySaving(false); }
  }

  async function updateActivityStatus(id, status) {
    const { data, error } = await supabase.from('activities').update({ status }).eq('id', id).select('*').single();
    if (error) { console.error('Error updating activity:', error); alert(error.message); return; }
    setActivities(prev => prev.map(activity => activity.id === data.id ? data : activity));
    if (selectedActivity?.id === data.id) setSelectedActivity(data);
  }
  async function deleteActivity(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this activity?'
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting activity:', error);
      alert(error.message);
      return;
    }

    setActivities((prev) =>
      prev.filter((activity) => activity.id !== id)
    );
  }
  async function addTicket(e) {
    e.preventDefault();
    setTicketError('');
    if (!newTicket.title.trim()) { setTicketError('Ticket title is required.'); return; }
    setTicketSaving(true);
    try {
      const { data, error } = await supabase.from('tickets').insert([{
        title: newTicket.title.trim(), description: newTicket.description.trim() || null,
        customer_id: newTicket.customer_id || null, status: newTicket.status,
        priority: newTicket.priority, category: newTicket.category, assigned_to: newTicket.assigned_to || session.user.id, portal_visible: newTicket.portal_visible !== false, created_by: session.user.id
      }]).select(`*, customers (name, company)`).single();
      if (error) { console.error('Error adding ticket:', error); setTicketError(error.message); return; }
      setTickets(prev => [data, ...prev]);
      setNewTicket({ title: '', description: '', customer_id: '', status: 'Open', priority: 'Medium', category: 'General', assigned_to: '', portal_visible: true });
      setShowTicketForm(false);
    } catch (error) { console.error('Unexpected error:', error); setTicketError('Something went wrong. Please try again.'); }
    finally { setTicketSaving(false); }
  }

  async function updateTicket(e) {
    e.preventDefault();
    setEditTicketError('');
    if (!editingTicket?.title?.trim()) { setEditTicketError('Ticket title is required.'); return; }
    setEditTicketSaving(true);
    try {
      const { data, error } = await supabase.from('tickets').update({
        title: editingTicket.title.trim(), description: editingTicket.description?.trim() || null,
        customer_id: editingTicket.customer_id || null, status: editingTicket.status,
        priority: editingTicket.priority, category: editingTicket.category, assigned_to: editingTicket.assigned_to || null, portal_visible: editingTicket.source === 'portal' ? true : !!editingTicket.portal_visible, updated_at: new Date().toISOString()
      }).eq('id', editingTicket.id).select(`*, customers (name, company)`).single();
      if (error) { console.error('Error updating ticket:', error); setEditTicketError(error.message); return; }
      setTickets(prev => prev.map(ticket => ticket.id === data.id ? data : ticket));
      setEditingTicket(null);
      if (selectedTicket?.id === data.id) setSelectedTicket(data);
    } finally { setEditTicketSaving(false); }
  }

  async function updateTicketStatus(id, status) {
    setTicketError('');
    const { data, error } = await supabase.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select(`*, customers (name, company)`).single();
    if (error) { console.error('Error updating ticket status:', error); setTicketError(error.message); return; }
    setTickets(prev => prev.map(ticket => ticket.id === id ? data : ticket));
    if (selectedTicket?.id === id) setSelectedTicket(data);
  }

  async function assignTicket(id, userId) {
    if (!['admin', 'manager', 'head_of_sales'].includes(authorizationProfile?.role)) { showToast('Only MD, Admin or Head of Sales can assign support tickets.'); return; }
    const { data, error } = await supabase.from('tickets')
      .update({ assigned_to: userId || null, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`*, customers (name, company)`)
      .single();
    if (error) {
      console.error('Error assigning ticket:', error);
      showToast(`Could not assign ticket: ${error.message}`);
      return;
    }
    setTickets(prev => prev.map(ticket => ticket.id === id ? data : ticket));
    if (selectedTicket?.id === id) setSelectedTicket(data);
    if (userId && userId !== session.user.id) {
      const { error: notifyError } = await supabase.from('notifications').insert({
        user_id: userId,
        type: 'ticket_assigned',
        title: 'Ticket assigned to you',
        message: data.title,
        link: 'Tickets'
      });
      if (notifyError) console.error('Could not notify assignee:', notifyError);
    }
  }

  async function deleteTicket(id) {
    const confirmed = window.confirm('Are you sure you want to delete this ticket?');
    if (!confirmed) return;
    setTicketError('');
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) { console.error('Error deleting ticket:', error); setTicketError(error.message); return; }
    setTickets(prev => prev.filter(ticket => ticket.id !== id));
    if (selectedTicket?.id === id) setSelectedTicket(null);
  }

  if (authLoading || authorizationLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-loading">
          <div className="auth-brand">
            <div className="brand-mark"><img src="/storhetLogo.png" alt="Storhet CRM" /></div>
            <span className="brand-name">
              Storhet<span className="brand-accent">CRM</span>
            </span>
          </div>
          <p>
            {authLoading
              ? 'Checking your session...'
              : 'Checking your account access...'}
          </p>
        </div>
      </div>
    );
  }
  if (session?.user && portalAccount?.status === 'active' && !authorized) {
    return <CustomerPortalHome user={session.user} account={portalAccount} onSignOut={handleSignOut} />;
  }

  if (session?.user && !authorized && (portalAccount || portalSetupPending)) {
    return <PortalStatusScreen account={portalAccount} email={session.user.email} onSignOut={handleSignOut} />;
  }

  if (session?.user && authorized && showStaffOnboarding) {
    const roleLabel = ROLE_OPTIONS.find(r => r.value === authorizationProfile?.role)?.label || authorizationProfile?.role;
    return (
      <div className="auth-page">
        <div className="auth-card onboarding-card">
          <div className="auth-brand"><div className="brand-mark"><img src="/storhetLogo.png" alt="Storhet CRM" /></div><span className="brand-name">Storhet<span className="brand-accent">CRM</span></span></div>
          <div className="auth-heading"><h1>Welcome to the team</h1><p>Your account is set up as <strong>{roleLabel}</strong>.</p></div>
          <ul className="onboarding-checklist">
            <li>Your dashboard shows what's relevant to your role, check it first.</li>
            <li>Look for customers, deals or tickets already assigned to you.</li>
            <li>Add a profile photo and your details under Settings.</li>
            <li>Not sure where something is? Ask your MD or an admin.</li>
          </ul>
          <button type="button" className="primary-btn" onClick={() => setShowStaffOnboarding(false)}>Get started</button>
        </div>
      </div>
    );
  }

  if (!session || !authorized) {
    return (
      <AuthScreen
        onGoogleSignIn={signInWithGoogle}
        onMicrosoftSignIn={signInWithMicrosoft}
        onEmailSignIn={signInWithEmail}
        onEmailSignUp={signUpWithEmail}
        onPortalSignUp={signUpCustomerPortal}
        authMode={authMode}
        setAuthMode={setAuthMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={authError}
        notice={authNotice}
        loading={authLoading || authorizationLoading || emailLoading}
        staffInvite={staffInviteInfo}
        staffInviteChecking={staffInviteChecking}
        staffInviteError={staffInviteError}
        onStaffInviteSignUp={signUpStaffInvite}
      />
    );
  }

  // The rendering of the internal CRM workspace is done here
  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><img src="/storhetLogo.png" alt="" /></div>
        <span className="brand-name">Storhet<span className="brand-accent">CRM</span></span>
        <button className="icon-btn close-mobile" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
      </div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="nav-sections" style={{ overflowY: "auto", paddingBottom: 12 }}>
        {rolePanelFor(authorizationProfile?.role) && (() => {
          const item = rolePanelNav.find(([label, , role]) => role === authorizationProfile?.role); if (!item) return null; const [label, Icon] = item; return (
            <div className="nav-section role-panel-nav" style={{ marginBottom: 10 }}>
              <div className="nav-section-title" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', opacity: .55, padding: '10px 14px 6px', textTransform: 'uppercase' }}>ROLE PANEL</div>
              <button key={label} className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => { setPage(label); setSidebarOpen(false); }}><Icon size={18} /><span>{label}</span></button>
            </div>
          );
        })()}
        {navSections.map(section => (
          <div className="nav-section" key={section.title} style={{ marginBottom: 10 }}>
            <div className="nav-section-title" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", opacity: .55, padding: "10px 14px 6px", textTransform: "uppercase" }}>{section.title}</div>
            {section.items.filter(([label]) => !(authorizationProfile?.role === 'technical_support' && label === 'Tickets')).map(([label, Icon]) => (
              <button key={label} className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => { setPage(label); setSidebarOpen(false); }}>
                <Icon size={18} /><span>{label}</span>
              </button>
            ))}
          </div>
        ))}
        {isAdminRole(authorizationProfile?.role) && (
          <div className="nav-section" style={{ marginBottom: 10 }}>
            <div className="nav-section-title" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", opacity: .55, padding: "10px 14px 6px", textTransform: "uppercase" }}>Administration</div>
            <button className={`nav-item ${page === 'UserManagement' ? 'active' : ''}`} onClick={() => { setPage('UserManagement'); setSidebarOpen(false); }}>
              <UserCog size={18} /><span>User Management</span>
            </button>
          </div>
        )}
      </nav>
      <div className="sidebar-bottom">
        {/* <div className="upgrade-card">
          <div className="upgrade-icon">✦</div>
          <strong>Upgrade your plan</strong><p>Unlock advanced reporting and automation.</p>
          <button onClick={() => setPage('Reports')}>Explore plans <ArrowUpRight size={14} /></button>
        </div> */}
        <div className="profile-mini">
          <div className="avatar">
            {(displayUserName[0] || 'U').toUpperCase()}
          </div>

          <div className="profile-details">
            <strong>{displayUserName}</strong>
            <span>
              {roleLabel(authorizationProfile?.role)}
            </span>
          </div>

          <button
            className="logout-btn"
            onClick={handleSignOut}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
    <main className="main-content">
      <header className="topbar">
        <button className="icon-btn menu-mobile" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
        <div className="breadcrumb">
          <span>Workspace</span>
          <b>/</b>
          <strong>{page}</strong>
        </div>
        <div className="top-actions">
          <div className="global-search">
            <Search size={16} />
            <input
              ref={searchInputRef}
              placeholder="Search anything..."
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
            />
            <kbd>⌘ K</kbd>
            {globalSearch.trim() && (
              <div className="global-search-dropdown">
                {globalSearchResults.length === 0 ? (
                  <div className="global-search-empty">
                    No results found.
                  </div>
                ) : (
                  globalSearchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${index}`}
                      type="button"
                      onClick={() => {
                        setPage(result.page);
                        setGlobalSearch('');

                        if (result.type === 'Customer') {
                          setSelectedCustomer(result.customer);
                        }
                      }}
                      className="global-search-result"
                    >
                      <strong>
                        {result.title}
                      </strong>

                      <span>
                        {result.type} · {result.subtitle}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <button className="icon-btn" style={{ position: 'relative' }} title='Notifications' onClick={() => setShowNotifications(prev => !prev)}>
            <Bell size={19} />
            {unreadNotificationCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '999px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {unreadNotificationCount}
              </span>
            )}
          </button>
          <button type="button" className="avatar avatar-button" title="Edit profile" onClick={() => { setProfileDraft(profileName); setProfileModalOpen(true); }}>{(displayUserName[0] || 'U').toUpperCase()}</button>
        </div>
      </header>
      <RefreshContext.Provider value={{ refreshAll, refreshing }}>
        <section className="page-content">
          {!pageDataReady ? <PageSkeleton /> : <>
            {page === 'Dashboard' && (
              <Dashboard revenue={revenue} customers={customers} leads={leads} deals={deals} activities={activities} tickets={tickets} setPage={setPage} formatAmount={formatAmount} onSelectCustomer={setSelectedCustomer} onEditCustomer={setEditingCustomer} onDeleteCustomer={deleteCustomer} currentUserId={session.user.id} role={authorizationProfile?.role} />
            )}
            {page === 'MD Panel' && ['manager', 'admin'].includes(authorizationProfile?.role) && <MDPanel deals={deals} quotes={quotes} invoices={invoices} customers={customers} formatAmount={formatAmount} onApprove={approveCommercialRecord} onReject={rejectCommercialRecord} />}
            {page === 'HOS Panel' && authorizationProfile?.role === 'head_of_sales' && <HOSPanel deals={deals} quotes={quotes} invoices={invoices} quoteItems={quoteItems} tickets={tickets} ownerProfiles={ownerProfiles} formatAmount={formatAmount} currentUserId={session.user.id} role={authorizationProfile?.role} setPage={setPage} onApprove={approveCommercialRecord} onReject={rejectCommercialRecord} />}
            {page === 'HR Panel' && authorizationProfile?.role === 'hr' && <HRPanel activities={activities} authorizedUsers={authorizedUsers} ownerProfiles={ownerProfiles} customers={customers} leads={leads} />}
            {page === 'Technical Support Panel' && authorizationProfile?.role === 'technical_support' && <TechnicalSupportPanel tickets={tickets} customers={customers} formatAmount={formatAmount} currentUserId={session.user.id} ticketError={ticketError} onAddTicket={() => { setTicketError(''); setNewTicket(t => ({ ...t, customer_id: '' })); setShowTicketForm(true); }} onStatusChange={updateTicketStatus} onDeleteTicket={deleteTicket} onEditTicket={ticket => { setEditTicketError(''); setEditingTicket(ticket); }} onViewTicket={setSelectedTicket} isAdmin={isAdminRole(authorizationProfile?.role)} role={authorizationProfile?.role} canManage={canManageTicket} staffName={staffName} staffOptions={getStaffOptions()} onAssign={assignTicket} setPage={setPage} />}
            {page === 'Customers' && (
              <Customers customers={filteredCustomers}
                allCustomers={customers}
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                deals={deals}
                onImport={importCustomers}
                onAdd={() => { setCustomerError(''); setShowCustomerForm(true); }}
                formatAmount={formatAmount}
                onSelectCustomer={setSelectedCustomer}
                onDeleteCustomer={deleteCustomer}
                onEditCustomer={setEditingCustomer}
                currentUserId={session.user.id}
                role={authorizationProfile?.role}
              />
            )}
            {page === 'Products' && <Products products={products} supportEngineers={supportEngineers} solutionSupport={solutionSupport} onAdd={addProduct} onUpdate={updateProduct} onDelete={deleteProduct} onUpdateFamilySupport={syncSolutionSupport} currentUserId={session.user.id} isAdmin={isSystemAdminOrMD(authorizationProfile?.role)} />}
            {page === 'Technical Support' && <SupportEngineers supportEngineers={supportEngineers} solutionSupport={solutionSupport} onAdd={addSupportEngineer} onUpdate={updateSupportEngineer} onDeactivate={deactivateSupportEngineer} isAdmin={isSystemAdminOrMD(authorizationProfile?.role)} />}
            {page === 'Leads' && <Leads leads={leads} customers={customers} products={products} leadProducts={leadProducts} onAdd={addLead} onUpdate={updateLead} onSyncProducts={syncLeadProducts} onDelete={deleteLead} currentUserId={session.user.id} isAdmin={['admin', 'manager', 'head_of_sales'].includes(authorizationProfile?.role)} />}
            {page === 'Email' && <EmailPage emailLogs={emailLogs} customers={customers} integrations={emailIntegrations} loading={emailIntegrationLoading} error={emailIntegrationError} onConnect={connectEmailProvider} onDisconnect={disconnectEmailProvider} onCompose={() => openCompose()} onAdd={async payload => { try { await addEmailLog(payload); showToast('Email logged.'); } catch (e) { alert(e.message); } }} />}
            {page === 'Calendar' && <CalendarPage events={calendarEvents} customers={customers} onAdd={addCalendarEvent} onUpdate={updateCalendarEvent} onDelete={deleteCalendarEvent} onRefresh={fetchCalendarEvents} />}
            {page === 'Quotes' && <Quotes quotes={quotes} products={products} deals={deals} dealProducts={dealProducts} customers={customers} quoteItems={quoteItems} onLoadQuoteItems={loadQuoteItems} onAdd={addQuote} onUpdate={updateQuote} onDelete={deleteQuote} formatAmount={formatAmount} currentUserId={session.user.id} isAdmin={isAdminRole(authorizationProfile?.role)} role={authorizationProfile?.role} onSendToHOS={sendQuoteToHOS} initialDealId={commercialLaunch?.type === 'quote' ? commercialLaunch.dealId : ''} dealFilterId={commercialView?.type === 'quotes' ? commercialView.dealId : ''} onLaunchConsumed={() => setCommercialLaunch(null)} onCreateInvoice={launchInvoiceFromQuote} />}
            {page === 'Invoices' && <Invoices invoices={invoices} payments={payments} customers={customers} products={products} deals={deals} dealProducts={dealProducts} quotes={quotes} onAdd={addInvoice} onUpdate={updateInvoice} onDelete={deleteInvoice} onAddPayment={addPayment} formatAmount={formatAmount} currentUserId={session.user.id} isAdmin={isAdminRole(authorizationProfile?.role)} role={authorizationProfile?.role} onSendToHOS={sendInvoiceToHOS} onLoadInvoiceItems={loadInvoiceItems} onLoadQuoteItems={loadQuoteItems} initialDealId={commercialLaunch?.type === 'invoice' ? commercialLaunch.dealId : ''} initialQuoteId={commercialLaunch?.type === 'invoice' ? commercialLaunch.quoteId : ''} dealFilterId={commercialView?.type === 'invoices' ? commercialView.dealId : ''} onLaunchConsumed={() => setCommercialLaunch(null)} />}
            {page === 'Documents' && <Documents documents={documents} customers={customers} onUpload={uploadDocument} onDownload={downloadDocument} onDelete={deleteDocument} />}
            {page === 'Automation' && <Automation workflows={workflows} onAdd={addWorkflow} onUpdate={updateWorkflow} />}
            {page === 'Segments' && <Segments segments={segments} customers={customers} onAdd={addSegment} onUpdate={updateSegment} />}
            {page === 'Forecast' && <Forecast deals={deals} formatAmount={formatAmount} />}
            {page === 'Pipeline' && (
              <Pipeline
                deals={deals}
                customers={customers}
                dealSupport={dealSupport}
                supportEngineers={supportEngineers}
                moveDeal={moveDeal}
                deleteDeal={deleteDeal}
                formatAmount={formatAmount}
                currentUserId={session.user.id}
                ownerProfiles={ownerProfiles}
                isAdmin={isAdminRole(authorizationProfile?.role)}
                role={authorizationProfile?.role}
                onCreateQuoteFromDeal={launchQuoteFromDeal}
                onViewDealCommercials={viewDealCommercials}
                onEdit={deal => {
                  setEditDealError('');
                  setEditingDeal({
                    ...deal,
                    amount: String(deal.amount ?? ''),
                    product_ids: dealProducts.filter(row => row.deal_id === deal.id).map(row => row.product_id),
                    support_engineer_ids: dealSupport.filter(row => row.deal_id === deal.id).map(row => row.support_engineer_id)
                  });
                }}
                onAdd={() => {
                  setDealError('');
                  setNewDeal({ title: '', company: '', amount: '', stage: 'New Lead', customer_id: '', contact_name: '', contact_email: '', contact_phone: '', new_customer_name: '', new_customer_email: '', new_customer_phone: '', new_customer_company: '', new_customer_job_title: '', new_customer_birthday: '', closure_start_at: '', closure_end_at: '', support_engineer_ids: [] });
                  setSelectedDealProductIds([]);
                  setExpandedDealVendor(null);
                  setShowDealForm(true);
                }}
              />
            )}
            {page === 'Activities' && (
              <Activities activities={activities} customers={customers} ownerProfiles={ownerProfiles} currentUserEmail={session.user.email} onAdd={() => { setActivityError(''); setNewActivity(a => ({ ...a, customer_id: '' })); setShowActivityForm(true); }} onStatusChange={updateActivityStatus} onDelete={deleteActivity} onEdit={activity => { setEditActivityError(''); setEditingActivity({ ...activity, activity_date: formatDateTimeLocal(activity.activity_date) }); }} onView={setSelectedActivity} currentUserId={session.user.id} isAdmin={isSystemAdminOrMD(authorizationProfile?.role)} />
            )}
            {page === 'Field Visits' && ['sales', 'head_of_sales', 'manager', 'admin'].includes(authorizationProfile?.role) && (
              <FieldVisits customers={customers} fieldVisits={fieldVisits} currentUserId={session.user.id} role={authorizationProfile?.role} onStart={startFieldVisit} onCheckIn={checkInFieldVisit} onEnd={endFieldVisit} error={fieldVisitError} />
            )}
            {page === 'Tickets' && authorizationProfile?.role !== 'technical_support' && (
              <Tickets
                tickets={tickets}
                error={ticketError}
                onAdd={() => { setTicketError(''); setNewTicket(t => ({ ...t, customer_id: '' })); setShowTicketForm(true); }}
                onStatusChange={updateTicketStatus}
                onDelete={deleteTicket}
                onEdit={ticket => { setEditTicketError(''); setEditingTicket(ticket); }}
                onView={setSelectedTicket}
                currentUserId={session.user.id}
                isAdmin={isAdminRole(authorizationProfile?.role)}
                role={authorizationProfile?.role}
                canCreate={['admin', 'manager', 'head_of_sales'].includes(authorizationProfile?.role)}
                canManage={canManageTicket}
                staffName={staffName}
                staffOptions={getStaffOptions()}
                onAssign={assignTicket}
              />
            )}
            {page === 'Chat' && <Chat />}
            {page === 'Reports' && <AdvancedReports customers={customers} deals={deals} activities={activities} tickets={tickets} leads={leads} quotes={quotes} invoices={invoices} payments={payments} formatAmount={formatAmount} />}
            {page === 'Email Logs' && <EmailLogs emailLogs={emailLogs} customers={customers} onAdd={addEmailLog} />}
            {page === 'UserManagement' && isAdminRole(authorizationProfile?.role) && <UserManagement users={authorizedUsers} loading={usersLoading} error={usersError} onRefresh={fetchAuthorizedUsers} onUpdateUser={updateAuthorizedUser} currentUserId={session?.user?.id} pendingPortalAccounts={pendingPortalAccounts} portalRequestsLoading={portalRequestsLoading} portalRequestsError={portalRequestsError} portalRequestsNotice={portalRequestsNotice} onRefreshPortalRequests={fetchPendingPortalAccounts} onReviewPortalRequest={reviewPortalRequest} portalRequestActionId={portalRequestActionId} onInviteStaff={inviteStaffWorker} onOpenInviteEmail={openCompose} staffInvitations={staffInvitations} onRevokeStaffInvitation={revokeStaffInvitation} staffInvitationActionId={staffInvitationActionId} />}
            {page === 'Settings' && <SettingsPage currency={currency} setCurrency={setCurrency} theme={theme} setTheme={setTheme} />}
          </>}
        </section>
      </RefreshContext.Provider>
    </main>
    {showCustomerForm && (
      <div className="modal-backdrop">
        <form className="modal" onSubmit={addCustomer}>
          <div className="modal-heading">
            <h2>Add customer</h2>
            <button type="button" className="icon-btn" onClick={() => setShowCustomerForm(false)}><X size={18} /></button>
          </div>
          {customerError && <div className="form-error">{customerError}</div>}
          <label>Full name<input value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} required /> </label>
          <label>
            Company
            <input
              value={newCustomer.company}
              onChange={e =>
                setNewCustomer({
                  ...newCustomer,
                  company: e.target.value
                })
              }
            />
          </label>
          <label>Email<input type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} required /> </label>
          <label>Phone<input value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="+234..." /></label>
          <JobTitleField value={newCustomer.job_title} onChange={value => setNewCustomer({ ...newCustomer, job_title: value })} />
          <BirthdayField value={newCustomer.birthday} onChange={value => setNewCustomer({ ...newCustomer, birthday: value })} />
          <label>Branch / visit address<input value={newCustomer.location_address || ''} onChange={e => setNewCustomer({ ...newCustomer, location_address: e.target.value })} placeholder="e.g. UBA CMS, Marina, Lagos" /></label>
          <LocationCaptureFields latitude={newCustomer.latitude} longitude={newCustomer.longitude} onCapture={coords => setNewCustomer(prev => ({ ...prev, latitude: String(coords.latitude), longitude: String(coords.longitude) }))} />
          <label>
            Status
            <select value={newCustomer.status} onChange={e => setNewCustomer({ ...newCustomer, status: e.target.value })}>
              <option value="Lead">Lead</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          <button
            className="primary-btn"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Creating...' : 'Create customer'}
          </button>
        </form>
      </div>
    )}
    {selectedCustomer && !CUSTOMER_DETAIL_DATA.every(key => readyDatasets.has(key)) && <div className="page-loading-bar" role="progressbar" aria-label="Loading customer" />}
    {selectedCustomer && CUSTOMER_DETAIL_DATA.every(key => readyDatasets.has(key)) && (
      <CustomerDetail
        currentUserId={session.user.id}
        customer={selectedCustomer}
        deals={deals}
        activities={activities}
        tickets={tickets}
        quotes={quotes}
        invoices={invoices}
        payments={payments}
        emailLogs={emailLogs}
        documents={documents}
        formatAmount={formatAmount}
        onClose={() => setSelectedCustomer(null)}
        onEdit={c => { setSelectedCustomer(null); setEditingCustomer(c); }}
        onAddDeal={c => { setSelectedCustomer(null); setDealError(''); setNewDeal(d => ({ ...d, customer_id: c.id, company: c.company || '' })); setSelectedDealProductIds([]); setExpandedDealVendor(null); setShowDealForm(true); }}
        onAddActivity={c => { setSelectedCustomer(null); setActivityError(''); setNewActivity(a => ({ ...a, customer_id: c.id })); setShowActivityForm(true); }}
        onAddTicket={c => { setSelectedCustomer(null); setTicketError(''); setNewTicket(t => ({ ...t, customer_id: c.id })); setShowTicketForm(true); }}
      />
    )}
    {editingCustomer && (
      <div
        className="modal-backdrop"
        onClick={() => setEditingCustomer(null)}
      >
        <form
          className="modal"
          onSubmit={updateCustomer}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-heading">
            <h2>Edit customer</h2>

            <button
              type="button"
              className="icon-btn"
              onClick={() => setEditingCustomer(null)}
            >
              <X size={18} />
            </button>
          </div>

          <label>
            Name
            <input
              type="text"
              value={editingCustomer.name || ''}
              onChange={e =>
                setEditingCustomer({
                  ...editingCustomer,
                  name: e.target.value
                })
              }
            />
          </label>

          <label>
            Company
            <input
              type="text"
              value={editingCustomer.company || ''}
              onChange={e =>
                setEditingCustomer({
                  ...editingCustomer,
                  company: e.target.value
                })
              }
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={editingCustomer.email || ''}
              onChange={e =>
                setEditingCustomer({
                  ...editingCustomer,
                  email: e.target.value
                })
              }
            />
          </label>

          <label>
            Phone
            <input type="text" value={editingCustomer.phone || ''} onChange={e => setEditingCustomer({ ...editingCustomer, phone: e.target.value })} />
          </label>
          <JobTitleField value={editingCustomer.job_title} onChange={value => setEditingCustomer({ ...editingCustomer, job_title: value })} />
          <BirthdayField value={editingCustomer.birthday} onChange={value => setEditingCustomer({ ...editingCustomer, birthday: value })} />
          <label>Branch / visit address<input value={editingCustomer.location_address || ''} onChange={e => setEditingCustomer({ ...editingCustomer, location_address: e.target.value })} placeholder="e.g. UBA CMS, Marina, Lagos" /></label>
          <LocationCaptureFields latitude={editingCustomer.latitude} longitude={editingCustomer.longitude} onCapture={coords => setEditingCustomer(prev => ({ ...prev, latitude: String(coords.latitude), longitude: String(coords.longitude) }))} />
          <label>
            Status
            <select
              value={editingCustomer.status || 'Active'}
              onChange={e => setEditingCustomer({ ...editingCustomer, status: e.target.value })}
            >
              <option value="Lead">Lead</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>

          <button type="submit" className="primary-btn">
            Save changes
          </button>
        </form>
      </div>
    )}
    {showDealForm && (
      <div className="modal-backdrop">
        <form className="modal deal-modal" onSubmit={addDeal}>
          <div className="modal-heading">
            <h2>New deal</h2>

            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowDealForm(false)}
            >
              <X size={18} />
            </button>
          </div>

          {dealError && (
            <div className="form-error">
              {dealError}
            </div>
          )}

          <label>
            Deal title

            <input
              value={newDeal.title}
              onChange={e =>
                setNewDeal({
                  ...newDeal,
                  title: e.target.value
                })
              }
              placeholder="e.g. Website redesign"
              required
            />
          </label>

          <label>
            Company
            <input
              value={newDeal.company}
              onChange={e =>
                setNewDeal({
                  ...newDeal,
                  company: e.target.value
                })
              }
              placeholder="e.g. Storhet Ltd"
            />
          </label>
          <label>
            Contact name
            <input
              value={newDeal.contact_name}
              onChange={e => setNewDeal({ ...newDeal, contact_name: e.target.value })}
              placeholder="e.g. Lola Farges"
            />
          </label>

          <label>
            Contact email
            <input
              type="email"
              value={newDeal.contact_email}
              onChange={e => setNewDeal({ ...newDeal, contact_email: e.target.value })}
              placeholder="name@company.com"
            />
          </label>

          <label>
            Contact phone
            <input
              value={newDeal.contact_phone}
              onChange={e => setNewDeal({ ...newDeal, contact_phone: e.target.value })}
              placeholder="+234..."
            />
          </label>

          <label>
            Customer

            <select
              value={newDeal.customer_id}
              onChange={e => {
                const customerId = e.target.value;

                const selectedCustomer = customers.find(
                  customer => customer.id === customerId
                );

                setNewDeal({
                  ...newDeal,
                  customer_id: customerId,
                  company: selectedCustomer?.company || newDeal.company,
                  contact_name: selectedCustomer?.name || (customerId === '__new__' ? newDeal.contact_name : ''),
                  contact_email: selectedCustomer?.email || (customerId === '__new__' ? newDeal.contact_email : ''),
                  contact_phone: selectedCustomer?.phone || (customerId === '__new__' ? newDeal.contact_phone : ''),
                  new_customer_name: customerId === '__new__' ? newDeal.new_customer_name : '',
                  new_customer_email: customerId === '__new__' ? newDeal.new_customer_email : '',
                  new_customer_company: customerId === '__new__' ? newDeal.new_customer_company : ''
                });
              }}
            >
              <option value="">Select existing customer</option>
              <option value="__new__">+ Create new customer</option>

              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.company ? ` — ${customer.company}` : ''}
                </option>
              ))}
            </select>
          </label>
          {newDeal.customer_id === '__new__' && (
            <div className="deal-new-customer-fields">
              <p className="settings-hint">This customer will be created and linked to the deal when you save.</p>
              <label>Customer/contact name<input required value={newDeal.new_customer_name} onChange={e => setNewDeal({ ...newDeal, new_customer_name: e.target.value })} placeholder="Contact or customer name" /></label>
              <label>Customer email<input required type="email" value={newDeal.new_customer_email} onChange={e => setNewDeal({ ...newDeal, new_customer_email: e.target.value })} placeholder="name@company.com" /></label>
              <label>Customer phone<input value={newDeal.new_customer_phone} onChange={e => setNewDeal({ ...newDeal, new_customer_phone: e.target.value })} placeholder="+234..." /></label>
              <label>Company name<input value={newDeal.new_customer_company} onChange={e => setNewDeal({ ...newDeal, new_customer_company: e.target.value, company: e.target.value || newDeal.company })} placeholder="Company (optional)" /></label>
              <JobTitleField value={newDeal.new_customer_job_title} onChange={value => setNewDeal({ ...newDeal, new_customer_job_title: value })} label="Job title" />
              <BirthdayField value={newDeal.new_customer_birthday} onChange={value => setNewDeal({ ...newDeal, new_customer_birthday: value })} label="Birthday" />
            </div>
          )}
          <div className="product-selector">
            <div className="product-selector-heading">
              <div>
                <strong>Solutions</strong>
                <span>{selectedDealProductIds.length} selected</span>
              </div>
            </div>
            <div className="product-vendor-list">
              {['F5', 'Kong', 'IRONSCALES', 'SolarWinds', 'Utimaco'].map(vendor => {
                const vendorProducts = products.filter(product =>
                  (product.vendor || '').trim().toLowerCase() === vendor.trim().toLowerCase() && product.status !== 'Inactive'
                );
                if (!vendorProducts.length) return null;
                const expanded = expandedDealVendor === vendor;
                return (
                  <div key={vendor} className="product-vendor-group">
                    <button type="button" className="product-vendor-button" onClick={() => setExpandedDealVendor(expanded ? null : vendor)}>
                      <span>{vendor}</span>
                      <span>{vendorProducts.filter(p => selectedDealProductIds.includes(p.id)).length} selected</span>
                    </button>
                    {expanded && (
                      <div className="product-vendor-children">
                        {vendorProducts.map(product => {
                          const selected = selectedDealProductIds.includes(product.id);
                          return (
                            <label key={product.id} className={`product-option ${selected ? 'selected' : ''}`}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => setSelectedDealProductIds(prev => selected ? prev.filter(id => id !== product.id) : [...prev, product.id])}
                              />
                              <span>{product.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="product-selector">
            <div className="product-selector-heading">
              <div>
                <strong>Technical Support</strong>
                <span>{(newDeal.support_engineer_ids || []).length} selected</span>
              </div>
            </div>
            <div className="product-vendor-children">
              {supportEngineers.filter(engineer => engineer.status === 'Active').length === 0 ? (
                <p className="settings-hint">No active support engineers have been added yet.</p>
              ) : supportEngineers.filter(engineer => engineer.status === 'Active').map(engineer => {
                const selected = (newDeal.support_engineer_ids || []).includes(engineer.id);
                return (
                  <label key={engineer.id} className={`product-option ${selected ? 'selected' : ''}`}>
                    <input type="checkbox" checked={selected} onChange={() => setNewDeal(prev => ({ ...prev, support_engineer_ids: selected ? prev.support_engineer_ids.filter(id => id !== engineer.id) : [...prev.support_engineer_ids, engineer.id] }))} />
                    <span>{engineer.name}{engineer.role ? ` — ${engineer.role}` : ''}</span>
                  </label>
                );
              })}
            </div>
          </div>


          <label>
            Deal amount (USD)

            <input
              type="number"
              min="0"
              step="0.01"
              value={newDeal.amount}
              onChange={e =>
                setNewDeal({
                  ...newDeal,
                  amount: e.target.value
                })
              }
              placeholder="e.g. 15000"
              required
            />
          </label>

          <label>
            Stage

            <select
              value={newDeal.stage}
              onChange={e =>
                setNewDeal({
                  ...newDeal,
                  stage: e.target.value
                })
              }
            >
              <option value="New Lead">New Lead</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Won">Won</option>
            </select>
          </label>

          <div className="deal-date-grid">
            <label>Closure start date<input type="datetime-local" value={newDeal.closure_start_at} onChange={e => setNewDeal({ ...newDeal, closure_start_at: e.target.value })} /></label>
            <label>Closure end date<input type="datetime-local" value={newDeal.closure_end_at} min={newDeal.closure_start_at || undefined} onChange={e => setNewDeal({ ...newDeal, closure_end_at: e.target.value })} /></label>
          </div>

          <button
            className="primary-btn"
            type="submit"
            disabled={dealSaving}
          >
            {dealSaving ? 'Creating...' : 'Create deal'}
          </button>
        </form>
      </div>
    )}
    {editingDeal && (
      <div className="modal-backdrop">
        <form className="modal deal-modal" onSubmit={updateDeal}>
          <div className="modal-heading">
            <h2>Edit deal</h2>

            <button
              type="button"
              className="icon-btn"
              onClick={() => setEditingDeal(null)}
            >
              <X size={18} />
            </button>
          </div>

          {editDealError && (
            <div className="form-error">
              {editDealError}
            </div>
          )}

          <label>
            Deal title

            <input
              value={editingDeal.title}
              onChange={e =>
                setEditingDeal({
                  ...editingDeal,
                  title: e.target.value
                })
              }
              placeholder="e.g. Website redesign"
              required
            />
          </label>

          <label>
            Company

            <input
              value={editingDeal.company || ''}
              onChange={e =>
                setEditingDeal({
                  ...editingDeal,
                  company: e.target.value
                })
              }
              placeholder="e.g. Acme Ltd"
            />
          </label>
          <label>
            Contact name
            <input
              value={editingDeal.contact_name || ''}
              onChange={e => setEditingDeal({ ...editingDeal, contact_name: e.target.value })}
              placeholder="e.g. Lola Farges"
            />
          </label>

          <label>
            Contact email
            <input
              type="email"
              value={editingDeal.contact_email || ''}
              onChange={e => setEditingDeal({ ...editingDeal, contact_email: e.target.value })}
              placeholder="name@company.com"
            />
          </label>

          <label>
            Contact phone
            <input
              value={editingDeal.contact_phone || ''}
              onChange={e => setEditingDeal({ ...editingDeal, contact_phone: e.target.value })}
              placeholder="+234..."
            />
          </label>

          <label>
            Customer

            <select
              value={editingDeal.customer_id || ''}
              onChange={e => {
                const customerId = e.target.value;

                const selectedCustomer = customers.find(
                  customer => customer.id === customerId
                );

                setEditingDeal({
                  ...editingDeal,
                  customer_id: customerId,
                  company: selectedCustomer?.company || editingDeal.company
                });
              }}
            >
              <option value="">Select a customer</option>

              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.company ? ` — ${customer.company}` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="product-selector">
            <div className="product-selector-heading">
              <div>
                <strong>Solutions</strong>
                <span>{(editingDeal.product_ids || []).length} selected</span>
              </div>
            </div>
            <div className="product-vendor-list">
              {['F5', 'Kong', 'IRONSCALES', 'SolarWinds', 'Utimaco'].map(vendor => {
                const vendorProducts = products.filter(product =>
                  (product.vendor || '').trim().toLowerCase() === vendor.trim().toLowerCase() && product.status !== 'Inactive'
                );
                if (!vendorProducts.length) return null;
                const selectedIds = editingDeal.product_ids || [];
                const expanded = expandedDealVendor === `edit-${vendor}`;
                return (
                  <div key={vendor} className="product-vendor-group">
                    <button type="button" className="product-vendor-button" onClick={() => setExpandedDealVendor(expanded ? null : `edit-${vendor}`)}>
                      <span>{vendor}</span>
                      <span>{vendorProducts.filter(p => selectedIds.includes(p.id)).length} selected</span>
                    </button>
                    {expanded && (
                      <div className="product-vendor-children">
                        {vendorProducts.map(product => {
                          const selected = selectedIds.includes(product.id);
                          return (
                            <label key={product.id} className={`product-option ${selected ? 'selected' : ''}`}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => setEditingDeal(prev => ({ ...prev, product_ids: selected ? selectedIds.filter(id => id !== product.id) : [...selectedIds, product.id] }))}
                              />
                              <span>{product.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="product-selector">
            <div className="product-selector-heading">
              <div>
                <strong>Technical Support</strong>
                <span>{(editingDeal.support_engineer_ids || []).length} selected</span>
              </div>
            </div>
            <div className="product-vendor-children">
              {supportEngineers.filter(engineer => engineer.status === 'Active').map(engineer => {
                const selected = (editingDeal.support_engineer_ids || []).includes(engineer.id);
                return (
                  <label key={engineer.id} className={`product-option ${selected ? 'selected' : ''}`}>
                    <input type="checkbox" checked={selected} onChange={() => setEditingDeal(prev => ({ ...prev, support_engineer_ids: selected ? prev.support_engineer_ids.filter(id => id !== engineer.id) : [...prev.support_engineer_ids, engineer.id] }))} />
                    <span>{engineer.name}{engineer.role ? ` — ${engineer.role}` : ''}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <label>
            Deal amount (USD)

            <input
              type="number"
              min="0"
              step="0.01"
              value={editingDeal.amount}
              onChange={e =>
                setEditingDeal({
                  ...editingDeal,
                  amount: e.target.value
                })
              }
              placeholder="e.g. 15000"
              required
            />
          </label>

          <label>
            Stage

            <select
              value={editingDeal.stage}
              onChange={e =>
                setEditingDeal({
                  ...editingDeal,
                  stage: e.target.value
                })
              }
            >
              <option value="New Lead">New Lead</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Won">Won</option>
            </select>
          </label>

          <div className="deal-date-grid">
            <label>Closure start date<input type="datetime-local" value={formatDateTimeLocal(editingDeal.closure_start_at)} onChange={e => setEditingDeal({ ...editingDeal, closure_start_at: e.target.value })} /></label>
            <label>Closure end date<input type="datetime-local" value={formatDateTimeLocal(editingDeal.closure_end_at)} min={formatDateTimeLocal(editingDeal.closure_start_at) || undefined} onChange={e => setEditingDeal({ ...editingDeal, closure_end_at: e.target.value })} /></label>
          </div>

          <button
            className="primary-btn"
            type="submit"
            disabled={editDealSaving}
          >
            {editDealSaving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    )}
    {showActivityForm && (
      <div className="modal-backdrop">
        <div className="modal">
          <div className="modal-heading">
            <h2>New Activity</h2>

            <button

              className="close-button"
              onClick={() => setShowActivityForm(false)}
            >
              <X size={16} />
            </button>
          </div>

          <form
            onSubmit={event => {
              event.preventDefault();
              addActivity();
            }}
          >
            <label>
              Activity title
              <input
                type="text"
                placeholder="e.g. Follow up with customer"
                value={newActivity.title}
                onChange={event =>
                  setNewActivity({
                    ...newActivity,
                    title: event.target.value
                  })
                }
                required
              />
            </label>

            <label>
              Activity type
              <select
                value={newActivity.type}
                onChange={event =>
                  setNewActivity({
                    ...newActivity,
                    type: event.target.value
                  })
                }
              >
                <option value="Task">Task</option>
                <option value="Call">Call</option>
                <option value="Meeting">Meeting</option>
                <option value="Email">Email</option>
                <option value="Follow-up">Follow-up</option>
              </select>
            </label>

            <label>
              Due date and time
              <input
                type="datetime-local"
                value={newActivity.activity_date}
                onChange={event =>
                  setNewActivity({
                    ...newActivity,
                    activity_date: event.target.value
                  })
                }
              />
            </label>

            <div className="activity-form-grid">
              <label>
                Priority
                <select value={newActivity.priority || 'Medium'} onChange={event => setNewActivity({ ...newActivity, priority: event.target.value })}>
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Urgent">Urgent</option>
                </select>
              </label>
              <label>
                Assign to
                <select value={newActivity.assigned_to || session.user.id} onChange={event => setNewActivity({ ...newActivity, assigned_to: event.target.value })}>
                  <option value={session.user.id}>{profileName.trim() || session.user.email || 'Me'} (me)</option>
                  {Object.entries(ownerProfiles).filter(([id, name]) => id !== session.user.id).map(([id, name]) => <option key={id} value={id}>{name || 'Team member'}</option>)}
                </select>
              </label>
            </div>

            <label>
              Customer
              <select
                value={newActivity.customer_id}
                onChange={event =>
                  setNewActivity({
                    ...newActivity,
                    customer_id: event.target.value
                  })
                }
              >
                <option value="">No customer selected</option>

                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                    {customer.company
                      ? ` — ${customer.company}`
                      : ''}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Notes
              <textarea
                placeholder="Add notes about this activity..."
                value={newActivity.notes}
                onChange={event =>
                  setNewActivity({
                    ...newActivity,
                    notes: event.target.value
                  })
                }
                rows="4"
              />
            </label>

            <label>
              Status
              <select
                value={newActivity.status}
                onChange={event =>
                  setNewActivity({
                    ...newActivity,
                    status: event.target.value
                  })
                }
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>

            {activityError && (
              <p className="form-error">{activityError}</p>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowActivityForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-btn"
                disabled={activitySaving}
              >
                {activitySaving ? 'Saving...' : 'Save Activity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    {selectedActivity && <ActivityDetail activity={selectedActivity} customer={customers.find(c => c.id === selectedActivity.customer_id)} ownerProfiles={ownerProfiles} currentUserEmail={session?.user?.email} onClose={() => setSelectedActivity(null)} onEdit={activity => { setSelectedActivity(null); setEditActivityError(''); setEditingActivity({ ...activity, activity_date: formatDateTimeLocal(activity.activity_date) }); }} />}
    {editingActivity && <div className="modal-backdrop" onClick={() => setEditingActivity(null)}><form className="modal" onSubmit={updateActivity} onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>Edit Activity</h2><button type="button" className="icon-btn" onClick={() => setEditingActivity(null)}><X size={18} /></button></div>{editActivityError && <p className="form-error">{editActivityError}</p>}<label>Activity title<input type="text" value={editingActivity.title || ''} onChange={e => setEditingActivity({ ...editingActivity, title: e.target.value })} required /></label><label>Activity type<select value={editingActivity.type || 'Task'} onChange={e => setEditingActivity({ ...editingActivity, type: e.target.value })}><option value="Task">Task</option><option value="Call">Call</option><option value="Meeting">Meeting</option><option value="Email">Email</option><option value="Follow-up">Follow-up</option></select></label><label>Due date and time<input type="datetime-local" value={editingActivity.activity_date || ''} onChange={e => setEditingActivity({ ...editingActivity, activity_date: e.target.value })} /></label><div className="activity-form-grid"><label>Priority<select value={editingActivity.priority || 'Medium'} onChange={e => setEditingActivity({ ...editingActivity, priority: e.target.value })}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Urgent">Urgent</option></select></label><label>Assign to<select value={editingActivity.assigned_to || session.user.id} onChange={e => setEditingActivity({ ...editingActivity, assigned_to: e.target.value })}><option value={session.user.id}>{profileName.trim() || session.user.email || 'Me'} (me)</option>{Object.entries(ownerProfiles).filter(([id, name]) => id !== session.user.id).map(([id, name]) => <option key={id} value={id}>{name || 'Team member'}</option>)}</select></label></div><label>Customer<select value={editingActivity.customer_id || ''} onChange={e => setEditingActivity({ ...editingActivity, customer_id: e.target.value })}><option value="">No customer selected</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}{customer.company ? ` — ${customer.company}` : ''}</option>)}</select></label><label>Notes<textarea value={editingActivity.notes || ''} onChange={e => setEditingActivity({ ...editingActivity, notes: e.target.value })} rows="4" /></label><label>Status<select value={editingActivity.status || 'Scheduled'} onChange={e => setEditingActivity({ ...editingActivity, status: e.target.value })}><option value="Scheduled">Scheduled</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setEditingActivity(null)}>Cancel</button><button type="submit" className="primary-btn" disabled={editActivitySaving}>{editActivitySaving ? 'Saving...' : 'Save changes'}</button></div></form></div>}
    {composeDraft && <ComposeEmailModal integrations={emailIntegrations} customers={customers} defaults={composeDraft} userId={session.user.id} onSend={sendEmail} onClose={() => setComposeDraft(null)} />}
    {selectedTicket && <TicketDetail ticket={tickets.find(t => t.id === selectedTicket.id) || selectedTicket} onRefresh={fetchTickets} staffName={staffName} staffOptions={getStaffOptions()} currentUserId={session.user.id} canManage={canManageTicket} onStatusChange={updateTicketStatus} onAssign={assignTicket} onClose={() => setSelectedTicket(null)} onEdit={ticket => { setSelectedTicket(null); setEditTicketError(''); setEditingTicket(ticket); }} />}
    {editingTicket && <div className="modal-backdrop" onClick={() => setEditingTicket(null)}><form className="modal" onSubmit={updateTicket} onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>Edit Ticket</h2><button type="button" className="icon-btn" onClick={() => setEditingTicket(null)}><X size={18} /></button></div>{editTicketError && <p className="form-error">{editTicketError}</p>}<label>Ticket title<input type="text" value={editingTicket.title || ''} onChange={e => setEditingTicket({ ...editingTicket, title: e.target.value })} required /></label><label>Description<textarea value={editingTicket.description || ''} onChange={e => setEditingTicket({ ...editingTicket, description: e.target.value })} rows="4" /></label><label>Customer<select value={editingTicket.customer_id || ''} onChange={e => setEditingTicket({ ...editingTicket, customer_id: e.target.value })}><option value="">No customer selected</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}{customer.company ? ` — ${customer.company}` : ''}</option>)}</select></label><label>Assign to<select value={editingTicket.assigned_to || ''} onChange={e => setEditingTicket({ ...editingTicket, assigned_to: e.target.value })}><option value="">Unassigned</option>{getStaffOptions().map(u => <option key={u.user_id} value={u.user_id}>{staffName(u.user_id)}</option>)}</select></label>{editingTicket.source !== 'portal' && <label className="portal-check-row"><input type="checkbox" checked={!!editingTicket.portal_visible} onChange={e => setEditingTicket({ ...editingTicket, portal_visible: e.target.checked })} />Show this ticket in the customer's portal (needs a linked customer)</label>}<label>Category<select value={editingTicket.category || 'General'} onChange={e => setEditingTicket({ ...editingTicket, category: e.target.value })}><option value="General">General</option><option value="Technical">Technical</option><option value="Billing">Billing</option><option value="Account">Account</option><option value="Feature Request">Feature Request</option></select></label><label>Priority<select value={editingTicket.priority || 'Medium'} onChange={e => setEditingTicket({ ...editingTicket, priority: e.target.value })}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Urgent">Urgent</option></select></label><label>Status<select value={editingTicket.status || 'Open'} onChange={e => setEditingTicket({ ...editingTicket, status: e.target.value })}><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option><option value="Closed">Closed</option></select></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setEditingTicket(null)}>Cancel</button><button type="submit" className="primary-btn" disabled={editTicketSaving}>{editTicketSaving ? 'Saving...' : 'Save changes'}</button></div></form></div>}
    {showTicketForm && (
      <div className="modal-backdrop">
        <form className="modal" onSubmit={addTicket}>
          <div className="modal-heading">
            <h2>New Ticket</h2>

            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowTicketForm(false)}
            >
              <X size={18} />
            </button>
          </div>
          {ticketError && (
            <p className="form-error">{ticketError}</p>
          )}
          <label>
            Ticket title
            <input
              type="text"
              placeholder="e.g. Unable to access account"
              value={newTicket.title}
              onChange={e =>
                setNewTicket({
                  ...newTicket,
                  title: e.target.value
                })
              }
              required
            />
          </label>
          <label>
            Description
            <textarea
              placeholder="Describe the customer's issue..."
              value={newTicket.description}
              onChange={e =>
                setNewTicket({
                  ...newTicket,
                  description: e.target.value
                })
              }
              rows="4"
            />
          </label>
          <label>
            Customer
            <select
              value={newTicket.customer_id}
              onChange={e =>
                setNewTicket({
                  ...newTicket,
                  customer_id: e.target.value
                })
              }
            >
              <option value="">No customer selected</option>

              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.company
                    ? ` — ${customer.company}`
                    : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Assign to
            <select value={newTicket.assigned_to || session.user.id} onChange={e => setNewTicket({ ...newTicket, assigned_to: e.target.value })}>
              {getStaffOptions().map(u => <option key={u.user_id} value={u.user_id}>{staffName(u.user_id)}</option>)}
            </select>
          </label>
          <label className="portal-check-row">
            <input type="checkbox" checked={newTicket.portal_visible !== false} onChange={e => setNewTicket({ ...newTicket, portal_visible: e.target.checked })} />
            Show this ticket in the customer's portal (needs a linked customer)
          </label>
          <label>
            Category

            <select
              value={newTicket.category}
              onChange={e =>
                setNewTicket({
                  ...newTicket,
                  category: e.target.value
                })
              }
            >
              <option value="General">General</option>
              <option value="Technical">Technical</option>
              <option value="Billing">Billing</option>
              <option value="Account">Account</option>
              <option value="Feature Request">Feature Request</option>
            </select>
          </label>
          <label>
            Priority
            <select
              value={newTicket.priority}
              onChange={e =>
                setNewTicket({
                  ...newTicket,
                  priority: e.target.value
                })
              }
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </label>
          <label>
            Status
            <select
              value={newTicket.status}
              onChange={e =>
                setNewTicket({
                  ...newTicket,
                  status: e.target.value
                })
              }
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setShowTicketForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={ticketSaving}
            >
              {ticketSaving ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    )}
    {profileModalOpen && (
      <div className="modal-backdrop" onClick={() => setProfileModalOpen(false)}>
        <form className="modal" onSubmit={saveProfile} onClick={event => event.stopPropagation()}>
          <div className="modal-heading"><div><h2>Edit profile</h2><p>Your name is shown across Storhet CRM when provided.</p></div><button type="button" className="icon-btn" onClick={() => setProfileModalOpen(false)} aria-label="Close profile modal"><X size={18} /></button></div>
          <label>Display name<input autoFocus value={profileDraft} onChange={event => setProfileDraft(event.target.value)} placeholder="Enter your name" maxLength={100} /></label>
          <label>Account email<input value={session?.user?.email || ''} readOnly /></label>
          <p className="settings-hint">Leave the name blank to use your account email. Profile photos are not used.</p>
          <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setProfileModalOpen(false)}>Cancel</button><button className="primary-btn" disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save profile'}</button></div>
        </form>
      </div>
    )}
    {showNotifications && (
      <div
        style={{
          position: 'fixed',
          top: '70px',
          right: '24px',
          width: '360px',
          maxHeight: '70vh',
          overflowY: 'auto',
          zIndex: 1000
        }}
      >
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Notifications</h3>
              <p>
                {unreadNotificationCount > 0
                  ? `${unreadNotificationCount} unread`
                  : 'All caught up'}
              </p>
            </div>

            <div className="toolbar-actions">
              <button type="button" className="secondary-btn" onClick={clearAllNotifications} disabled={notifications.length === 0}>Clear all</button>
              <button
                type="button"
                className="secondary-btn"
                onClick={markAllNotificationsRead}
                disabled={unreadNotificationCount === 0}
              >
                Mark all read
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowNotifications(false)}
              >
                Close
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="empty-state">
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div>
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={async () => {
                    if (!notification.read) {
                      const { error } = await supabase
                        .from('notifications')
                        .update({ read: true })
                        .eq('id', notification.id)
                        .eq('user_id', session.user.id);

                      if (error) {
                        console.error('Failed to mark notification as read:', error);
                        return;
                      }

                      setNotifications(prev =>
                        prev.map(item =>
                          item.id === notification.id
                            ? { ...item, read: true }
                            : item
                        )
                      );

                      setUnreadNotificationCount(prev => Math.max(0, prev - 1));
                    }

                    const allowedPages = ['Dashboard', 'Customers', 'Leads', 'Pipeline', 'Products', 'Activities', 'Tickets', 'Quotes', 'Invoices', 'Chat', 'Email', 'Documents', 'Calendar'];
                    if (notification.link && allowedPages.includes(notification.link)) {
                      setPage(notification.link);
                    } else if (notification.type === 'new_chat') {
                      setPage('Chat');
                    }
                    setShowNotifications(false);
                  }}
                  style={{
                    cursor: notification.read ? 'default' : 'pointer',
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                    fontWeight: notification.read ? 'normal' : '600'
                  }}
                >
                  <strong>{notification.title}</strong>

                  {notification.message && (
                    <p style={{ margin: '4px 0' }}>
                      {notification.message}
                    </p>
                  )}

                  <small>
                    {notification.created_at
                      ? new Date(notification.created_at).toLocaleString()
                      : ''}
                  </small>
                  {notification.link && <button type="button" className="text-btn notification-clear" onClick={event => { event.stopPropagation(); const allowedPages = ['Dashboard', 'Customers', 'Leads', 'Pipeline', 'Products', 'Activities', 'Tickets', 'Quotes', 'Invoices', 'Chat', 'Email', 'Documents']; if (allowedPages.includes(notification.link)) setPage(notification.link); setShowNotifications(false); }}>Open</button>}
                  <button type="button" className="text-btn notification-clear" onClick={event => { event.stopPropagation(); clearNotification(notification.id); }}>Clear</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>
}

function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-busy="true" aria-live="polite">
      <div className="page-loading-bar" role="progressbar" aria-label="Loading page" />
      <div className="skeleton-heading">
        <div className="skeleton skeleton-eyebrow" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-desc" />
      </div>
      <div className="stats-grid">
        {[0, 1, 2, 3].map(i => (
          <div className="stat-card skeleton-card" key={i}>
            <div className="skeleton skeleton-icon" />
            <div className="skeleton skeleton-stat-value" />
            <div className="skeleton skeleton-stat-label" />
          </div>
        ))}
      </div>
      <div className="panel skeleton-table">
        <div className="skeleton skeleton-panel-title" />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div className="skeleton-row" key={i}>
            <div className="skeleton skeleton-cell" />
            <div className="skeleton skeleton-cell" />
            <div className="skeleton skeleton-cell" />
            <div className="skeleton skeleton-cell" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action, onAction, refresh = true }) {
  const refreshCtx = useContext(RefreshContext);

  return <div className="page-heading">
    <div>
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    <div className="page-heading-actions">
      {refresh && refreshCtx && (
        <button type="button" className="secondary-btn refresh-btn" onClick={() => refreshCtx.refreshAll()} disabled={refreshCtx.refreshing} title="Reload the latest data">
          <RefreshCw size={15} className={refreshCtx.refreshing ? 'spin' : ''} />
          {refreshCtx.refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      )}
      {action && <button className="primary-btn" onClick={onAction}>
        <Plus size={17} />{action}
      </button>}
    </div>
  </div>
}
const PIPELINE_STAGES = ['New Lead', 'Qualified', 'Proposal', 'Won'];
const CUSTOMER_STATUSES = ['Lead', 'Active', 'Inactive'];
const JOB_TITLE_SUGGESTIONS = [
  'CEO', 'CIO', 'CTO', 'CSO', 'CFO', 'COO', 'CISO', 'CDO',
  'Chief Technology Officer', 'Chief Information Officer', 'Chief Security Officer',
  'IT Director', 'Head of IT', 'Head of Technology', 'Head of Information Security',
  'IT Manager', 'Procurement Manager', 'Procurement Director', 'Operations Manager',
  'Finance Director', 'Managing Director', 'Founder', 'Director', 'Manager'
];

function JobTitleField({ value, onChange, label = 'Job title' }) {
  return <label>{label}<input list="orbit-job-title-options" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="e.g. CTO" autoComplete="organization-title" /><datalist id="orbit-job-title-options">{JOB_TITLE_SUGGESTIONS.map(title => <option key={title} value={title} />)}</datalist></label>;
}

function normalizeBirthdayValue(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    if (month < 1 || month > 12 || day < 1 || day > new Date(2000, month, 0).getDate()) return null;
    return `2000-${iso[2]}-${iso[3]}`;
  }
  const dayMonth = raw.match(/^(\d{1,2})-(\d{1,2})$/);
  if (!dayMonth) return null;
  const day = Number(dayMonth[1]);
  const month = Number(dayMonth[2]);
  if (month < 1 || month > 12 || day < 1 || day > new Date(2000, month, 0).getDate()) return null;
  return `2000-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function birthdayDisplayValue(value) {
  const normalized = normalizeBirthdayValue(value);
  if (!normalized) return '';
  const parts = normalized.match(/^\d{4}-(\d{2})-(\d{2})$/);
  return parts ? `${parts[2]}-${parts[1]}` : '';
}

function LocationCaptureFields({ latitude, longitude, onCapture }) {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState('');
  const [accuracy, setAccuracy] = useState(null);
  const capture = () => {
    setError('');
    setAccuracy(null);
    setCapturing(true);
    captureCurrentLocation(
      coords => { setCapturing(false); setAccuracy(coords.accuracy); onCapture(coords); },
      err => { setCapturing(false); setError(err.message || 'Could not capture location.'); },
      { targetAccuracy: 30, maxWaitMs: 25000 }
    );
  };
  const mapUrl = googleMapsLocationUrl(latitude, longitude);
  return <div className="location-capture-fields">
    <div className="location-capture-heading"><div><strong>Customer branch location</strong><span>Used to verify field visits and retained for audit.</span></div><button type="button" className="secondary-btn" onClick={capture} disabled={capturing}>{capturing ? 'Getting GPS fix…' : 'Capture branch GPS'}</button></div>
    {(latitude && longitude) && <div className="location-capture-meta"><small className="location-coordinates">{Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}</small>{mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="field-visit-map-link">Open in Google Maps</a>}</div>}
    {accuracy != null && <small className={accuracy > 100 ? 'form-error' : undefined}>Accuracy ±{Math.round(accuracy)} m{accuracy > 100 ? ' — low accuracy. Move outdoors (ideally use a phone) and capture again.' : ''}</small>}
    {error && <small className="form-error">{error}</small>}
  </div>;
}

function BirthdayField({ value, onChange, label = 'Birthday' }) {
  const [inputValue, setInputValue] = useState(() => birthdayDisplayValue(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setInputValue(birthdayDisplayValue(value));
    setInvalid(false);
  }, [value]);

  const handleChange = e => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    const next = digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;

    // Do not let the month move beyond 12 while typing.
    if (digits.length === 4) {
      const month = Number(digits.slice(2, 4));
      const day = Number(digits.slice(0, 2));
      if (month > 12 || month < 1 || day < 1 || day > new Date(2000, month, 0).getDate()) {
        setInvalid(true);
        return;
      }
    }

    setInputValue(next);
    setInvalid(false);

    if (!next) {
      onChange('');
      return;
    }

    if (/^\d{2}-\d{2}$/.test(next)) {
      const normalized = normalizeBirthdayValue(next);
      if (normalized) onChange(normalized);
    }
  };

  return (
    <label className="birthday-field">
      <span className="birthday-field-label">{label}</span>
      <div className={`birthday-input-shell${invalid ? ' is-invalid' : ''}`}>
        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleChange}
          placeholder="DD-MM"
          maxLength={5}
          autoComplete="bday"
          aria-invalid={invalid}
        />
        <span className="birthday-input-suffix">DAY · MONTH</span>
      </div>
      <small className={invalid ? 'birthday-field-help birthday-field-error' : 'birthday-field-help'}>
        {invalid ? 'Invalid date. Day must match the selected month and month must be 01-12.' : 'Enter day and month only — e.g. 31-10. No year.'}
      </small>
    </label>
  );
}

function birthdayIsToday(value, now = new Date()) {
  if (!value) return false;
  const raw = String(value).trim();
  const iso = raw.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (iso) return Number(iso[1]) === now.getMonth() + 1 && Number(iso[2]) === now.getDate();
  const dayMonth = raw.match(/^(\d{2})-(\d{2})$/);
  if (dayMonth) return Number(dayMonth[2]) === now.getMonth() + 1 && Number(dayMonth[1]) === now.getDate();
  return false;
}

function formatBirthday(value) {
  const normalized = normalizeBirthdayValue(value);
  if (!normalized) return '—';
  const parts = normalized.match(/^\d{4}-(\d{2})-(\d{2})$/);
  return parts ? `${parts[2]}-${parts[1]}` : '—';
}

function birthdayIsTomorrow(value, now = new Date()) {
  const normalized = normalizeBirthdayValue(value);
  if (!normalized) return false;
  const parts = normalized.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!parts) return false;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Number(parts[1]) === tomorrow.getMonth() + 1 && Number(parts[2]) === tomorrow.getDate();
}

function birthdayGreeting(customer) {
  const firstName = (customer?.name || 'there').trim().split(/\s+/)[0] || 'there';
  const job = customer?.job_title ? `, ${customer.job_title}` : '';
  const company = customer?.company ? ` at ${customer.company}` : '';
  return `Happy Birthday, ${firstName}${job}! 🎉\n\nWishing you a wonderful birthday and a successful year ahead. We truly appreciate the relationship we have with you${company} and look forward to continuing to work together.\n\nHave a fantastic day!`;
}


const isOpenActivity = a => a.status !== 'Completed' && a.status !== 'Cancelled';
const isOverdue = a => isOpenActivity(a) && !!a.activity_date && new Date(a.activity_date) < new Date();
const sumAmount = list => list.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
const lifetimeValue = (customer, deals) => {
  const won = sumAmount(deals.filter(d => d.customer_id === customer.id && d.stage === 'Won'));
  return won || Number(customer.value) || 0;
};
const formatDate = value => value
  ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';
const formatDateTime = value => value
  ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  : 'No date';
const formatDateTimeLocal = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};
const formatDuration = milliseconds => {
  const abs = Math.abs(milliseconds);
  const totalSeconds = Math.floor(abs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
};

const closureTimerText = endAt => {
  if (!endAt) return 'No closure end date';

  const targetTime = new Date(endAt).getTime();
  if (Number.isNaN(targetTime)) return 'Invalid closure date';

  const diff = targetTime - Date.now();

  // Active / Future timer
  if (diff >= 0) {
    return `${formatDuration(diff)} remaining`;
  }

  // Expired timer: Prepend explicit negative sign and indicate overdue status
  return `-${formatDuration(diff)} overdue`;
};

const ownerColor = userId => {
  if (!userId) return '#98a2b3';

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
  }

  const hue = Math.abs(hash) % 360;

  return `hsl(${hue}, 65%, 50%)`;
};

const trend = (current, previous) => {
  if (!previous) return current ? '↗ New' : '0%';
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? '↗' : '↘'} ${Math.abs(pct).toFixed(1)}%`;
};

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = ''; rows.push(row); row = [];
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

function downloadCSV(filename, header, rows) {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map(r => r.map(escape).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, change, hint, icon, tone, onClick }) {
  const clickable = typeof onClick === 'function';
  return (
    <div className={`stat-card${clickable ? ' stat-card-clickable' : ''}`} onClick={onClick} role={clickable ? 'button' : undefined} tabIndex={clickable ? 0 : undefined} onKeyDown={event => { if (clickable && (event.key === 'Enter' || event.key === ' ')) onClick(event); }}>
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-change">
        {change != null ? <><span>{change}</span><small>vs last month</small></> : <small>{hint}</small>}
      </div>
    </div>
  );
}

function Dashboard({ revenue, customers, leads = [], deals, activities, tickets, setPage, formatAmount, onSelectCustomer, onEditCustomer, onDeleteCustomer, currentUserId, role }) {
  const [range, setRange] = useState(6);

  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
        revenue: 0
      });
    }
    deals.forEach(deal => {
      if (deal.stage !== 'Won' || !deal.created_at) return;
      const d = new Date(deal.created_at);
      const m = months.find(x => x.year === d.getFullYear() && x.month === d.getMonth());
      if (m) m.revenue += Number(deal.amount) || 0;
    });
    return months;
  }, [deals, range]);

  const now = new Date();
  const sameMonth = (value, offset) => {
    if (!value) return false;
    const d = new Date(value);
    const ref = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
  };
  const thisMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1].revenue;
  const lastMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0;
  const newCustomers = customers.filter(c => sameMonth(c.created_at, 0)).length;
  const lastNewCustomers = customers.filter(c => sameMonth(c.created_at, 1)).length;

  const wonDeals = deals.filter(d => d.stage === 'Won');
  const openDeals = deals.filter(d => d.stage !== 'Won');
  const winRate = deals.length ? (wonDeals.length / deals.length) * 100 : 0;
  const overdueCount = activities.filter(isOverdue).length;
  const dueTodayCount = activities.filter(a => { if (!isOpenActivity(a) || !a.activity_date) return false; const d = new Date(a.activity_date); const today = new Date(); return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate(); }).length;
  const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
  const avgDeal = wonDeals.length ? sumAmount(wonDeals) / wonDeals.length : 0;

  const upcoming = useMemo(() => activities
    .filter(isOpenActivity)
    .sort((a, b) => new Date(a.activity_date || 8.64e15) - new Date(b.activity_date || 8.64e15))
    .slice(0, 4), [activities]);

  const maxRevenue = Math.max(...monthlyRevenue.map(item => item.revenue), 0);
  const step = maxRevenue > 0 ? maxRevenue / 4 : 0;
  const chartMax = Math.max(maxRevenue, 1);
  const points = monthlyRevenue.map((item, index) => {
    const x = monthlyRevenue.length === 1 ? 0 : (index / (monthlyRevenue.length - 1)) * 600;
    const y = 200 - (item.revenue / chartMax) * 175;
    return `${x} ${y}`;
  });
  const linePath = `M${points[0]}${points.slice(1).map(p => ` L${p}`).join('')}`;
  const areaPath = `${linePath} L600 220 L0 220 Z`;

  return <>
    <PageHeading eyebrow="OVERVIEW" title="Dashboard" description="Here's what's happening with your business today." />
    <div className="stats-grid">
      <StatCard label="Revenue (won deals)" value={formatAmount(revenue)} change={trend(thisMonthRevenue, lastMonthRevenue)} tone="purple" icon="↗" onClick={() => setPage(role === 'head_of_sales' ? 'HOS Panel' : role === 'manager' ? 'MD Panel' : 'Reports')} />
      <StatCard label="Customers" value={customers.length} change={trend(newCustomers, lastNewCustomers)} tone="blue" icon="♙" onClick={() => setPage('Customers')} />
      <StatCard label="Open pipeline" value={formatAmount(sumAmount(openDeals))} hint={`${openDeals.length} open deals`} tone="orange" icon="◈" onClick={() => setPage('Pipeline')} />
      <StatCard label="Win rate" value={`${winRate.toFixed(1)}%`} hint={`${wonDeals.length} of ${deals.length} deals won`} tone="green" icon="◉" />
      <StatCard label="Overdue activities" value={overdueCount} hint={overdueCount ? 'Needs attention' : 'You are on track'} tone="orange" icon="◷" onClick={() => setPage('Activities')} />
      <StatCard label="Due today" value={dueTodayCount} hint="Activity reminders" tone="blue" icon="!" onClick={() => setPage('Activities')} />
      <StatCard label="Open tickets" value={openTickets} hint={`${tickets.length} tickets in total`} tone="blue" icon="✉" onClick={() => setPage(role === 'technical_support' ? 'Technical Support Panel' : 'Tickets')} />
      <StatCard label="Average deal size" value={formatAmount(avgDeal)} hint="Across won deals" tone="purple" icon="◆" />
      <StatCard label="Deals won" value={wonDeals.length} hint={`${formatAmount(sumAmount(wonDeals))} closed`} tone="green" icon="✓" onClick={() => setPage('Pipeline')} />
    </div>
    <div className="dashboard-grid">
      <div className="panel chart-panel">
        <div className="panel-heading">
          <div><h3>Revenue overview</h3><p>Won deals by month</p></div>
          <select value={range} onChange={e => setRange(Number(e.target.value))}>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
        <div className="chart">
          <div className="chart-y">
            {[4, 3, 2, 1, 0].map(level => <span key={level}>{formatAmount(step * level)}</span>)}
          </div>
          <div className="chart-body">
            <div className="grid-lines"><i /><i /><i /><i /><i /></div>
            <svg viewBox="0 0 600 220" preserveAspectRatio="none" className="line-chart">
              <defs>
                <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7357f0" stopOpacity=".25" /><stop offset="100%" stopColor="#7357f0" stopOpacity="0" /></linearGradient>
              </defs>
              <path d={areaPath} fill="url(#fill)" />
              <path d={linePath} fill="none" stroke="#7357f0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="chart-labels">
              {monthlyRevenue.map(item => <span key={`${item.year}-${item.month}`}>{item.label}</span>)}
            </div>
          </div>
        </div>
      </div>
      <div className="panel activity-panel">
        <div className="panel-heading">
          <div><h3>Upcoming &amp; overdue</h3><p>What needs doing next</p></div>
          <button className="text-btn" onClick={() => setPage('Activities')}>View all</button>
        </div>
        {upcoming.length === 0 ? (
          <div className="empty-state">
            <p>Nothing scheduled.</p>
            <button type="button" className="secondary-btn" onClick={() => setPage('Activities')}>Plan an activity</button>
          </div>
        ) : upcoming.map(activity => (
          <Activity
            key={activity.id}
            icon={isOverdue(activity) ? '!' : activity.type === 'Call' ? '☎' : activity.type === 'Meeting' ? '◷' : '↗'}
            title={activity.title}
            text={isOverdue(activity) ? `${activity.type || 'Task'} · overdue` : (activity.type || 'Task')}
            time={activity.activity_date ? new Date(activity.activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
          />
        ))}
      </div>
    </div>
    <BirthdayReminders customers={customers} leads={leads} />
    <div className="panel">
      <div className="panel-heading">
        <div><h3>Recent customers</h3><p>Your newest customer relationships</p></div>
        <button className="text-btn" onClick={() => setPage('Customers')}>View all</button>
      </div>
      <CustomerTable
        customers={customers.slice(0, 4)}
        deals={deals}
        formatAmount={formatAmount}
        onSelectCustomer={onSelectCustomer}
        onEditCustomer={onEditCustomer}
        onDeleteCustomer={onDeleteCustomer}
        currentUserId={currentUserId}
        role={role}
      />
    </div>
  </>;
}

function BirthdayReminders({ customers = [], leads = [] }) {
  const today = new Date();
  const contacts = [
    ...customers.map(contact => ({ ...contact, contactType: 'Customer' })),
    ...leads.filter(lead => !lead.customer_id).map(contact => ({ ...contact, contactType: 'Lead' }))
  ];
  const birthdayCustomers = contacts.filter(customer => birthdayIsToday(customer.birthday, today));
  const [copiedId, setCopiedId] = useState(null);

  const copyGreeting = async customer => {
    const message = birthdayGreeting(customer);
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(customer.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      window.prompt('Copy birthday greeting:', message);
    }
  };

  const openEmail = customer => {
    if (!customer.email) return;
    const subject = encodeURIComponent(`Happy Birthday, ${customer.name || 'there'}! 🎉`);
    const body = encodeURIComponent(birthdayGreeting(customer));
    window.location.href = `mailto:${customer.email}?subject=${subject}&body=${body}`;
  };

  return <div className="panel birthday-panel">
    <div className="panel-heading">
      <div><h3>🎂 Birthday greetings</h3><p>{birthdayCustomers.length ? `${birthdayCustomers.length} contact${birthdayCustomers.length > 1 ? 's' : ''} celebrating today.` : 'No customer birthdays today.'}</p></div>
      {birthdayCustomers.length > 0 && <span className="count-badge">Today</span>}
    </div>
    {birthdayCustomers.length === 0 ? (
      <div className="birthday-empty">When a contact has a birthday today, Storhet will surface them here with a ready-to-send greeting.</div>
    ) : birthdayCustomers.map(customer => (
      <div className="birthday-row" key={customer.id}>
        <div className="birthday-avatar">🎉</div>
        <div className="birthday-person">
          <strong>{customer.name}</strong>
          <span>{customer.job_title || 'Contact'}{customer.company ? ` · ${customer.company}` : ''}{customer.contactType === 'Lead' ? ' · Lead' : ''}</span>
        </div>
        <div className="birthday-actions">
          <button type="button" className="secondary-btn" onClick={() => copyGreeting(customer)}>{copiedId === customer.id ? 'Copied ✓' : 'Copy greeting'}</button>
          {customer.email && <button type="button" className="primary-btn" onClick={() => openEmail(customer)}>Email</button>}
        </div>
      </div>
    ))}
  </div>;
}

function Activity({ icon, title, text, time }) {
  return (
    <div className="activity-row">
      <div className="activity-icon">{icon}</div>
      <div><strong>{title}</strong><p>{text}</p></div>
      <time>{time}</time>
    </div>
  );
}

function CustomerTable({ customers, deals = [], formatAmount, onSelectCustomer, onEditCustomer, onDeleteCustomer, currentUserId, role }) {
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    if (openMenuId === null) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

  if (customers.length === 0) {
    return <div className="empty-state"><p>No customers match your filters.</p></div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Company</th>
            <th>Status</th>
            <th>Mail</th>
            <th>Contact</th>
            <th>Job Title</th>
            <th>Open deals</th>
            <th>Value</th>
            <th>Start date</th>
            <th>End date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => {
            const status = c.status || 'Active';
            const customerDeals = deals.filter(d => d.customer_id === c.id);
            const openDeals = customerDeals.filter(d => !['Won', 'Lost'].includes(d.stage));
            const allStarts = customerDeals.map(d => d.closure_start_at).filter(Boolean).sort((a, b) => new Date(a) - new Date(b));
            const allEnds = customerDeals.map(d => d.closure_end_at).filter(Boolean).sort((a, b) => new Date(b) - new Date(a));
            return (
              <tr key={c.id} onClick={() => onSelectCustomer?.(c)} style={{ cursor: onSelectCustomer ? 'pointer' : 'default' }}>
                <td>
                  <div className="customer-cell">
                    <div className="avatar small">{(c.name || '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()}</div>
                    <div>
                      <strong>{c.name}</strong>
                    </div>
                  </div>
                </td>
                <td>{c.company || '—'}</td>
                <td><span className={`status ${status.toLowerCase()}`}>{status}</span></td>
                <td>
                  <div className="customer-contact-cell">
                    <strong>{c.email || '—'}</strong>
                  </div>
                </td>
                <td> 
                  <div> 
                    <span>{c.phone || '—'}</span>
                  </div>
                </td>
                <td> 
                  <div> 
                    <span>{c.job_title && <small>{c.job_title}</small>}</span>
                  </div>
                </td>

                <td>{openDeals.length}</td>
                <td>{formatAmount(sumAmount(customerDeals))}</td>
                <td>{allStarts.length ? formatDate(allStarts[0]) : '—'}</td>
                <td>{allEnds.length ? formatDate(allEnds[0]) : '—'}</td>
                <td>
                  <div style={{ position: 'relative' }}>
                    <button
                      className="icon-btn"
                      aria-label="Customer actions"
                      onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === c.id ? null : c.id); }}
                    >
                      <MoreHorizontal size={17} />
                    </button>
                    {openMenuId === c.id && (
                      <div className="customer-menu" onClick={e => e.stopPropagation()}>
                        <button className="secondary-btn" type="button" onClick={() => { setOpenMenuId(null); onSelectCustomer?.(c); }}>View</button>
                        {(isCommercialEditor(role) || (role === 'sales' && c.created_by === currentUserId)) && <button className="secondary-btn" type="button" onClick={() => { setOpenMenuId(null); onEditCustomer?.(c); }}>Edit</button>}
                        {isCommercialDeleter(role) && <button className="secondary-btn" type="button" onClick={() => { setOpenMenuId(null); onDeleteCustomer?.(c.id); }}>Delete</button>}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Customers({ customers, allCustomers, deals, search, setSearch, statusFilter, setStatusFilter, onAdd, onImport, formatAmount, onSelectCustomer, onEditCustomer, onDeleteCustomer, currentUserId, role }) {
  const fileRef = useRef(null);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const rows = parseCSV(await file.text());
    const header = (rows[0] || []).map(h => h.trim().toLowerCase());
    const col = key => header.indexOf(key);
    const read = (r, key) => (col(key) >= 0 ? (r[col(key)] || '').trim() : '');
    onImport(rows.slice(1).map(r => ({
      name: read(r, 'name'),
      company: read(r, 'company'),
      email: read(r, 'email'),
      phone: read(r, 'phone'),
      job_title: read(r, 'job_title'),
      birthday: read(r, 'birthday'),
      status: read(r, 'status')
    })));
  }

  function exportCustomers() {
    downloadCSV(
      'customers.csv',
      ['name', 'company', 'email', 'phone', 'job_title', 'birthday', 'status', 'lifetime_value'],
      customers.map(c => [c.name, c.company || '', c.email, c.phone || '', c.job_title || '', c.birthday || '', c.status || 'Active', lifetimeValue(c, deals)])
    );
  }

  const counts = CUSTOMER_STATUSES.reduce((acc, s) => ({ ...acc, [s]: allCustomers.filter(c => (c.status || 'Active') === s).length }), {});

  return (
    <>
      <PageHeading eyebrow="RELATIONSHIPS" title="Customers" description="Manage customer contacts, job titles, birthdays and relationships." action={['admin', 'manager', 'head_of_sales', 'sales'].includes(role) ? 'New customer' : undefined} onAction={['admin', 'manager', 'head_of_sales', 'sales'].includes(role) ? onAdd : undefined} />
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>All customers <span className="count-badge">{customers.length}</span></h3>
            <p>Search, filter and manage your contacts.</p>
          </div>
          <div className="toolbar-actions">
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} hidden />
            <button className="secondary-btn" type="button" onClick={() => fileRef.current?.click()}><Users size={15} /> Import CSV</button>
            <button className="secondary-btn" type="button" onClick={exportCustomers} disabled={customers.length === 0}>Export CSV</button>
          </div>
        </div>
        <div className="toolbar">
          <div className="toolbar-search">
            <Search size={15} />
            <input
              type="search"
              placeholder="Search by name, company or email"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-tabs" role="tablist" aria-label="Filter by status">
            {['All', ...CUSTOMER_STATUSES].map(s => (
              <button
                key={s}
                type="button"
                className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}{s !== 'All' ? ` (${counts[s]})` : ` (${allCustomers.length})`}
              </button>
            ))}
          </div>
        </div>
        <CustomerTable
          customers={customers}
          deals={deals}
          formatAmount={formatAmount}
          onSelectCustomer={onSelectCustomer}
          onEditCustomer={onEditCustomer}
          onDeleteCustomer={onDeleteCustomer}
          currentUserId={currentUserId}
          role={role}
        />
      </div>
    </>
  );
}

function PortalSharingPanel({ customer, deals, quotes, invoices, documents, currentUserId, formatAmount }) {
  const [shared, setShared] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error: loadError } = await supabase
        .from('customer_portal_shared_records')
        .select('id, record_type, record_id')
        .eq('customer_id', customer.id);
      if (cancelled) return;
      if (loadError) setError(loadError.message);
      else setShared(Object.fromEntries((data || []).map(r => [`${r.record_type}:${r.record_id}`, r.id])));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [customer.id]);

  async function toggle(type, id) {
    const key = `${type}:${id}`;
    setBusyKey(key);
    setError('');
    if (shared[key]) {
      const { error: deleteError } = await supabase.from('customer_portal_shared_records').delete().eq('id', shared[key]);
      if (deleteError) setError(deleteError.message);
      else setShared(prev => { const next = { ...prev }; delete next[key]; return next; });
    } else {
      const { data, error: insertError } = await supabase
        .from('customer_portal_shared_records')
        .insert({ customer_id: customer.id, record_type: type, record_id: id, shared_by: currentUserId })
        .select('id')
        .single();
      if (insertError) setError(insertError.message);
      else setShared(prev => ({ ...prev, [key]: data.id }));
    }
    setBusyKey('');
  }

  const customerEmail = (customer.email || '').trim().toLowerCase();
  const myQuotes = quotes.filter(q => customerEmail && (q.email || '').trim().toLowerCase() === customerEmail);
  const groups = [
    ['deal', 'Deals', deals.filter(d => d.customer_id === customer.id).map(d => ({ id: d.id, title: d.title, meta: `${d.stage} · ${formatAmount(d.amount)}` }))],
    ['quote', 'Quotes', myQuotes.map(q => ({ id: q.id, title: q.title || q.quote_number, meta: `${q.quote_number || 'Quote'} · ${q.status || 'Draft'} · ${formatAmount(docAmountUsd(q, q.total != null ? 'total' : 'amount'))}` }))],
    ['invoice', 'Invoices', invoices.filter(i => i.customer_id === customer.id).map(i => ({ id: i.id, title: i.title || i.invoice_number, meta: `${i.invoice_number || 'Invoice'} · ${i.status} · ${formatAmount(docAmountUsd(i, 'amount'))}` }))],
    ['document', 'Documents', documents.filter(d => d.customer_id === customer.id).map(d => ({ id: d.id, title: d.name, meta: d.mime_type || 'File' }))]
  ];
  const total = groups.reduce((sum, g) => sum + g[2].length, 0);
  const sharedCount = Object.keys(shared).length;

  return (
    <div className="portal-share-panel">
      <h3 className="detail-title">Customer portal sharing <span className="count-badge">{sharedCount} shared</span></h3>
      <p className="customer-history-hint">Customers only see the records you switch on here. Support tickets they raise from the portal appear in their Support tab automatically.</p>
      {error && <p className="form-error">{error}</p>}
      {loading ? <p className="detail-empty">Loading…</p> : total === 0 ? (
        <p className="detail-empty">This customer has no deals, quotes, invoices or documents to share yet.</p>
      ) : groups.filter(g => g[2].length > 0).map(([type, label, items]) => (
        <div key={type} className="portal-share-group">
          <strong>{label}</strong>
          {items.map(item => {
            const key = `${type}:${item.id}`;
            return (
              <label key={key} className="portal-share-row">
                <input type="checkbox" checked={!!shared[key]} disabled={busyKey === key} onChange={() => toggle(type, item.id)} />
                <span><b>{item.title}</b><small>{item.meta}</small></span>
                <em>{shared[key] ? 'Shared' : 'Private'}</em>
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function CustomerDetail({ currentUserId, customer, deals, activities, tickets, quotes = [], invoices = [], payments = [], emailLogs = [], documents = [], formatAmount, onClose, onEdit, onAddDeal, onAddActivity, onAddTicket }) {
  const myDeals = deals.filter(d => d.customer_id === customer.id);
  const myActivities = activities.filter(a => a.customer_id === customer.id);
  const myTickets = tickets.filter(t => t.customer_id === customer.id);
  const myQuotes = []; // Quotes V1 are standalone/manual and are not linked to customers yet.
  const myInvoices = invoices.filter(i => i.customer_id === customer.id);
  const invoiceIds = new Set(myInvoices.map(i => i.id));
  const myPayments = payments.filter(p => invoiceIds.has(p.invoice_id));
  const myEmailLogs = emailLogs.filter(e => e.customer_id === customer.id);
  const myDocuments = documents.filter(d => d.customer_id === customer.id);
  const paidTotal = myPayments.reduce((sum, p) => sum + paymentAmountUsd(p, invoices), 0);
  const outstanding = myInvoices.filter(i => !['Paid', 'Cancelled'].includes(i.status)).reduce((sum, i) => sum + docAmountUsd(i, 'amount'), 0);
  const status = customer.status || 'Active';

  const timeline = [
    ...myDeals.map(d => ({ key: `d-${d.id}`, kind: 'Deal', title: d.title, meta: `${d.stage} · ${formatAmount(d.amount)}`, date: d.created_at })),
    ...myActivities.map(a => ({ key: `a-${a.id}`, kind: 'Activity', title: a.title, meta: `${a.type || 'Task'} · ${a.status || 'Scheduled'}`, date: a.activity_date || a.created_at })),
    ...myTickets.map(t => ({ key: `t-${t.id}`, kind: 'Ticket', title: t.title, meta: `${t.priority || 'Medium'} · ${t.status}`, date: t.created_at })),
    ...myInvoices.map(i => ({ key: `i-${i.id}`, kind: 'Invoice', title: i.title || i.invoice_number || 'Invoice', meta: `${i.invoice_number || 'Invoice'} · ${i.status || 'Draft'} · ${formatAmount(docAmountUsd(i, 'amount'))}`, date: i.created_at })),
    ...myPayments.map(p => ({ key: `p-${p.id}`, kind: 'Payment', title: `Payment received · ${formatAmount(paymentAmountUsd(p, invoices))}`, meta: `${p.payment_method || 'Payment'}${p.reference ? ` · Ref ${p.reference}` : ''}`, date: p.paid_at || p.created_at })),
    ...myEmailLogs.map(e => ({ key: `e-${e.id}`, kind: 'Email', title: e.subject || 'Email logged', meta: `${e.direction || 'Email'} · ${e.to_email || ''}`.trim(), date: e.sent_at || e.created_at })),
    ...myDocuments.map(d => ({ key: `doc-${d.id}`, kind: 'Document', title: d.name || 'Document uploaded', meta: d.mime_type || 'CRM document', date: d.created_at }))
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide customer-360-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-heading customer-header">
          <div>
            <h2>{customer.name}</h2>
            <span className={`status ${status.toLowerCase()}`}>{status}</span>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="secondary-btn" onClick={() => onEdit(customer)}><Pencil size={14} /> Edit</button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
        </div>

        <div className="detail-grid">
          <div><small>Email</small><p>{customer.email ? <a href={`mailto:${customer.email}`}>{customer.email}</a> : '—'}</p></div>
          <div><small>Phone</small><p>{customer.phone || '—'}</p></div>
          <div><small>Job title</small><p>{customer.job_title || '—'}</p></div>
          <div><small>Birthday</small><p>{formatBirthday(customer.birthday)}</p></div>
          <div><small>Company</small><p>{customer.company || '—'}</p></div>
          <div><small>Customer since</small><p>{formatDate(customer.created_at)}</p></div>
          <div><small>Lifetime value</small><p>{formatAmount(lifetimeValue(customer, deals))}</p></div>
          <div><small>Open pipeline</small><p>{formatAmount(sumAmount(myDeals.filter(d => !['Won', 'Lost'].includes(d.stage))))}</p></div>
          <div><small>Open tickets</small><p>{myTickets.filter(t => ['Open', 'In Progress'].includes(t.status)).length}</p></div>
          <div><small>Quotes</small><p>{myQuotes.length}</p></div>
          <div><small>Invoices</small><p>{myInvoices.length}</p></div>
          <div><small>Open invoice balance</small><p>{formatAmount(Math.max(0, outstanding - paidTotal))}</p></div>
          <div><small>Payments recorded</small><p>{formatAmount(paidTotal)}</p></div>
          <div><small>Email logs</small><p>{myEmailLogs.length}</p></div>
          <div><small>Documents</small><p>{myDocuments.length}</p></div>
        </div>

        <div className="detail-actions">
          <button type="button" className="primary-btn" onClick={() => onAddDeal(customer)}><Plus size={15} /> New deal</button>
          <button type="button" className="secondary-btn" onClick={() => onAddActivity(customer)}>Log activity</button>
          <button type="button" className="secondary-btn" onClick={() => onAddTicket(customer)}>Create ticket</button>
        </div>

        <h3 className="detail-title">Customer history</h3>
        <p className="customer-history-hint">Deals, activities, support, quotes, invoices, payments, email logs and documents linked to this customer.</p>
        {timeline.length === 0 ? (
          <p className="detail-empty">No linked history yet. Use the actions above or link records to this customer as you create them.</p>
        ) : (
          <ul className="timeline">
            {timeline.map(item => (
              <li key={item.key} className="timeline-item">
                <span className={`timeline-kind ${item.kind.toLowerCase()}`}>{item.kind}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.meta}</p>
                </div>
                <time>{formatDateTime(item.date)}</time>
              </li>
            ))}
          </ul>
        )}

        <PortalSharingPanel customer={customer} deals={deals} quotes={quotes} invoices={invoices} documents={documents} currentUserId={currentUserId} formatAmount={formatAmount} />
      </div>
    </div>
  );
}
function Pipeline({ deals, customers, dealSupport = [], supportEngineers = [], moveDeal, deleteDeal, onEdit, onAdd, formatAmount, currentUserId, ownerProfiles = {}, isAdmin, role, onCreateQuoteFromDeal, onViewDealCommercials }) {
  const [query, setQuery] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const [openDealMenu, setOpenDealMenu] = useState(null);
  const [viewingDeal, setViewingDeal] = useState(null);
  const [, setClock] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const q = query.trim().toLowerCase();
  const visible = deals.filter(d =>
    (!mineOnly || d.created_by === currentUserId) &&
    (!q || `${d.title} ${d.company || ''}`.toLowerCase().includes(q))
  );
  const canEditDeal = deal => isCommercialEditor(role) || deal.created_by === currentUserId;
  const canDeleteDeal = deal => isCommercialDeleter(role);

  return (
    <>
      <PageHeading
        eyebrow="SALES"
        title="Sales pipeline"
        description="Drag deals between stages to track them from first contact to closed revenue."
        action="New deal"
        onAction={onAdd}
      />
      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={15} />
          <input type="search" placeholder="Search deals or companies" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button type="button" className={`filter-tab ${mineOnly ? 'active' : ''}`} onClick={() => setMineOnly(v => !v)}>My deals</button>
        <span className="toolbar-summary">
          Open: <strong>{formatAmount(sumAmount(visible.filter(d => d.stage !== 'Won')))}</strong>
          {' · '}Won: <strong>{formatAmount(sumAmount(visible.filter(d => d.stage === 'Won')))}</strong>
        </span>
      </div>
      <div className="pipeline-grid">
        {PIPELINE_STAGES.map(stage => {
          const stageDeals = visible.filter(d => d.stage === stage);
          return (
            <div
              className={`pipeline-column ${dragOver === stage ? 'drag-over' : ''}`}
              key={stage}
              onDragOver={e => { e.preventDefault(); setDragOver(stage); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(null);
                const id = e.dataTransfer.getData('text/plain');
                const deal = deals.find(d => String(d.id) === id);
                if (deal && deal.stage !== stage && canEditDeal(deal)) moveDeal(deal.id, stage);
              }}
            >
              <div className="pipeline-title">
                <span>{stage}</span>
                <span className="count-badge">{stageDeals.length}</span>
              </div>
              <div className="stage-total">{formatAmount(sumAmount(stageDeals))}</div>
              {stageDeals.length === 0 && <div className="pipeline-empty">Drop a deal here</div>}
              {stageDeals.map(deal => {
                const canEdit = canEditDeal(deal);
                const color = ownerColor(deal.created_by);
                return (
                  <div
                    className="deal-card deal-card-owned"
                    key={deal.id}
                    draggable={canEdit}
                    onDragStart={e => { e.dataTransfer.setData('text/plain', String(deal.id)); e.dataTransfer.effectAllowed = 'move'; }}
                    style={{ cursor: canEdit ? 'grab' : 'default', '--owner-color': color }}
                  >
                    <div className="deal-owner-marker">
                      <span className="owner-dot" style={{ background: color }} />
                      <span>{deal.created_by === currentUserId ? `${ownerProfiles[deal.created_by] || 'You'} (you)` : (ownerProfiles[deal.created_by] || 'Unknown user')}</span>
                    </div>
                    <div className="deal-top">
                      <span className="deal-label">DEAL</span>
                      {(canEdit || canDeleteDeal(deal) || deal.stage === 'Won') && (
                        <div className="deal-actions" style={{ position: 'relative' }}>
                          <button type="button" className="icon-btn" title="Deal actions" onClick={() => setOpenDealMenu(openDealMenu === deal.id ? null : deal.id)}><MoreHorizontal size={17} /></button>
                          {openDealMenu === deal.id && (
                            <div className="deal-action-menu">
                              <button type="button" onClick={() => { setViewingDeal(deal); setOpenDealMenu(null); }}>View Deal</button>
                              {canEdit && <button type="button" onClick={() => { onEdit(deal); setOpenDealMenu(null); }}>Edit Deal</button>}
                              {deal.stage === 'Won' && <button type="button" onClick={() => { onCreateQuoteFromDeal(deal); setOpenDealMenu(null); }}>Create Quote</button>}
                              {deal.stage === 'Won' && <button type="button" onClick={() => { onViewDealCommercials('quotes', deal); setOpenDealMenu(null); }}>View Quotes</button>}
                              {deal.stage === 'Won' && <button type="button" onClick={() => { onViewDealCommercials('invoices', deal); setOpenDealMenu(null); }}>View Invoices</button>}
                              {canDeleteDeal(deal) && <button type="button" className="danger" onClick={() => { setOpenDealMenu(null); deleteDeal(deal.id); }}>Delete Deal</button>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <h3>{deal.title}</h3>
                    <p>{deal.company || 'No company specified'}</p>
                    {deal.customer_id && (
                      <small className="deal-customer">
                        Customer: {customers.find(c => c.id === deal.customer_id)?.name || 'Unknown customer'}
                      </small>
                    )}
                    <strong>{formatAmount(deal.amount)}</strong>
                    {dealSupport.filter(row => row.deal_id === deal.id && row.support_engineers?.status === 'Active').length > 0 && (
                      <div className="deal-customer" style={{ marginTop: 8 }}>
                        <strong style={{ display: 'block', marginBottom: 4 }}>Technical Support</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {dealSupport.filter(row => row.deal_id === deal.id && row.support_engineers?.status === 'Active').map(row => (
                            <span key={row.support_engineer_id} className="status active">{row.support_engineers?.name}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <small className="deal-customer">
                      Closure: {deal.closure_start_at ? formatDateTime(deal.closure_start_at) : 'Not set'} → {deal.closure_end_at ? formatDateTime(deal.closure_end_at) : 'Not set'}
                    </small>
                    {deal.closure_end_at && (
                      <div className={`closure-timer ${new Date(deal.closure_end_at).getTime() < Date.now() ? 'expired' : ''}`}>
                        {closureTimerText(deal.closure_end_at)}
                      </div>
                    )}
                    <select value={deal.stage} onChange={e => moveDeal(deal.id, e.target.value)} disabled={!canEdit}>
                      {PIPELINE_STAGES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {viewingDeal && (
        <div className="modal-backdrop" onClick={() => setViewingDeal(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-heading">
              <div><h2>{viewingDeal.title}</h2><p>Deal details</p></div>
              <button type="button" className="icon-btn" onClick={() => setViewingDeal(null)}><X size={18} /></button>
            </div>
            <div className="detail-grid">
              <div><small>Company</small><p>{viewingDeal.company || '—'}</p></div>
              <div><small>Stage</small><p>{viewingDeal.stage}</p></div>
              <div><small>Value</small><p>{formatAmount(viewingDeal.amount)}</p></div>
              <div><small>Owner</small><p>{ownerProfiles[viewingDeal.created_by] || 'Sales Rep'}</p></div>
              <div><small>Customer</small><p>{customers.find(c => c.id === viewingDeal.customer_id)?.name || '—'}</p></div>
              <div><small>Contact</small><p>{viewingDeal.contact_email || viewingDeal.contact_phone || '—'}</p></div>
            </div>
            {viewingDeal.stage === 'Won' && <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => { onViewDealCommercials('quotes', viewingDeal); setViewingDeal(null); }}>View Quotes</button>
              <button type="button" className="secondary-btn" onClick={() => { onViewDealCommercials('invoices', viewingDeal); setViewingDeal(null); }}>View Invoices</button>
              <button type="button" className="primary-btn" onClick={() => { onCreateQuoteFromDeal(viewingDeal); setViewingDeal(null); }}>Create Quote</button>
            </div>}
          </div>
        </div>
      )}
    </>
  );
}


function googleMapsLocationUrl(latitude, longitude, address = '') {
  const cleanAddress = String(address || '').trim();
  if (cleanAddress) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

function FieldVisits({ customers = [], fieldVisits = [], currentUserId, role, onStart, onCheckIn, onEnd, error }) {
  const [targetType, setTargetType] = useState('customer');
  const [customerId, setCustomerId] = useState('');
  const [targetName, setTargetName] = useState('');
  const [targetOrganization, setTargetOrganization] = useState('');
  const [targetAddress, setTargetAddress] = useState('');
  const [visitType, setVisitType] = useState('Customer visit');
  const [contactPerson, setContactPerson] = useState('');
  const [objective, setObjective] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const visibleVisits = fieldVisits.filter(visit => role === 'manager' || role === 'admin' || visit.sales_rep_id === currentUserId);
  const activeVisits = visibleVisits.filter(visit => !visit.check_out_at);
  const selectedCustomer = customers.find(customer => customer.id === customerId);

  const resetForm = () => {
    setCustomerId('');
    setTargetName('');
    setTargetOrganization('');
    setTargetAddress('');
    setVisitType('Customer visit');
    setContactPerson('');
    setObjective('');
    setNotes('');
  };

  const start = async () => {
    if (targetType === 'customer' && !customerId) return;
    if (targetType === 'other' && !targetName.trim()) return;
    if (!objective.trim()) return;
    setBusy(true);
    try {
      await onStart({ targetType, customerId, targetName, targetOrganization, targetAddress, visitType, contactPerson, objective, notes });
      resetForm();
    } catch (e) {
      alert(e.message || 'Unable to start field visit.');
    } finally {
      setBusy(false);
    }
  };

  const statusLabel = visit => ({
    PENDING: 'Pending check-in',
    VERIFIED: 'Verified',
    NEARBY: 'Nearby — review',
    MISMATCH: 'Location mismatch',
    LOW_ACCURACY: 'Low accuracy',
    NOT_CONFIGURED: 'Customer location not configured',
    LOCATION_CAPTURED: 'Location captured'
  }[visit.verification_status] || visit.verification_status || 'Pending');

  const targetLabel = visit => {
    const customer = customers.find(c => c.id === visit.customer_id);
    return visit.target_name || customer?.name || 'Visit target';
  };

  return <>
    <PageHeading
      eyebrow="WORK & SUPPORT"
      title="Field Visits"
      description="Schedule a field visit first, then capture arrival and departure locations with Check In and Check Out."
    />

    <div className="panel">
      <div className="panel-heading">
        <div>
          <h3>Start a field visit</h3>
          <p>Complete the visit details and schedule it. GPS is not requested until you press Check In on arrival.</p>
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}

      <div className="field-visit-form field-visit-form-expanded">
        <label>Visit target
          <select value={targetType} onChange={e => { setTargetType(e.target.value); setCustomerId(''); setTargetName(''); setTargetOrganization(''); setTargetAddress(''); }}>
            <option value="customer">CRM Customer</option>
            <option value="other">Other person / organization</option>
          </select>
        </label>

        {targetType === 'customer' ? <label>Customer
          <select value={customerId} onChange={e => setCustomerId(e.target.value)}>
            <option value="">Select customer</option>
            {customers.filter(c => c.status !== 'Inactive').map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
          </select>
        </label> : <label>Person / organization name
          <input value={targetName} onChange={e => setTargetName(e.target.value)} placeholder="e.g. Mr. Chinedu Okafor" />
        </label>}

        {targetType === 'other' && <label>Organization / company
          <input value={targetOrganization} onChange={e => setTargetOrganization(e.target.value)} placeholder="Optional" />
        </label>}

        {targetType === 'other' && <label>Visit address
          <input value={targetAddress} onChange={e => setTargetAddress(e.target.value)} placeholder="e.g. UBA CMS, Marina, Lagos" />
        </label>}

        <label>Visit type
          <select value={visitType} onChange={e => setVisitType(e.target.value)}>
            <option>Customer visit</option>
            <option>Sales meeting</option>
            <option>Product presentation</option>
            <option>Follow-up</option>
            <option>Technical / solution discussion</option>
            <option>Relationship meeting</option>
            <option>Other</option>
          </select>
        </label>

        <label>Contact person
          <input value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Who are you meeting?" />
        </label>

        <label className="field-visit-full">Visit objective
          <textarea value={objective} onChange={e => setObjective(e.target.value)} rows="3" placeholder="What is the purpose of this visit?" />
        </label>

        <label className="field-visit-full">Additional notes
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" placeholder="Anything else the team should know?" />
        </label>

        {targetType === 'customer' && selectedCustomer?.location_address && <div className="field-visit-location-preview field-visit-full">
          <strong>Registered customer location</strong>
          <span>{selectedCustomer.location_address}</span>
          {googleMapsLocationUrl(selectedCustomer.latitude, selectedCustomer.longitude, selectedCustomer.location_address) && <a href={googleMapsLocationUrl(selectedCustomer.latitude, selectedCustomer.longitude, selectedCustomer.location_address)} target="_blank" rel="noreferrer" className="field-visit-map-link">Open customer location in Google Maps</a>}
        </div>}

        <div className="field-visit-location-notice field-visit-full">
          <span className="field-visit-location-dot">●</span>
          <div><strong>Location verification</strong><p>Scheduling does not capture GPS. Check In records your arrival coordinates and street address; Check Out records your departure coordinates and street address. No continuous location tracking is used.</p></div>
        </div>

        <div className="field-visit-form-actions field-visit-full">
          <button type="button" className="primary-btn" onClick={start} disabled={(targetType === 'customer' ? !customerId : !targetName.trim()) || !objective.trim() || busy}>
            {busy ? 'Scheduling visit…' : 'Schedule Field Visit'}
          </button>
        </div>
      </div>
    </div>

    {activeVisits.length > 0 && <div className="panel">
      <div className="panel-heading"><div><h3>Scheduled &amp; active visits</h3><p>Scheduled visits need Check In on arrival. After checking in, use Check Out when you leave.</p></div></div>
      <div className="field-visit-cards">
        {activeVisits.map(visit => {
          const customer = customers.find(c => c.id === visit.customer_id);
          const checkInMapUrl = visit.check_in_location_url || googleMapsLocationUrl(visit.check_in_latitude, visit.check_in_longitude);
          const targetMapUrl = googleMapsLocationUrl(visit.customer_latitude, visit.customer_longitude, visit.check_in_location_address || visit.target_address || customer?.location_address);
          return <div className="field-visit-card" key={visit.id}>
            <div>
              <strong>{targetLabel(visit)}</strong>
              <span>{visit.target_organization || customer?.company || visit.purpose || 'Field visit'}</span>
              <small>{visit.contact_person ? `Contact: ${visit.contact_person}` : 'No contact person recorded'}</small>
              <small>{visit.check_in_at ? `Checked in ${formatDateTime(visit.check_in_at)}` : 'Scheduled — not checked in yet'}</small>
              {visit.check_in_location_address && <small className="field-visit-address">Arrival: {visit.check_in_location_address}</small>}
              {visit.check_out_location_address && <small className="field-visit-address">Departure: {visit.check_out_location_address}</small>}
              {visit.target_address && <small className="field-visit-address">{visit.target_address}</small>}
              <div className="field-visit-links">
                {checkInMapUrl && <a href={checkInMapUrl} target="_blank" rel="noreferrer" className="field-visit-map-link">Open live location</a>}
                {targetMapUrl && <a href={targetMapUrl} target="_blank" rel="noreferrer" className="field-visit-map-link">Open target location</a>}
              </div>
            </div>
            <div><span className={`status ${String(visit.verification_status || '').toLowerCase()}`}>{statusLabel(visit)}</span>{!visit.check_in_at ? <button type="button" className="primary-btn" disabled={busy} onClick={async () => { setBusy(true); try { await onCheckIn(visit); } catch (e) { alert(e.message || 'Unable to check in.'); } finally { setBusy(false); } }}>Check In</button> : <button type="button" className="secondary-btn" disabled={busy} onClick={async () => { setBusy(true); try { await onEnd(visit); } catch (e) { alert(e.message || 'Unable to check out.'); } finally { setBusy(false); } }}>Check Out</button>}</div>
          </div>;
        })}
      </div>
    </div>}

    <div className="panel">
      <div className="panel-heading"><div><h3>Visit history</h3><p>{visibleVisits.length} visit{visibleVisits.length === 1 ? '' : 's'} recorded. Location links are retained for audit.</p></div></div>
      {visibleVisits.length === 0 ? <div className="empty-state"><p>No field visits yet.</p></div> : <div className="table-wrap"><table><thead><tr><th>Visit target</th><th>Check In</th><th>Check Out</th><th>Distance</th><th>Verification</th><th>Location</th></tr></thead><tbody>{visibleVisits.map(visit => {
        const customer = customers.find(c => c.id === visit.customer_id);
        const checkInMapUrl = visit.check_in_location_url || googleMapsLocationUrl(visit.check_in_latitude, visit.check_in_longitude);
        const checkOutMapUrl = visit.check_out_location_url || googleMapsLocationUrl(visit.check_out_latitude, visit.check_out_longitude);
        const targetMapUrl = googleMapsLocationUrl(visit.customer_latitude, visit.customer_longitude, visit.check_in_location_address || visit.target_address || customer?.location_address);
        return <tr key={visit.id}>
          <td><strong>{targetLabel(visit)}</strong><div className="deal-customer">{visit.target_organization || customer?.company || visit.purpose || 'Field visit'}</div>{visit.target_address && <div className="field-visit-address">{visit.target_address}</div>}</td>
          <td>{visit.check_in_at ? formatDateTime(visit.check_in_at) : 'Not checked in'}</td>
          <td>{visit.check_out_at ? formatDateTime(visit.check_out_at) : visit.check_in_at ? 'In progress' : 'Scheduled'}</td>
          <td>{visit.distance_from_customer == null ? '—' : `${Math.round(Number(visit.distance_from_customer))}m`}</td>
          <td><span className={`status ${String(visit.verification_status || '').toLowerCase()}`}>{statusLabel(visit)}</span></td>
          <td><div className="field-visit-links field-visit-links-table">{checkInMapUrl && <a href={checkInMapUrl} target="_blank" rel="noreferrer" className="field-visit-map-link">Check-in location</a>}{checkOutMapUrl && <a href={checkOutMapUrl} target="_blank" rel="noreferrer" className="field-visit-map-link">Check-out location</a>}{targetMapUrl && <a href={targetMapUrl} target="_blank" rel="noreferrer" className="field-visit-map-link">Target location</a>}</div></td>
        </tr>;
      })}</tbody></table></div>}
    </div>
  </>;
}

function Activities({ activities, customers, ownerProfiles = {}, currentUserEmail, onAdd, onStatusChange, onDelete, onEdit, onView, currentUserId, isAdmin }) {
  const [tab, setTab] = useState('All');
  const getCustomerName = id => customers.find(c => c.id === id)?.name || 'No customer linked';
  const filters = { All: () => true, Upcoming: a => isOpenActivity(a) && !isOverdue(a), Overdue: isOverdue, Completed: a => a.status === 'Completed' };
  const counts = Object.fromEntries(Object.entries(filters).map(([k, f]) => [k, activities.filter(f).length]));
  const list = activities.filter(filters[tab]).sort((a, b) => { const diff = new Date(a.activity_date || 8.64e15) - new Date(b.activity_date || 8.64e15); return tab === 'Completed' ? -diff : diff; });
  return <><PageHeading eyebrow="PRODUCTIVITY" title="Activities" description="Keep track of meetings, calls, and follow-ups." action="New activity" onAction={onAdd} /><div className="panel"><div className="panel-heading"><div><h3>Schedule</h3><p>Your tasks, calls and follow-ups.</p></div></div><div className="filter-tabs" role="tablist" aria-label="Filter activities">{Object.keys(filters).map(name => <button key={name} type="button" className={`filter-tab ${tab === name ? 'active' : ''} ${name === 'Overdue' && counts.Overdue ? 'danger' : ''}`} onClick={() => setTab(name)}>{name} ({counts[name]})</button>)}</div>{list.length === 0 ? <div className="empty-state"><p>{activities.length === 0 ? 'No activities yet.' : `No ${tab.toLowerCase()} activities.`}</p>{activities.length === 0 && <button type="button" className="primary-btn" onClick={onAdd}>Create your first activity</button>}</div> : list.map(activity => { const canEdit = isAdmin || activity.created_by === currentUserId; const date = activity.activity_date ? new Date(activity.activity_date) : null; return <div className="activity-row large" key={activity.id}><div className="date-box"><strong>{date ? date.getDate() : '--'}</strong><span>{date ? date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '---'}</span></div><div className="activity-content"><strong>{activity.title} {isOverdue(activity) && <span className="status overdue">Overdue</span>}</strong><p>{activity.type || 'Task'} · {getCustomerName(activity.customer_id)}</p><div className="activity-meta-badges"><span className={`priority-pill priority-${String(activity.priority || 'Medium').toLowerCase()}`}>{activity.priority || 'Medium'} priority</span><span className="assignee-pill">Assigned: {(activity.assigned_to === currentUserId ? (ownerProfiles[currentUserId] || currentUserEmail || 'Me') : (ownerProfiles[activity.assigned_to] || (activity.assigned_to ? 'Team member' : 'Unassigned')))}</span></div><small>Due: {formatDateTime(activity.activity_date)}</small>{activity.notes && <p className="activity-notes">{activity.notes}</p>}</div><div className="activity-actions"><button type="button" className="secondary-btn" onClick={() => onView(activity)}>View</button>{canEdit && <button type="button" className="secondary-btn" onClick={() => onEdit(activity)}><Pencil size={14} /> Edit</button>}{canEdit && isOpenActivity(activity) && <button type="button" className="secondary-btn" onClick={() => onStatusChange(activity.id, 'Completed')}>Mark done</button>}<select value={activity.status || 'Scheduled'} onChange={e => onStatusChange(activity.id, e.target.value)} disabled={!canEdit}><option value="Scheduled">Scheduled</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select>{canEdit && <button type="button" className="icon-btn" title="Delete activity" onClick={() => onDelete(activity.id)}><X size={16} /></button>}</div></div> })}</div></>;
}

function ActivityDetail({ activity, customer, ownerProfiles = {}, currentUserEmail, onClose, onEdit }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <h2>{activity.title}</h2>
            <p>{activity.type || 'Task'} · {activity.status || 'Scheduled'}</p>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="secondary-btn" onClick={() => onEdit(activity)}><Pencil size={14} /> Edit</button>
            <button type="button" className="icon-btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>
        <div className="detail-grid">
          <div>
            <small>Status</small>
            <p>{activity.status || 'Scheduled'}</p>
          </div>
          <div>
            <small>Type</small><p>{activity.type || 'Task'}</p>
          </div>
          <div>
            <small>Due date & time</small>
            <p>{formatDateTime(activity.activity_date)}</p>
          </div>
          <div><small>Priority</small><p><span className={`priority-pill priority-${String(activity.priority || 'Medium').toLowerCase()}`}>{activity.priority || 'Medium'}</span></p>
          </div>
          <div><small>Assigned to</small><p>{activity.assigned_to ? (ownerProfiles[activity.assigned_to] || (activity.assigned_to === activity.created_by ? (currentUserEmail || 'Me') : 'Team member')) : 'Unassigned'}</p>
          </div>
          <div>
            <small>Customer</small><p>{customer?.name || 'No customer linked'}</p>
          </div>
          <div><small>Created</small>
            <p>{formatDate(activity.created_at)}</p>
          </div>
          <div>
            <small>Reminder state</small>
            <p>{isOverdue(activity) ? 'Overdue' : isOpenActivity(activity) ? 'Upcoming' : 'Completed/closed'}</p>
          </div>
        </div>
        <h3 className="detail-title">Notes</h3>
        <p className="detail-empty" style={{ whiteSpace: 'pre-wrap' }}>{activity.notes || 'No notes added.'}</p>
      </div>
    </div>
  );
}

function Tickets({ tickets, error, onAdd, onStatusChange, onDelete, onEdit, onView, currentUserId, isAdmin, canManage, canCreate = true, role, staffName, staffOptions, onAssign }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [queue, setQueue] = useState('All tickets');
  const q = query.trim().toLowerCase();
  const matchesQueue = t => queue === 'All tickets'
    || (queue === 'Assigned to me' && t.assigned_to === currentUserId)
    || (queue === 'Unassigned' && !t.assigned_to)
    || (queue === 'Customer portal' && t.source === 'portal');
  const filtered = tickets.filter(t => (status === 'All' || t.status === status) && (priority === 'All' || t.priority === priority) && matchesQueue(t) && (!q || `${t.title} ${t.description || ''} ${t.customers?.name || ''} ${t.category || ''} ${t.ticket_number || ''}`.toLowerCase().includes(q)));
  const count = s => tickets.filter(t => t.status === s).length;
  const portalOpen = tickets.filter(t => t.source === 'portal' && (t.status === 'Open' || t.status === 'In Progress')).length;
  return <>
    <PageHeading eyebrow="SUPPORT" title="Tickets" description="Manage customer issues and support requests, including tickets raised from the customer portal." action="Create Ticket" onAction={onAdd} />
    <div className="stats-grid">
      <StatCard label="Open" value={count('Open')} hint="Waiting for a response" tone="orange" icon="!" />
      <StatCard label="In progress" value={count('In Progress')} hint="Being worked on" tone="blue" icon="◷" />
      <StatCard label="Resolved" value={count('Resolved') + count('Closed')} hint="Resolved or closed" tone="green" icon="✓" />
      <StatCard label="From customer portal" value={portalOpen} hint="Open portal tickets" tone="purple" icon="✉" />
    </div>
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h3>All Tickets</h3>
          <p>{filtered.length} of {tickets.length} tickets</p>
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="toolbar">
        <div className="toolbar-search"><Search size={15} /><input type="search" placeholder="Search tickets or customers" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <select value={queue} onChange={e => setQueue(e.target.value)} aria-label="Ticket queue">{['All tickets', 'Assigned to me', 'Unassigned', 'Customer portal'].map(x => <option key={x} value={x}>{x}</option>)}</select>
        <select value={status} onChange={e => setStatus(e.target.value)}>{['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map(x => <option key={x} value={x}>{x === 'All' ? 'All statuses' : x}</option>)}</select>
        <select value={priority} onChange={e => setPriority(e.target.value)}>
          {['All', 'Low', 'Medium', 'High', 'Urgent'].map(x => <option key={x} value={x}>{x === 'All' ? 'All priorities' : x}</option>)}</select>
      </div>
      {tickets.length === 0 ?
        <div className="empty-state">
          <p>No tickets yet.</p>
          <button type="button" className="secondary-btn" onClick={onAdd}>Create your first ticket</button>
        </div> : filtered.length === 0 ? <div className="empty-state"><p>No tickets match your filters.</p></div> : <div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Customer</th><th>Assigned to</th><th>Priority</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{filtered.map(ticket => {
          const editable = canManage(ticket);
          return <tr key={ticket.id}>
            <td>
              <button type="button" className="text-btn" onClick={() => onView(ticket)}><strong>{ticket.ticket_number ? `#${ticket.ticket_number} · ` : ''}{ticket.title}</strong></button>
              <div className="deal-customer">{ticket.category || 'General'}{ticket.source === 'portal' && <span className="ticket-source-badge">Portal</span>}</div>
            </td>
            <td>{ticket.customers?.name || 'Unassigned'}</td>
            <td>{editable
              ? <select className="ticket-status-select" value={ticket.assigned_to || ''} onChange={e => onAssign(ticket.id, e.target.value || null)} aria-label="Assign ticket"><option value="">Unassigned</option>{staffOptions.map(u => <option key={u.user_id} value={u.user_id}>{staffName(u.user_id)}</option>)}</select>
              : staffName(ticket.assigned_to)}</td>
            <td><span className={`status ${(ticket.priority || 'medium').toLowerCase()}`}>{ticket.priority || 'Medium'}</span></td>
            <td><select className="ticket-status-select" value={ticket.status} onChange={e => onStatusChange(ticket.id, e.target.value)} disabled={!editable}><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option><option value="Closed">Closed</option></select></td>
            <td>{formatDate(ticket.created_at)}</td>
            <td><div className="toolbar-actions"><button type="button" className="secondary-btn" onClick={() => onView(ticket)}>View</button>{editable && <button type="button" className="secondary-btn" onClick={() => onEdit(ticket)}><Pencil size={14} /> Edit</button>}{(isAdmin || ticket.created_by === currentUserId) && <button type="button" className="icon-btn" title="Delete ticket" onClick={() => onDelete(ticket.id)}><X size={16} /></button>}</div></td>
          </tr>;
        })}</tbody></table></div>}</div></>;
}
function TicketDetail({ onRefresh, ticket, staffName, staffOptions, currentUserId, canManage, onClose, onEdit, onStatusChange, onAssign }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const isPortal = ticket.source === 'portal';
  const editable = canManage(ticket);

  async function loadComments({ silent = false } = {}) {
    if (!silent) setLoading(true);
    const { data, error: loadError } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    if (loadError) {
      if (!silent) setError(loadError.code === '42P01' || loadError.code === 'PGRST205'
        ? 'Conversations are not set up yet. Run the portal support SQL migration to enable them.'
        : loadError.message);
    } else {
      setError('');
      setComments(data || []);
    }
    if (!silent) setLoading(false);
  }

  useEffect(() => {
    loadComments();
    const timer = window.setInterval(() => loadComments({ silent: true }), 15000);
    return () => window.clearInterval(timer);
  }, [ticket.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [comments.length]);

  async function sendReply(event) {
    event.preventDefault();
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    const { data, error: sendError } = await supabase
      .from('ticket_comments')
      .insert({ ticket_id: ticket.id, author_id: currentUserId, author_type: 'staff', body, is_internal: internal })
      .select()
      .single();
    if (sendError) {
      setError(sendError.message);
      setSending(false);
      return;
    }
    setComments(prev => [...prev, data]);
    setReply('');
    if (!internal) {
      // A public reply claims an unassigned portal ticket and moves a new ticket into progress.
      if (isPortal && !ticket.assigned_to) onAssign(ticket.id, currentUserId);
      if (ticket.status === 'Open') onStatusChange(ticket.id, 'In Progress');
    }
    setSending(false);
  }

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
      <div className="modal-heading">
        <div>
          <h2>{ticket.ticket_number ? `#${ticket.ticket_number} · ` : ''}{ticket.title}</h2>
          <p>{ticket.category || 'General'} · {ticket.status || 'Open'}{isPortal && <span className="ticket-source-badge">Customer portal</span>}</p>
        </div>
        <div className="toolbar-actions">
          <button type="button" className="secondary-btn" onClick={() => { loadComments({ silent: true }); onRefresh?.(); }}><RefreshCw size={14} /> Refresh</button>
          {editable && <button type="button" className="secondary-btn" onClick={() => onEdit(ticket)}><Pencil size={14} /> Edit</button>}
          <button type="button" className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
      </div>
      <div className="detail-grid">
        <div><small>Customer</small><p>{ticket.customers?.name || 'Unassigned'}</p></div>
        <div><small>Company</small><p>{ticket.customers?.company || '—'}</p></div>
        <div><small>Priority</small><p>{ticket.priority || 'Medium'}</p></div>
        <div><small>Status</small><p>{editable
          ? <select className="ticket-status-select" value={ticket.status || 'Open'} onChange={e => onStatusChange(ticket.id, e.target.value)}><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option><option value="Closed">Closed</option></select>
          : ticket.status || 'Open'}</p></div>
        <div><small>Assigned to</small><p>{editable
          ? <select className="ticket-status-select" value={ticket.assigned_to || ''} onChange={e => onAssign(ticket.id, e.target.value || null)}><option value="">Unassigned</option>{staffOptions.map(u => <option key={u.user_id} value={u.user_id}>{staffName(u.user_id)}</option>)}</select>
          : staffName(ticket.assigned_to)}</p></div>
        <div><small>Created</small><p>{formatDate(ticket.created_at)}</p></div>
        <div><small>Customer portal</small><p>{isPortal || ticket.portal_visible ? (ticket.customer_id ? 'Visible to customer' : 'Needs a linked customer') : 'Hidden'}</p></div>
      </div>

      <h3 className="detail-title">Conversation</h3>
      <div className="ticket-thread">
        <div className="ticket-message customer">
          <div className="ticket-message-meta"><strong>{ticket.customers?.name || 'Customer'}</strong><time>{formatDateTime(ticket.created_at)}</time></div>
          <p>{ticket.description || 'No description added.'}</p>
        </div>
        {loading && <p className="detail-empty">Loading conversation…</p>}
        {comments.map(comment => {
          const fromCustomer = comment.author_type === 'customer';
          return <div key={comment.id} className={`ticket-message ${fromCustomer ? 'customer' : 'staff'} ${comment.is_internal ? 'internal' : ''}`}>
            <div className="ticket-message-meta">
              <strong>{fromCustomer ? (ticket.customers?.name || 'Customer') : staffName(comment.author_id)}</strong>
              {comment.is_internal && <span className="ticket-internal-tag">Internal note · hidden from customer</span>}
              <time>{formatDateTime(comment.created_at)}</time>
            </div>
            <p>{comment.body}</p>
          </div>;
        })}
        <div ref={endRef} />
      </div>

      {error && <p className="form-error">{error}</p>}
      <form className="ticket-reply-form" onSubmit={sendReply}>
        <div className="filter-tabs" role="tablist" aria-label="Reply type">
          <button type="button" className={`filter-tab ${!internal ? 'active' : ''}`} onClick={() => setInternal(false)}>{isPortal ? 'Reply to customer' : 'Add comment'}</button>
          <button type="button" className={`filter-tab ${internal ? 'active' : ''}`} onClick={() => setInternal(true)}>Internal note</button>
        </div>
        <textarea rows="3" value={reply} onChange={e => setReply(e.target.value)} maxLength={5000} placeholder={internal ? 'Write a note for your team only…' : isPortal ? 'Write a reply the customer will see in their portal…' : 'Write a comment…'} disabled={sending} />
        <div className="modal-actions">
          <button type="submit" className="primary-btn" disabled={sending || !reply.trim()}>{sending ? 'Sending…' : internal ? 'Save note' : isPortal ? 'Send reply' : 'Add comment'}</button>
        </div>
      </form>
    </div>
  </div>;
}
function BarRow({ label, percent, display }) {
  return (
    <div className="report-row wide">
      <span>{label}</span>
      <div className="progress"><i style={{ width: `${percent > 0 ? Math.max(6, percent) : 0}%` }} /></div>
      <strong>{display}</strong>
    </div>
  );
}

function Reports({ customers, deals, activities, tickets, formatAmount }) {
  const won = deals.filter(d => d.stage === 'Won');
  const open = deals.filter(d => d.stage !== 'Won');
  const winRate = deals.length ? (won.length / deals.length) * 100 : 0;
  const totalPipeline = sumAmount(deals) || 1;

  const topCustomers = Object.values(won.reduce((acc, d) => {
    if (!d.customer_id) return acc;
    acc[d.customer_id] = acc[d.customer_id] || { id: d.customer_id, value: 0, deals: 0 };
    acc[d.customer_id].value += Number(d.amount) || 0;
    acc[d.customer_id].deals += 1;
    return acc;
  }, {})).sort((a, b) => b.value - a.value).slice(0, 5);
  const topMax = topCustomers[0]?.value || 1;

  const months = useMemo(() => {
    const now = new Date();
    const list = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth(), revenue: 0 });
    }
    won.forEach(deal => {
      if (!deal.created_at) return;
      const d = new Date(deal.created_at);
      const m = list.find(x => x.year === d.getFullYear() && x.month === d.getMonth());
      if (m) m.revenue += Number(deal.amount) || 0;
    });
    return list;
  }, [deals]);
  const monthMax = Math.max(...months.map(m => m.revenue), 1);

  const doneActivities = activities.filter(a => a.status === 'Completed').length;
  const countedActivities = activities.filter(a => a.status !== 'Cancelled').length;
  const solvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  function exportDeals() {
    downloadCSV(
      'deals.csv',
      ['title', 'company', 'customer', 'stage', 'amount_usd', 'created'],
      deals.map(d => [d.title, d.company || '', customers.find(c => c.id === d.customer_id)?.name || '', d.stage, d.amount, d.created_at || ''])
    );
  }

  return (
    <>
      <PageHeading eyebrow="INSIGHTS" title="Reports & analytics" description="Understand your sales, customers and support performance." />
      <div className="stats-grid">
        <StatCard label="Won revenue" value={formatAmount(sumAmount(won))} hint={`${won.length} deals won`} tone="purple" icon="↗" />
        <StatCard label="Open pipeline" value={formatAmount(sumAmount(open))} hint={`${open.length} open deals`} tone="orange" icon="◈" />
        <StatCard label="Win rate" value={`${winRate.toFixed(1)}%`} hint={`${won.length} of ${deals.length} deals`} tone="green" icon="◉" />
        <StatCard label="Average deal size" value={formatAmount(won.length ? sumAmount(won) / won.length : 0)} hint="Won deals only" tone="blue" icon="◆" />
      </div>
      <div className="report-grid">
        <div className="panel report-summary">
          <h3>Pipeline by stage</h3>
          {PIPELINE_STAGES.map(stage => {
            const list = deals.filter(d => d.stage === stage);
            return <BarRow key={stage} label={stage} percent={(sumAmount(list) / totalPipeline) * 100} display={`${list.length} · ${formatAmount(sumAmount(list))}`} />;
          })}
        </div>
        <div className="panel report-summary">
          <h3>Won revenue by month</h3>
          {months.map(m => <BarRow key={`${m.year}-${m.month}`} label={m.label} percent={(m.revenue / monthMax) * 100} display={formatAmount(m.revenue)} />)}
        </div>
        <div className="panel report-summary">
          <h3>Top customers</h3>
          {topCustomers.length === 0 ? <p className="detail-empty">Won deals linked to a customer will appear here.</p> : topCustomers.map(t => (
            <BarRow key={t.id} label={customers.find(c => c.id === t.id)?.name || 'Unknown'} percent={(t.value / topMax) * 100} display={`${t.deals} · ${formatAmount(t.value)}`} />
          ))}
        </div>
        <div className="panel report-summary">
          <h3>Customers and support</h3>
          {CUSTOMER_STATUSES.map(s => {
            const n = customers.filter(c => (c.status || 'Active') === s).length;
            return <BarRow key={s} label={`${s} customers`} percent={customers.length ? (n / customers.length) * 100 : 0} display={n} />;
          })}
          <BarRow label="Tickets resolved" percent={tickets.length ? (solvedTickets / tickets.length) * 100 : 0} display={`${solvedTickets}/${tickets.length}`} />
          <BarRow label="Activities done" percent={countedActivities ? (doneActivities / countedActivities) * 100 : 0} display={`${doneActivities}/${countedActivities}`} />
        </div>
      </div>
      <div className="toolbar-actions">
        <button type="button" className="secondary-btn" onClick={exportDeals} disabled={deals.length === 0}>Export deals (CSV)</button>
      </div>
    </>
  );
}

function Leads({ leads, customers, products, leadProducts, onAdd, onUpdate, onSyncProducts, onDelete, currentUserId, isAdmin }) {
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', job_title: '', birthday: '', source: 'Website', status: 'New', customer_id: '' });
  const [q, setQ] = useState('');

  const primaryVendors = ['F5', 'Kong', 'IRONSCALES', 'SolarWinds', 'Utimaco'];
  const normalizeVendor = vendor => (vendor || '').trim().toLowerCase();
  const visible = leads.filter(x => `${x.name || ''} ${x.email || ''} ${x.company || ''} ${x.source || ''}`.toLowerCase().includes(q.toLowerCase()));

  const productsForVendor = vendor => products.filter(product =>
    normalizeVendor(product.vendor) === normalizeVendor(vendor) && product.status !== 'Inactive'
  );

  const productById = productId => products.find(product => product.id === productId);
  const productIdsForLead = leadId => leadProducts.filter(row => row.lead_id === leadId).map(row => row.product_id);

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', company: '', job_title: '', birthday: '', source: 'Website', status: 'New', customer_id: '' });
    setSelectedProductIds([]);
    setExpandedVendor(null);
    setEditing(null);
  };

  const openAdd = () => {
    resetForm();
    setShow(true);
  };

  const openEdit = x => {
    setEditing(x);
    setForm({
      name: x.name || '',
      email: x.email || '',
      phone: x.phone || '',
      company: x.company || '',
      job_title: x.job_title || '',
      birthday: x.birthday || '',
      source: x.source || 'Website',
      status: x.status || 'New',
      customer_id: x.customer_id || ''
    });
    setSelectedProductIds(productIdsForLead(x.id));
    setExpandedVendor(null);
    setShow(true);
  };

  const closeModal = () => {
    setShow(false);
    resetForm();
  };

  const toggleProduct = productId => {
    setSelectedProductIds(prev => prev.includes(productId)
      ? prev.filter(id => id !== productId)
      : [...prev, productId]
    );
  };

  const save = async e => {
    e.preventDefault();
    try {
      const payload = { ...form, customer_id: form.customer_id || null };

      const savedLead = editing
        ? await onUpdate(editing.id, payload)
        : await onAdd(payload, selectedProductIds);

      // New leads are synced inside the database transaction that also
      // creates their Pipeline record. Existing leads still use the
      // normal solution-sync path when their solutions are edited.
      if (editing) {
        await onSyncProducts(savedLead.id, selectedProductIds);
      }

      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const solutionNamesForLead = leadId => productIdsForLead(leadId)
    .map(productId => productById(productId)?.name)
    .filter(Boolean);

  return <>
    <PageHeading
      eyebrow="PROSPECTING"
      title="Leads"
      description="Capture, qualify and convert prospects."
      action="New lead"
      onAction={openAdd}
    />
    <div className="panel">
      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={15} />
          <input placeholder="Search leads" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>
      {visible.length === 0 ?
        <div className="empty-state">
          <p>No leads yet.</p>
        </div> : <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Company</th>
                <th>Solutions</th>
                <th>Source</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(x => {
                const solutionNames = solutionNamesForLead(x.id);
                return <tr key={x.id}>
                  <td><strong>{x.name || x.email}</strong><div className="deal-customer">{x.email}</div></td>
                  <td>{x.company || '—'}</td>
                  <td>
                    {solutionNames.length ? (
                      <div className="lead-solution-tags compact">
                        {solutionNames.slice(0, 2).map(name => <span key={name}>{name}</span>)}
                        {solutionNames.length > 2 && <span>+{solutionNames.length - 2}</span>}
                      </div>
                    ) : <span className="deal-customer">Not selected</span>}
                  </td>
                  <td>{x.source || '—'}</td>
                  <td><span className="status">{x.status}</span></td>
                  <td>
                    <div className="toolbar-actions">
                      <button className="secondary-btn" onClick={() => openEdit(x)}>Edit</button>
                      {(isAdmin || x.created_by === currentUserId) && <button className="icon-btn" onClick={() => onDelete(x.id)}><X size={16} /></button>}
                    </div>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>}
    </div>



    {show && <div className="modal-backdrop" onClick={closeModal}>
      <form className="modal lead-modal" onSubmit={save} onClick={e => e.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <h2>{editing ? 'Edit lead' : 'New lead'}</h2>
            <p>Add the prospect and the solutions your salesperson wants to discuss.</p>
          </div>
          <button type="button" className="icon-btn" onClick={closeModal}><X size={18} /></button>
        </div>

        {[['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['company', 'Company']].map(([k, l]) =>
          <label key={k}>{l}<input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required={k === 'name' || k === 'email'} /></label>
        )}
        <JobTitleField value={form.job_title} onChange={value => setForm({ ...form, job_title: value })} />
        <BirthdayField value={form.birthday} onChange={value => setForm({ ...form, birthday: value })} />

        <label>Source<select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>{['Website', 'Referral', 'Social', 'Campaign', 'Cold outreach', 'Other'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Convert/link customer<select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}><option value="">None</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>

        <div className="lead-solutions-field">
          <div className="lead-solutions-heading">
            <div>
              <strong>Solutions of interest</strong>
              <span>Select one or more solutions the salesperson wants to deal with.</span>
            </div>
            <span className="lead-solution-count">{selectedProductIds.length} selected</span>
          </div>

          <div className="lead-solution-family-list">
            {primaryVendors.map(vendor => {
              const vendorProducts = productsForVendor(vendor);
              const selectedCount = vendorProducts.filter(product => selectedProductIds.includes(product.id)).length;
              const expanded = expandedVendor === vendor;

              return <div className="lead-solution-family" key={vendor}>
                <button type="button" className="lead-solution-family-button" onClick={() => setExpandedVendor(expanded ? null : vendor)}>
                  <span><strong>{vendor}</strong><small>{vendorProducts.length} solutions</small></span>
                  <span>{selectedCount ? `${selectedCount} selected` : expanded ? '−' : '+'}</span>
                </button>

                {expanded && <div className="lead-solution-children">
                  {vendorProducts.length ? vendorProducts.map(product =>
                    <label className="lead-solution-option" key={product.id}>
                      <input type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={() => toggleProduct(product.id)} />
                      <span>{product.name}</span>
                    </label>
                  ) : <div className="deal-customer">No active solutions under {vendor}.</div>}
                </div>}
              </div>;
            })}
          </div>

          {selectedProductIds.length > 0 && <div className="lead-solution-tags">
            {selectedProductIds.map(productId => {
              const product = productById(productId);
              if (!product) return null;
              return <button type="button" key={productId} onClick={() => toggleProduct(productId)} title="Remove solution">{product.name} ×</button>;
            })}
          </div>}
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
          <button className="primary-btn">{editing ? 'Save changes' : 'Save lead'}</button>
        </div>
      </form>
    </div>}
  </>;
}
function ComposeEmailModal({ integrations, customers, defaults = {}, userId, onSend, onClose }) {
  const accounts = integrations.filter(x => x.status === 'connected');
  const [provider, setProvider] = useState(accounts[0]?.provider || '');
  const [customerId, setCustomerId] = useState(defaults.customer_id || '');
  const [to, setTo] = useState(defaults.to || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(defaults.subject || '');
  const [body, setBody] = useState(defaults.body || '');
  const [signature, setSignature] = useState('');
  const [useSignature, setUseSignature] = useState(true);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureSaving, setSignatureSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // The connected accounts may finish loading after the window opens.
  useEffect(() => {
    if (!provider && accounts[0]) setProvider(accounts[0].provider);
  }, [integrations]);

  useEffect(() => {
    let cancelled = false;
    supabase.from('user_profiles').select('email_signature').eq('user_id', userId).maybeSingle()
      .then(({ data }) => { if (!cancelled && data?.email_signature) setSignature(data.email_signature); });
    return () => { cancelled = true; };
  }, [userId]);

  const pickCustomer = id => {
    setCustomerId(id);
    const customer = customers.find(c => c.id === id);
    if (customer?.email) setTo(customer.email);
  };

  async function saveSignature() {
    setSignatureSaving(true);
    const { error: saveError } = await supabase.from('user_profiles').upsert({ user_id: userId, email_signature: signature.trim() || null, updated_at: new Date().toISOString() });
    setSignatureSaving(false);
    if (saveError) setError(`Could not save your signature: ${saveError.message}`);
    else { setError(''); setShowSignature(false); }
  }

  const submit = async event => {
    event.preventDefault();
    setError('');
    if (!provider) { setError('Connect a Gmail or Outlook account first.'); return; }
    if (!to.trim()) { setError('Enter at least one recipient.'); return; }
    setSending(true);
    try {
      const finalBody = useSignature && signature.trim() ? `${body.trimEnd()}\n\n-- \n${signature.trim()}` : body;
      await onSend({ provider, to: to.trim(), cc: cc.trim(), bcc: bcc.trim(), subject: subject.trim(), body: finalBody, customer_id: customerId || null });
      onClose();
    } catch (err) {
      setError(err.message || 'The email could not be sent.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="modal modal-wide compose-modal" onSubmit={submit}>
        <div className="modal-heading">
          <div><h2>New email</h2><p>Sent from your connected account and saved to the customer's history.</p></div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={sending} aria-label="Close compose email"><X size={18} /></button>
        </div>
        {accounts.length === 0 ? (
          <>
            <p className="detail-empty">Connect Gmail or Outlook on the Email page before sending email from here.</p>
            <div className="modal-actions"><button type="button" className="primary-btn" onClick={onClose}>Close</button></div>
          </>
        ) : (
          <>
            {error && <div className="form-error" role="alert">{error}</div>}
            <div className="compose-row">
              <label>From
                <select value={provider} onChange={e => setProvider(e.target.value)}>
                  {accounts.map(a => <option key={a.id} value={a.provider}>{a.email_address || a.provider} ({a.provider === 'gmail' ? 'Gmail' : 'Outlook'})</option>)}
                </select>
              </label>
              <label>Customer (optional)
                <select value={customerId} onChange={e => pickCustomer(e.target.value)}>
                  <option value="">Not linked to a customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
                </select>
              </label>
            </div>
            <label>To
              <input type="text" value={to} onChange={e => setTo(e.target.value)} placeholder="name@company.com (separate several with commas)" required />
            </label>
            {showCc ? (
              <div className="compose-row">
                <label>Cc<input type="text" value={cc} onChange={e => setCc(e.target.value)} placeholder="Optional" /></label>
                <label>Bcc<input type="text" value={bcc} onChange={e => setBcc(e.target.value)} placeholder="Optional" /></label>
              </div>
            ) : (
              <button type="button" className="text-btn compose-link" onClick={() => setShowCc(true)}>+ Add Cc / Bcc</button>
            )}
            <label>Subject
              <input value={subject} onChange={e => setSubject(e.target.value)} maxLength={300} required />
            </label>
            <label>Message
              <textarea rows="9" value={body} onChange={e => setBody(e.target.value)} required />
            </label>
            <div className="compose-signature">
              <label className="compose-check"><input type="checkbox" checked={useSignature} onChange={e => setUseSignature(e.target.checked)} />Add my signature</label>
              <button type="button" className="text-btn" onClick={() => setShowSignature(v => !v)}>{showSignature ? 'Hide signature' : signature ? 'Edit signature' : 'Create signature'}</button>
            </div>
            {showSignature && (
              <div className="compose-signature-editor">
                <textarea rows="4" value={signature} onChange={e => setSignature(e.target.value)} placeholder={'Your name\nYour title · Company\nPhone'} maxLength={1000} />
                <button type="button" className="secondary-btn" onClick={saveSignature} disabled={signatureSaving}>{signatureSaving ? 'Saving…' : 'Save signature'}</button>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={onClose} disabled={sending}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={sending}>{sending ? 'Sending…' : 'Send email'}</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
function EmailPage({ emailLogs, customers, integrations, loading, error, onConnect, onDisconnect, onAdd, onCompose }) {
  const [showLog, setShowLog] = useState(false);
  useEffect(() => { const handler = () => setShowLog(true); window.addEventListener('orbit-open-email-log', handler); return () => window.removeEventListener('orbit-open-email-log', handler); }, []);
  return <>
    <PageHeading eyebrow="COMMUNICATIONS" title="Email" description="Connect Gmail or Outlook, send email from inside the CRM, and keep customer communication in one place." action="Compose email" onAction={onCompose} />
    <div className="stats-grid">
      <StatCard label="Connected accounts" value={integrations.filter(x => x.status === 'connected').length} hint="Gmail and Outlook" tone="blue" icon="@" />
      <StatCard label="Email logs" value={emailLogs.length} hint="CRM communication history" tone="green" icon="✉" />
    </div>
    <div className="report-grid">
      {['gmail', 'outlook'].map(provider => { const account = integrations.find(x => x.provider === provider && x.status === 'connected'); const label = provider === 'gmail' ? 'Gmail' : 'Outlook'; return <div className="panel" key={provider}><div className="panel-heading"><div><h3>{label}</h3><p>{account?.email_address || 'Connect your account'}</p></div></div>{account ? <div className="toolbar-actions"><span className="status completed">Connected</span><button className="secondary-btn" onClick={() => onDisconnect(account.id)}>Disconnect</button></div> : <button className="primary-btn" onClick={() => onConnect(provider)} disabled={loading}>Connect {label}</button>}</div>; })}
    </div>
    {error && <div className="form-error">{error}</div>}
    <div className="panel"><div className="panel-heading"><div><h3>CRM Email Log</h3><p>Manual and synchronized communication history.</p></div><button className="secondary-btn" onClick={() => setShowLog(true)}>Log email</button></div><EmailLogs emailLogs={emailLogs} customers={customers} onAdd={async payload => { await onAdd(payload); setShowLog(false); }} openExternally={showLog} onCloseExternal={() => setShowLog(false)} /></div>
  </>;
}
function EmailLogs({ emailLogs, customers, onAdd, openExternally = false, onCloseExternal }) {
  const [show, setShow] = useState(openExternally);
  useEffect(() => { if (openExternally) setShow(true) }, [openExternally]);
  const [form, setForm] = useState({ to_email: '', subject: '', body: '', direction: 'Outgoing', status: 'Logged', customer_id: '' });
  const save = async e => {
    e.preventDefault(); try {
      await onAdd(form); setShow(false);
      setForm({ to_email: '', subject: '', body: '', direction: 'Outgoing', status: 'Logged', customer_id: '' })
    }
    catch (err) { alert(err.message) }
  };
  return <>
    <div className="panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Contact</th>
              <th>Direction</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {emailLogs.length === 0 ?
              <tr>
                <td colSpan="5">No email logs yet.</td>
              </tr> : emailLogs.map(
                e => <tr key={e.id}><td><strong>{e.subject}</strong>
                  <div className="deal-customer">{e.body?.slice(0, 80)}</div>
                </td>
                  <td>{e.customers?.name || e.to_email}</td>
                  <td>{e.direction}</td>
                  <td>{e.status}</td>
                  <td>{formatDate(e.sent_at || e.created_at)}</td>
                </tr>)
            }
          </tbody>
        </table>
      </div>
    </div>
    {show && <div className="modal-backdrop" onClick={() => setShow(false)}>
      <form className="modal" onSubmit={save} onClick={e => e.stopPropagation()}>
        <div className="modal-heading">
          <h2>Log email</h2>
          <button type="button" className="icon-btn" onClick={() => setShow(false)}><X size={18} /></button>
        </div>
        <label>To email<input type="email" required value={form.to_email} onChange={e => setForm({ ...form, to_email: e.target.value })} /></label>
        <label>Customer<select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
          <option value="">None</option>
          {customers.map(c =>
            <option key={c.id} value={c.id}>{c.name}</option>
          )}
        </select>
        </label>
        <label>Subject<input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
        </label><label>Body<textarea rows="6" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
        </label><label>Direction<select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}>
          <option>Outgoing</option>
          <option>Incoming</option>
        </select>
        </label>
        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={() => setShow(false)}>Cancel</button>
          <button className="primary-btn">Save email</button>
        </div>
      </form>
    </div>
    }
  </>
}
function CalendarPage({ events = [], customers = [], onAdd, onUpdate, onDelete, onRefresh }) {
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const blank = {
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    event_type: 'Meeting',
    customer_id: '',
    location: '',
    status: 'Scheduled',
    reminder_minutes: ''
  };
  const [form, setForm] = useState(blank);

  const localDateTime = value => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const toIso = value => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  const calendarEvents = useMemo(() => events.map(event => {
    const type = String(event.event_type || 'Other').toLowerCase();
    const colorMap = {
      meeting: '#10b981',
      demo: '#10b981',
      'follow-up': '#6366f1',
      call: '#0ea5e9',
      reminder: '#f59e0b',
      task: '#8b5cf6',
      other: '#64748b'
    };
    const color = colorMap[type] || '#64748b';
    return {
      id: event.id,
      title: event.title || 'Untitled event',
      start: event.start_at,
      // Calendar events are single-day by default. If an old/accidental record
      // contains an end date on another day, do not let it become a long
      // multi-day bar in Month view. Same-day end times are still respected.
      end: (() => {
        if (!event.end_at) return undefined;
        const startDate = new Date(event.start_at);
        const endDate = new Date(event.end_at);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return undefined;
        return startDate.toDateString() === endDate.toDateString() ? event.end_at : undefined;
      })(),
      allDay: false,
      color,
      textColor: '#ffffff',
      extendedProps: { original: event }
    };
  }), [events]);

  const hasEventOnDate = date => {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return events.some(event => {
      if (!event?.start_at) return false;
      const start = new Date(event.start_at);
      if (Number.isNaN(start.getTime())) return false;
      start.setHours(0, 0, 0, 0);
      return start.getTime() === target.getTime();
    });
  };

  const openNew = startValue => {
    setEditing(null);
    setForm({ ...blank, start_at: startValue || '' });
    setShow(true);
  };

  const openEdit = event => {
    const original = event.extendedProps?.original || event;
    setEditing(original);
    setForm({
      ...blank,
      ...original,
      customer_id: original.customer_id || '',
      event_type: original.event_type || 'Meeting',
      status: original.status || 'Scheduled',
      reminder_minutes: original.reminder_minutes == null ? '' : String(original.reminder_minutes),
      start_at: localDateTime(original.start_at || event.start),
      end_at: (() => {
        const start = new Date(original.start_at || event.start);
        const end = new Date(original.end_at || event.end);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
        return start.toDateString() === end.toDateString() ? localDateTime(original.end_at || event.end) : '';
      })()
    });
    setShow(true);
  };

  const close = () => {
    if (saving) return;
    setShow(false);
    setEditing(null);
    setForm(blank);
  };

  const save = async e => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_at) return;

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || '',
        start_at: toIso(form.start_at),
        end_at: form.end_at ? toIso(form.end_at) : null,
        event_type: form.event_type || 'Meeting',
        customer_id: form.customer_id || null,
        location: form.location?.trim() || '',
        status: form.status || 'Scheduled',
        reminder_minutes: form.reminder_minutes === '' ? null : Number(form.reminder_minutes)
      };

      if (editing) await onUpdate(editing.id, payload);
      else await onAdd(payload);
      close();
    } catch (err) {
      alert(err.message || 'Unable to save event.');
    } finally {
      setSaving(false);
    }
  };

  const updateCalendarPosition = async info => {
    const original = info.event.extendedProps?.original;
    if (!original) return;

    try {
      await onUpdate(original.id, {
        title: original.title,
        description: original.description || '',
        start_at: info.event.start?.toISOString() || original.start_at,
        end_at: (() => {
          const start = info.event.start;
          const end = info.event.end;
          if (!start || !end) return null;
          return start.toDateString() === end.toDateString() ? end.toISOString() : null;
        })(),
        event_type: original.event_type || 'Meeting',
        customer_id: original.customer_id || null,
        location: original.location || '',
        status: original.status || 'Scheduled',
        reminder_minutes: original.reminder_minutes == null ? null : Number(original.reminder_minutes)
      });
    } catch (err) {
      info.revert();
      alert(err.message || 'Unable to update the event.');
    }
  };

  const dateClickValue = (date, allDay = false) => {
    const pad = n => String(n).padStart(2, '0');
    const nextDate = new Date(date);
    if (allDay) nextDate.setHours(9, 0, 0, 0);
    return `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(nextDate.getDate())}T${pad(nextDate.getHours())}:${pad(nextDate.getMinutes())}`;
  };

  const openFromSelection = selection => {
    const start = new Date(selection.start);
    const end = selection.end ? new Date(selection.end) : null;
    if (selection.allDay) {
      start.setHours(9, 0, 0, 0);
      if (end) {
        end.setDate(end.getDate() - 1);
        end.setHours(10, 0, 0, 0);
      }
    }
    openNew(dateClickValue(start), end ? dateClickValue(end) : '');
  };

  const reminderOptions = [
    { value: '', label: 'No reminder' },
    { value: '0', label: 'At event time' },
    { value: '5', label: '5 minutes before' },
    { value: '15', label: '15 minutes before' },
    { value: '30', label: '30 minutes before' },
    { value: '60', label: '1 hour before' },
    { value: '1440', label: '1 day before' },
    { value: '4320', label: '3 days before' }
  ];

  const eventContent = info => {
    const original = info.event.extendedProps?.original || {};
    return (
      <div className="orbit-event-inner">
        <span className="orbit-event-dot" />
        <span className="orbit-event-copy">
          {info.timeText && <span className="orbit-event-time">{info.timeText}</span>}
          <span className="orbit-event-title">{info.event.title}</span>
        </span>
      </div>
    );
  };

  return <>


    <PageHeading
      eyebrow="PRODUCTIVITY"
      title="Calendar"
      description="Manage meetings, calls, follow-ups and reminders."
      action="New event"
      onAction={() => openNew()}
    />

    <div className="orbit-calendar-panel panel">
      <div className="orbit-calendar-shell">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          buttons={{
            prev: { text: '‹' },
            next: { text: '›' },
            today: { text: 'Today' },
            dayGridMonth: { text: 'Month' },
            timeGridWeek: { text: 'Week' },
            timeGridDay: { text: 'Day' },
            listWeek: { text: 'List' }
          }}
          headerToolbarClass="orbit-fc-header"
          toolbarSectionClass="orbit-fc-toolbar-section"
          toolbarTitleClass="orbit-fc-title"
          buttonGroupClass="orbit-fc-button-group"
          buttonClass={info => `orbit-fc-button${info.isSelected ? ' orbit-fc-button-active' : ''}`}
          className="orbit-fullcalendar"
          viewClass="orbit-fc-view"
          dayHeaderClass="orbit-fc-day-header"
          dayHeaderInnerClass="orbit-fc-day-header-inner"
          dayHeaderRowClass="orbit-fc-day-header-row"
          dayHeaderDividerClass="orbit-fc-day-header-divider"
          dayCellClass={info => `orbit-fc-day-cell${hasEventOnDate(info.date) ? ' orbit-fc-day-cell-has-event' : ''}${info.isToday ? ' orbit-fc-day-cell-today' : ''}${info.isOther ? ' orbit-fc-day-cell-other' : ''}`}
          dayCellTopClass="orbit-fc-day-top"
          dayCellTopInnerClass="orbit-fc-day-number"
          dayCellInnerClass="orbit-fc-day-events"
          dayCellBottomClass="orbit-fc-day-bottom"
          dayRowClass="orbit-fc-day-row"
          eventClass={info => {
            const type = String(info.event.extendedProps?.original?.event_type || 'Other')
              .toLowerCase()
              .replace(/\s+/g, '-');
            return `orbit-fc-event orbit-calendar-event-${type}`;
          }}
          eventInnerClass="orbit-fc-event-inner"
          eventTimeClass="orbit-fc-event-time"
          eventTitleClass="orbit-fc-event-title"
          dayLaneClass="orbit-fc-day-lane"
          slotHeaderClass="orbit-fc-slot-header"
          slotHeaderInnerClass="orbit-fc-slot-header-inner"
          slotLaneClass="orbit-fc-slot-lane"
          listDayHeaderClass="orbit-fc-list-day-header"
          listDayHeaderInnerClass="orbit-fc-list-day-header-inner"
          views={{
            dayGrid: { className: 'orbit-fc-daygrid-view', eventClass: 'orbit-fc-event' },
            timeGrid: { className: 'orbit-fc-timegrid-view', rowEventClass: 'orbit-fc-event' },
            list: { className: 'orbit-fc-list-view', listItemEventClass: 'orbit-fc-list-event' }
          }}
          height="auto"
          dayMaxEvents={3}
          dayMaxEventRows={3}
          fixedWeekCount={false}
          nowIndicator
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          scrollTime="08:00:00"
          eventContent={eventContent}
          editable
          selectable
          selectMirror
          unselectAuto
          events={calendarEvents}
          dateClick={info => openNew(dateClickValue(info.date, info.allDay))}
          select={openFromSelection}
          eventClick={info => openEdit(info.event)}
          eventDrop={updateCalendarPosition}
          eventResize={updateCalendarPosition}
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          eventDisplay="block"
        />
        <div className="orbit-calendar-legend">
          <span className="orbit-calendar-legend-item"><span className="orbit-calendar-legend-dot" style={{ background: '#10b981' }} />Meeting / Demo</span>
          <span className="orbit-calendar-legend-item"><span className="orbit-calendar-legend-dot" style={{ background: '#6366f1' }} />Follow-up</span>
          <span className="orbit-calendar-legend-item"><span className="orbit-calendar-legend-dot" style={{ background: '#0ea5e9' }} />Call</span>
          <span className="orbit-calendar-legend-item"><span className="orbit-calendar-legend-dot" style={{ background: '#f59e0b' }} />Reminder</span>
          <span className="orbit-calendar-legend-item"><span className="orbit-calendar-legend-dot" style={{ background: '#8b5cf6' }} />Task</span>
        </div>
      </div>
    </div>

    {show && <div className="modal-backdrop" onClick={close}>
      <form className="modal calendar-event-modal" onSubmit={save} onClick={e => e.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <div className="eyebrow">CALENDAR</div>
            <h2>{editing ? 'Edit event' : 'New event'}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={close}><X size={18} /></button>
        </div>

        <label>Title
          <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Follow up with Kenya" />
        </label>

        <label>Customer
          <select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
            <option value="">No customer / general event</option>
            {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}{customer.company ? ` — ${customer.company}` : ''}</option>)}
          </select>
        </label>

        <div className="calendar-form-grid">
          <label>Start
            <input type="datetime-local" required value={form.start_at || ''} onChange={e => setForm({ ...form, start_at: e.target.value })} />
          </label>
          <label>End
            <input type="datetime-local" value={form.end_at || ''} onChange={e => setForm({ ...form, end_at: e.target.value })} />
          </label>
        </div>

        <div className="calendar-form-grid">
          <label>Type
            <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
              {['Meeting', 'Follow-up', 'Call', 'Reminder', 'Task', 'Demo', 'Other'].map(type => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label>Status
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {['Scheduled', 'Completed', 'Cancelled'].map(status => <option key={status}>{status}</option>)}
            </select>
          </label>
        </div>

        <label>Reminder
          <select value={form.reminder_minutes == null ? '' : String(form.reminder_minutes)} onChange={e => setForm({ ...form, reminder_minutes: e.target.value })}>
            {reminderOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <span className="calendar-form-help">The reminder will appear in your Storhet notification bell.</span>
        </label>

        <label>Location
          <input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Office, Zoom, customer site, etc." />
        </label>

        <label>Description
          <textarea rows="5" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add notes, follow-up details or instructions..." />
        </label>

        <div className="modal-actions">
          {editing && <button type="button" className="secondary-btn calendar-delete-btn" onClick={async () => {
            if (!window.confirm('Delete this event?')) return;
            try { await onDelete(editing.id); close(); }
            catch (err) { alert(err.message || 'Unable to delete event.'); }
          }} disabled={saving}>Delete</button>}
          <div className="calendar-modal-actions-right">
            <button type="button" className="secondary-btn" onClick={close} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Save event'}</button>
          </div>
        </div>
      </form>
    </div>}
  </>;
}

function Quotes({ quotes = [], products = [], quoteItems = [], deals = [], dealProducts = [], customers = [], onLoadQuoteItems, onAdd, onUpdate, onDelete, formatAmount, currentUserId, isAdmin, role, onSendToHOS, initialDealId = '', dealFilterId = '', onLaunchConsumed, onCreateInvoice }) {
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState('');
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [preview, setPreview] = useState(null);

  const vendors = ['F5', 'Kong', 'IRONSCALES', 'SolarWinds', 'Utimaco'];
  const blank = {
    quote_number: `Q-${Date.now().toString().slice(-6)}`,
    title: '',
    quote_date: new Date().toISOString().slice(0, 10),
    valid_until: '',
    status: 'Draft',
    customer_name: '',
    company: '',
    email: '',
    phone: '',
    billing_address: '',
    payment_terms: '',
    delivery_terms: '',
    notes: '',
    terms: '',
    resubmission_note: '',
    deal_id: '',
    customer_id: '',
    sales_rep_id: '', currency_code: 'USD', exchange_rate: 1, vat_rate: 7.5, manual_tax: 0
  };

  const emptyItem = () => ({
    product_id: '',
    product_name: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
    tax: 0
  });

  const [form, setForm] = useState(blank);
  const [items, setItems] = useState([emptyItem()]);
  const visibleQuotes = quotes.filter(q =>
    (role !== 'sales' || q.created_by === currentUserId) &&
    (!dealFilterId || q.deal_id === dealFilterId)
  );

  const moneyNumber = value => Number(value) || 0;
  const lineSubtotal = item => moneyNumber(item.quantity) * moneyNumber(item.unit_price);
  const lineDiscountAmount = item => lineSubtotal(item) * Math.min(100, Math.max(0, moneyNumber(item.discount_percent ?? item.discount))) / 100;
  const lineTotal = item => Math.max(0, lineSubtotal(item) - lineDiscountAmount(item));
  const subtotal = items.reduce((sum, item) => sum + lineSubtotal(item), 0);
  const discount = items.reduce((sum, item) => sum + lineDiscountAmount(item), 0);
  const taxable = Math.max(0, subtotal - discount);
  const vat = taxable * Math.max(0, moneyNumber(form.vat_rate ?? 7.5)) / 100;
  const manualTax = Math.max(0, moneyNumber(form.manual_tax));
  const tax = vat + manualTax;
  const total = Math.max(0, taxable + vat + manualTax);

  const productsByVendor = vendors.reduce((groups, vendor) => {
    groups[vendor] = products.filter(product => (product.vendor || '').trim().toLowerCase() === vendor.toLowerCase());
    return groups;
  }, {});

  const selectableWonDeals = deals.filter(deal => deal.stage === 'Won' && (role !== 'sales' || deal.created_by === currentUserId));
  const selectedDeal = deals.find(deal => deal.id === form.deal_id) || null;
  const selectDeal = dealId => {
    const deal = deals.find(item => item.id === dealId);
    const customer = deal?.customer_id ? customers.find(item => item.id === deal.customer_id) : null;
    const inheritedProductIds = deal ? dealProducts.filter(row => row.deal_id === deal.id).map(row => row.product_id) : [];
    const inheritedProducts = inheritedProductIds.map(id => products.find(product => product.id === id)).filter(Boolean);
    setForm(prev => ({
      ...prev,
      deal_id: deal?.id || '',
      customer_id: customer?.id || deal?.customer_id || '',
      sales_rep_id: deal?.created_by || currentUserId,
      customer_name: customer?.name || prev.customer_name || '',
      company: customer?.company || deal?.company || prev.company || '',
      email: customer?.email || deal?.contact_email || prev.email || '',
      phone: customer?.phone || deal?.contact_phone || prev.phone || '',
      title: prev.title || `${deal?.title || 'Won deal'} Quote`
    }));
    if (inheritedProducts.length) {
      setItems(inheritedProducts.map(product => ({
        product_id: product.id,
        product_name: product.name,
        description: product.description || '',
        quantity: 1,
        unit_price: 0,
        discount: 0,
        discount_percent: 0,
        tax: 0
      })));
    }
  };

  const openNew = (dealId = '') => {
    setEditing(null);
    setError('');
    setExpandedVendor(null);
    setForm({ ...blank, quote_number: `Q-${Date.now().toString().slice(-6)}` });
    setItems([emptyItem()]);
    setShow(true);
    if (dealId) window.setTimeout(() => selectDeal(dealId), 0);
  };

  useEffect(() => {
    if (initialDealId) {
      openNew(initialDealId);
      onLaunchConsumed?.();
    }
  }, [initialDealId]);

  const openEdit = async quote => {
    setEditing(quote);
    setLoadingItems(true);
    setError('');
    setExpandedVendor(null);
    setForm({ ...blank, ...quote, currency_code: quote.currency_code || 'USD', exchange_rate: quote.exchange_rate || 1, vat_rate: quote.vat_rate ?? 7.5, manual_tax: quote.manual_tax ?? 0 });
    setItems([emptyItem()]);
    setShow(true);

    try {
      // Always load the saved line items for this quote when editing.
      // This prevents the edit form from losing its products when the
      // global quote-items fetch has not completed yet.
      const loadedItems = onLoadQuoteItems
        ? await onLoadQuoteItems(quote)
        : quoteItems.filter(item => item.quote_id === quote.id);

      const existing = (loadedItems || []).map(item => ({
        product_id: item.product_id || '',
        product_name: item.product_name || '',
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        discount: Number(item.discount) || 0,
        tax: Number(item.tax) || 0
      }));

      setItems(existing.length ? existing : [emptyItem()]);
    } catch (err) {
      console.error('Unable to load quote items:', err);
      setError(err?.message || 'Unable to load the saved quote items.');
    } finally {
      setLoadingItems(false);
    }
  };

  const selectProduct = (index, product) => {
    setItems(prev => prev.map((item, i) => i === index ? {
      ...item,
      product_id: product.id,
      product_name: product.name,
      description: item.description || product.description || ''
    } : item));
  };

  const updateItem = (index, patch) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
  };

  const removeItem = index => {
    setItems(prev => prev.length === 1 ? [emptyItem()] : prev.filter((_, i) => i !== index));
  };

  const save = async event => {
    event.preventDefault();
    setError('');

    const validItems = items.filter(item => item.product_id && item.product_name);
    if (!form.quote_number.trim()) return setError('Quote number is required.');
    if (!form.title.trim()) return setError('Quote title is required.');
    if (!form.quote_date) return setError('Quote date is required.');
    if (form.deal_id && (!selectedDeal || selectedDeal.stage !== 'Won')) return setError('If a Deal is selected, it must be a Won Deal.');
    if (!form.customer_name.trim() && !form.company.trim()) return setError('Enter a customer name or company.');
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Enter a valid customer email address.');
    if (!validItems.length) return setError('Add at least one product or solution to the quote.');
    if (form.status === 'Accepted' && editing?.approval_status !== 'APPROVED') return setError('A quote must be approved before it can be marked Accepted.');
    if (validItems.some(item => moneyNumber(item.quantity) <= 0)) return setError('Each line item must have a quantity greater than 0.');

    const payload = {
      quote_number: form.quote_number.trim(),
      title: form.title.trim(),
      quote_date: form.quote_date || new Date().toISOString().slice(0, 10),
      valid_until: form.valid_until || null,
      status: form.status,
      customer_name: form.customer_name.trim() || null,
      company: form.company.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      billing_address: form.billing_address.trim() || null,
      subtotal,
      discount,
      tax,
      vat_amount: vat,
      vat_rate: moneyNumber(form.vat_rate ?? 7.5),
      manual_tax: manualTax,
      total,
      payment_terms: form.payment_terms.trim() || null,
      delivery_terms: form.delivery_terms.trim() || null,
      notes: form.notes.trim() || null,
      terms: form.terms.trim() || null,
      resubmission_note: form.resubmission_note?.trim() || null,
      deal_id: form.deal_id || null,
      customer_id: form.customer_id || selectedDeal?.customer_id || null,
      sales_rep_id: form.sales_rep_id || selectedDeal?.created_by || currentUserId,
      currency_code: form.currency_code === 'OTHER' ? (form.custom_currency_code || 'OTHER') : (form.currency_code || 'USD'),
      exchange_rate: moneyNumber(form.exchange_rate) || 1,
      ...(editing && editing.approval_status === 'REJECTED' ? { approval_status: approvalRequirement(total * docRateToUsd({ currency_code: form.currency_code === 'OTHER' ? (form.custom_currency_code || 'OTHER') : (form.currency_code || 'USD'), exchange_rate: Number(form.exchange_rate) || 1 })).band === 'SALES' ? 'SALES_PENDING' : 'HOS_PENDING', approval_stage: approvalRequirement(total * docRateToUsd({ currency_code: form.currency_code === 'OTHER' ? (form.custom_currency_code || 'OTHER') : (form.currency_code || 'USD'), exchange_rate: Number(form.exchange_rate) || 1 })).band === 'HOS_MD' ? 'HOS' : approvalRequirement(total * docRateToUsd({ currency_code: form.currency_code === 'OTHER' ? (form.custom_currency_code || 'OTHER') : (form.currency_code || 'USD'), exchange_rate: Number(form.exchange_rate) || 1 })).band } : {})
    };

    const itemPayload = validItems.map(item => ({
      product_id: item.product_id || null,
      product_name: item.product_name,
      description: item.description?.trim() || null,
      quantity: moneyNumber(item.quantity),
      unit_price: moneyNumber(item.unit_price),
      discount: lineDiscountAmount(item),
      discount_percent: Math.min(100, Math.max(0, moneyNumber(item.discount_percent ?? item.discount))),
      tax: 0,
      total: lineTotal(item)
    }));

    setSaving(true);
    try {
      if (editing) await onUpdate(editing.id, payload, itemPayload);
      else await onAdd(payload, itemPayload);
      setShow(false);
      setEditing(null);
    } catch (err) {
      setError(err.message || 'Unable to save quote.');
    } finally {
      setSaving(false);
    }
  };

  return <>
    <PageHeading
      eyebrow="SALES OPERATIONS"
      title="Quotes"
      description="Create and track customer quotations."
      action="New quote"
      onAction={openNew}
    />

    <div className="panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Quote</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Valid until</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleQuotes.length === 0 ? <tr><td colSpan="6">No quotes yet.</td></tr> : visibleQuotes.map(q => (
              <tr key={q.id}>
                <td><strong>{q.quote_number}</strong><div className="deal-customer">{q.title}</div></td>
                <td>{q.customer_name || q.company || '—'}{q.company && q.customer_name ? <div className="deal-customer">{q.company}</div> : null}</td>
                <td>{deals.find(d => d.id === q.deal_id)?.title || '—'}</td>
                <td>{formatAmount(docAmountUsd(q, 'total'))}</td>
                <td><div>{q.status || '—'}</div><small className="approval-range-hint">{approvalRequirement(q.total).label} approval</small></td>
                <td>{q.valid_until ? formatDate(q.valid_until) : '—'}</td>
                <td><div className="quote-actions">
                  <button type="button" className="secondary-btn" onClick={async () => { try { const loaded = onLoadQuoteItems ? await onLoadQuoteItems(q) : quoteItems.filter(item => item.quote_id === q.id); setPreview({ ...q, __items: loaded || [] }); } catch (err) { alert(err.message || 'Unable to load quote items.'); } }}>View</button>
                  {(isCommercialEditor(role) || q.created_by === currentUserId) && <button className="secondary-btn" onClick={() => openEdit(q)}>Edit</button>}
                  {q.created_by === currentUserId && ['HOS_PENDING', 'APPROVED', 'MD_PENDING'].indexOf(q.approval_status) === -1 && <button type="button" className="primary-btn approval-btn" onClick={async () => { try { await onSendToHOS(q.id); } catch (err) { alert(err.message); } }}>{q.approval_status === 'REJECTED' ? 'Resubmit to HOS' : 'Send to HOS'}</button>}
                  {q.approval_status === 'APPROVED' && <button type="button" className="secondary-btn" onClick={() => onCreateInvoice(q)}>Create Invoice</button>}
                  {isCommercialDeleter(role) && <button type="button" className="quote-delete-btn icon-btn" title="Delete quote" aria-label="Delete quote" onClick={async () => { if (!window.confirm('Delete this quote?')) return; try { await onDelete(q.id); } catch (err) { alert(err.message || 'Unable to delete quote.'); } }}><X size={16} /></button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {preview && <div className="commercial-preview-backdrop" onClick={() => setPreview(null)}><div className="commercial-preview-shell" onClick={e => e.stopPropagation()}><div className="commercial-preview-toolbar"><div><strong>Quote preview</strong><span>Commercial document</span></div><div className="toolbar-actions"><button type="button" className="secondary-btn" onClick={() => window.print()}>Print / Save PDF</button><button type="button" className="icon-btn" onClick={() => setPreview(null)}><X size={18} /></button></div></div><div className="commercial-print-sheet"><header className="commercial-document-header"><div><img src="/storhet-logo.png" alt="Storhet Solutions" className="invoice-company-logo" /><h2>STORHET SOLUTIONS</h2><p>Technology Solutions & Services</p></div><div className="commercial-document-title-block"><div className="commercial-document-title">QUOTATION</div><span>{preview.status || 'Draft'}</span></div></header><div className="commercial-rule" /><section className="commercial-meta-grid"><div><span className="invoice-label">BILL TO</span><strong>{preview.customer_name || preview.company || 'Customer'}</strong><span>{preview.company || ''}</span><span>{preview.email || ''}</span><span>{preview.billing_address || ''}</span></div><div className="commercial-details-box"><div><span>Quote #</span><strong>{preview.quote_number}</strong></div><div><span>Quote Date</span><strong>{formatDate(preview.quote_date)}</strong></div><div><span>Valid Until</span><strong>{preview.valid_until ? formatDate(preview.valid_until) : '—'}</strong></div><div><span>Currency</span><strong>{preview.currency_code || 'USD'}{preview.currency_code && preview.currency_code !== 'USD' ? ` · 1 ${preview.currency_code} = ${preview.exchange_rate || 1} USD` : ''}</strong></div></div></section><table className="commercial-document-table"><thead><tr><th>#</th><th>ITEM &amp; DESCRIPTION</th><th>QTY</th><th>PRICE</th><th>DISCOUNT</th><th>AMOUNT</th></tr></thead><tbody>{(preview.__items || []).map((item, idx) => <tr key={item.id || idx}><td>{idx + 1}</td><td><strong>{item.product_name || 'Solution'}</strong><span>{item.description || ''}</span></td><td>{item.quantity || 1}</td><td>{formatCommercialAmount(item.unit_price, preview.currency_code)}</td><td>{Number(item.discount_percent || 0).toFixed(2)}%</td><td>{formatCommercialAmount(Number(item.total || 0), preview.currency_code)}</td></tr>)}</tbody></table><section className="commercial-bottom-grid"><div><span className="invoice-label">NOTES</span><p>{preview.notes || 'Thank you for your business.'}</p><span className="invoice-label">TERMS</span><p>{preview.terms || '—'}</p></div><div className="commercial-totals-block"><div><span>Subtotal</span><strong>{formatCommercialAmount(preview.subtotal, preview.currency_code)}</strong></div><div><span>Discount</span><strong>- {formatCommercialAmount(preview.discount, preview.currency_code)}</strong></div><div><span>VAT ({preview.vat_rate ?? 7.5}%)</span><strong>{formatCommercialAmount(preview.vat_amount || 0, preview.currency_code)}</strong></div><div><span>Manual tax</span><strong>{formatCommercialAmount(preview.manual_tax || 0, preview.currency_code)}</strong></div><div className="commercial-grand-total"><span>TOTAL</span><strong>{formatCommercialAmount(preview.total, preview.currency_code)}</strong></div></div></section><footer className="commercial-document-footer"><div><strong>Payment terms</strong><p>{preview.payment_terms || 'Due on receipt.'}</p><strong>Delivery terms</strong><p>{preview.delivery_terms || '—'}</p></div><div>Thank you for doing business with<br /><strong>STORHET SOLUTIONS</strong>.</div></footer></div></div></div>}

    {show && <div className="modal-backdrop" onClick={() => !saving && setShow(false)}>
      <form className="modal modal-wide" noValidate onSubmit={save} onClick={e => e.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <h2>{editing ? 'Edit quote' : 'New quote'}</h2>
            <p>Enter the quote manually and build the quoted items from your Products catalogue.</p>
          </div>
          <button type="button" className="icon-btn" onClick={() => !saving && setShow(false)}><X size={18} /></button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-grid-2">
          <label>Quote number<input required value={form.quote_number} readOnly={!!editing} onChange={e => !editing && setForm({ ...form, quote_number: e.target.value })} /></label>
          <label>Quote title<input required placeholder="e.g. F5 Application Security Quote" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
          <label>Quote date<input type="date" required value={form.quote_date || ''} onChange={e => setForm({ ...form, quote_date: e.target.value })} /></label>
          <label>Valid until<input type="date" value={form.valid_until || ''} onChange={e => setForm({ ...form, valid_until: e.target.value })} /></label>
          <label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'].map(x => <option key={x}>{x}</option>)}</select></label>
          {editing?.approval_status === 'REJECTED' && <label className="full-width-form-field">Resubmission note<textarea rows="3" required placeholder="Explain what changed before resubmitting..." value={form.resubmission_note || ''} onChange={e => setForm({ ...form, resubmission_note: e.target.value })} /></label>}
          <label>Customer name<input placeholder="Contact / customer name" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} /></label>
          <label>Company<input placeholder="Company name" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></label>
          <label>Email<input type="email" placeholder="customer@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Phone<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Deal (optional)<select value={form.deal_id || ''} onChange={e => selectDeal(e.target.value)}><option value="">Manual quote — no Deal</option>{selectableWonDeals.map(d => <option key={d.id} value={d.id}>{d.title}{d.company ? ` · ${d.company}` : ''}</option>)}</select></label>
          <label>Currency<select value={form.currency_code || 'USD'} onChange={e => setForm({ ...form, currency_code: e.target.value, exchange_rate: suggestedUsdRate(e.target.value) })}>{COMMERCIAL_CURRENCIES.map(([code, label]) => <option key={code} value={code}>{code} — {label}</option>)}</select></label>
          {form.currency_code === 'OTHER' && <label>Currency code<input maxLength={6} placeholder="e.g. AED" value={form.custom_currency_code || ''} onChange={e => setForm({ ...form, custom_currency_code: e.target.value.toUpperCase() })} /></label>}
          <label>Exchange rate<span className="field-help">USD value of 1 unit of the selected currency (USD = 1)</span><input type="number" min="0" step="0.000001" value={form.exchange_rate} onChange={e => setForm({ ...form, exchange_rate: e.target.value })} /></label>
        </div>

        <label>Billing address<textarea rows="2" value={form.billing_address} onChange={e => setForm({ ...form, billing_address: e.target.value })} /></label>

        <div className="quote-items-section">
          <div className="section-heading-row">
            <div><h3>Quoted items</h3><p>Select products from the existing catalogue and set the commercial pricing.</p></div>
            <button type="button" className="secondary-btn" onClick={() => setItems(prev => [...prev, emptyItem()])}><Plus size={15} /> Add item</button>
          </div>

          {items.map((item, index) => <div className="quote-line-item" key={index}>
            <div className="quote-line-header"><strong>Item {index + 1}</strong>{items.length > 1 && <button type="button" className="icon-btn" onClick={() => removeItem(index)} aria-label="Remove item"><X size={15} /></button>}</div>

            <div className="solution-family-grid quote-product-families">
              {vendors.map(vendor => <button
                key={vendor}
                type="button"
                className={`solution-family-card ${expandedVendor === `${index}-${vendor}` ? 'selected' : ''}`}
                onClick={() => setExpandedVendor(expandedVendor === `${index}-${vendor}` ? null : `${index}-${vendor}`)}
              >
                <strong>{vendor}</strong><span>{productsByVendor[vendor].length} solutions</span>
              </button>)}
            </div>

            {expandedVendor?.startsWith(`${index}-`) && <div className="quote-product-picker">
              {productsByVendor[expandedVendor.slice(index.toString().length + 1)]?.map(product => <button
                type="button"
                key={product.id}
                className={`quote-product-option ${item.product_id === product.id ? 'selected' : ''}`}
                onClick={() => selectProduct(index, product)}
              >
                <span>{product.name}</span><small>{product.description || product.category || ''}</small>
              </button>)}
            </div>}

            <div className="form-grid-2">
              <label>Selected product<input value={item.product_name} readOnly placeholder="Choose a product above" /></label>
              <label>Description<input value={item.description} onChange={e => updateItem(index, { description: e.target.value })} /></label>
              <label>Quantity<input type="number" min="1" step="1" value={item.quantity} onChange={e => updateItem(index, { quantity: e.target.value })} /></label>
              <label>Price for this quote<input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(index, { unit_price: e.target.value })} /></label>
              <label>Discount (%)<input type="number" min="0" max="100" step="0.01" value={item.discount_percent ?? 0} onChange={e => updateItem(index, { discount_percent: e.target.value })} /></label>
              <div className="line-field-note">VAT and manual tax are applied below the item list.</div>
            </div>
            <div className="quote-line-total"><span>Line total</span><strong>{formatCommercialAmount(lineTotal(item), form.currency_code)}</strong></div>
          </div>)}
        </div>

        <div className="quote-total-card">
          <div><span>Subtotal</span><strong>{formatCommercialAmount(subtotal, form.currency_code)}</strong></div>
          <div><span>Discount</span><strong>- {formatCommercialAmount(discount, form.currency_code)}</strong></div>
          <div><span>VAT ({moneyNumber(form.vat_rate ?? 7.5)}%)</span><strong>{formatCommercialAmount(vat, form.currency_code)}</strong></div>
          <div><span>Manual tax</span><strong>{formatCommercialAmount(manualTax, form.currency_code)}</strong></div>
          <div className="grand-total"><span>Total</span><strong>{formatCommercialAmount(total, form.currency_code)}</strong></div>
        </div>

        <div className="form-grid-2 commercial-tax-fields">
          <label>VAT rate (%)<input type="number" min="0" max="100" step="0.01" value={form.vat_rate ?? 7.5} onChange={e => setForm({ ...form, vat_rate: e.target.value })} /></label>
          <label>Manual tax amount<input type="number" min="0" step="0.01" value={form.manual_tax ?? 0} onChange={e => setForm({ ...form, manual_tax: e.target.value })} /></label>
        </div>

        <div className="form-grid-2">
          <label>Payment terms<textarea rows="3" placeholder="e.g. 50% upfront, balance on delivery" value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} /></label>
          <label>Delivery terms<textarea rows="3" placeholder="Delivery / implementation terms" value={form.delivery_terms} onChange={e => setForm({ ...form, delivery_terms: e.target.value })} /></label>
          <label>Customer notes<textarea rows="3" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
          <label>Terms & conditions<textarea rows="3" value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} /></label>
        </div>

        <div
          className="modal-actions quote-modal-actions"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            marginTop: 24
          }}
        >
          <button
            type="button"
            className="secondary-btn"
            onClick={() => !saving && setShow(false)}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="primary-btn"
            disabled={saving || loadingItems}
          >
            {loadingItems ? 'Loading quote...' : saving ? 'Saving quote...' : editing ? 'Save changes' : 'Save quote'}
          </button>
        </div>
      </form>
    </div>}
  </>;
}
function Invoices({ invoices, payments, customers, products, deals = [], dealProducts = [], quotes = [], onAdd, onUpdate, onDelete, onAddPayment, formatAmount, currentUserId, isAdmin, role, onSendToHOS, onLoadInvoiceItems, onLoadQuoteItems, initialDealId = '', initialQuoteId = '', dealFilterId = '', onLaunchConsumed }) {
  const [show, setShow] = useState(false);
  const [pay, setPay] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    invoice_number: `INV-${Date.now().toString().slice(-6)}`, title: '', customer_id: '', deal_id: '', quote_id: '', sales_rep_id: '', currency_code: 'USD', exchange_rate: 1, vat_rate: 7.5, manual_tax: 0,
    due_date: '', payment_terms: 'Due on receipt', status: 'Draft', notes: '', resubmission_note: '', approval_status: null, approval_stage: null
  });
  const emptyItem = () => ({ product_id: '', product_name: '', description: '', quantity: 1, unit_price: 0, discount: 0, tax: 0 });
  const [items, setItems] = useState([emptyItem()]);
  const visibleInvoices = invoices.filter(i => (role !== 'sales' || i.created_by === currentUserId) && (!dealFilterId || i.deal_id === dealFilterId));
  const wonDeals = deals.filter(d => d.stage === 'Won' && (role !== 'sales' || d.created_by === currentUserId));
  const selectableQuotes = quotes.filter(q => q.approval_status === 'APPROVED' && (!form.deal_id || !q.deal_id || q.deal_id === form.deal_id) && (role !== 'sales' || q.created_by === currentUserId));
  const money = v => Number(v) || 0;
  const lineSubtotal = item => Math.max(0, money(item.quantity)) * Math.max(0, money(item.unit_price));
  const lineDiscountAmount = item => lineSubtotal(item) * Math.min(100, Math.max(0, money(item.discount_percent ?? item.discount))) / 100;
  const lineTotal = item => Math.max(0, lineSubtotal(item) - lineDiscountAmount(item));
  const subtotal = items.reduce((s, item) => s + lineSubtotal(item), 0);
  const discount = items.reduce((s, item) => s + lineDiscountAmount(item), 0);
  const taxable = Math.max(0, subtotal - discount);
  const vat = taxable * Math.max(0, money(form.vat_rate ?? 7.5)) / 100;
  const manualTax = Math.max(0, money(form.manual_tax));
  const tax = vat + manualTax;
  const total = Math.max(0, taxable + vat + manualTax);

  const applyDeal = dealId => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;
    const customer = customers.find(c => c.id === deal.customer_id);
    const inheritedProductIds = dealProducts.filter(row => row.deal_id === deal.id).map(row => row.product_id);
    const ids = inheritedProductIds.map(id => products.find(product => product.id === id)).filter(Boolean);
    setForm(prev => ({ ...prev, deal_id: deal.id, quote_id: '', customer_id: deal.customer_id || '', sales_rep_id: deal.created_by || currentUserId, title: prev.title || `${deal.title} Invoice` }));
    if (ids.length) setItems(ids.map(product => ({ product_id: product.id, product_name: product.name, description: product.description || '', quantity: 1, unit_price: 0, discount: 0, discount_percent: 0, tax: 0 })));
    else setItems([emptyItem()]);
    if (customer && !form.title) setForm(prev => ({ ...prev, customer_id: customer.id }));
  };

  const applyQuote = async quoteId => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;
    setForm(prev => ({ ...prev, quote_id: quote.id, deal_id: quote.deal_id || prev.deal_id, customer_id: quote.customer_id || prev.customer_id, sales_rep_id: quote.sales_rep_id || quote.created_by || prev.sales_rep_id, title: quote.title || prev.title || '', notes: quote.notes || prev.notes || '' }));
    try {
      setLoadingItems(true);
      const loaded = onLoadQuoteItems ? await onLoadQuoteItems(quote) : [];
      const mapped = (loaded || []).map(item => ({ product_id: item.product_id || '', product_name: item.product_name || '', description: item.description || '', quantity: money(item.quantity) || 1, unit_price: money(item.unit_price), discount: money(item.discount), discount_percent: money(item.discount_percent), tax: 0 }));
      if (mapped.length) setItems(mapped);
    } catch (err) { setError(err.message || 'Unable to load quote items.'); }
    finally { setLoadingItems(false); }
  };

  const openNew = async (dealId = '', quoteId = '') => {
    setError('');
    setForm({ invoice_number: `INV-${Date.now().toString().slice(-6)}`, title: '', customer_id: '', deal_id: '', quote_id: '', sales_rep_id: currentUserId, currency_code: 'USD', exchange_rate: 1, vat_rate: 7.5, manual_tax: 0, due_date: '', payment_terms: 'Due on receipt', status: 'Draft', notes: '', resubmission_note: '', approval_status: null, approval_stage: null });
    setItems([emptyItem()]);
    setShow(true);
    if (dealId) window.setTimeout(() => applyDeal(dealId), 0);
    if (quoteId) window.setTimeout(() => applyQuote(quoteId), 0);
  };

  useEffect(() => {
    if (initialDealId || initialQuoteId) { openNew(initialDealId, initialQuoteId); onLaunchConsumed?.(); }
  }, [initialDealId, initialQuoteId]);

  const openEdit = async invoice => {
    setError(''); setForm({ ...form, ...invoice, currency_code: invoice.currency_code || 'USD', exchange_rate: invoice.exchange_rate || 1, vat_rate: invoice.vat_rate ?? 7.5, manual_tax: invoice.manual_tax ?? 0, invoice_number: invoice.invoice_number || form.invoice_number, resubmission_note: '' }); setShow(true);
    try {
      setLoadingItems(true);
      const loaded = onLoadInvoiceItems ? await onLoadInvoiceItems(invoice) : [];
      const mapped = (loaded || []).map(item => ({ product_id: item.product_id || '', product_name: item.product_name || '', description: item.description || '', quantity: money(item.quantity) || 1, unit_price: money(item.unit_price), discount: money(item.discount), discount_percent: money(item.discount_percent), tax: 0 }));
      setItems(mapped.length ? mapped : [{ product_id: invoice.product_id || '', product_name: invoice.title || '', description: '', quantity: money(invoice.quantity) || 1, unit_price: money(invoice.unit_price), discount: money(invoice.discount), tax: money(invoice.tax) }]);
    } catch (err) { setError(err.message || 'Unable to load invoice items.'); }
    finally { setLoadingItems(false); }
  };

  const save = async e => {
    e.preventDefault(); setError('');
    try {
      const deal = form.deal_id ? deals.find(d => d.id === form.deal_id) : null;
      if (form.deal_id && (!deal || deal.stage !== 'Won')) throw new Error('If a Deal is selected, it must be a Won Deal.');
      if (form.quote_id) { const quote = quotes.find(q => q.id === form.quote_id); if (!quote) throw new Error('Select a valid source Quote.'); if (form.deal_id && quote.deal_id !== form.deal_id) throw new Error('The selected Quote must belong to the selected Won Deal.'); }
      const validItems = items.filter(item => item.product_name || item.product_id);
      if (!validItems.length) throw new Error('Add at least one invoice solution.');
      if (validItems.some(item => money(item.quantity) <= 0)) throw new Error('Each invoice item must have a quantity greater than 0.');
      const calculatedItems = validItems.map(item => ({ ...item, quantity: money(item.quantity), unit_price: money(item.unit_price), discount: lineDiscountAmount(item), discount_percent: Math.min(100, Math.max(0, money(item.discount_percent ?? item.discount))), tax: 0, total: lineTotal(item) }));
      const payload = {
        invoice_number: form.invoice_number, title: form.title || calculatedItems[0]?.product_name || 'Invoice', customer_id: form.customer_id || deal?.customer_id || null,
        deal_id: form.deal_id || null, quote_id: form.quote_id || null, sales_rep_id: form.sales_rep_id || deal?.created_by || currentUserId,
        product_id: calculatedItems[0]?.product_id || null, item_type: 'Product', quantity: calculatedItems[0]?.quantity || 1, unit_price: calculatedItems[0]?.unit_price || 0,
        amount: total, discount, tax, vat_amount: vat, vat_rate: money(form.vat_rate ?? 7.5), manual_tax: manualTax, currency_code: form.currency_code === 'OTHER' ? (form.custom_currency_code || 'OTHER') : (form.currency_code || 'USD'), exchange_rate: money(form.exchange_rate) || 1, due_date: form.due_date || null, payment_terms: form.payment_terms || 'Due on receipt', status: form.status || 'Draft', notes: form.notes || ''
      };
      const approvalPatch = form.approval_status === 'REJECTED' ? { approval_status: null, approval_stage: null, resubmission_note: form.resubmission_note?.trim() || null } : {};
      if (form.id) await onUpdate(form.id, { ...payload, ...approvalPatch }, calculatedItems);
      else await onAdd(payload, calculatedItems);
      setShow(false);
    } catch (err) { setError(err.message || 'Unable to save invoice.'); }
  };

  const paymentSave = async e => { e.preventDefault(); try { await onAddPayment({ ...pay, payment_method: pay.payment_method || 'Bank transfer' }); setPay(null); } catch (err) { alert(err.message); } };
  const customerFor = invoice => customers.find(c => c.id === invoice.customer_id) || null;

  return <>
    <PageHeading eyebrow="BILLING" title="Invoices & payments" description="Track invoices, balances and payments." action="New invoice" onAction={() => openNew()} />
    <div className="stats-grid">
      <StatCard label="Invoiced" value={formatAmount(invoices.reduce((s, x) => s + docAmountUsd(x, 'amount'), 0))} hint={`${invoices.length} invoices`} tone="blue" icon="$" />
      <StatCard label="Paid" value={formatAmount(payments.reduce((s, x) => s + paymentAmountUsd(x, invoices), 0))} hint={`${payments.length} payments`} tone="green" icon="✓" />
      <StatCard label="Outstanding" value={formatAmount(invoices.filter(x => !['Paid', 'Cancelled'].includes(x.status)).reduce((s, x) => s + docAmountUsd(x, 'amount'), 0))} hint="Open balances" tone="orange" icon="!" />
    </div>
    {dealFilterId && <div className="panel" style={{ marginBottom: 12 }}><strong>Invoices for Deal:</strong> {deals.find(d => d.id === dealFilterId)?.title || dealFilterId}</div>}
    <div className="panel"><div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Customer</th><th>Deal</th><th>Source Quote</th><th>Amount</th><th>Status</th><th>Due</th><th>Actions</th></tr></thead><tbody>
      {visibleInvoices.length === 0 ? <tr><td colSpan="8">No invoices yet.</td></tr> : visibleInvoices.map(i => <tr key={i.id}>
        <td><strong>{i.invoice_number}</strong><div className="deal-customer">{i.title}</div></td><td>{i.customers?.name || customerFor(i)?.name || '—'}</td><td>{deals.find(d => d.id === i.deal_id)?.title || '—'}</td><td>{quotes.find(q => q.id === i.quote_id)?.quote_number || '—'}</td><td>{formatAmount(docAmountUsd(i, 'amount'))}</td><td><div>{i.status}</div><small className="approval-range-hint">{approvalRequirement(i.amount).label} approval</small></td><td>{i.due_date ? formatDate(i.due_date) : '—'}</td>
        <td><div className="toolbar-actions"><button type="button" className="secondary-btn" onClick={async () => { try { const loaded = onLoadInvoiceItems ? await onLoadInvoiceItems(i) : []; setPreview({ ...i, __items: loaded || [] }); } catch (err) { alert(err.message || 'Unable to load invoice items.'); } }}><FileText size={15} /> View</button>{(isCommercialEditor(role) || i.created_by === currentUserId) && <button type="button" className="secondary-btn" onClick={() => openEdit(i)}>Edit</button>}{i.created_by === currentUserId && ['HOS_PENDING', 'APPROVED', 'MD_PENDING'].indexOf(i.approval_status) === -1 && <button type="button" className="primary-btn approval-btn" onClick={async () => { try { await onSendToHOS(i.id); } catch (err) { alert(err.message); } }}>{i.approval_status === 'REJECTED' ? 'Resubmit to HOS' : 'Send to HOS'}</button>}{isCommercialDeleter(role) && <button type="button" className="icon-btn" title="Delete invoice" onClick={async () => { if (!window.confirm('Delete this invoice?')) return; try { await onDelete(i.id); } catch (err) { alert(err.message); } }}><X size={16} /></button>}{i.status !== 'Paid' && i.approval_status === 'APPROVED' && <button className="secondary-btn" onClick={() => setPay({ invoice_id: i.id, amount: i.amount, paid_at: new Date().toISOString().slice(0, 16), payment_method: 'Bank transfer' })}>Record payment</button>}{(isCommercialEditor(role) || i.created_by === currentUserId) && i.status !== 'Paid' && i.approval_status === 'APPROVED' && <button className="secondary-btn" onClick={() => onUpdate(i.id, { status: 'Paid' })}>Mark paid</button>}</div></td>
      </tr>)}
    </tbody></table></div></div>

    {show && <div className="modal-backdrop" onClick={() => setShow(false)}><form className="modal modal-wide invoice-form-modal" onSubmit={save} onClick={e => e.stopPropagation()}><div className="modal-heading"><div><h2>{form.id ? 'Edit invoice' : 'New invoice'}</h2><p>Invoice manually or optionally tie it to a Won Deal and/or approved Quote.</p></div><button type="button" className="icon-btn" onClick={() => setShow(false)}><X size={18} /></button></div>{error && <div className="form-error">{error}</div>}
      <div className="form-grid-2"><label>Invoice number<input required value={form.invoice_number} readOnly={!!form.id} onChange={e => setForm({ ...form, invoice_number: e.target.value })} /></label><label>Invoice title<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
        <label>Deal (optional)<select value={form.deal_id} onChange={e => applyDeal(e.target.value)}><option value="">Manual invoice — no Deal</option>{wonDeals.map(d => <option key={d.id} value={d.id}>{d.title}{d.company ? ` · ${d.company}` : ''}</option>)}</select></label>
        <label>Source Quote<select value={form.quote_id} onChange={e => applyQuote(e.target.value)}><option value="">No source quote</option>{selectableQuotes.map(q => <option key={q.id} value={q.id}>{q.quote_number} · {q.title}</option>)}</select></label>
        <label>Customer<select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}><option value="">Select customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>)}</select></label>
        <label>Currency<select value={form.currency_code || 'USD'} onChange={e => setForm({ ...form, currency_code: e.target.value, exchange_rate: suggestedUsdRate(e.target.value) })}>{COMMERCIAL_CURRENCIES.map(([code, label]) => <option key={code} value={code}>{code} — {label}</option>)}</select></label>{form.currency_code === 'OTHER' && <label>Currency code<input maxLength={6} placeholder="e.g. AED" value={form.custom_currency_code || ''} onChange={e => setForm({ ...form, custom_currency_code: e.target.value.toUpperCase() })} /></label>}<label>Exchange rate<span className="field-help">USD value of 1 unit of the selected currency (USD = 1)</span><input type="number" min="0" step="0.000001" value={form.exchange_rate} onChange={e => setForm({ ...form, exchange_rate: e.target.value })} /></label><label>Due date<input type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} /></label>
        <label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'].map(x => <option key={x}>{x}</option>)}</select></label>
      </div>
      {form.approval_status === 'REJECTED' && <label>Resubmission note<textarea required rows="3" value={form.resubmission_note || ''} onChange={e => setForm({ ...form, resubmission_note: e.target.value })} /></label>}
      <div className="quote-items-section"><div className="section-heading-row"><div><h3>Invoice items</h3><p>Items are inherited from the Deal or Quote, but the Sales Rep can adjust them.</p></div><button type="button" className="secondary-btn" onClick={() => setItems(prev => [...prev, emptyItem()])}><Plus size={15} /> Add solution</button></div>
        {loadingItems && <div className="invoice-item-empty">Loading commercial items…</div>}
        {items.map((item, index) => <div className="quote-line-item" key={index}><div className="quote-line-header"><strong>Item {index + 1}</strong>{items.length > 1 && <button type="button" className="icon-btn" onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}><X size={15} /></button>}</div><div className="form-grid-2"><label>Solution<select value={item.product_id || ''} onChange={e => { const product = products.find(p => p.id === e.target.value); setItems(prev => prev.map((x, i) => i === index ? { ...x, product_id: product?.id || '', product_name: product?.name || '', description: x.description || product?.description || '' } : x)); }}><option value="">Select solution</option>{products.filter(p => (p.status || 'Active') === 'Active').map(p => <option key={p.id} value={p.id}>{p.name}{p.vendor ? ` · ${p.vendor}` : ''}</option>)}</select></label><label>Description<input value={item.description || ''} onChange={e => setItems(prev => prev.map((x, i) => i === index ? { ...x, description: e.target.value } : x))} /></label><label>Quantity<input type="number" min="1" value={item.quantity} onChange={e => setItems(prev => prev.map((x, i) => i === index ? { ...x, quantity: e.target.value } : x))} /></label><label>Price for this invoice<input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => setItems(prev => prev.map((x, i) => i === index ? { ...x, unit_price: e.target.value } : x))} /></label><label>Discount (%)<input type="number" min="0" max="100" step="0.01" value={item.discount_percent ?? 0} onChange={e => setItems(prev => prev.map((x, i) => i === index ? { ...x, discount_percent: e.target.value } : x))} /></label><div className="line-field-note">VAT and manual tax are applied below the item list.</div></div><div className="quote-line-total"><span>Line total</span><strong>{formatAmount(lineTotal(item))}</strong></div></div>)}
      </div><div className="form-grid-2 commercial-tax-fields"><label>VAT rate (%)<input type="number" min="0" max="100" step="0.01" value={form.vat_rate ?? 7.5} onChange={e => setForm({ ...form, vat_rate: e.target.value })} /></label><label>Manual tax amount<input type="number" min="0" step="0.01" value={form.manual_tax ?? 0} onChange={e => setForm({ ...form, manual_tax: e.target.value })} /></label></div><div className="quote-total-card"><div><span>Subtotal</span><strong>{formatCommercialAmount(subtotal, form.currency_code)}</strong></div><div><span>Discount</span><strong>- {formatCommercialAmount(discount, form.currency_code)}</strong></div><div><span>VAT ({money(form.vat_rate ?? 7.5)}%)</span><strong>{formatCommercialAmount(vat, form.currency_code)}</strong></div><div><span>Manual tax</span><strong>{formatCommercialAmount(manualTax, form.currency_code)}</strong></div><div className="grand-total"><span>Total</span><strong>{formatCommercialAmount(total, form.currency_code)}</strong></div></div>
      <label>Notes<textarea rows="3" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShow(false)}>Cancel</button><button className="primary-btn" disabled={loadingItems}>{form.id ? 'Save changes' : 'Create invoice'}</button></div>
    </form></div>}

    {pay && <div className="modal-backdrop" onClick={() => setPay(null)}><form className="modal" onSubmit={paymentSave} onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>Record payment</h2><button type="button" className="icon-btn" onClick={() => setPay(null)}><X size={18} /></button></div><label>Amount<input type="number" min="0" value={pay.amount} onChange={e => setPay({ ...pay, amount: Number(e.target.value) })} /></label><label>Method<select value={pay.payment_method} onChange={e => setPay({ ...pay, payment_method: e.target.value })}>{['Bank transfer', 'Card', 'Cash', 'Online', 'Other'].map(x => <option key={x}>{x}</option>)}</select></label><label>Date<input type="datetime-local" value={pay.paid_at} onChange={e => setPay({ ...pay, paid_at: e.target.value })} /></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setPay(null)}>Cancel</button><button className="primary-btn">Save payment</button></div></form></div>}

    {preview && <div className="commercial-preview-backdrop" onClick={() => setPreview(null)}><div className="commercial-preview-shell" onClick={e => e.stopPropagation()}><div className="commercial-preview-toolbar"><div><strong>Invoice preview</strong><span>Commercial document</span></div><div className="toolbar-actions"><button type="button" className="secondary-btn" onClick={() => window.print()}>Print / Save PDF</button><button type="button" className="icon-btn" onClick={() => setPreview(null)}><X size={18} /></button></div></div><div className="commercial-print-sheet"><header className="commercial-document-header"><div><img src="/storhet-logo.png" alt="Storhet Solutions" className="invoice-company-logo" /><h2>STORHET SOLUTIONS</h2><p>Technology Solutions & Services</p></div><div className="commercial-document-title-block"><div className="commercial-document-title">INVOICE</div><span>{preview.status || 'Draft'}</span></div></header><div className="commercial-rule" /><section className="commercial-meta-grid"><div><span className="invoice-label">BILL TO</span><strong>{customerFor(preview)?.name || preview.title || 'Customer'}</strong><span>{customerFor(preview)?.company || ''}</span><span>{customerFor(preview)?.email || ''}</span></div><div className="commercial-details-box"><div><span>Invoice #</span><strong>{preview.invoice_number}</strong></div><div><span>Invoice Date</span><strong>{formatDate(preview.created_at || new Date().toISOString())}</strong></div><div><span>Due Date</span><strong>{preview.due_date ? formatDate(preview.due_date) : '—'}</strong></div><div><span>Currency</span><strong>{preview.currency_code || 'USD'}{preview.currency_code && preview.currency_code !== 'USD' ? ` · 1 ${preview.currency_code} = ${preview.exchange_rate || 1} USD` : ''}</strong></div></div></section><table className="commercial-document-table"><thead><tr><th>#</th><th>ITEM &amp; DESCRIPTION</th><th>QTY</th><th>PRICE</th><th>DISCOUNT</th><th>AMOUNT</th></tr></thead><tbody>{(preview.__items || []).map((item, idx) => <tr key={item.id || idx}><td>{idx + 1}</td><td><strong>{item.product_name || 'Solution'}</strong><span>{item.description || ''}</span></td><td>{item.quantity || 1}</td><td>{formatCommercialAmount(item.unit_price, preview.currency_code)}</td><td>{Number(item.discount_percent || 0).toFixed(2)}%</td><td>{formatCommercialAmount(Number(item.total || 0), preview.currency_code)}</td></tr>)}</tbody></table><section className="commercial-bottom-grid"><div><span className="invoice-label">NOTES</span><p>{preview.notes || 'Thank you for your business.'}</p><span className="invoice-label">PAYMENT TERMS</span><p>{preview.payment_terms || 'Due on receipt.'}</p></div><div className="commercial-totals-block"><div><span>Subtotal</span><strong>{formatCommercialAmount(preview.subtotal ?? preview.amount, preview.currency_code)}</strong></div><div><span>Discount</span><strong>- {formatCommercialAmount(preview.discount || 0, preview.currency_code)}</strong></div><div><span>VAT ({preview.vat_rate ?? 7.5}%)</span><strong>{formatCommercialAmount(preview.vat_amount || 0, preview.currency_code)}</strong></div><div><span>Manual tax</span><strong>{formatCommercialAmount(preview.manual_tax || 0, preview.currency_code)}</strong></div><div className="commercial-grand-total"><span>TOTAL</span><strong>{formatCommercialAmount(preview.amount, preview.currency_code)}</strong></div></div></section><footer className="commercial-document-footer"><div><strong>Payment / Terms</strong><p>{preview.payment_terms || 'Please make payment by the stated due date.'}</p></div><div>Thank you for doing business with<br /><strong>STORHET SOLUTIONS</strong>.</div></footer></div></div></div>}
  </>;
}
function Documents({ documents, customers, onUpload, onDownload, onDelete }) { const [customerId, setCustomerId] = useState(''); const upload = e => { const f = e.target.files?.[0]; if (!f) return; onUpload(f, customerId).catch(err => alert(err.message)); e.target.value = '' }; return <><PageHeading eyebrow="FILES" title="Documents" description="Store customer and CRM files in Supabase Storage." /><div className="panel"><div className="toolbar"><select value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">No customer link</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><label className="secondary-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Upload size={15} /> Upload file<input type="file" hidden onChange={upload} /></label></div><div className="table-wrap"><table><thead><tr><th>File</th><th>Customer</th><th>Type</th><th>Size</th><th>Created</th><th>Actions</th></tr></thead><tbody>{documents.length === 0 ? <tr><td colSpan="6">No documents yet.</td></tr> : documents.map(d => <tr key={d.id}><td><strong>{d.name}</strong></td><td>{d.customers?.name || '—'}</td><td>{d.mime_type}</td><td>{Math.max(1, Math.round(Number(d.size_bytes || 0) / 1024))} KB</td><td>{formatDate(d.created_at)}</td><td><div className="toolbar-actions"><button className="secondary-btn" onClick={() => onDownload(d)}><Download size={14} /> Download</button><button className="icon-btn" onClick={() => onDelete(d)}><X size={16} /></button></div></td></tr>)}</tbody></table></div></div></> }
function Automation({ workflows, onAdd, onUpdate }) { const [show, setShow] = useState(false); const blank = { name: '', description: '', trigger_type: 'customer_created', action_type: 'create_notification', active: true, config: {} }; const [form, setForm] = useState(blank); const save = async e => { e.preventDefault(); try { await onAdd(form); setShow(false); setForm(blank) } catch (err) { alert(err.message) } }; return <><PageHeading eyebrow="AUTOMATION" title="Workflow automation" description="Define rules that turn CRM events into actions." action="New workflow" onAction={() => setShow(true)} /><div className="panel"><div className="table-wrap"><table><thead><tr><th>Workflow</th><th>Trigger</th><th>Action</th><th>Status</th><th>Created</th><th>Toggle</th></tr></thead><tbody>{workflows.length === 0 ? <tr><td colSpan="6">No workflows yet.</td></tr> : workflows.map(w => <tr key={w.id}><td><strong>{w.name}</strong><div className="deal-customer">{w.description}</div></td><td>{w.trigger_type}</td><td>{w.action_type}</td><td>{w.active ? 'Active' : 'Paused'}</td><td>{formatDate(w.created_at)}</td><td><button className="secondary-btn" onClick={() => onUpdate(w.id, { active: !w.active })}>{w.active ? 'Pause' : 'Activate'}</button></td></tr>)}</tbody></table></div></div>{show && <div className="modal-backdrop" onClick={() => setShow(false)}><form className="modal" onSubmit={save} onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>New workflow</h2><button type="button" className="icon-btn" onClick={() => setShow(false)}><X size={18} /></button></div><label>Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>Description<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><label>Trigger<select value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value })}>{['customer_created', 'lead_created', 'deal_stage_changed', 'ticket_created', 'invoice_overdue', 'activity_due'].map(x => <option key={x}>{x}</option>)}</select></label><label>Action<select value={form.action_type} onChange={e => setForm({ ...form, action_type: e.target.value })}>{['create_notification', 'create_activity', 'log_event', 'send_email'].map(x => <option key={x}>{x}</option>)}</select></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShow(false)}>Cancel</button><button className="primary-btn">Create workflow</button></div></form></div>}</> }
function Segments({ segments, customers, onAdd, onUpdate }) { const [show, setShow] = useState(false); const [form, setForm] = useState({ name: '', description: '', rule_json: { status: 'Active' }, active: true }); const [selected, setSelected] = useState(null); const save = async e => { e.preventDefault(); try { await onAdd(form); setShow(false) } catch (err) { alert(err.message) } }; const count = s => customers.filter(c => (c.status || 'Active') === (s.rule_json?.status || 'Active')).length; return <><PageHeading eyebrow="CUSTOMER INTELLIGENCE" title="Segments" description="Group customers for targeted follow-up and reporting." action="New segment" onAction={() => setShow(true)} /><div className="panel"><div className="table-wrap"><table><thead><tr><th>Segment</th><th>Rule</th><th>Customers</th><th>Status</th><th>Actions</th></tr></thead><tbody>{segments.length === 0 ? <tr><td colSpan="5">No segments yet.</td></tr> : segments.map(s => <tr key={s.id}><td><strong>{s.name}</strong><div className="deal-customer">{s.description}</div></td><td>Status = {s.rule_json?.status || 'Active'}</td><td>{count(s)}</td><td>{s.active ? 'Active' : 'Paused'}</td><td><button className="secondary-btn" onClick={() => onUpdate(s.id, { active: !s.active })}>{s.active ? 'Pause' : 'Activate'}</button></td></tr>)}</tbody></table></div></div>{show && <div className="modal-backdrop" onClick={() => setShow(false)}><form className="modal" onSubmit={save} onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>New segment</h2><button type="button" className="icon-btn" onClick={() => setShow(false)}><X size={18} /></button></div><label>Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>Description<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><label>Customer status<select value={form.rule_json.status} onChange={e => setForm({ ...form, rule_json: { ...form.rule_json, status: e.target.value } })}>{['Active', 'Inactive', 'Prospect', 'VIP'].map(x => <option key={x}>{x}</option>)}</select></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShow(false)}>Cancel</button><button className="primary-btn">Create segment</button></div></form></div>}</> }

function Forecast({ deals, formatAmount }) {
  const weighted = deals.filter(d => d.stage !== 'Lost' && d.stage !== 'Won').reduce((s, d) => s + (Number(d.amount) || 0) * stageProbability(d.stage), 0);
  const open = deals.filter(d => !['Lost', 'Won'].includes(d.stage));
  return <>
    <PageHeading eyebrow="SALES INTELLIGENCE"
      title="Sales forecast"
      description="Weighted forecast based on current pipeline stages." />
    {/* <div className="stats-grid">
      <StatCard label="Weighted forecast" value={formatAmount(weighted)} hint="Open pipeline × stage probability" tone="purple" icon="↗" />
      <StatCard label="Open pipeline" value={formatAmount(open.reduce((s, d) => s + Number(d.amount || 0), 0))} hint={`${open.length} open deals`} tone="orange" icon="◈" />
      <StatCard label="Won revenue" value={formatAmount(deals.filter(d => d.stage === 'Won').reduce((s, d) => s + Number(d.amount || 0), 0))} hint="Closed won" tone="green" icon="✓" />
    </div> */}
    <div className="panel">
      <h3>Forecast by stage</h3>
      <h6 className='coming'>Coming soon</h6>
      {/* {PIPELINE_STAGES.filter(s => s !== 'Lost').map(stage => {
        const list = deals.filter(d => d.stage === stage);
        const value = list.reduce((s, d) => s + Number(d.amount || 0), 0);
        return <BarRow key={stage} label={`${stage} (${Math.round(stageProbability(stage) * 100)}%)`} percent={weighted ? value * stageProbability(stage) / weighted * 100 : 0} display={formatAmount(value * stageProbability(stage))} />
      })} */}
    </div>
  </>
}
function stageProbability(stage) { return ({ 'New Lead': 0.1, 'Qualified': 0.25, 'Proposal': 0.5, 'Won': 1, 'Lost': 0 })[stage] ?? 0.2; }
function AdvancedReports({ customers, deals, activities, tickets, leads, quotes, invoices, payments, formatAmount }) { const pipeline = deals.filter(d => !['Won', 'Lost'].includes(d.stage)).reduce((s, d) => s + Number(d.amount || 0), 0); const won = deals.filter(d => d.stage === 'Won').reduce((s, d) => s + Number(d.amount || 0), 0); const paid = payments.reduce((s, p) => s + paymentAmountUsd(p, invoices), 0); const leadConversion = leads.length ? leads.filter(l => l.status === 'Converted').length / leads.length * 100 : 0; const overdue = invoices.filter(i => i.status === 'Overdue').length; const response = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length; return <><PageHeading eyebrow="INSIGHTS" title="Advanced reports" description="Cross-module performance, conversion and revenue intelligence." /><div className="stats-grid"><StatCard label="Won revenue" value={formatAmount(won)} hint={`${deals.filter(d => d.stage === 'Won').length} won deals`} tone="green" icon="✓" /><StatCard label="Weighted forecast" value={formatAmount(deals.filter(d => !['Won', 'Lost'].includes(d.stage)).reduce((s, d) => s + Number(d.amount || 0) * stageProbability(d.stage), 0))} hint="Probability weighted" tone="purple" icon="↗" /><StatCard label="Lead conversion" value={`${leadConversion.toFixed(1)}%`} hint={`${leads.filter(l => l.status === 'Converted').length}/${leads.length} converted`} tone="blue" icon="◉" /><StatCard label="Collected" value={formatAmount(paid)} hint="Recorded payments" tone="orange" icon="$" /></div><div className="report-grid"><div className="panel report-summary"><h3>Sales funnel</h3><BarRow label="Leads" percent={100} display={leads.length} /><BarRow label="Qualified" percent={leads.length ? (leads.filter(l => l.status === 'Qualified').length / leads.length * 100) : 0} display={leads.filter(l => l.status === 'Qualified').length} /><BarRow label="Won deals" percent={leads.length ? (deals.filter(d => d.stage === 'Won').length / leads.length * 100) : 0} display={deals.filter(d => d.stage === 'Won').length} /></div><div className="panel report-summary"><h3>Revenue</h3><BarRow label="Open pipeline" percent={pipeline + won ? (pipeline / (pipeline + won)) * 100 : 0} display={formatAmount(pipeline)} /><BarRow label="Won" percent={pipeline + won ? (won / (pipeline + won)) * 100 : 0} display={formatAmount(won)} /><BarRow label="Collected" percent={won ? Math.min(100, paid / won * 100) : 0} display={formatAmount(paid)} /></div><div className="panel report-summary"><h3>Operations</h3><BarRow label="Activities completed" percent={activities.length ? activities.filter(a => a.status === 'Completed').length / activities.length * 100 : 0} display={`${activities.filter(a => a.status === 'Completed').length}/${activities.length}`} /><BarRow label="Tickets resolved" percent={tickets.length ? response / tickets.length * 100 : 0} display={`${response}/${tickets.length}`} /><BarRow label="Overdue invoices" percent={invoices.length ? overdue / invoices.length * 100 : 0} display={overdue} /></div><div className="panel report-summary"><h3>Quotes</h3><BarRow label="Accepted" percent={quotes.length ? quotes.filter(q => q.status === 'Accepted').length / quotes.length * 100 : 0} display={quotes.filter(q => q.status === 'Accepted').length} /><BarRow label="Sent" percent={quotes.length ? quotes.filter(q => q.status === 'Sent').length / quotes.length * 100 : 0} display={quotes.filter(q => q.status === 'Sent').length} /><BarRow label="Rejected" percent={quotes.length ? quotes.filter(q => q.status === 'Rejected').length / quotes.length * 100 : 0} display={quotes.filter(q => q.status === 'Rejected').length} /></div></div></> }
function SupportEngineers({ supportEngineers, solutionSupport, onAdd, onUpdate, onDeactivate, isAdmin }) {
  const primaryVendors = ['F5', 'Kong', 'IRONSCALES', 'SolarWinds', 'Utimaco'];
  const blank = { name: '', email: '', role: 'System Engineer', status: 'Active', solutionFamilies: [] };
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const familyNamesFor = engineerId => solutionSupport
    .filter(row => row.support_engineer_id === engineerId)
    .map(row => row.solution_family);

  const openAdd = () => { setEditing(null); setForm(blank); setError(''); setShow(true); };
  const openEdit = engineer => {
    setEditing(engineer);
    setForm({ name: engineer.name || '', email: engineer.email || '', role: engineer.role || 'System Engineer', status: engineer.status || 'Active', solutionFamilies: familyNamesFor(engineer.id) });
    setError('');
    setShow(true);
  };
  const close = () => { setShow(false); setEditing(null); setForm(blank); setError(''); };

  const save = async event => {
    event.preventDefault();
    if (!form.name.trim()) return setError('Engineer name is required.');
    setSaving(true); setError('');
    try {
      const payload = { name: form.name.trim(), email: form.email.trim() || null, role: form.role.trim() || 'System Engineer', status: form.status };
      if (editing) await onUpdate(editing.id, payload, form.solutionFamilies);
      else await onAdd(payload, form.solutionFamilies);
      close();
    } catch (err) { setError(err.message || 'Unable to save support engineer.'); }
    finally { setSaving(false); }
  };

  const toggleFamily = family => setForm(prev => ({ ...prev, solutionFamilies: prev.solutionFamilies.includes(family) ? prev.solutionFamilies.filter(item => item !== family) : [...prev.solutionFamilies, family] }));

  return <>
    <PageHeading eyebrow="WORK & SUPPORT" title="Technical Support" description="Manage the engineers who support Storhet solutions and assign them to deals." action={isAdmin ? 'Add support engineer' : undefined} onAction={isAdmin ? openAdd : undefined} />
    <div className="stats-grid">
      <StatCard label="Support engineers" value={supportEngineers.filter(x => x.status === 'Active').length} hint={`${supportEngineers.length} total`} tone="blue" icon="◉" />
      <StatCard label="Solution families" value={primaryVendors.length} hint="Configured solution families" tone="purple" icon="◈" />
      <StatCard label="Active assignments" value={solutionSupport.length} hint="Parent-solution support links" tone="green" icon="✓" />
    </div>
    <div className="panel">
      <div className="panel-heading"><div><h3>Support engineers</h3><p>These people can be assigned to solution families and deals.</p></div></div>
      {supportEngineers.length === 0 ? <div className="empty-state"><p>No support engineers have been added yet.</p>{isAdmin && <button className="primary-btn" onClick={openAdd}>Add your first support engineer</button>}</div> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Engineer</th><th>Role</th><th>Supported solutions</th><th>Status</th><th>Actions</th></tr></thead><tbody>{supportEngineers.map(engineer => { const families = familyNamesFor(engineer.id); return <tr key={engineer.id}><td><strong>{engineer.name}</strong><div className="table-subtext">{engineer.email || 'No email added'}</div></td><td>{engineer.role || 'System Engineer'}</td><td>{families.length ? families.map(f => <span key={f} className="tag-pill">{f}</span>) : <span className="table-subtext">Not assigned</span>}</td><td><span className={`status ${engineer.status === 'Active' ? 'paid' : 'overdue'}`}>{engineer.status}</span></td><td>{isAdmin && <div className="table-actions"><button type="button" className="secondary-btn" onClick={() => openEdit(engineer)}><Pencil size={14} /> Edit</button>{engineer.status === 'Active' && <button type="button" className="secondary-btn" onClick={async () => { if (!window.confirm(`Deactivate ${engineer.name}?`)) return; try { await onDeactivate(engineer.id); } catch (err) { alert(err.message); } }}>Deactivate</button>}</div>}</td></tr>; })}</tbody></table></div>}
    </div>
    {show && <div className="modal-backdrop" onClick={close}><form className="modal" onSubmit={save} onClick={e => e.stopPropagation()}><div className="modal-heading"><div><h2>{editing ? 'Edit support engineer' : 'Add support engineer'}</h2><p>Manage the technical people available to Storhet.</p></div><button type="button" className="icon-btn" onClick={close}><X size={18} /></button></div>{error && <div className="form-error">{error}</div>}<label>Name *<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Michel Agboola" /></label><label>Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="engineer@storhet.com" /></label><label>Role<input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. System Engineer" /></label><label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label><div className="product-selector"><div className="product-selector-heading"><div><strong>Supported solution families</strong><span>{form.solutionFamilies.length} selected</span></div></div><div className="product-vendor-children">{primaryVendors.map(family => { const selected = form.solutionFamilies.includes(family); return <label key={family} className={`product-option ${selected ? 'selected' : ''}`}><input type="checkbox" checked={selected} onChange={() => toggleFamily(family)} /><span>{family}</span></label>; })}</div></div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={close}>Cancel</button><button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add engineer'}</button></div></form></div>}
  </>;
}
function Products({ products, supportEngineers, solutionSupport, onAdd, onUpdate, onDelete, onUpdateFamilySupport, currentUserId, isAdmin }) {
  const [show, setShow] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const blank = {
    name: '',
    description: '',
    category: '',
    custom_category: '',
    vendor: '',
    logo_url: '',
    type: 'Product',
    unit_price: 0,
    status: 'Active'
  };
  const [form, setForm] = useState(blank);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showFamilySupport, setShowFamilySupport] = useState(false);
  const [familySupportIds, setFamilySupportIds] = useState([]);
  const [familySupportSaving, setFamilySupportSaving] = useState(false);

  const categories = [
    'API Management',
    'Application Security',
    'Network & Infrastructure',
    'Cybersecurity',
    'Cloud',
    'IT Services',
    'Software',
    'Hardware',
    'Other'
  ];

  // The five primary solution families in Storhet's catalogue.
  // Individual products are displayed inside their parent vendor family.
  const primaryVendors = ['F5', 'Kong', 'IRONSCALES', 'SolarWinds', 'Utimaco'];
  const vendorLogos = {
    F5: '/logos/f5.png',
    Kong: '/logos/kong.png',
    IRONSCALES: '/logos/ironscales.png',
    SolarWinds: '/logos/solarwinds.jpg',
    Utimaco: '/logos/utimaco.jpg'
  };

  const normalizeVendor = vendor => (vendor || '').trim().toLowerCase();
  const getVendorKey = vendor => {
    const match = primaryVendors.find(item => normalizeVendor(item) === normalizeVendor(vendor));
    return match || (vendor || 'Other').trim() || 'Other';
  };

  const groupedProducts = primaryVendors.reduce((groups, vendor) => {
    groups[vendor] = products.filter(product => normalizeVendor(product.vendor) === normalizeVendor(vendor));
    return groups;
  }, {});

  const otherVendorGroups = products.reduce((groups, product) => {
    const vendor = getVendorKey(product.vendor);
    if (primaryVendors.includes(vendor)) return groups;
    if (!groups[vendor]) groups[vendor] = [];
    groups[vendor].push(product);
    return groups;
  }, {});

  const save = async event => {
    event.preventDefault();
    if (!form.name.trim()) return;

    if (form.category === 'Other' && !form.custom_category.trim()) {
      alert('Please enter the category you want to use.');
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category || null,
        custom_category: form.category === 'Other' ? form.custom_category.trim() : null,
        vendor: form.vendor.trim() || null,
        logo_url: form.logo_url.trim() || null,
        type: form.type || 'Product',
        unit_price: Math.max(0, Number(form.unit_price) || 0),
        status: form.status
      };

      if (editingProduct) {
        await onUpdate(editingProduct.id, payload);
      } else {
        await onAdd(payload);
      }
      closeModal();
    } catch (error) {
      alert(error.message);
    }
  };

  const openAdd = () => {
    setEditingProduct(null);
    setForm(blank);
    setShow(true);
  };

  const openEdit = product => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      custom_category: product.custom_category || '',
      vendor: product.vendor || '',
      logo_url: product.logo_url || '',
      type: product.type || 'Product',
      unit_price: Number(product.unit_price || 0),
      status: product.status || 'Active'
    });
    setShow(true);
  };

  const closeModal = () => {
    setShow(false);
    setEditingProduct(null);
    setForm(blank);
  };

  const getFamilySupport = vendor => solutionSupport.filter(row => row.solution_family === vendor && row.support_engineers?.status === 'Active').map(row => row.support_engineer_id);
  const getFamilySupportNames = vendor => solutionSupport.filter(row => row.solution_family === vendor && row.support_engineers?.status === 'Active').map(row => row.support_engineers?.name).filter(Boolean);
  const openFamilySupport = vendor => { setFamilySupportIds(getFamilySupport(vendor)); setSelectedVendor(vendor); setShowFamilySupport(true); };
  const saveFamilySupport = async () => { setFamilySupportSaving(true); try { await onUpdateFamilySupport(selectedVendor, familySupportIds); setShowFamilySupport(false); } catch (err) { alert(err.message); } finally { setFamilySupportSaving(false); } };

  const getCategoryLabel = product => {
    if (product.category === 'Other') return product.custom_category || 'Other';
    return product.category || 'Uncategorized';
  };

  const getLogoUrl = (productOrVendor) => {
    const vendor = typeof productOrVendor === 'string' ? productOrVendor : productOrVendor?.vendor;
    const productLogo = typeof productOrVendor === 'string' ? null : productOrVendor?.logo_url;
    return productLogo || vendorLogos[getVendorKey(vendor)] || null;
  };

  const LogoMark = ({ product, vendor, large = false }) => {
    const name = vendor || product?.vendor || product?.name || 'Solution';
    const logoUrl = getLogoUrl(product || vendor);
    const fallbackText = name.slice(0, 2).toUpperCase();

    return (
      <div className={`product-logo ${large ? 'product-logo-large' : ''}`}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${name} logo`}
            onError={event => {
              event.currentTarget.style.display = 'none';
              const fallback = event.currentTarget.parentElement.querySelector('.product-logo-fallback');
              if (fallback) fallback.style.display = 'grid';
            }}
          />
        ) : null}
        <span className="product-logo-fallback" style={{ display: logoUrl ? 'none' : 'grid' }}>
          {logoUrl ? <Building2 size={large ? 22 : 18} /> : fallbackText}
        </span>
      </div>
    );
  };

  const renderProductCard = product => (
    <div className="panel product-card" key={product.id}>
      <div className="product-card-top">
        <LogoMark product={product} />
        <div className="product-card-actions">
          <span className={`product-status ${product.status === 'Inactive' ? 'inactive' : ''}`}>
            {product.status || 'Active'}
          </span>
          {(isAdmin || product.created_by === currentUserId) && (
            <div className="product-card-actions-buttons">
              <button type="button" className="icon-btn" title="Edit product" onClick={() => openEdit(product)}><Pencil size={16} /></button>
              <button type="button" className="icon-btn" title="Delete product" onClick={() => onDelete(product.id)}><X size={16} /></button>
            </div>
          )}
        </div>
      </div>

      <div className="product-category">{getCategoryLabel(product)}</div>
      <h3>{product.name}</h3>
      <div className="product-vendor">{product.vendor || 'Storhet'} · {product.type || 'Product'}</div>
      {Number(product.unit_price || 0) > 0 && <div className="product-price">{formatAmount(product.unit_price)}</div>}
      <p>{product.description || 'No description added.'}</p>
      <small>Added {formatDate(product.created_at)}</small>
    </div>
  );

  const renderVendorCard = vendor => {
    const vendorProducts = groupedProducts[vendor] || [];
    const categoriesForVendor = [...new Set(vendorProducts.map(getCategoryLabel).filter(Boolean))];

    return (
      <button type="button" className="panel solution-family-card" key={vendor} onClick={() => setSelectedVendor(vendor)}>
        <div className="solution-family-top">
          <LogoMark vendor={vendor} large />
          <ChevronRight size={19} className="solution-family-arrow" />
        </div>
        <div className="solution-family-label">SOLUTION FAMILY</div>
        <h3>{vendor}</h3>
        <p>{vendorProducts.length} {vendorProducts.length === 1 ? 'solution' : 'solutions'} in catalogue</p>
        <div className="solution-family-support-preview"><strong>Supported by</strong><div>{getFamilySupportNames(vendor).length ? getFamilySupportNames(vendor).slice(0, 3).map(name => <span key={name}>{name}</span>) : <span>Not assigned</span>}</div></div>
        <div className="solution-family-categories">
          {categoriesForVendor.slice(0, 4).map(category => (
            <span key={category}>{category}</span>
          ))}
          {categoriesForVendor.length > 4 && <span>+{categoriesForVendor.length - 4} more</span>}
        </div>
      </button>
    );
  };

  return (
    <>
      <PageHeading
        eyebrow="PRODUCTS & SOLUTIONS"
        title="Products & solutions"
        description="Manage the products and technology solutions your team can offer to customers."
        action="Add product"
        onAction={openAdd}
      />

      {products.length === 0 ? (
        <div className="panel empty-state">
          <p>No products or solutions have been added yet.</p>
          <button className="primary-btn" onClick={openAdd}>Add your first product</button>
        </div>
      ) : selectedVendor ? (
        <div className="solution-family-view">
          <button type="button" className="solution-back-btn" onClick={() => setSelectedVendor(null)}>
            <ArrowLeft size={16} />
            Back to solutions
          </button>

          <div className="solution-family-heading">
            <LogoMark vendor={selectedVendor} large />
            <div>
              <div className="solution-family-label">SOLUTION FAMILY</div>
              <h2>{selectedVendor}</h2>
              <p>{(groupedProducts[selectedVendor] || []).length} solutions available in the catalogue.</p>
              <div className="solution-family-support-preview"><strong>Supported by</strong><div>{getFamilySupportNames(selectedVendor).length ? getFamilySupportNames(selectedVendor).map(name => <span key={name}>{name}</span>) : <span>Not assigned</span>}</div></div>
            </div>
            {isAdmin && <button type="button" className="secondary-btn" onClick={() => openFamilySupport(selectedVendor)}>Manage support</button>}
          </div>

          {(groupedProducts[selectedVendor] || []).length > 0 ? (
            <div className="product-grid">
              {(groupedProducts[selectedVendor] || []).map(renderProductCard)}
            </div>
          ) : (
            <div className="panel empty-state">
              <p>No products have been added under {selectedVendor} yet.</p>
              <button className="primary-btn" onClick={openAdd}>Add product</button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="solution-family-grid">
            {primaryVendors.map(renderVendorCard)}
          </div>

          {Object.keys(otherVendorGroups).length > 0 && (
            <div className="other-vendor-section">
              <div className="solution-family-section-heading">
                <div>
                  <div className="solution-family-label">OTHER VENDORS</div>
                  <h2>Additional solutions</h2>
                </div>
              </div>
              <div className="product-grid">
                {Object.values(otherVendorGroups).flat().map(renderProductCard)}
              </div>
            </div>
          )}
        </>
      )}

      {showFamilySupport && selectedVendor && <div className="modal-backdrop" onClick={() => !familySupportSaving && setShowFamilySupport(false)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-heading"><div><h2>{selectedVendor} support team</h2><p>Assign engineers at the parent solution-family level. This applies to the solutions under {selectedVendor}.</p></div><button type="button" className="icon-btn" onClick={() => setShowFamilySupport(false)}><X size={18} /></button></div><div className="product-selector"><div className="product-selector-heading"><div><strong>Supported by</strong><span>{familySupportIds.length} selected</span></div></div><div className="product-vendor-children">{supportEngineers.filter(engineer => engineer.status === 'Active').length === 0 ? <p className="settings-hint">Add support engineers from the Technical Support page first.</p> : supportEngineers.filter(engineer => engineer.status === 'Active').map(engineer => { const selected = familySupportIds.includes(engineer.id); return <label key={engineer.id} className={`product-option ${selected ? 'selected' : ''}`}><input type="checkbox" checked={selected} onChange={() => setFamilySupportIds(prev => selected ? prev.filter(id => id !== engineer.id) : [...prev, engineer.id])} /><span>{engineer.name}{engineer.role ? ` — ${engineer.role}` : ''}</span></label>; })}</div></div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowFamilySupport(false)}>Cancel</button><button type="button" className="primary-btn" disabled={familySupportSaving} onClick={saveFamilySupport}>{familySupportSaving ? 'Saving...' : 'Save support team'}</button></div></div></div>}

      {show && (
        <div className="modal-backdrop" onClick={closeModal}>
          <form className="modal product-modal" onSubmit={save} onClick={e => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <h2>{editingProduct ? 'Edit product' : 'Add product'}</h2>
                <p>{editingProduct ? 'Update the product or solution details in your catalogue.' : 'Add a Storhet product or technology solution to the catalogue.'}</p>
              </div>
              <button type="button" className="icon-btn" onClick={closeModal}><X size={18} /></button>
            </div>

            <label>
              Product / solution name <span className="required-mark">*</span>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Kong API Gateway"
                required
              />
            </label>

            <div className="product-form-grid">
              <label>
                Category
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value, custom_category: e.target.value === 'Other' ? form.custom_category : '' })}
                >
                  <option value="">Select category</option>
                  {categories.map(category => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>

              <label>
                Vendor / brand
                <input
                  value={form.vendor}
                  onChange={e => setForm({ ...form, vendor: e.target.value })}
                  placeholder="e.g. Kong"
                />
              </label>
            </div>

            <div className="product-form-grid">
              <label>
                Type
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="Product">Product</option>
                  <option value="Service">Service</option>
                </select>
              </label>

              <label>
                Selling price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unit_price}
                  onChange={e => setForm({ ...form, unit_price: e.target.value })}
                  placeholder="0.00"
                />
              </label>
            </div>

            <label>
              Solution logo URL
              <input
                type="url"
                value={form.logo_url}
                onChange={e => setForm({ ...form, logo_url: e.target.value })}
                placeholder="e.g. /logos/kong.png"
              />
            </label>

            {form.category === 'Other' && (
              <label>
                Custom category <span className="required-mark">*</span>
                <input
                  value={form.custom_category}
                  onChange={e => setForm({ ...form, custom_category: e.target.value })}
                  placeholder="Type any category you want, e.g. Data Analytics"
                  required
                />
              </label>
            )}

            <label>
              Description
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="What does this product or solution do?"
                rows="4"
              />
            </label>

            <label>
              Status
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
              <button className="primary-btn" type="submit">{editingProduct ? 'Save changes' : 'Add product'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
function SettingsPage({ currency, setCurrency, theme, setTheme }) {
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setCurrency(selectedCurrency);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <PageHeading eyebrow="WORKSPACE" title="Settings" description="Manage your workspace preferences." />
      <div className="panel settings-panel">
        <h3>Workspace settings</h3>
        <div className="theme-setting">
          <div>
            <strong>Dark mode</strong>
            <span>Use a darker colour scheme. Applies instantly and is saved on this device.</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Dark mode"
            className="theme-switch"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
        </div>
        <label>Display currency
          <select value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value)}>
            <option value="USD">USD — US Dollar ($)</option>
            <option value="NGN">NGN — Nigerian Naira (₦)</option>
            <option value="EUR">EUR — Euro (€)</option>
          </select>
        </label>
        <p className="settings-hint">Deal amounts are stored in USD and converted for display. Your choice is saved on this device.</p>
        <button className="primary-btn" onClick={handleSave}>{saved ? 'Changes saved' : 'Save changes'}</button>
      </div>
    </>
  );
}
function Chat() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error) {
      console.error('Could not get current user:', error);
      setError(error.message);
      return;
    }

    setCurrentUserId(user?.id || null);

    if (user?.id) {
      fetchUsers(user.id);
    }
  }

  async function fetchUsers(myUserId) {
    setLoadingUsers(true);
    setError('');

    const { data, error } = await supabase
      .from('authorized_users')
      .select('user_id, email, role, status')
      .eq('status', 'active')
      .neq('user_id', myUserId)
      .order('email', { ascending: true });

    if (error) {
      console.error('Failed to load chat users:', error);
      setError('Unable to load users.');
      setUsers([]);
    } else {
      setUsers(data || []);
    }

    setLoadingUsers(false);
  }

  async function openConversation(user) {
    if (!currentUserId || !user?.user_id) return;

    setSelectedUser(user);
    setMessages([]);
    setLoadingMessages(true);
    setError('');

    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .or(
        `and(user_one.eq.${currentUserId},user_two.eq.${user.user_id}),and(user_one.eq.${user.user_id},user_two.eq.${currentUserId})`
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to find conversation:', error);
      setError('Unable to open conversation.');
      setLoadingMessages(false);
      return;
    }

    let activeConversation = data;

    if (!activeConversation) {
      const { data: newConversation, error: createError } = await supabase
        .from('chat_conversations')
        .insert({
          user_one: currentUserId,
          user_two: user.user_id
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create conversation:', createError);
        setError(createError.message);
        setLoadingMessages(false);
        return;
      }

      activeConversation = newConversation;
    }

    setConversation(activeConversation);
    await fetchMessages(activeConversation.id);
    setLoadingMessages(false);
  }

  async function fetchMessages(conversationId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load messages:', error);
      setError('Unable to load messages.');
      return;
    }

    setMessages(data || []);
  }

  async function sendMessage(event) {
    event.preventDefault();
    const body = messageText.trim();

    if (!body || !conversation || !currentUserId || sending) {
      return;
    }

    setSending(true);
    setError('');

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        body
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to send message:', error);
      setError(error.message);
      setSending(false);
      return;
    }

    setMessages(prev => {
      if (prev.some(message => message.id === data.id)) {
        return prev;
      }

      return [...prev, data];
    });
    const recipientId =
      conversation.user_one === currentUserId
        ? conversation.user_two
        : conversation.user_one;

    if (recipientId !== currentUserId) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'new_chat',
          title: 'New chat message',
          message: body,
          link: 'Chat'
        });

      if (notificationError) {
        console.error(
          'Failed to create chat notification:',
          notificationError
        );
      }
    }
    setMessageText('');
    setSending(false);
  }
  async function deleteMessage(messageId) {
    if (!messageId) return;

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', currentUserId);

    if (error) {
      console.error('Failed to delete message:', error);
      setError(error.message);
      return;
    }

    setMessages(prev =>
      prev.filter(message => message.id !== messageId)
    );
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`chat-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        payload => {
          const newMessage = payload.new;

          setMessages(prev => {
            if (prev.some(message => message.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`wa-layout ${selectedUser ? 'has-active-chat' : ''}`}>

      <div className="wa-sidebar">
        <div className="wa-sidebar-header">
          <div className="wa-avatar">
            {currentUserId ? 'U' : '?'}
          </div>
          <div className="wa-header-actions">
            <button className="wa-icon-btn" title="New Chat"><MessageCircle size={18} /></button>
            <button className="wa-icon-btn" title="Menu"><MoreHorizontal size={18} /></button>
          </div>
        </div>

        <div className="wa-search-bar">
          <div className="wa-search-input">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="wa-contacts-list">
          {loadingUsers ? (
            <div className="wa-empty-state">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="wa-empty-state">No contacts found</div>
          ) : (
            filteredUsers.map(user => (
              <div
                key={user.user_id}
                className={`wa-contact-tile ${selectedUser?.user_id === user.user_id ? 'active' : ''}`}
                onClick={() => openConversation(user)}
              >
                <div className="wa-avatar">
                  {(user.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="wa-contact-body">
                  <div className="wa-contact-top">
                    <span className="wa-contact-name">{user.email.split('@')[0]}</span>
                  </div>
                  <div className="wa-contact-bottom">
                    <span className="wa-last-msg">{user.email}</span>
                    <span className="wa-role-tag">{roleLabel(user.role)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="wa-chat-panel">
        {!selectedUser ? (
          <div className="wa-welcome-screen">
            <div className="wa-welcome-content">
              <MessageCircle size={48} />
              <h2>Select a contact</h2>
              <p>Choose a conversation from the left to start messaging.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="wa-chat-header">
              <button
                className="wa-back-btn"
                onClick={() => setSelectedUser(null)}
                title="Back to contacts"
              >
                ←
              </button>

              <div className="wa-avatar">
                {(selectedUser.email || '?').charAt(0).toUpperCase()}
              </div>

              <div className="wa-chat-info">
                <strong>{selectedUser.email.split('@')[0]}</strong>
                <span>Active now · {roleLabel(selectedUser.role)}</span>
              </div>

              <div className="wa-header-actions">
                <button className="wa-icon-btn"><Search size={18} /></button>
                <button className="wa-icon-btn"><MoreHorizontal size={18} /></button>
              </div>
            </div>

            <div className="wa-chat-messages">
              {loadingMessages ? (
                <div className="wa-empty-state">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="wa-empty-state">
                  <span>No messages yet. Send a message to start the conversation.</span>
                </div>
              ) : (
                messages.map(message => {
                  const mine = message.sender_id === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`wa-msg-row ${mine ? 'mine' : 'theirs'} ${selectedMessageId === message.id ? 'selected' : ''
                        }`}
                      onClick={() => setSelectedMessageId(message.id)}
                    >
                      <div className="wa-msg-bubble">
                        <div className="wa-msg-text">{message.body}</div>
                        {mine && selectedMessageId === message.id && (
                          <button
                            type="button"
                            className="wa-msg-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(message.id);
                              setSelectedMessageId(null);
                            }}
                            title="Delete message"
                          >
                            Delete
                          </button>
                        )}
                        <div className="wa-msg-meta">
                          <span className="wa-msg-time">
                            {message.created_at
                              ? new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                              : ''}
                          </span>
                          {mine && <span className="wa-msg-status">✓✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="wa-input-area" onSubmit={sendMessage}>
              <button type="button" className="wa-icon-btn" title="Emoji">😊</button>
              <button type="button" className="wa-icon-btn" title="Attach">📎</button>
              <input
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                className="wa-send-btn"
                disabled={sending || !messageText.trim()}
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
      {error && <div className="wa-error-toast">{error}</div>}
    </div>
  );
}
function MDPanel({ deals = [], quotes = [], invoices = [], customers = [], formatAmount, onApprove, onReject, onInviteStaff, onOpenInviteEmail, staffInvitations = [], onRevokeStaffInvitation, staffInvitationActionId }) {
  const [showStaffInvite, setShowStaffInvite] = useState(false);
  // Deals are not commercial approval records; only quotes and invoices can reach MD.
  const approvals = [...quotes.map(x => ({ ...x, _type: 'quote' })), ...invoices.map(x => ({ ...x, _type: 'invoice' }))].filter(item => item.approval_status === 'MD_PENDING');
  const pending = [...quotes, ...invoices].filter(item => ['SALES_PENDING', 'HOS_PENDING', 'MD_PENDING'].includes(item.approval_status)).length;
  return <><PageHeading eyebrow="EXECUTIVE" title="MD Panel" description="Executive overview and final approval queue." action="Invite a worker" onAction={() => setShowStaffInvite(true)} />
    {showStaffInvite && <StaffInviteModal onInvite={onInviteStaff} onOpenEmail={onOpenInviteEmail} onClose={() => setShowStaffInvite(false)} />}
    <StaffInvitationsPanel invitations={staffInvitations} onRevoke={onRevokeStaffInvitation} actionId={staffInvitationActionId} /><div className="stats-grid"><StatCard label="Customers" value={customers.length} hint="Active customer records" tone="blue" icon="C" onClick={() => document.getElementById('md-customers')?.scrollIntoView({ behavior: 'smooth' })} /><StatCard label="Won revenue" value={formatAmount(deals.filter(d => d.stage === 'Won').reduce((s, d) => s + Number(d.amount || 0), 0))} hint="Pipeline revenue" tone="green" icon="$" onClick={() => document.getElementById('md-revenue')?.scrollIntoView({ behavior: 'smooth' })} /><StatCard label="Pending approvals" value={pending} hint="Commercial approval queue" tone="orange" icon="!" onClick={() => document.getElementById('md-approval-queue')?.scrollIntoView({ behavior: 'smooth' })} /><StatCard label="Open invoices" value={invoices.filter(i => !['Paid', 'Cancelled'].includes(i.status)).length} hint="Outstanding billing" tone="purple" icon="I" onClick={() => setPage?.('Invoices')} /></div><div className="panel" id="md-revenue"><div className="panel-heading"><div><h3>MD executive revenue</h3><p>Company-wide revenue visibility.</p></div></div><div className="panel-subsection" id="md-customers"><p>Customers: <strong>{customers.length}</strong> · Won revenue: <strong>{formatAmount(deals.filter(d => d.stage === 'Won').reduce((s, d) => s + Number(d.amount || 0), 0))}</strong> · Open invoices: <strong>{invoices.filter(i => !['Paid', 'Cancelled'].includes(i.status)).length}</strong></p></div></div><div className="panel" id="md-approval-queue"><div className="panel-heading"><div><h3>MD final approval queue</h3><p>Only $50,000+ records reach this queue after HOS approval.</p></div></div><div className="table-wrap"><table><thead><tr><th>Type</th><th>Record</th><th>Amount</th><th>Action</th></tr></thead><tbody>{approvals.length === 0 ? <tr><td colSpan="4">No MD approvals pending.</td></tr> : approvals.map(item => <tr key={`${item._type}-${item.id}`}><td>{item._type}</td><td>{item.title || item.quote_number || item.invoice_number || 'Record'}</td><td>{formatAmount(item.total ?? item.amount)}</td><td><div className="toolbar-actions"><button className="primary-btn" onClick={async () => { try { await onApprove(item._type, item.id) } catch (e) { alert(e.message) } }}>Approve</button><button className="secondary-btn" onClick={async () => { const note = window.prompt('Rejection reason / note:'); if (note) try { await onReject(item._type, item.id, note) } catch (e) { alert(e.message) } }}>Reject</button></div></td></tr>)}</tbody></table></div></div></>;
}

function HOSPanel({
  deals = [],
  quotes = [],
  invoices = [],
  quoteItems = [],
  tickets = [],
  ownerProfiles = {},
  formatAmount,
  onApprove,
  onReject,
  setPage
}) {
  // HOS revenue targets are entered and stored directly in NGN.
  // Deal amounts are stored in the app's base currency, so convert the
  // achieved figure to NGN before comparing it with the NGN target.
  const [revenueTargetNgn, setRevenueTargetNgn] = useState(() => {
    try { return Number(localStorage.getItem('storhet_hos_revenue_target_ngn') || 0); } catch { return 0; }
  });
  const [approvalFilter, setApprovalFilter] = useState('All');
  const [viewRecord, setViewRecord] = useState(null);

  const achievedRevenueBase = deals
    .filter(deal => deal.stage === 'Won')
    .reduce((sum, deal) => sum + Number(deal.amount || 0), 0);
  const achievedRevenueNgn = achievedRevenueBase * EXCHANGE_RATES.NGN.rate;
  const remainingRevenueNgn = Math.max(Number(revenueTargetNgn || 0) - achievedRevenueNgn, 0);

  const formatNaira = value => `₦${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;

  // HOS only receives commercial records explicitly sent to HOS.
  // Deals never appear in this queue.
  const hosRecords = [
    ...quotes
      .filter(q => ['HOS_PENDING', 'APPROVED', 'REJECTED', 'MD_PENDING'].includes(q.approval_status))
      .map(q => ({ ...q, _type: 'Quote', _amount: docAmountUsd(q, 'total'), _idLabel: q.quote_number || q.id })),
    ...invoices
      .filter(i => ['HOS_PENDING', 'APPROVED', 'REJECTED', 'MD_PENDING'].includes(i.approval_status))
      .map(i => ({ ...i, _type: 'Invoice', _amount: docAmountUsd(i, 'amount'), _idLabel: i.invoice_number || i.id }))
  ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const filteredRecords = approvalFilter === 'All'
    ? hosRecords
    : hosRecords.filter(record => {
      if (approvalFilter === 'Pending') return record.approval_status === 'HOS_PENDING';
      if (approvalFilter === 'Approved') return ['APPROVED', 'MD_PENDING'].includes(record.approval_status);
      if (approvalFilter === 'Rejected') return record.approval_status === 'REJECTED';
      return true;
    });

  const pendingCount = hosRecords.filter(r => r.approval_status === 'HOS_PENDING').length;

  const saveRevenueTarget = value => {
    const numeric = Math.max(0, Number(value) || 0);
    setRevenueTargetNgn(numeric);
    try { localStorage.setItem('storhet_hos_revenue_target_ngn', String(numeric)); } catch { }
  };

  const recordSolution = record => {
    if (record._type === 'Quote') {
      const names = quoteItems
        .filter(item => item.quote_id === record.id)
        .map(item => item.product_name)
        .filter(Boolean);
      return [...new Set(names)].join(', ') || record.title || 'Quoted solution';
    }
    return record.title || record.item_type || 'Invoice item';
  };

  const repName = record => {
    const id = record.created_by || record.owner_id || record.assigned_to;
    return ownerProfiles[id] || 'Sales Rep';
  };

  const companyName = record => {
    if (record._type === 'Quote') return record.company || record.customer_name || '—';
    return record.customers?.company || record.customers?.name || record.company || record.customer_name || '—';
  };

  const statusLabel = record => {
    if (record.approval_status === 'HOS_PENDING') return 'Pending';
    if (record.approval_status === 'MD_PENDING') return 'Approved · MD pending';
    if (record.approval_status === 'APPROVED') return 'Approved';
    if (record.approval_status === 'REJECTED') return 'Rejected';
    return 'Pending';
  };

  const isPending = record => record.approval_status === 'HOS_PENDING';

  return <>
    <PageHeading
      eyebrow="SALES LEADERSHIP"
      title="HOS Panel"
      description="Review Sales Rep quotes and invoices, track team revenue, and make HOS commercial decisions."
    />

    <div className="stats-grid">
      <StatCard label="Revenue to be achieved" value={formatNaira(revenueTargetNgn)} hint="Team target for this tracking period" tone="purple" icon="◎" onClick={() => document.getElementById('hos-revenue-analysis')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      <StatCard label="Revenue actually achieved" value={formatNaira(achievedRevenueNgn)} hint="Won deals from Sales Reps" tone="green" icon="✓" onClick={() => document.getElementById('hos-revenue-analysis')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      <StatCard label="Revenue remaining" value={formatNaira(remainingRevenueNgn)} hint="Target less achieved" tone="orange" icon="↗" onClick={() => document.getElementById('hos-revenue-analysis')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      <StatCard label="Pending approvals" value={pendingCount} hint="Quotes & invoices waiting for HOS" tone="orange" icon="!" onClick={() => document.getElementById('hos-approval-queue')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
    </div>

    <div className="panel revenue-analysis-panel" id="hos-revenue-analysis">
      <div className="panel-heading">
        <div>
          <h3>Revenue &amp; Performance</h3>
          <p>Revenue is calculated from Sales Reps' won deals. HOS monitors the result.</p>
        </div>
      </div>
      <div className="revenue-target-row">
        <div>
          <label htmlFor="hos-revenue-target">Revenue target</label>
          <small>Set the team's target for the current tracking period.</small>
        </div>
        <div className="revenue-target-input">
          <span>₦</span>
          <input id="hos-revenue-target" type="number" min="0" step="100000" value={revenueTargetNgn || ''} placeholder="0" onChange={e => saveRevenueTarget(e.target.value)} />
        </div>
      </div>
      <div className="revenue-performance-grid">
        <div className="revenue-performance-card"><span>Revenue target</span><strong>{formatNaira(revenueTargetNgn)}</strong></div>
        <div className="revenue-performance-card"><span>Actually achieved</span><strong>{formatNaira(achievedRevenueNgn)}</strong></div>
        <div className="revenue-performance-card"><span>Remaining</span><strong>{formatNaira(remainingRevenueNgn)}</strong></div>
      </div>
    </div>

    <div className="panel hos-approval-panel" id="hos-approval-queue">
      <div className="panel-heading hos-approval-heading">
        <div>
          <h3>Quotes &amp; Invoices</h3>
          <p>Every row comes from a Sales Rep. HOS does not create or edit the commercial record here.</p>
        </div>
        <div className="hos-filter-tabs">
          {['All', 'Pending', 'Approved', 'Rejected'].map(filter => (
            <button key={filter} type="button" className={approvalFilter === filter ? 'active' : ''} onClick={() => setApprovalFilter(filter)}>
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap hos-approval-table-wrap">
        <table className="hos-approval-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Quote / Invoice ID</th>
              <th>Solution</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Sales Rep</th>
              <th>Company / Customer</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr><td colSpan="8" className="hos-empty-state">No quotes or invoices in this view.</td></tr>
            ) : filteredRecords.map(record => (
              <tr key={`${record._type}-${record.id}`}>
                <td><span className="hos-type-badge">{record._type}</span></td>
                <td><strong>{record._idLabel}</strong></td>
                <td>
                  <div className="hos-solution-cell">
                    <strong>{recordSolution(record)}</strong>
                    {record._type === 'Quote' && record.title && record.title !== recordSolution(record) ? <small>{record.title}</small> : null}
                  </div>
                </td>
                <td><strong>{formatAmount(record._amount)}</strong></td>
                <td><span className={`hos-status-badge ${record.approval_status === 'REJECTED' ? 'is-rejected' : record.approval_status === 'HOS_PENDING' ? 'is-pending' : 'is-approved'}`}>{statusLabel(record)}</span></td>
                <td>{repName(record)}</td>
                <td>
                  <div className="hos-company-cell">
                    <strong>{companyName(record)}</strong>
                    {record._type === 'Quote' && record.customer_name && record.company ? <small>{record.customer_name}</small> : null}
                    {record._type === 'Invoice' && record.customers?.name && record.customers?.company ? <small>{record.customers.name}</small> : null}
                  </div>
                </td>
                <td className="hos-action-cell">
                  <div className="hos-action-buttons">
                    <button type="button" className="secondary-btn" onClick={() => setViewRecord(record)}>View</button>
                    {isPending(record) && <>
                      <button type="button" className="primary-btn" onClick={async () => { try { await onApprove(record._type.toLowerCase(), record.id); } catch (e) { alert(e.message); } }}>Approve</button>
                      <button type="button" className="secondary-btn" onClick={async () => { const note = window.prompt('Why is this quote/invoice being rejected?'); if (!note?.trim()) return; try { await onReject(record._type.toLowerCase(), record.id, note.trim()); } catch (e) { alert(e.message); } }}>Reject</button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {viewRecord && (
      <div className="modal-backdrop" onClick={() => setViewRecord(null)}>
        <div className="modal hos-record-view-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-heading">
            <div>
              <span className="eyebrow">COMMERCIAL RECORD</span>
              <h2>{viewRecord._type} · {viewRecord._idLabel}</h2>
              <p>Read-only view from the Sales Rep's submitted record.</p>
            </div>
            <button type="button" className="icon-btn" onClick={() => setViewRecord(null)}>×</button>
          </div>
          <div className="hos-record-view-grid">
            <div><span>Solution</span><strong>{recordSolution(viewRecord)}</strong></div>
            <div><span>Amount</span><strong>{formatAmount(viewRecord._amount)}</strong></div>
            <div><span>Sales Rep</span><strong>{repName(viewRecord)}</strong></div>
            <div><span>Company / Customer</span><strong>{companyName(viewRecord)}</strong></div>
            <div><span>Status</span><strong>{statusLabel(viewRecord)}</strong></div>
            <div><span>Created</span><strong>{viewRecord.created_at ? formatDate(viewRecord.created_at) : '—'}</strong></div>
          </div>
          {viewRecord._type === 'Quote' && viewRecord.notes && <div className="hos-record-note"><span>Sales Rep notes</span><p>{viewRecord.notes}</p></div>}
          {viewRecord._type === 'Invoice' && viewRecord.notes && <div className="hos-record-note"><span>Sales Rep notes</span><p>{viewRecord.notes}</p></div>}
          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={() => setViewRecord(null)}>Close</button>
            {isPending(viewRecord) && <button type="button" className="primary-btn" onClick={async () => { try { await onApprove(viewRecord._type.toLowerCase(), viewRecord.id); setViewRecord(null); } catch (e) { alert(e.message); } }}>Approve</button>}
          </div>
        </div>
      </div>
    )}
  </>;
}
function HRPanel({ activities = [], authorizedUsers = [], ownerProfiles = {}, customers = [], leads = [] }) {
  const activeEmployees = authorizedUsers.filter(user => user.is_active !== false).length;
  const openWork = activities.filter(activity => isOpenActivity(activity) && !isOverdue(activity));
  const overdueWork = activities.filter(activity => isOverdue(activity));
  const completedWork = activities.filter(activity => activity.status === 'Completed');
  const birthdayContacts = [...customers, ...leads];
  const birthdayContactsToday = birthdayContacts.filter(contact => birthdayIsToday(contact.birthday));
  const getAssignee = activity => activity.assigned_to ? (ownerProfiles[activity.assigned_to] || 'Team member') : 'Unassigned';
  const visibleWork = [...activities]
    .filter(activity => activity.status !== 'Cancelled')
    .sort((a, b) => {
      const aOverdue = isOverdue(a) ? 0 : 1;
      const bOverdue = isOverdue(b) ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      return new Date(a.activity_date || 8.64e15) - new Date(b.activity_date || 8.64e15);
    })
    .slice(0, 8);

  return <>
    <PageHeading eyebrow="PEOPLE & SUPERVISION" title="HR Panel" description="People and work operations across the organization." />
    <div className="stats-grid">
      <StatCard label="Employees" value={activeEmployees} hint="Active staff" tone="green" icon="E" />
      <StatCard label="Pending work" value={openWork.length} hint="Open activities" tone="orange" icon="!" onClick={() => document.getElementById('hr-work-operations')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      <StatCard label="Overdue work" value={overdueWork.length} hint="Past their due date" tone="red" icon="!" onClick={() => document.getElementById('hr-work-operations')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      <StatCard label="Completed work" value={completedWork.length} hint="Completed activities" tone="blue" icon="✓" onClick={() => document.getElementById('hr-work-operations')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      <StatCard label="Birthdays today" value={birthdayContactsToday.length} hint="Customer & lead birthdays" tone="purple" icon="🎂" onClick={() => document.getElementById('hr-birthdays')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
    </div>

    <div className="panel hr-birthday-panel" id="hr-birthdays">
      <div className="panel-heading">
        <div>
          <h3>Birthdays today</h3>
          <p>Customer and lead contacts celebrating today.</p>
        </div>
        <span className="count-badge">{birthdayContactsToday.length}</span>
      </div>
      {birthdayContactsToday.length === 0 ? (
        <div className="birthday-empty">No customer or lead birthdays today.</div>
      ) : (
        <div className="hr-birthday-list">
          {birthdayContactsToday.map(contact => (
            <div className="hr-birthday-row" key={`${contact.id}-${contact.birthday}`}>
              <div className="birthday-avatar">🎂</div>
              <div className="birthday-person">
                <strong>{contact.name || 'Unnamed contact'}</strong>
                <span>{contact.company || 'Lead'}</span>
              </div>
              <strong>{formatBirthday(contact.birthday)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="panel hr-work-operations" id="hr-work-operations">
      <div className="panel-heading">
        <div><h3>Work Operations</h3><p>See the current work assigned across the organization.</p></div>
        <div className="hr-work-summary"><span>{openWork.length} pending</span><span>{overdueWork.length} overdue</span><span>{completedWork.length} completed</span></div>
      </div>
      <div className="table-wrap">
        <table className="hr-work-table">
          <thead><tr><th>Work</th><th>Assigned to</th><th>Priority</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>
            {visibleWork.length === 0 ? <tr><td colSpan="5"><div className="empty-state"><p>No work activities yet.</p></div></td></tr> : visibleWork.map(activity => {
              const overdue = isOverdue(activity);
              return <tr key={activity.id}>
                <td><strong>{activity.title || 'Untitled work'}</strong><small>{activity.type || 'Task'}</small></td>
                <td>{getAssignee(activity)}</td>
                <td><span className={`priority-pill priority-${String(activity.priority || 'Medium').toLowerCase()}`}>{activity.priority || 'Medium'}</span></td>
                <td className={overdue ? 'hr-overdue-date' : ''}>{formatDateTime(activity.activity_date)}</td>
                <td><span className={`status ${overdue ? 'overdue' : String(activity.status || 'Scheduled').toLowerCase().replace(/\s+/g, '-')}`}>{overdue ? 'Overdue' : (activity.status || 'Scheduled')}</span></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>

    <div className="panel role-panel-summary">
      <h3>HR scope</h3>
      <p>HR manages people and work operations. Commercial approvals, pricing, sales ownership and financial records remain outside the HR role.</p>
    </div>
  </>;
}

function TechnicalSupportPanel({ tickets = [], customers = [], formatAmount, currentUserId, ticketError, onAddTicket, onStatusChange, onDeleteTicket, onEditTicket, onViewTicket, isAdmin, role, canManage, staffName, staffOptions, onAssign, setPage }) {
  const open = tickets.filter(t => !['Resolved', 'Closed'].includes(t.status));
  const assigned = tickets.filter(t => t.assigned_to === currentUserId && !['Resolved', 'Closed'].includes(t.status));
  const solved = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status));
  return <>
    <PageHeading eyebrow="TECHNICAL SUPPORT" title="Technical Support Panel" description="Support workload, assigned tickets and customer commercial context." />
    <div className="stats-grid">
      <StatCard label="Open tickets" value={open.length} hint="All open support work" tone="orange" icon="!" onClick={() => document.getElementById('technical-support-tickets')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      <StatCard label="Assigned tickets" value={assigned.length} hint="Assigned to you" tone="blue" icon="A" onClick={() => document.getElementById('technical-support-tickets')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      <StatCard label="Solved tickets" value={solved.length} hint="Resolved or closed" tone="green" icon="✓" onClick={() => document.getElementById('technical-support-tickets')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      <StatCard label="Customers" value={customers.length} hint="Commercial context available" tone="purple" icon="C" onClick={() => setPage?.('Customers')} />
    </div>
    <div className="panel role-panel-summary"><h3>Customer context</h3><p>Technical Support can view customer commercial information and prices when supporting a customer.</p></div>
    <div className="panel technical-ticket-panel" id="technical-support-tickets">
      <div className="panel-heading"><div><h3>Support Tickets</h3><p>Ticket management lives here for Technical Support, so it is not duplicated in the main navigation.</p></div></div>
      <Tickets tickets={tickets} error={ticketError} onAdd={onAddTicket} onStatusChange={onStatusChange} onDelete={onDeleteTicket} onEdit={onEditTicket} onView={onViewTicket} currentUserId={currentUserId} isAdmin={isAdmin} role={role} canCreate={false} canManage={canManage} staffName={staffName} staffOptions={staffOptions} onAssign={onAssign} />
    </div>
  </>;
}

function UserManagement({
  users = [], loading = false, error = '', onRefresh, onUpdateUser, currentUserId,
  pendingPortalAccounts = [], portalRequestsLoading = false, portalRequestsError = '', portalRequestsNotice = '',
  onRefreshPortalRequests, onReviewPortalRequest, portalRequestActionId,
  onInviteStaff, onOpenInviteEmail, staffInvitations = [], onRevokeStaffInvitation, staffInvitationActionId
}) {
  const [draggedUserId, setDraggedUserId] = useState(null);
  const [showStaffInvite, setShowStaffInvite] = useState(false);
  const [dropTargetRole, setDropTargetRole] = useState(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('chart');
  const [pageByRole, setPageByRole] = useState({ hr: 1, head_of_sales: 1, technical_support: 1, sales: 1 });
  const [selectedHeadId, setSelectedHeadId] = useState('');

  const PAGE_SIZE = 8;

  const ROLE_META = {
    manager: { label: 'MD', short: 'MD', tone: 'md', parentRole: null, color: 'green' },
    admin: { label: 'Admin', short: 'Admin', tone: 'admin', parentRole: null, color: 'blue' },
    hr: { label: 'HR', short: 'HR', tone: 'hr', parentRole: 'manager', color: 'yellow' },
    head_of_sales: { label: 'Head of Sales', short: 'Sales', tone: 'sales', parentRole: 'manager', color: 'green' },
    technical_support: { label: 'Technical Support', short: 'Technical', tone: 'technical', parentRole: 'manager', color: 'purple' },
    sales: { label: 'Sales Rep', short: 'Sales Reps', tone: 'sales', parentRole: 'head_of_sales', color: 'green' }
  };

  const usersById = useMemo(() => new Map(users.map(user => [user.id, user])), [users]);
  const mdUsers = useMemo(() => users.filter(user => user.role === 'manager'), [users]);
  const headOfSalesUsers = useMemo(() => users.filter(user => user.role === 'head_of_sales'), [users]);

  const getDisplayName = user => {
    if (!user) return 'Unknown user';
    const local = String(user.email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
    return local ? local.replace(/\b\w/g, char => char.toUpperCase()) : 'Unknown user';
  };

  const getInitials = user => getDisplayName(user).split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';

  const getParentId = user => {
    if (user?.parent_id && usersById.has(user.parent_id) && user.parent_id !== user.id) {
      const parent = usersById.get(user.parent_id);
      if (ROLE_META[user.role]?.parentRole === parent?.role) return user.parent_id;
    }
    if (user?.role === 'sales') return headOfSalesUsers[0]?.id || null;
    if (ROLE_META[user?.role]?.parentRole === 'manager') return mdUsers[0]?.id || null;
    return null;
  };

  const roleUsers = role => users.filter(user => {
    if (user.role !== role) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return `${getDisplayName(user)} ${user.email}`.toLowerCase().includes(query);
  });

  const pageUsers = role => {
    const items = roleUsers(role);
    const page = pageByRole[role] || 1;
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    return {
      items: items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
      page: safePage,
      totalPages,
      total: items.length
    };
  };

  const teamRoles = ['hr', 'head_of_sales', 'technical_support'];
  const adminPage = pageUsers('admin');
  const salesPage = pageUsers('sales');

  useEffect(() => {
    setPageByRole(previous => ({ ...previous, hr: 1, head_of_sales: 1, technical_support: 1, sales: 1 }));
  }, [search]);

  useEffect(() => {
    if (!selectedHeadId && headOfSalesUsers[0]) setSelectedHeadId(headOfSalesUsers[0].id);
    if (selectedHeadId && !headOfSalesUsers.some(user => user.id === selectedHeadId)) {
      setSelectedHeadId(headOfSalesUsers[0]?.id || '');
    }
  }, [headOfSalesUsers, selectedHeadId]);

  const setPage = (role, nextPage) => {
    setPageByRole(previous => ({ ...previous, [role]: Math.max(1, nextPage) }));
  };

  const handleDragStart = (event, user) => {
    if (user.user_id === currentUserId) return;
    setDraggedUserId(user.id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', user.id);
  };

  const handleDragEnd = () => {
    setDraggedUserId(null);
    setDropTargetRole(null);
  };

  const canMoveToRole = (user, role) => {
    if (!user || !ROLE_META[role] || user.user_id === currentUserId) return false;
    if (user.role === role) return true;
    return role !== 'manager';
  };

  const handleDrop = async (event, role) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/plain') || draggedUserId;
    const source = usersById.get(sourceId);
    setDropTargetRole(null);

    if (!source || !canMoveToRole(source, role)) return;

    let parent_id = null;
    if (role === 'sales') parent_id = selectedHeadId || headOfSalesUsers[0]?.id || null;
    if (ROLE_META[role]?.parentRole === 'manager') parent_id = mdUsers[0]?.id || null;
    if (role === 'admin') parent_id = null;

    const updates = {
      role,
      parent_id
    };

    const saved = await onUpdateUser(source.id, updates);
    if (saved) setDraggedUserId(null);
  };

  const updateRole = async (user, role) => {
    if (user.user_id === currentUserId || !ROLE_META[role]) return;
    let parent_id = null;
    if (role === 'sales') parent_id = selectedHeadId || headOfSalesUsers[0]?.id || null;
    if (ROLE_META[role]?.parentRole === 'manager') parent_id = mdUsers[0]?.id || null;
    if (role === 'admin') parent_id = null;
    await onUpdateUser(user.id, { role, parent_id });
  };

  const renderUserRow = (user, compact = false) => {
    const meta = ROLE_META[user.role] || { label: roleLabel(user.role), tone: 'other' };
    const isCurrentUser = user.user_id === currentUserId;
    const isDragging = draggedUserId === user.id;

    return (
      <div
        key={user.id}
        className={`org-team-user ${isDragging ? 'is-dragging' : ''}`}
        draggable={!isCurrentUser}
        onDragStart={event => handleDragStart(event, user)}
        onDragEnd={handleDragEnd}
      >
        <div className={`org-user-avatar tone-${meta.tone}`}>{getInitials(user)}</div>
        <div className="org-team-user-main">
          <strong>{getDisplayName(user)}</strong>
          <span>{user.email}</span>
        </div>
        <span className={`org-status-dot ${user.status || 'inactive'}`} title={user.status || 'inactive'} />
        {!compact && (
          <select
            value={user.role}
            disabled={isCurrentUser}
            onChange={event => updateRole(user, event.target.value)}
            aria-label={`Role for ${getDisplayName(user)}`}
          >
            {ROLE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        )}
        <GripVertical className="org-user-drag-handle" size={16} />
      </div>
    );
  };

  const renderTeamCard = role => {
    const meta = ROLE_META[role];
    const data = pageUsers(role);
    const isDropTarget = dropTargetRole === role;

    return (
      <div
        className={`org-team-card tone-${meta.tone} ${isDropTarget ? 'is-drop-target' : ''}`}
        onDragOver={event => {
          const source = usersById.get(draggedUserId);
          if (!source || !canMoveToRole(source, role)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          setDropTargetRole(role);
        }}
        onDragLeave={() => setDropTargetRole(previous => previous === role ? null : previous)}
        onDrop={event => handleDrop(event, role)}
      >
        <div className="org-team-card-head">
          <div className={`org-team-icon tone-${meta.tone}`}>{meta.short.slice(0, 2).toUpperCase()}</div>
          <div className="org-team-title">
            <div>
              <strong>{meta.label}</strong>
              <span>{users.filter(user => user.role === role).length} {role === 'sales' ? 'sales reps' : 'members'}</span>
            </div>
            <button type="button" className="org-team-more" title="Team options"><MoreHorizontal size={17} /></button>
          </div>
        </div>

        {role === 'head_of_sales' && headOfSalesUsers.length > 1 && (
          <label className="org-manager-select">
            Sales reports to
            <select value={selectedHeadId} onChange={event => setSelectedHeadId(event.target.value)}>
              {headOfSalesUsers.map(head => <option key={head.id} value={head.id}>{getDisplayName(head)}</option>)}
            </select>
          </label>
        )}

        <div className="org-team-user-list">
          {data.items.length === 0 ? (
            <div className="org-team-empty">{search ? 'No matching users.' : `No ${meta.label.toLowerCase()} users yet.`}</div>
          ) : data.items.map(user => renderUserRow(user))}
        </div>

        {data.totalPages > 1 && (
          <div className="org-team-pagination">
            <button type="button" className="icon-btn" disabled={data.page <= 1} onClick={() => setPage(role, data.page - 1)} aria-label="Previous page">‹</button>
            <span>{data.page} / {data.totalPages}</span>
            <button type="button" className="icon-btn" disabled={data.page >= data.totalPages} onClick={() => setPage(role, data.page + 1)} aria-label="Next page">›</button>
          </div>
        )}
      </div>
    );
  };

  const md = mdUsers[0] || null;

  return (
    <>
      <PageHeading
        eyebrow="ADMIN"
        title="User Management"
        description="Manage your organization, teams and reporting structure."
      />

      <div className="user-management-toolbar">
        <div className="user-management-search">
          <Search size={16} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search users by name or email..."
            aria-label="Search users"
          />
        </div>

        <div className="user-management-toolbar-actions">
          <div className="org-view-toggle" role="tablist" aria-label="User management view">
            <button type="button" className={view === 'chart' ? 'active' : ''} onClick={() => setView('chart')}>Organization Chart</button>
            <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>List View</button>
          </div>
          <button type="button" className="secondary-btn" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={14} /> {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button type="button" className="primary-btn" onClick={() => alert('User creation can be connected to your existing authorization flow next.')}>
            <UserPlus size={15} /> Add User
          </button>
        </div>
      </div>

      <div className="user-management-summary">
        <div><span>Total users</span><strong>{users.length}</strong></div>
        <div><span>Sales Reps</span><strong>{users.filter(user => user.role === 'sales').length}</strong></div>
        <div><span>Technical Support</span><strong>{users.filter(user => user.role === 'technical_support').length}</strong></div>
        <div><span>HR</span><strong>{users.filter(user => user.role === 'hr').length}</strong></div>
        <div><span>Admins</span><strong>{users.filter(user => user.role === 'admin').length}</strong></div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {view === 'chart' ? (
        <div className="panel user-management-panel org-management-shell">
          <div className="org-management-header">
            <div>
              <h3>Organization Structure</h3>
              <p>Drag a user onto a team to move them. The reporting lines follow the company hierarchy.</p>
            </div>
            <div className="org-hierarchy-legend">
              <span><i className="legend-line" /> Reporting structure</span>
              <span><GripVertical size={14} /> Drag & drop</span>
            </div>
          </div>

          {loading ? (
            <div className="org-loading">Loading organization...</div>
          ) : users.length === 0 ? (
            <div className="org-tree-empty"><strong>No authorized users found</strong><p>Authorized staff will appear here once they are added.</p></div>
          ) : (
            <div className="modern-org-chart">
              <div className="org-level org-level-md">
                {md ? (
                  <div
                    className={`org-md-card ${draggedUserId === md.id ? 'is-dragging' : ''}`}
                    draggable={md.user_id !== currentUserId}
                    onDragStart={event => handleDragStart(event, md)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="org-md-avatar">{getInitials(md)}</div>
                    <div>
                      <span className="org-card-eyebrow">MANAGING DIRECTOR</span>
                      <strong>{getDisplayName(md)}</strong>
                      <small>{md.email}</small>
                    </div>
                    <span className="org-active-dot" />
                  </div>
                ) : (
                  <div className="org-missing-md">
                    <strong>MD not assigned</strong>
                    <span>Assign a user to the Manager (MD) role to create the organization root.</span>
                  </div>
                )}
              </div>

              <div className="org-connector org-connector-main" />

              <div className="org-direct-reports">
                {teamRoles.map(role => (
                  <div className="org-department-column" key={role}>
                    <div className="org-department-connector" />
                    {renderTeamCard(role)}
                    {role === 'head_of_sales' && (
                      <>
                        <div className="org-sales-connector" />
                        <div className="org-sales-section">
                          <div className="org-sales-heading">
                            <div>
                              <span>TEAM</span>
                              <strong>Sales Reps</strong>
                            </div>
                            <b>{salesPage.total}</b>
                          </div>
                          <div
                            className={`org-sales-card ${dropTargetRole === 'sales' ? 'is-drop-target' : ''}`}
                            onDragOver={event => {
                              const source = usersById.get(draggedUserId);
                              if (!source || !canMoveToRole(source, 'sales')) return;
                              event.preventDefault();
                              event.dataTransfer.dropEffect = 'move';
                              setDropTargetRole('sales');
                            }}
                            onDragLeave={() => setDropTargetRole(previous => previous === 'sales' ? null : previous)}
                            onDrop={event => handleDrop(event, 'sales')}
                          >
                            {salesPage.items.length === 0 ? (
                              <div className="org-team-empty">{search ? 'No matching sales reps.' : 'No sales reps yet.'}</div>
                            ) : salesPage.items.map(user => renderUserRow(user, true))}
                          </div>
                          {salesPage.totalPages > 1 && (
                            <div className="org-team-pagination">
                              <button type="button" className="icon-btn" disabled={salesPage.page <= 1} onClick={() => setPage('sales', salesPage.page - 1)}>‹</button>
                              <span>{salesPage.page} / {salesPage.totalPages}</span>
                              <button type="button" className="icon-btn" disabled={salesPage.page >= salesPage.totalPages} onClick={() => setPage('sales', salesPage.page + 1)}>›</button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="org-admin-section">
                <div className="org-admin-section-head">
                  <div>
                    <span>SYSTEM ACCESS</span>
                    <strong>Administrators</strong>
                    <p>Admin remains a full internal role. It is managed separately from the reporting hierarchy above.</p>
                  </div>
                  <b>{adminPage.total}</b>
                </div>
                <div
                  className={`org-admin-card ${dropTargetRole === 'admin' ? 'is-drop-target' : ''}`}
                  onDragOver={event => {
                    const source = usersById.get(draggedUserId);
                    if (!source || !canMoveToRole(source, 'admin')) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    setDropTargetRole('admin');
                  }}
                  onDragLeave={() => setDropTargetRole(previous => previous === 'admin' ? null : previous)}
                  onDrop={event => handleDrop(event, 'admin')}
                >
                  {adminPage.items.length === 0 ? (
                    <div className="org-team-empty">{search ? 'No matching admins.' : 'No administrators yet.'}</div>
                  ) : adminPage.items.map(user => renderUserRow(user, true))}
                </div>
                {adminPage.totalPages > 1 && (
                  <div className="org-team-pagination">
                    <button type="button" className="icon-btn" disabled={adminPage.page <= 1} onClick={() => setPage('admin', adminPage.page - 1)}>‹</button>
                    <span>{adminPage.page} / {adminPage.totalPages}</span>
                    <button type="button" className="icon-btn" disabled={adminPage.page >= adminPage.totalPages} onClick={() => setPage('admin', adminPage.page + 1)}>›</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="panel user-management-panel org-list-panel">
          <div className="panel-header">
            <div><h3>All Internal Users</h3><p>Search and manage individual users without rendering the entire organization at once.</p></div>
          </div>
          <div className="org-list">
            {users.filter(user => {
              const query = search.trim().toLowerCase();
              return !query || `${getDisplayName(user)} ${user.email}`.toLowerCase().includes(query);
            }).map(user => (
              <div className="org-list-row" key={user.id}>
                <div className={`org-user-avatar tone-${ROLE_META[user.role]?.tone || 'other'}`}>{getInitials(user)}</div>
                <div className="org-list-user">
                  <strong>{getDisplayName(user)}</strong>
                  <span>{user.email}</span>
                </div>
                <span className={`org-role-badge tone-${ROLE_META[user.role]?.tone || 'other'}`}>{ROLE_META[user.role]?.label || roleLabel(user.role)}</span>
                <span className={`org-status-dot ${user.status || 'inactive'}`} />
                <select value={user.role} disabled={user.user_id === currentUserId} onChange={event => updateRole(user, event.target.value)}>
                  {ROLE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <GripVertical size={16} className="org-user-drag-handle" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel user-management-panel pending-customer-access-panel">
        <div className="panel-header">
          <div><h3>Pending Customer Access</h3><p>Review portal registrations. Approving creates and links a new customer record; it does not assign an internal staff role.</p></div>
          <button type="button" className="secondary-btn" onClick={onRefreshPortalRequests} disabled={portalRequestsLoading}>{portalRequestsLoading ? 'Refreshing...' : 'Refresh requests'}</button>
        </div>
        {portalRequestsError && <div className="error-message">{portalRequestsError}</div>}
        {portalRequestsNotice && <div className="success-message">{portalRequestsNotice}</div>}
        {portalRequestsLoading ? <p>Loading pending customer access...</p> : pendingPortalAccounts.length === 0 ? <p>No pending customer portal registrations.</p> : (
          <div className="table-wrapper"><table className="data-table">
            <thead><tr><th>Customer name</th><th>Email</th><th>Registered</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{pendingPortalAccounts.map((request) => <tr key={request.id}>
              <td>{request.full_name || '—'}</td><td>{request.email}</td><td>{request.created_at ? new Date(request.created_at).toLocaleDateString() : '—'}</td>
              <td><span className="portal-request-status">Pending</span></td><td className="portal-request-actions">
                <button type="button" className="primary-btn" disabled={portalRequestActionId === request.user_id} onClick={() => onReviewPortalRequest(request.user_id, 'approve')}>{portalRequestActionId === request.user_id ? 'Processing...' : 'Approve & Create Customer'}</button>
                <button type="button" className="secondary-btn" disabled={portalRequestActionId === request.user_id} onClick={() => onReviewPortalRequest(request.user_id, 'reject')}>Reject</button>
              </td>
            </tr>)}</tbody>
          </table></div>
        )}
      </div>

      <StaffInvitationsPanel invitations={staffInvitations} onRevoke={onRevokeStaffInvitation} actionId={staffInvitationActionId} onInvite={() => setShowStaffInvite(true)} />
      {showStaffInvite && <StaffInviteModal onInvite={onInviteStaff} onOpenEmail={onOpenInviteEmail} onClose={() => setShowStaffInvite(false)} />}
    </>
  );
}

function StaffInviteModal({ onInvite, onOpenEmail, onClose }) {
  const [emailValue, setEmailValue] = useState('');
  const [role, setRole] = useState('sales');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [copied, setCopied] = useState(false);
  const invitableRoles = ROLE_OPTIONS.filter(r => r.value !== 'admin');
  const roleLabel = ROLE_OPTIONS.find(r => r.value === role)?.label || role;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSending(true);
    try {
      const result = await onInvite(emailValue.trim(), role);
      setLink(result.link);
      setExpiresAt(result.expiresAt);
    } catch (err) {
      setError(err.message || 'Could not create the invitation.');
    } finally {
      setSending(false);
    }
  }

  function copyLink() {
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function sendByEmail() {
    onOpenEmail({
      to: emailValue.trim(),
      subject: "You're invited to join Storhet CRM",
      body: `Hi,

You've been invited to join Storhet CRM as ${roleLabel}.

Create your account here:
${link}

This link expires on ${expiresAt ? new Date(expiresAt).toLocaleDateString() : 'in 7 days'}.

Thanks,`
    });
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <div className="modal-heading">
          <div><h2>Invite a worker</h2><p>They will skip the usual approval queue and land straight in Storhet CRM with the role you pick.</p></div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close invite form"><X size={18} /></button>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        {link ? (
          <>
            <p className="detail-empty">Invitation created. Share this link with them, it expires in 7 days.</p>
            <div className="invite-link-row">
              <input type="text" value={link} readOnly onFocus={e => e.target.select()} />
              <button type="button" className="secondary-btn" onClick={copyLink}>{copied ? 'Copied' : 'Copy'}</button>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={onClose}>Done</button>
              {onOpenEmail && <button type="button" className="primary-btn" onClick={sendByEmail}>Send via email</button>}
            </div>
          </>
        ) : (
          <>
            <label>Email address
              <input type="email" value={emailValue} onChange={e => setEmailValue(e.target.value)} required />
            </label>
            <label>Role
              <select value={role} onChange={e => setRole(e.target.value)}>
                {invitableRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </label>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={onClose} disabled={sending}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={sending}>{sending ? 'Creating link…' : 'Create invite link'}</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

function StaffInvitationsPanel({ invitations = [], onRevoke, actionId, onInvite }) {
  const status = invite => invite.revoked_at ? 'Revoked' : invite.accepted_at ? 'Accepted' : new Date(invite.expires_at) < new Date() ? 'Expired' : 'Pending';
  return (
    <div className="panel user-management-panel pending-customer-access-panel">
      <div className="panel-header">
        <div><h3>Staff Invitations</h3><p>Workers invited directly by the MD or an Admin, skipping the sign-up approval queue.</p></div>
        {onInvite && <button type="button" className="primary-btn" onClick={onInvite}>Invite a worker</button>}
      </div>
      {invitations.length === 0 ? <p>No invitations sent yet.</p> : (
        <div className="table-wrapper"><table className="data-table">
          <thead><tr><th>Email</th><th>Role</th><th>Sent</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{invitations.map(invite => {
            const s = status(invite); return <tr key={invite.id}>
              <td>{invite.email}</td>
              <td>{ROLE_OPTIONS.find(r => r.value === invite.role)?.label || invite.role}</td>
              <td>{invite.created_at ? new Date(invite.created_at).toLocaleDateString() : '—'}</td>
              <td>{invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : '—'}</td>
              <td><span className={`portal-request-status invite-status-${s.toLowerCase()}`}>{s}</span></td>
              <td className="portal-request-actions">
                {s === 'Pending' && onRevoke && <button type="button" className="secondary-btn" disabled={actionId === invite.id} onClick={() => onRevoke(invite.id)}>{actionId === invite.id ? 'Revoking...' : 'Revoke'}</button>}
              </td>
            </tr>;
          })}</tbody>
        </table></div>
      )}
    </div>
  );
}

export default App;