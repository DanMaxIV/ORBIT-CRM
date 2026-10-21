import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from './lib/supabase';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import listPlugin from '@fullcalendar/react/list';
import interactionPlugin from '@fullcalendar/react/interaction';
import '@fullcalendar/react/skeleton.css';
import { LayoutDashboard, Users, Kanban, CalendarCheck, BarChart3, Settings, Bell, Search, Plus, ArrowUpRight, MoreHorizontal, Menu, X, UserRound, Pencil, Receipt, LogOut, UserCog, MessageCircle, UserPlus, Mail, CalendarDays, FileText, Workflow, TrendingUp, Tags, DollarSign, CreditCard, Upload, Download, Play, Target, CheckCircle2, ArrowLeft, ChevronRight, Building2, RefreshCw } from 'lucide-react';

// Lets every page heading refresh the latest workspace data without prop-drilling.
const RefreshContext = createContext(null);

function AuthScreen({ onGoogleSignIn, onEmailSignIn, onEmailSignUp, onPortalSignUp, authMode, setAuthMode, email, setEmail, password, setPassword,
  error,
  notice,
  loading
}) {

  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showPortalSignup, setShowPortalSignup] = useState(false);
  const [portalFullName, setPortalFullName] = useState('');

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
    try { return localStorage.getItem('orbit_portal_currency') || localStorage.getItem('orbit_currency') || 'NGN'; } catch { return 'NGN'; }
  });

  useEffect(() => {
    try { localStorage.setItem('orbit_portal_currency', currency); } catch { /* storage unavailable */ }
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
    const config = EXCHANGE_RATES[currency] || EXCHANGE_RATES.NGN;
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
  { title: 'Work & Support', items: [['Activities', CalendarCheck], ['Calendar', CalendarDays], ['Technical Support', UserCog], ['Tickets', Receipt], ['Documents', FileText]] },
  { title: 'Communication', items: [['Email', Mail], ['Chat', MessageCircle]] },
  { title: 'Automation & Insights', items: [['Automation', Workflow], ['Segments', Tags]] },
  { title: 'System', items: [['Settings', Settings]] }
];

const EXCHANGE_RATES = {
  NGN: { symbol: '₦', rate: 1400 },
  USD: { symbol: '$', rate: 1 },
  EUR: { symbol: '€', rate: 0.92 }
};



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

  const [page, setPage] = useState('Dashboard');
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
  const [newCustomer, setNewCustomer] = useState({ name: '', company: '', email: '', phone: '', job_title: '', birthday: '', status: 'Active' });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openCustomerMenu, setOpenCustomerMenu] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activities, setActivities] = useState([]);
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
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');

  const [currency, setCurrency] = useState(() => {
    try { return localStorage.getItem('orbit_currency') || 'NGN'; } catch { return 'NGN'; }
  });
  useEffect(() => {
    try { localStorage.setItem('orbit_currency', currency); } catch { /* storage unavailable */ }
  }, [currency]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('email_connected');
    const emailError = params.get('email_error');
    if (connected) { showToast(`${connected === 'gmail' ? 'Gmail' : 'Outlook'} connected successfully.`); fetchEmailIntegrations(); window.history.replaceState({}, document.title, window.location.pathname); }
    if (emailError) { setEmailIntegrationError(emailError); setPage('Email'); window.history.replaceState({}, document.title, window.location.pathname); }
  }, [session]);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 5000);
  };

  const formatAmount = (amountInUSD) => {
    const numericAmount = Number(amountInUSD) || 0;
    const config = EXCHANGE_RATES[currency] || EXCHANGE_RATES.NGN;
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
  async function signInWithGoogle() {
    setAuthError('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });

    if (error) {
      console.error('Google sign-in error:', error);
      setAuthError(error.message);
    }
  }
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
            role: 'member',
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

    setAuthorizationLoading(false);
    await supabase.auth.signOut();
    if (!justSignedUp.current) {
      setAuthError('Your internal CRM account has not been approved yet. Please contact your administrator.');
    }
  };
  const fetchCustomers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Error fetching customers:", error);
    } else {
      setCustomers(data);
    }

    setLoading(false);
  };
  const fetchDeals = async () => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching deals:', error);
    } else {
      setDeals(data || []);
    }
  };
  async function fetchActivities() {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('activity_date', { ascending: true });
    if (error) {
      console.error('Error fetching activities:', error);
      return;
    }
    setActivities(data || []);
  }
  async function fetchTickets() {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
      *,
      customers (
        name,
        company
      )
    `)
      .order('created_at', { ascending: false });

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
    const { data, error } = await supabase.from('leads')
      .select('*, customers(name,company)')
      .order('created_at', { ascending: false });
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
  async function fetchEmailLogs() { const { data, error } = await supabase.from('email_logs').select('*, customers(name,company)').order('sent_at', { ascending: false }); if (error) { console.error('Error fetching email logs:', error); return; } setEmailLogs(data || []); }
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
    const { data, error } = await supabase.from('calendar_events').select('*, customers(name,company)').order('start_at', { ascending: true });
    if (error) { console.error('Error fetching calendar events:', error); return; }
    setCalendarEvents(data || []);
    createDueCalendarNotifications(data || []);
  }
  async function fetchQuotes() {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });
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
  async function fetchInvoices() { const { data, error } = await supabase.from('invoices').select('*, customers(name,company)').order('created_at', { ascending: false }); if (error) { console.error('Error fetching invoices:', error); return; } setInvoices(data || []); }
  async function fetchPayments() { const { data, error } = await supabase.from('payments').select('*').order('paid_at', { ascending: false }); if (error) { console.error('Error fetching payments:', error); return; } setPayments(data || []); }
  async function fetchDocuments() { const { data, error } = await supabase.from('documents').select('*, customers(name,company)').order('created_at', { ascending: false }); if (error) { console.error('Error fetching documents:', error); return; } setDocuments(data || []); }
  async function fetchWorkflows() { const { data, error } = await supabase.from('workflows').select('*').order('created_at', { ascending: false }); if (error) { console.error('Error fetching workflows:', error); return; } setWorkflows(data || []); }
  async function fetchSegments() { const { data, error } = await supabase.from('customer_segments').select('*').order('created_at', { ascending: false }); if (error) { console.error('Error fetching segments:', error); return; } setSegments(data || []); }
  async function fetchProducts() { const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }); if (error) { console.error('Error fetching products:', error); return; } setProducts(data || []); }
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
  async function addEmailLog(payload) { const { data, error } = await supabase.from('email_logs').insert([{ ...payload, created_by: session.user.id }]).select('*, customers(name,company)').single(); if (error) throw error; setEmailLogs(prev => [data, ...prev]); return data; }
  async function addCalendarEvent(payload) { const { data, error } = await supabase.from('calendar_events').insert([{ ...payload, created_by: session.user.id }]).select('*, customers(name,company)').single(); if (error) throw error; setCalendarEvents(prev => [...prev, data].sort((a, b) => new Date(a.start_at) - new Date(b.start_at))); return data; }
  async function updateCalendarEvent(id, payload) { const { data, error } = await supabase.from('calendar_events').update(payload).eq('id', id).select('*, customers(name,company)').single(); if (error) throw error; setCalendarEvents(prev => prev.map(x => x.id === id ? data : x)); return data; }
  async function deleteCalendarEvent(id) { const { error } = await supabase.from('calendar_events').delete().eq('id', id); if (error) throw error; setCalendarEvents(prev => prev.filter(x => x.id !== id)); }
  async function addQuote(payload, items = []) {
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

    return quoteToInsert;
  }

  async function updateQuote(id, payload, items = []) {
    const currentQuote = quotes.find(quote => quote.id === id);
    const persistedQuote = currentQuote?.id?.toString().startsWith('local-')
      ? await resolvePersistedQuote(currentQuote)
      : currentQuote || { id };
    const realId = persistedQuote.id;

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

  async function addInvoice(payload) { const { data, error } = await supabase.from('invoices').insert([{ ...payload, created_by: session.user.id }]).select('*, customers(name,company)').single(); if (error) throw error; setInvoices(prev => [data, ...prev]); return data; }
  async function updateInvoice(id, payload) { const { data, error } = await supabase.from('invoices').update(payload).eq('id', id).select('*, customers(name,company)').single(); if (error) throw error; setInvoices(prev => prev.map(x => x.id === id ? data : x)); return data; }
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
    if (authorizationProfile?.role !== 'admin') throw new Error('Only an admin can manage solution support assignments.');
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

  async function fetchAuthorizedUsers() {
    setUsersLoading(true);
    setUsersError('');

    const { data, error } = await supabase
      .from('authorized_users')
      .select('id, email, role, status, created_at, user_id')
      .order('created_at', { ascending: false });
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
    if (page === 'UserManagement' && authorizationProfile?.role === 'admin') {
      fetchPendingPortalAccounts();
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
  const canManageTicket = ticket =>
    authorizationProfile?.role === 'admin' ||
    ticket.created_by === session?.user?.id ||
    ticket.assigned_to === session?.user?.id ||
    (ticket.source === 'portal' && !ticket.assigned_to);

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
      const jobs = [
        fetchCustomers(), fetchDeals(), fetchActivities(), fetchTickets(), fetchStaffUsers(),
        fetchLeads(), fetchLeadProducts(), fetchDealProducts(), fetchEmailLogs(), fetchCalendarEvents(),
        fetchQuotes(), fetchQuoteItems(), fetchInvoices(), fetchPayments(), fetchDocuments(),
        fetchWorkflows(), fetchSegments(), fetchProducts(), fetchSupportEngineers(),
        fetchSolutionSupport(), fetchDealSupport(), fetchNotifications(), fetchOwnerProfiles(),
        fetchEmailIntegrations()
      ];

      if (authorizationProfile?.role === 'admin') {
        jobs.push(fetchAuthorizedUsers(), fetchPendingPortalAccounts());
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
    if (!authorized || authorizationProfile?.role !== 'admin') {
      return;
    }

    fetchAuthorizedUsers();
  }, [authorized, authorizationProfile?.role]);
  // Fetch notifications 
  useEffect(() => {
    if (!session?.user?.id) return;

    fetchNotifications();
    fetchProfile();
    fetchOwnerProfiles();
  }, [session?.user?.id]);
  // Fetch when page loads
  useEffect(() => {
    if (!session || !authorized) return;

    fetchCustomers();
    fetchDeals();
    fetchActivities();
    fetchTickets();
    fetchStaffUsers();
    fetchEmailIntegrations(); fetchLeads(); fetchLeadProducts(); fetchDealProducts(); fetchDealSupport(); fetchSolutionSupport(); fetchSupportEngineers(); fetchEmailLogs(); fetchCalendarEvents(); fetchQuotes(); fetchQuoteItems(); fetchInvoices(); fetchPayments(); fetchDocuments(); fetchWorkflows(); fetchSegments(); fetchProducts();
  }, [session, authorized]);

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
        await fetchCalendarEvents();
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
            status: newCustomer.status || 'Active'
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
          status: 'Active'
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
            stage: newDeal.stage,
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

  if (!session || !authorized) {
    return (
      <AuthScreen
        onGoogleSignIn={signInWithGoogle}
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
        {navSections.map(section => (
          <div className="nav-section" key={section.title} style={{ marginBottom: 10 }}>
            <div className="nav-section-title" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", opacity: .55, padding: "10px 14px 6px", textTransform: "uppercase" }}>{section.title}</div>
            {section.items.map(([label, Icon]) => (
              <button key={label} className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => { setPage(label); setSidebarOpen(false); }}>
                <Icon size={18} /><span>{label}</span>
              </button>
            ))}
          </div>
        ))}
        {authorizationProfile?.role === 'admin' && (
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
              {authorizationProfile?.role
                ? authorizationProfile.role.charAt(0).toUpperCase() +
                authorizationProfile.role.slice(1)
                : 'Member'}
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
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                  overflow: 'hidden'
                }}
              >
                {globalSearchResults.length === 0 ? (
                  <div style={{ padding: '14px', fontSize: '14px', color: '#6b7280' }}>
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
                      style={{
                        width: '100%',
                        display: 'block',
                        textAlign: 'left',
                        padding: '12px 14px',
                        border: 'none',
                        borderBottom: '1px solid #f1f5f9',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '14px' }}>
                        {result.title}
                      </strong>

                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
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
        {page === 'Dashboard' && (
          <Dashboard revenue={revenue} customers={customers} leads={leads} deals={deals} activities={activities} tickets={tickets} setPage={setPage} formatAmount={formatAmount} onSelectCustomer={setSelectedCustomer} onEditCustomer={setEditingCustomer} onDeleteCustomer={deleteCustomer} />
        )}
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
          />
        )}
        {page === 'Products' && <Products products={products} supportEngineers={supportEngineers} solutionSupport={solutionSupport} onAdd={addProduct} onUpdate={updateProduct} onDelete={deleteProduct} onUpdateFamilySupport={syncSolutionSupport} currentUserId={session.user.id} isAdmin={authorizationProfile?.role === 'admin'} />}
        {page === 'Technical Support' && <SupportEngineers supportEngineers={supportEngineers} solutionSupport={solutionSupport} onAdd={addSupportEngineer} onUpdate={updateSupportEngineer} onDeactivate={deactivateSupportEngineer} isAdmin={authorizationProfile?.role === 'admin'} />}
        {page === 'Leads' && <Leads leads={leads} customers={customers} products={products} leadProducts={leadProducts} onAdd={addLead} onUpdate={updateLead} onSyncProducts={syncLeadProducts} onDelete={deleteLead} currentUserId={session.user.id} isAdmin={authorizationProfile?.role === 'admin'} />}
        {page === 'Email' && <EmailPage emailLogs={emailLogs} customers={customers} integrations={emailIntegrations} loading={emailIntegrationLoading} error={emailIntegrationError} onConnect={connectEmailProvider} onDisconnect={disconnectEmailProvider} onAdd={async payload => { try { await addEmailLog(payload); showToast('Email logged.'); } catch (e) { alert(e.message); } }} />}
        {page === 'Calendar' && <CalendarPage events={calendarEvents} customers={customers} onAdd={addCalendarEvent} onUpdate={updateCalendarEvent} onDelete={deleteCalendarEvent} onRefresh={fetchCalendarEvents} />}
        {page === 'Quotes' && <Quotes quotes={quotes} products={products} quoteItems={quoteItems} onLoadQuoteItems={loadQuoteItems} onAdd={addQuote} onUpdate={updateQuote} onDelete={deleteQuote} formatAmount={formatAmount} currentUserId={session.user.id} isAdmin={authorizationProfile?.role === 'admin'} />}
        {page === 'Invoices' && <Invoices invoices={invoices} payments={payments} customers={customers} products={products} onAdd={addInvoice} onUpdate={updateInvoice} onAddPayment={addPayment} formatAmount={formatAmount} currentUserId={session.user.id} isAdmin={authorizationProfile?.role === 'admin'} />}
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
            isAdmin={authorizationProfile?.role === 'admin'}
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
          <Activities activities={activities} customers={customers} ownerProfiles={ownerProfiles} currentUserEmail={session.user.email} onAdd={() => { setActivityError(''); setNewActivity(a => ({ ...a, customer_id: '' })); setShowActivityForm(true); }} onStatusChange={updateActivityStatus} onDelete={deleteActivity} onEdit={activity => { setEditActivityError(''); setEditingActivity({ ...activity, activity_date: formatDateTimeLocal(activity.activity_date) }); }} onView={setSelectedActivity} currentUserId={session.user.id} isAdmin={authorizationProfile?.role === 'admin'} />
        )}
        {page === 'Tickets' && (
          <Tickets
            tickets={tickets}
            error={ticketError}
            onAdd={() => { setTicketError(''); setNewTicket(t => ({ ...t, customer_id: '' })); setShowTicketForm(true); }}
            onStatusChange={updateTicketStatus}
            onDelete={deleteTicket}
            onEdit={ticket => { setEditTicketError(''); setEditingTicket(ticket); }}
            onView={setSelectedTicket}
            currentUserId={session.user.id}
            isAdmin={authorizationProfile?.role === 'admin'}
            canManage={canManageTicket}
            staffName={staffName}
            staffOptions={getStaffOptions()}
            onAssign={assignTicket}
          />
        )}
        {page === 'Chat' && <Chat />}
        {page === 'Reports' && <AdvancedReports customers={customers} deals={deals} activities={activities} tickets={tickets} leads={leads} quotes={quotes} invoices={invoices} payments={payments} formatAmount={formatAmount} />}
        {page === 'Email Logs' && <EmailLogs emailLogs={emailLogs} customers={customers} onAdd={addEmailLog} />}
        {page === 'UserManagement' && <UserManagement users={authorizedUsers} loading={usersLoading} error={usersError} onRefresh={fetchAuthorizedUsers} onUpdateUser={updateAuthorizedUser} currentUserId={session?.user?.id} pendingPortalAccounts={pendingPortalAccounts} portalRequestsLoading={portalRequestsLoading} portalRequestsError={portalRequestsError} portalRequestsNotice={portalRequestsNotice} onRefreshPortalRequests={fetchPendingPortalAccounts} onReviewPortalRequest={reviewPortalRequest} portalRequestActionId={portalRequestActionId} />}
        {page === 'Settings' && <SettingsPage currency={currency} setCurrency={setCurrency} />}
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
    {selectedCustomer && (
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
                    if (notification.read) return;

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
                    if (notification.type === 'new_chat') {
                      setPage('Chat');
                      setShowNotifications(false);
                    }
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

function BirthdayField({ value, onChange, label = 'Birthday' }) {
  return <label>{label}<input type="date" value={value || ''} onChange={e => onChange(e.target.value)} /></label>;
}

function birthdayIsToday(value, now = new Date()) {
  if (!value) return false;
  const parts = String(value).slice(0, 10).split('-');
  if (parts.length !== 3) return false;
  return Number(parts[1]) === now.getMonth() + 1 && Number(parts[2]) === now.getDate();
}

function formatBirthday(value) {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
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

function StatCard({ label, value, change, hint, icon, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-change">
        {change != null ? <><span>{change}</span><small>vs last month</small></> : <small>{hint}</small>}
      </div>
    </div>
  );
}

function Dashboard({ revenue, customers, leads = [], deals, activities, tickets, setPage, formatAmount, onSelectCustomer, onEditCustomer, onDeleteCustomer }) {
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
      <StatCard label="Revenue (won deals)" value={formatAmount(revenue)} change={trend(thisMonthRevenue, lastMonthRevenue)} tone="purple" icon="↗" />
      <StatCard label="Customers" value={customers.length} change={trend(newCustomers, lastNewCustomers)} tone="blue" icon="♙" />
      <StatCard label="Open pipeline" value={formatAmount(sumAmount(openDeals))} hint={`${openDeals.length} open deals`} tone="orange" icon="◈" />
      <StatCard label="Win rate" value={`${winRate.toFixed(1)}%`} hint={`${wonDeals.length} of ${deals.length} deals won`} tone="green" icon="◉" />
      <StatCard label="Overdue activities" value={overdueCount} hint={overdueCount ? 'Needs attention' : 'You are on track'} tone="orange" icon="◷" />
      <StatCard label="Due today" value={dueTodayCount} hint="Activity reminders" tone="blue" icon="!" />
      <StatCard label="Open tickets" value={openTickets} hint={`${tickets.length} tickets in total`} tone="blue" icon="✉" />
      <StatCard label="Average deal size" value={formatAmount(avgDeal)} hint="Across won deals" tone="purple" icon="◆" />
      <StatCard label="Deals won" value={wonDeals.length} hint={`${formatAmount(sumAmount(wonDeals))} closed`} tone="green" icon="✓" />
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
      <div className="birthday-empty">When a contact has a birthday today, Orbit will surface them here with a ready-to-send greeting.</div>
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

function CustomerTable({ customers, deals = [], formatAmount, onSelectCustomer, onEditCustomer, onDeleteCustomer }) {
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
            <th>Mail / Contact</th>
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
              <tr key={c.id}>
                <td onClick={() => onSelectCustomer?.(c)} style={{ cursor: onSelectCustomer ? 'pointer' : 'default' }}>
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
                    <span>{c.email || '—'}</span>
                    <span>{c.phone || '—'}</span>
                    {c.job_title && <small>{c.job_title}</small>}
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
                        <button className="secondary-btn" type="button" onClick={() => { setOpenMenuId(null); onEditCustomer?.(c); }}>Edit</button>
                        <button className="secondary-btn" type="button" onClick={() => { setOpenMenuId(null); onDeleteCustomer?.(c.id); }}>Delete</button>
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

function Customers({ customers, allCustomers, deals, search, setSearch, statusFilter, setStatusFilter, onAdd, onImport, formatAmount, onSelectCustomer, onEditCustomer, onDeleteCustomer }) {
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
      <PageHeading eyebrow="RELATIONSHIPS" title="Customers" description="Manage customer contacts, job titles, birthdays and relationships." action="New customer" onAction={onAdd} />
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
    ['quote', 'Quotes', myQuotes.map(q => ({ id: q.id, title: q.title || q.quote_number, meta: `${q.quote_number || 'Quote'} · ${q.status || 'Draft'} · ${formatAmount(q.total ?? q.amount)}` }))],
    ['invoice', 'Invoices', invoices.filter(i => i.customer_id === customer.id).map(i => ({ id: i.id, title: i.title || i.invoice_number, meta: `${i.invoice_number || 'Invoice'} · ${i.status} · ${formatAmount(i.amount)}` }))],
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
  const paidTotal = myPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const outstanding = myInvoices.filter(i => !['Paid', 'Cancelled'].includes(i.status)).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const status = customer.status || 'Active';

  const timeline = [
    ...myDeals.map(d => ({ key: `d-${d.id}`, kind: 'Deal', title: d.title, meta: `${d.stage} · ${formatAmount(d.amount)}`, date: d.created_at })),
    ...myActivities.map(a => ({ key: `a-${a.id}`, kind: 'Activity', title: a.title, meta: `${a.type || 'Task'} · ${a.status || 'Scheduled'}`, date: a.activity_date || a.created_at })),
    ...myTickets.map(t => ({ key: `t-${t.id}`, kind: 'Ticket', title: t.title, meta: `${t.priority || 'Medium'} · ${t.status}`, date: t.created_at })),
    ...myInvoices.map(i => ({ key: `i-${i.id}`, kind: 'Invoice', title: i.title || i.invoice_number || 'Invoice', meta: `${i.invoice_number || 'Invoice'} · ${i.status || 'Draft'} · ${formatAmount(i.amount)}`, date: i.created_at })),
    ...myPayments.map(p => ({ key: `p-${p.id}`, kind: 'Payment', title: `Payment received · ${formatAmount(p.amount)}`, meta: `${p.payment_method || 'Payment'}${p.reference ? ` · Ref ${p.reference}` : ''}`, date: p.paid_at || p.created_at })),
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
function Pipeline({ deals, customers, dealSupport = [], supportEngineers = [], moveDeal, deleteDeal, onEdit, onAdd, formatAmount, currentUserId, ownerProfiles = {}, isAdmin }) {
  const [query, setQuery] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [dragOver, setDragOver] = useState(null);
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
  const canEditDeal = deal => isAdmin || deal.created_by === currentUserId;

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
                      {canEdit && (
                        <div className="deal-actions">
                          <button type="button" className="icon-btn" title="Edit deal" onClick={() => onEdit(deal)}><Pencil size={16} /></button>
                          <button type="button" className="icon-btn" title="Delete deal" onClick={() => deleteDeal(deal.id)}><X size={16} /></button>
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
    </>
  );
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

function Tickets({ tickets, error, onAdd, onStatusChange, onDelete, onEdit, onView, currentUserId, isAdmin, canManage, staffName, staffOptions, onAssign }) {
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

function EmailPage({ emailLogs, customers, integrations, loading, error, onConnect, onDisconnect, onAdd }) {
  const [showLog, setShowLog] = useState(false);
  useEffect(() => { const handler = () => setShowLog(true); window.addEventListener('orbit-open-email-log', handler); return () => window.removeEventListener('orbit-open-email-log', handler); }, []);
  return <>
    <PageHeading eyebrow="COMMUNICATIONS" title="Email" description="Connect Gmail or Outlook and keep customer communication in your CRM." />
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
    <PageHeading eyebrow="COMMUNICATIONS" title="Email" description="Log customer emails and keep communication history in one place." action="Log email" onAction={() => setShow(true)} />
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
          eventTimeFormat={{ hour:'numeric', minute:'2-digit', meridiem:'short' }}
          eventDisplay="block"
        />
        <div className="orbit-calendar-legend">
          <span className="orbit-calendar-legend-item"><span className="orbit-calendar-legend-dot" style={{ background:'#10b981' }} />Meeting / Demo</span>
          <span className="orbit-calendar-legend-item"><span className="orbit-calendar-legend-dot" style={{ background:'#6366f1' }} />Follow-up</span>
          <span className="orbit-calendar-legend-item"><span className="orbit-calendar-legend-dot" style={{ background:'#0ea5e9' }} />Call</span>
          <span className="orbit-calendar-legend-item"><span className="orbit-calendar-legend-dot" style={{ background:'#f59e0b' }} />Reminder</span>
          <span className="orbit-calendar-legend-item"><span className="orbit-calendar-legend-dot" style={{ background:'#8b5cf6' }} />Task</span>
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
          <input required value={form.title} onChange={e => setForm({ ...form, title:e.target.value })} placeholder="e.g. Follow up with Kenya" />
        </label>

        <label>Customer
          <select value={form.customer_id} onChange={e => setForm({ ...form, customer_id:e.target.value })}>
            <option value="">No customer / general event</option>
            {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}{customer.company ? ` — ${customer.company}` : ''}</option>)}
          </select>
        </label>

        <div className="calendar-form-grid">
          <label>Start
            <input type="datetime-local" required value={form.start_at || ''} onChange={e => setForm({ ...form, start_at:e.target.value })} />
          </label>
          <label>End
            <input type="datetime-local" value={form.end_at || ''} onChange={e => setForm({ ...form, end_at:e.target.value })} />
          </label>
        </div>

        <div className="calendar-form-grid">
          <label>Type
            <select value={form.event_type} onChange={e => setForm({ ...form, event_type:e.target.value })}>
              {['Meeting','Follow-up','Call','Reminder','Task','Demo','Other'].map(type => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label>Status
            <select value={form.status} onChange={e => setForm({ ...form, status:e.target.value })}>
              {['Scheduled','Completed','Cancelled'].map(status => <option key={status}>{status}</option>)}
            </select>
          </label>
        </div>

        <label>Reminder
          <select value={form.reminder_minutes == null ? '' : String(form.reminder_minutes)} onChange={e => setForm({ ...form, reminder_minutes:e.target.value })}>
            {reminderOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <span className="calendar-form-help">The reminder will appear in your Storhet notification bell.</span>
        </label>

        <label>Location
          <input value={form.location || ''} onChange={e => setForm({ ...form, location:e.target.value })} placeholder="Office, Zoom, customer site, etc." />
        </label>

        <label>Description
          <textarea rows="5" value={form.description || ''} onChange={e => setForm({ ...form, description:e.target.value })} placeholder="Add notes, follow-up details or instructions..." />
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

function Quotes({ quotes = [], products = [], quoteItems = [], onLoadQuoteItems, onAdd, onUpdate, onDelete, formatAmount, currentUserId, isAdmin }) {
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState('');
  const [expandedVendor, setExpandedVendor] = useState(null);

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
    terms: ''
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

  const moneyNumber = value => Number(value) || 0;
  const lineSubtotal = item => moneyNumber(item.quantity) * moneyNumber(item.unit_price);
  const lineTotal = item => Math.max(0, lineSubtotal(item) - moneyNumber(item.discount) + moneyNumber(item.tax));
  const subtotal = items.reduce((sum, item) => sum + lineSubtotal(item), 0);
  const discount = items.reduce((sum, item) => sum + moneyNumber(item.discount), 0);
  const tax = items.reduce((sum, item) => sum + moneyNumber(item.tax), 0);
  const total = Math.max(0, subtotal - discount + tax);

  const productsByVendor = vendors.reduce((groups, vendor) => {
    groups[vendor] = products.filter(product => (product.vendor || '').trim().toLowerCase() === vendor.toLowerCase());
    return groups;
  }, {});

  const openNew = () => {
    setEditing(null);
    setError('');
    setExpandedVendor(null);
    setForm({ ...blank, quote_number: `Q-${Date.now().toString().slice(-6)}` });
    setItems([emptyItem()]);
    setShow(true);
  };

  const openEdit = async quote => {
    setEditing(quote);
    setLoadingItems(true);
    setError('');
    setExpandedVendor(null);
    setForm({ ...blank, ...quote });
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
    if (!form.customer_name.trim() && !form.company.trim()) return setError('Enter a customer name or company.');
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Enter a valid customer email address.');
    if (!validItems.length) return setError('Add at least one product or solution to the quote.');
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
      total,
      payment_terms: form.payment_terms.trim() || null,
      delivery_terms: form.delivery_terms.trim() || null,
      notes: form.notes.trim() || null,
      terms: form.terms.trim() || null
    };

    const itemPayload = validItems.map(item => ({
      product_id: item.product_id || null,
      product_name: item.product_name,
      description: item.description?.trim() || null,
      quantity: moneyNumber(item.quantity),
      unit_price: moneyNumber(item.unit_price),
      discount: moneyNumber(item.discount),
      tax: moneyNumber(item.tax),
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
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? <tr><td colSpan="7">No quotes yet.</td></tr> : quotes.map(q => (
              <tr key={q.id}>
                <td><strong>{q.quote_number}</strong><div className="deal-customer">{q.title}</div></td>
                <td>{q.customer_name || q.company || '—'}{q.company && q.customer_name ? <div className="deal-customer">{q.company}</div> : null}</td>
                <td>{formatAmount(q.total)}</td>
                <td>{q.status}</td>
                <td>{q.valid_until ? formatDate(q.valid_until) : '—'}</td>
                <td>{q.created_at ? formatDate(q.created_at) : '—'}</td>
                <td>{(isAdmin || q.created_by === currentUserId) && <div className="toolbar-actions"><button className="secondary-btn" onClick={() => openEdit(q)}>Edit</button><button type="button" className="icon-btn" title="Delete quote" onClick={async () => { if (!window.confirm('Delete this quote?')) return; try { await onDelete(q.id); } catch (err) { alert(err.message || 'Unable to delete quote.'); } }}><X size={16} /></button></div>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

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
          <label>Customer name<input placeholder="Contact / customer name" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} /></label>
          <label>Company<input placeholder="Company name" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></label>
          <label>Email<input type="email" placeholder="customer@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Phone<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
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
              <label>Unit price<input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(index, { unit_price: e.target.value })} /></label>
              <label>Discount<input type="number" min="0" step="0.01" value={item.discount} onChange={e => updateItem(index, { discount: e.target.value })} /></label>
              <label>Tax<input type="number" min="0" step="0.01" value={item.tax} onChange={e => updateItem(index, { tax: e.target.value })} /></label>
            </div>
            <div className="quote-line-total"><span>Line total</span><strong>{formatAmount(lineTotal(item))}</strong></div>
          </div>)}
        </div>

        <div className="quote-total-card">
          <div><span>Subtotal</span><strong>{formatAmount(subtotal)}</strong></div>
          <div><span>Discount</span><strong>- {formatAmount(discount)}</strong></div>
          <div><span>Tax</span><strong>{formatAmount(tax)}</strong></div>
          <div className="grand-total"><span>Total</span><strong>{formatAmount(total)}</strong></div>
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
function Invoices({ invoices, payments, customers, products, onAdd, onUpdate, onAddPayment, formatAmount, currentUserId, isAdmin }) {
  const [show, setShow] = useState(false);
  const [pay, setPay] = useState(null);
  const [preview, setPreview] = useState(null);
  const blank = {
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    title: '',
    customer_id: '',
    product_id: '',
    item_type: 'Product',
    quantity: 1,
    unit_price: 0,
    amount: 0,
    due_date: '',
    payment_terms: 'Due on receipt',
    status: 'Draft',
    notes: ''
  };
  const [form, setForm] = useState(blank);

  const setInvoiceField = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        next.amount = Math.max(0, Number(next.quantity) || 0) * Math.max(0, Number(next.unit_price) || 0);
      }
      return next;
    });
  };

  const availableInvoiceProducts = products.filter(product => (product.status || 'Active') === 'Active' && (product.type || 'Product') === form.item_type);

  const setInvoiceProduct = productId => {
    const product = products.find(item => item.id === productId);
    if (!product) {
      setForm(prev => ({ ...prev, product_id: '', title: '', unit_price: 0, amount: 0 }));
      return;
    }

    const unitPrice = Math.max(0, Number(product.unit_price) || 0);
    const quantity = Math.max(1, Number(form.quantity) || 1);
    setForm(prev => ({
      ...prev,
      product_id: product.id,
      title: product.name,
      item_type: product.type || 'Product',
      unit_price: unitPrice,
      amount: quantity * unitPrice
    }));
  };

  const setInvoiceItemType = value => {
    setForm(prev => ({
      ...prev,
      item_type: value,
      product_id: '',
      title: '',
      unit_price: 0,
      amount: 0
    }));
  };

  const setPaymentTerms = value => {
    const today = new Date();
    let dueDate = '';

    if (value === 'Due on receipt') {
      dueDate = today.toISOString().slice(0, 10);
    } else if (value.startsWith('Net ')) {
      const days = Number(value.replace('Net ', '')) || 0;
      today.setDate(today.getDate() + days);
      dueDate = today.toISOString().slice(0, 10);
    }

    setForm(prev => ({
      ...prev,
      payment_terms: value,
      due_date: value === 'Custom' ? prev.due_date : dueDate
    }));
  };

  const save = async e => {
    e.preventDefault();
    try {
      const payload = {
        invoice_number: form.invoice_number,
        title: form.title,
        customer_id: form.customer_id || null,
        product_id: form.product_id || null,
        item_type: form.item_type || 'Product',
        quantity: Number(form.quantity) || 1,
        unit_price: Number(form.unit_price) || 0,
        amount: Number(form.amount) || 0,
        due_date: form.due_date || null,
        status: form.status,
        notes: form.notes || ''
      };
      await onAdd(payload);
      setShow(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const paymentSave = async e => {
    e.preventDefault();
    try {
      await onAddPayment({ ...pay, payment_method: pay.payment_method || 'Bank transfer' });
      setPay(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const getCustomer = invoice => {
    return customers.find(customer => customer.id === invoice.customer_id) || null;
  };

  return <>
    <PageHeading
      eyebrow="BILLING"
      title="Invoices & payments"
      description="Track invoices, balances and payments."
      action="New invoice"
      onAction={() => {
        setForm({ ...blank, invoice_number: `INV-${Date.now().toString().slice(-6)}` });
        setShow(true);
      }}
    />

    <div className="stats-grid">
      <StatCard label="Invoiced" value={formatAmount(invoices.reduce((s, x) => s + Number(x.amount || 0), 0))} hint={`${invoices.length} invoices`} tone="blue" icon="$" />
      <StatCard label="Paid" value={formatAmount(payments.reduce((s, x) => s + Number(x.amount || 0), 0))} hint={`${payments.length} payments`} tone="green" icon="✓" />
      <StatCard label="Outstanding" value={formatAmount(invoices.filter(x => !['Paid', 'Cancelled'].includes(x.status)).reduce((s, x) => s + Number(x.amount || 0), 0))} hint="Open balances" tone="orange" icon="!" />
    </div>

    <div className="panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Status</th><th>Due</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? <tr><td colSpan="6">No invoices yet.</td></tr> : invoices.map(i => (
              <tr key={i.id}>
                <td><strong>{i.invoice_number}</strong><div className="deal-customer">{i.title}</div></td>
                <td>{i.customers?.name || '—'}</td>
                <td>{formatAmount(i.amount)}</td>
                <td>{i.status}</td>
                <td>{i.due_date ? formatDate(i.due_date) : '—'}</td>
                <td>
                  <div className="toolbar-actions">
                    <button type="button" className="secondary-btn" onClick={() => setPreview(i)}>
                      <FileText size={15} /> View
                    </button>
                    {(isAdmin || i.created_by === currentUserId) && <button className="secondary-btn" onClick={() => onUpdate(i.id, { status: i.status === 'Paid' ? 'Sent' : 'Paid' })}>{i.status === 'Paid' ? 'Reopen' : 'Mark paid'}</button>}
                    {i.status !== 'Paid' && <button className="secondary-btn" onClick={() => setPay({ invoice_id: i.id, amount: i.amount, paid_at: new Date().toISOString().slice(0, 16), payment_method: 'Bank transfer' })}>Record payment</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {show && <div className="modal-backdrop" onClick={() => setShow(false)}>
      <form className="modal invoice-form-modal" onSubmit={save} onClick={e => e.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <h2>New invoice</h2>
            <span className="invoice-form-subtitle">Create a simple professional invoice for your customer.</span>
          </div>
          <button type="button" className="icon-btn" onClick={() => setShow(false)}><X size={18} /></button>
        </div>

        <div className="invoice-form-section">
          <div className="invoice-form-section-title">Invoice details</div>
          <div className="invoice-form-grid">
            <label>
              Invoice number
              <input required value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} />
            </label>

            <label>
              Customer
              <select required value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>)}
              </select>
            </label>

            <label>
              Invoice date
              <input type="date" value={new Date().toISOString().slice(0, 10)} readOnly />
            </label>

            <label className="invoice-payment-terms-field">
              Payment terms
              <select value={form.payment_terms} onChange={e => setPaymentTerms(e.target.value)}>
                <option>Due on receipt</option>
                <option>Net 15</option>
                <option>Net 30</option>
                <option>Net 45</option>
                <option>Net 60</option>
                <option>Custom</option>
              </select>
              <span className="invoice-payment-term-help">
                {form.payment_terms === 'Due on receipt'
                  ? 'Payment is due when the invoice is received.'
                  : form.payment_terms === 'Custom'
                    ? 'Choose the exact due date below.'
                    : `Payment is due ${form.payment_terms.replace('Net ', '')} days after the invoice date.`}
              </span>
            </label>

            <label>
              Due date
              <input type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </label>

            <label>
              Status
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'].map(x => <option key={x}>{x}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="invoice-form-section">
          <div className="invoice-form-section-title">Items</div>
          <div className="invoice-item-editor">
            <label>
              Type
              <select value={form.item_type} onChange={e => setInvoiceItemType(e.target.value)}>
                <option value="Product">Product</option>
                <option value="Service">Service</option>
              </select>
            </label>

            <label className="invoice-item-description">
              Item / service
              <select required value={form.product_id} onChange={e => setInvoiceProduct(e.target.value)}>
                <option value="">Select from solutions</option>
                {availableInvoiceProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}{product.vendor ? ` · ${product.vendor}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Qty
              <input type="number" min="1" step="1" value={form.quantity} onChange={e => setInvoiceField('quantity', e.target.value)} />
            </label>

            <label>
              Unit price
              <input type="number" min="0" step="0.01" value={form.unit_price} readOnly />
              <span className="invoice-payment-term-help">Pulled from the selected solution.</span>
            </label>

            <div className="invoice-item-total">
              <span>Amount</span>
              <strong>{formatAmount(form.amount)}</strong>
            </div>
          </div>
          {form.item_type && availableInvoiceProducts.length === 0 && (
            <div className="invoice-item-empty">No active {form.item_type.toLowerCase()} solutions have a selling price in the catalogue yet.</div>
          )}

          <div className="invoice-form-total">
            <span>Total</span>
            <strong>{formatAmount(form.amount)}</strong>
          </div>
        </div>

        <div className="invoice-form-section">
          <div className="invoice-form-section-title">Notes</div>
          <label>
            Customer notes
            <textarea rows="3" placeholder="Thank you for your business." value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={() => setShow(false)}>Cancel</button>
          <button className="primary-btn">Create invoice</button>
        </div>
      </form>
    </div>}

    {pay && <div className="modal-backdrop" onClick={() => setPay(null)}>
      <form className="modal" onSubmit={paymentSave} onClick={e => e.stopPropagation()}>
        <div className="modal-heading"><h2>Record payment</h2><button type="button" className="icon-btn" onClick={() => setPay(null)}><X size={18} /></button></div>
        <label>Amount<input type="number" min="0" value={pay.amount} onChange={e => setPay({ ...pay, amount: Number(e.target.value) })} /></label>
        <label>Method<select value={pay.payment_method} onChange={e => setPay({ ...pay, payment_method: e.target.value })}>{['Bank transfer', 'Card', 'Cash', 'Online', 'Other'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Date<input type="datetime-local" value={pay.paid_at} onChange={e => setPay({ ...pay, paid_at: e.target.value })} /></label>
        <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setPay(null)}>Cancel</button><button className="primary-btn">Save payment</button></div>
      </form>
    </div>}

    {preview && (() => {
      const customer = getCustomer(preview);
      const invoiceDate = preview.created_at || new Date().toISOString();
      const amount = Number(preview.amount || 0);
      return <div className="invoice-preview-backdrop" onClick={() => setPreview(null)}>
        <div className="invoice-preview-shell" onClick={e => e.stopPropagation()}>
          <div className="invoice-preview-toolbar">
            <div>
              <strong>Invoice preview</strong>
              <span>Temporary document template</span>
            </div>
            <div className="invoice-preview-actions">
              <button type="button" className="secondary-btn" onClick={() => window.print()}><Download size={15} /> Print / Save PDF</button>
              <button type="button" className="icon-btn" onClick={() => setPreview(null)}><X size={18} /></button>
            </div>
          </div>

          <div className="invoice-print-sheet">
            <header className="invoice-document-header">
              <div className="invoice-company-block">
                <img src="/storhet-logo.png" alt="Storhet Solutions" className="invoice-company-logo" />
                <div>
                  <h2>STORHET SOLUTIONS</h2>
                  <p>Technology Solutions & Services</p>
                </div>
              </div>
              <div className="invoice-title-block">
                <div className="invoice-document-title">INVOICE</div>
                <div className="invoice-status-pill">{preview.status || 'Draft'}</div>
              </div>
            </header>

            <div className="invoice-document-rule" />

            <section className="invoice-meta-grid">
              <div>
                <span className="invoice-label">BILL TO</span>
                <strong>{customer?.name || preview.customers?.name || 'Customer'}</strong>
                {customer?.company && <span>{customer.company}</span>}
                {customer?.email && <span>{customer.email}</span>}
                {customer?.phone && <span>{customer.phone}</span>}
              </div>
              <div className="invoice-details-box">
                <div><span>Invoice #</span><strong>{preview.invoice_number}</strong></div>
                <div><span>Invoice Date</span><strong>{formatDate(invoiceDate)}</strong></div>
                <div><span>Due Date</span><strong>{preview.due_date ? formatDate(preview.due_date) : '—'}</strong></div>
              </div>
            </section>

            <table className="invoice-document-table">
              <thead><tr><th>#</th><th>ITEM &amp; DESCRIPTION</th><th>QTY</th><th>RATE</th><th>AMOUNT</th></tr></thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td><strong>{preview.title || 'Professional services'}</strong><span>{preview.item_type || 'Product'} · Storhet Solutions solution delivery</span></td>
                  <td>{preview.quantity || 1}</td>
                  <td>{formatAmount(preview.unit_price ?? amount)}</td>
                  <td>{formatAmount(amount)}</td>
                </tr>
              </tbody>
            </table>

            <section className="invoice-bottom-grid">
              <div className="invoice-notes-block">
                <span className="invoice-label">NOTES</span>
                <p>{preview.notes || 'Thank you for your business.'}</p>
              </div>
              <div className="invoice-totals-block">
                <div><span>Subtotal</span><strong>{formatAmount(amount)}</strong></div>
                <div><span>Discount</span><strong>{formatAmount(0)}</strong></div>
                <div className="invoice-total-row"><span>TOTAL</span><strong>{formatAmount(amount)}</strong></div>
                <div className="invoice-balance-row"><span>BALANCE DUE</span><strong>{formatAmount(amount)}</strong></div>
              </div>
            </section>

            <footer className="invoice-document-footer">
              <div>
                <strong>Payment / Terms</strong>
                <p>Please make payment by the stated due date. Payment details can be added here later.</p>
              </div>
              <div className="invoice-thank-you">Thank you for doing business with<br /><strong>STORHET SOLUTIONS</strong>.</div>
            </footer>
          </div>
        </div>
      </div>;
    })()}
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
function AdvancedReports({ customers, deals, activities, tickets, leads, quotes, invoices, payments, formatAmount }) { const pipeline = deals.filter(d => !['Won', 'Lost'].includes(d.stage)).reduce((s, d) => s + Number(d.amount || 0), 0); const won = deals.filter(d => d.stage === 'Won').reduce((s, d) => s + Number(d.amount || 0), 0); const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0); const leadConversion = leads.length ? leads.filter(l => l.status === 'Converted').length / leads.length * 100 : 0; const overdue = invoices.filter(i => i.status === 'Overdue').length; const response = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length; return <><PageHeading eyebrow="INSIGHTS" title="Advanced reports" description="Cross-module performance, conversion and revenue intelligence." /><div className="stats-grid"><StatCard label="Won revenue" value={formatAmount(won)} hint={`${deals.filter(d => d.stage === 'Won').length} won deals`} tone="green" icon="✓" /><StatCard label="Weighted forecast" value={formatAmount(deals.filter(d => !['Won', 'Lost'].includes(d.stage)).reduce((s, d) => s + Number(d.amount || 0) * stageProbability(d.stage), 0))} hint="Probability weighted" tone="purple" icon="↗" /><StatCard label="Lead conversion" value={`${leadConversion.toFixed(1)}%`} hint={`${leads.filter(l => l.status === 'Converted').length}/${leads.length} converted`} tone="blue" icon="◉" /><StatCard label="Collected" value={formatAmount(paid)} hint="Recorded payments" tone="orange" icon="$" /></div><div className="report-grid"><div className="panel report-summary"><h3>Sales funnel</h3><BarRow label="Leads" percent={100} display={leads.length} /><BarRow label="Qualified" percent={leads.length ? (leads.filter(l => l.status === 'Qualified').length / leads.length * 100) : 0} display={leads.filter(l => l.status === 'Qualified').length} /><BarRow label="Won deals" percent={leads.length ? (deals.filter(d => d.stage === 'Won').length / leads.length * 100) : 0} display={deals.filter(d => d.stage === 'Won').length} /></div><div className="panel report-summary"><h3>Revenue</h3><BarRow label="Open pipeline" percent={pipeline + won ? (pipeline / (pipeline + won)) * 100 : 0} display={formatAmount(pipeline)} /><BarRow label="Won" percent={pipeline + won ? (won / (pipeline + won)) * 100 : 0} display={formatAmount(won)} /><BarRow label="Collected" percent={won ? Math.min(100, paid / won * 100) : 0} display={formatAmount(paid)} /></div><div className="panel report-summary"><h3>Operations</h3><BarRow label="Activities completed" percent={activities.length ? activities.filter(a => a.status === 'Completed').length / activities.length * 100 : 0} display={`${activities.filter(a => a.status === 'Completed').length}/${activities.length}`} /><BarRow label="Tickets resolved" percent={tickets.length ? response / tickets.length * 100 : 0} display={`${response}/${tickets.length}`} /><BarRow label="Overdue invoices" percent={invoices.length ? overdue / invoices.length * 100 : 0} display={overdue} /></div><div className="panel report-summary"><h3>Quotes</h3><BarRow label="Accepted" percent={quotes.length ? quotes.filter(q => q.status === 'Accepted').length / quotes.length * 100 : 0} display={quotes.filter(q => q.status === 'Accepted').length} /><BarRow label="Sent" percent={quotes.length ? quotes.filter(q => q.status === 'Sent').length / quotes.length * 100 : 0} display={quotes.filter(q => q.status === 'Sent').length} /><BarRow label="Rejected" percent={quotes.length ? quotes.filter(q => q.status === 'Rejected').length / quotes.length * 100 : 0} display={quotes.filter(q => q.status === 'Rejected').length} /></div></div></> }
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
function SettingsPage({ currency, setCurrency }) {
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
        <label>Display currency
          <select value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value)}>
            <option value="NGN">NGN — Nigerian Naira (₦)</option>
            <option value="USD">USD — US Dollar ($)</option>
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
                    <span className="wa-role-tag">{user.role}</span>
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
                <span>Active now · {selectedUser.role}</span>
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
function UserManagement({
  users = [], loading = false, error = '', onRefresh, onUpdateUser, currentUserId,
  pendingPortalAccounts = [], portalRequestsLoading = false, portalRequestsError = '', portalRequestsNotice = '',
  onRefreshPortalRequests, onReviewPortalRequest, portalRequestActionId
}) {
  return (
    <>
      <PageHeading eyebrow="ADMIN" title="User Management" description="Manage internal users and customer portal access separately." />

      <div className="panel user-management-panel">
        <div className="panel-header">
          <div><h3>Authorized Users</h3><p>Manage internal CRM users and their permissions.</p></div>
          <button type="button" className="secondary-btn" onClick={onRefresh} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
        </div>
        {error && <div className="error-message">{error}</div>}
        {loading ? <p>Loading users...</p> : users.length === 0 ? <p>No authorized users found.</p> : (
          <div className="table-wrapper"><table className="data-table">
            <thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>{users.map((user) => {
              const isCurrentUser = user.user_id === currentUserId;
              return <tr key={user.id}>
                <td>{user.email}</td>
                <td><select value={user.role} disabled={isCurrentUser} onChange={(event) => onUpdateUser(user.id, { role: event.target.value })}>
                  <option value="admin">Admin</option><option value="manager">Manager</option><option value="member">Member</option>
                </select></td>
                <td><select value={user.status} disabled={isCurrentUser} onChange={(event) => onUpdateUser(user.id, { status: event.target.value })}>
                  <option value="pending">Pending</option><option value="active">Active</option><option value="inactive">Inactive</option>
                </select></td>
                <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                <td>{user.status === 'pending' ? <button type="button" className="primary-btn" onClick={() => onUpdateUser(user.id, { status: 'active' })}>Approve</button> : <span className="user-management-edit-label">{isCurrentUser ? 'Current account' : 'Editable'}</span>}</td>
              </tr>;
            })}</tbody>
          </table></div>
        )}
      </div>

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
              <td>{request.full_name || '—'}</td><td>{request.email}</td>
              <td>{request.created_at ? new Date(request.created_at).toLocaleDateString() : '—'}</td>
              <td><span className="portal-request-status">Pending</span></td>
              <td className="portal-request-actions">
                <button type="button" className="primary-btn" disabled={portalRequestActionId === request.user_id} onClick={() => onReviewPortalRequest(request.user_id, 'approve')}>{portalRequestActionId === request.user_id ? 'Processing...' : 'Approve & Create Customer'}</button>
                <button type="button" className="secondary-btn" disabled={portalRequestActionId === request.user_id} onClick={() => onReviewPortalRequest(request.user_id, 'reject')}>Reject</button>
              </td>
            </tr>)}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}

export default App;
