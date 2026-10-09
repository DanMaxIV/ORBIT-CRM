import { useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from './lib/supabase';
import { LayoutDashboard, Users, Kanban, CalendarCheck, BarChart3, Settings, Bell, Search, Plus, ArrowUpRight, MoreHorizontal, Menu, X, UserRound, Pencil, Receipt, LogOut, UserCog, MessageCircle, UserPlus, Mail, CalendarDays, FileText, Workflow, TrendingUp, Tags, DollarSign, CreditCard, Upload, Download, Play, Target, CheckCircle2 } from 'lucide-react';

function AuthScreen({ onGoogleSignIn, onEmailSignIn, onEmailSignUp, authMode, setAuthMode, email, setEmail, password, setPassword,
  error,
  notice,
  loading
}) {

  const [showSignupModal, setShowSignupModal] = useState(false);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><OrbitLogo /></div>
          <span>
            orbit<span className="brand-accent">CRM</span>
          </span>
        </div>
        <div className="auth-heading">
          <h1>Welcome back</h1>
          <p>Sign in to access your Orbit CRM workspace.</p>
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

        <p className="auth-footer">
          Access is restricted to authorized Orbit CRM users.
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
                <p>Sign up for Orbit CRM access.</p>
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
    </div>
  );
}

const navSections = [
  { title: 'Overview', items: [['Dashboard', LayoutDashboard], ['Reports', BarChart3]] },
  { title: 'Customers & Sales', items: [['Customers', Users], ['Leads', UserPlus], ['Pipeline', Kanban], ['Products', FileText], ['Quotes', FileText], ['Invoices', CreditCard], ['Forecast', TrendingUp]] },
  { title: 'Work & Support', items: [['Activities', CalendarCheck], ['Calendar', CalendarDays], ['Tickets', Receipt], ['Documents', FileText]] },
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
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  const [page, setPage] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [ownerProfiles, setOwnerProfiles] = useState({});
  const [showDealForm, setShowDealForm] = useState(false);
  const [newDeal, setNewDeal] = useState({ title: '', company: '', amount: '', stage: 'New Lead', customer_id: '', new_customer_name: '', new_customer_email: '', new_customer_company: '', closure_start_at: '', closure_end_at: '' });
  const [dealSaving, setDealSaving] = useState(false);
  const [dealError, setDealError] = useState('');
  const [editingDeal, setEditingDeal] = useState(null);
  const [editDealSaving, setEditDealSaving] = useState(false);
  const [editDealError, setEditDealError] = useState('');
  const [search, setSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', company: '', email: '', status: 'Active' });
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
  const [emailLogs, setEmailLogs] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [quotes, setQuotes] = useState([]);
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
  const [newTicket, setNewTicket] = useState({
    title: '', description: '', customer_id: '', status: 'Open', priority: 'Medium',
    category: 'General'
  });
  const [saving, setSaving] = useState(false);
  const [customerError, setCustomerError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const toastTimer = useRef(null);
  const justSignedUp = useRef(false);
  const searchInputRef = useRef(null);
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
    quotes.forEach(q => { const text = `${q.quote_number || ''} ${q.title || ''} ${q.customers?.name || ''}`.toLowerCase(); if (text.includes(query)) results.push({ type: 'Quote', title: q.quote_number || q.title, subtitle: q.customers?.name || 'Quote', page: 'Quotes', quote: q }); });
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
    if (!email.trim() || !password) {
      setAuthError('Please enter your email and password.');
      return;
    }
    setEmailLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      console.error('Email sign-in error:', error);
      setAuthError(error.message);
    }
    setEmailLoading(false);
  }
  async function signUpWithEmail(event) {
    event.preventDefault();
    setAuthError('');
    setAuthNotice('');

    if (!email.trim() || !password) {
      setAuthError('Please enter your email and password.');
      return;
    }

    setEmailLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password
    });

    if (error) {
      console.error('Email signup error:', error);
      setAuthError(error.message);
    } else {
      justSignedUp.current = true;
      setAuthNotice(
        'Account created. Check your email if confirmation is required. An administrator must approve your account before you can sign in.'
      );
      await supabase.auth.signOut();
    }

    setEmailLoading(false);
  }
  const resetWorkspace = () => {
    setPage('Dashboard');
    setCustomers([]);
    setDeals([]);
    setActivities([]);
    setTickets([]); setLeads([]); setEmailLogs([]); setCalendarEvents([]); setQuotes([]); setInvoices([]); setPayments([]); setDocuments([]); setWorkflows([]); setSegments([]);
    setNotifications([]);
    setUnreadNotificationCount(0);
    setAuthorizedUsers([]);
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
      setAuthorizationLoading(false);
      return;
    }

    if (!silent) setAuthorizationLoading(true);

    const { data, error } = await supabase
      .from("authorized_users")
      .select("role, status")
      .eq("user_id", currentSession.user.id)
      .maybeSingle();

    if (error) {
      console.error("Authorization check failed:", error);
      setAuthError("Unable to verify your account access.");
      setAuthorized(false);
      setAuthorizationProfile(null);
      setAuthorizationLoading(false);
      return;
    }

    const hasAccess = data?.status === "active";
    setAuthorized(hasAccess);
    setAuthorizationProfile(hasAccess ? data : null);
    setAuthorizationLoading(false);

    if (!hasAccess) {
      await supabase.auth.signOut();
      if (!justSignedUp.current) {
        setAuthError(
          "Your account has not been approved yet. Please contact your administrator."
        );
      }
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
  async function fetchEmailLogs() { const { data, error } = await supabase.from('email_logs').select('*, customers(name,company)').order('sent_at', { ascending: false }); if (error) { console.error('Error fetching email logs:', error); return; } setEmailLogs(data || []); }
  async function fetchCalendarEvents() { const { data, error } = await supabase.from('calendar_events').select('*, customers(name,company)').order('start_at', { ascending: true }); if (error) { console.error('Error fetching calendar events:', error); return; } setCalendarEvents(data || []); }
  async function fetchQuotes() { const { data, error } = await supabase.from('quotes').select('*, customers(name,company)').order('created_at', { ascending: false }); if (error) { console.error('Error fetching quotes:', error); return; } setQuotes(data || []); }
  async function fetchInvoices() { const { data, error } = await supabase.from('invoices').select('*, customers(name,company)').order('created_at', { ascending: false }); if (error) { console.error('Error fetching invoices:', error); return; } setInvoices(data || []); }
  async function fetchPayments() { const { data, error } = await supabase.from('payments').select('*').order('paid_at', { ascending: false }); if (error) { console.error('Error fetching payments:', error); return; } setPayments(data || []); }
  async function fetchDocuments() { const { data, error } = await supabase.from('documents').select('*, customers(name,company)').order('created_at', { ascending: false }); if (error) { console.error('Error fetching documents:', error); return; } setDocuments(data || []); }
  async function fetchWorkflows() { const { data, error } = await supabase.from('workflows').select('*').order('created_at', { ascending: false }); if (error) { console.error('Error fetching workflows:', error); return; } setWorkflows(data || []); }
  async function fetchSegments() { const { data, error } = await supabase.from('customer_segments').select('*').order('created_at', { ascending: false }); if (error) { console.error('Error fetching segments:', error); return; } setSegments(data || []); }
  async function fetchProducts() { const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }); if (error) { console.error('Error fetching products:', error); return; } setProducts(data || []); }

  async function addLead(payload) { const { data, error } = await supabase.from('leads').insert([{ ...payload, created_by: session.user.id }]).select('*, customers(name,company)').single(); if (error) throw error; setLeads(prev => [data, ...prev]); return data; }
  async function updateLead(id, payload) { const { data, error } = await supabase.from('leads').update(payload).eq('id', id).select('*, customers(name,company)').single(); if (error) throw error; setLeads(prev => prev.map(x => x.id === id ? data : x)); return data; }
  async function deleteLead(id) { if (!window.confirm('Delete this lead?')) return; const { error } = await supabase.from('leads').delete().eq('id', id); if (error) { alert(error.message); return; } setLeads(prev => prev.filter(x => x.id !== id)); }
  async function addEmailLog(payload) { const { data, error } = await supabase.from('email_logs').insert([{ ...payload, created_by: session.user.id }]).select('*, customers(name,company)').single(); if (error) throw error; setEmailLogs(prev => [data, ...prev]); return data; }
  async function addCalendarEvent(payload) { const { data, error } = await supabase.from('calendar_events').insert([{ ...payload, created_by: session.user.id }]).select('*, customers(name,company)').single(); if (error) throw error; setCalendarEvents(prev => [...prev, data].sort((a, b) => new Date(a.start_at) - new Date(b.start_at))); return data; }
  async function updateCalendarEvent(id, payload) { const { data, error } = await supabase.from('calendar_events').update(payload).eq('id', id).select('*, customers(name,company)').single(); if (error) throw error; setCalendarEvents(prev => prev.map(x => x.id === id ? data : x)); return data; }
  async function deleteCalendarEvent(id) { const { error } = await supabase.from('calendar_events').delete().eq('id', id); if (error) throw error; setCalendarEvents(prev => prev.filter(x => x.id !== id)); }
  async function addQuote(payload) { const { data, error } = await supabase.from('quotes').insert([{ ...payload, created_by: session.user.id }]).select('*, customers(name,company)').single(); if (error) throw error; setQuotes(prev => [data, ...prev]); return data; }
  async function updateQuote(id, payload) { const { data, error } = await supabase.from('quotes').update(payload).eq('id', id).select('*, customers(name,company)').single(); if (error) throw error; setQuotes(prev => prev.map(x => x.id === id ? data : x)); return data; }
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
  async function deleteProduct(id) {
    if (!window.confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    setProducts(prev => prev.filter(product => product.id !== id));
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
  const displayUserName = profileName.trim() || session?.user?.email || 'Signed-in user';

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
    fetchEmailIntegrations(); fetchLeads(); fetchEmailLogs(); fetchCalendarEvents(); fetchQuotes(); fetchInvoices(); fetchPayments(); fetchDocuments(); fetchWorkflows(); fetchSegments(); fetchProducts();
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
          company: newDeal.new_customer_company.trim() || newDeal.company.trim() || null,
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

      setNewDeal({
        title: '',
        company: '',
        amount: '',
        stage: 'New Lead',
        customer_id: '',
        new_customer_name: '',
        new_customer_email: '',
        new_customer_company: '',
        closure_start_at: '',
        closure_end_at: ''
      });

      setShowDealForm(false);

    } catch (error) {
      console.error('Unexpected error:', error);

      setDealError('Something went wrong. Please try again.');

    } finally {
      setDealSaving(false);
    }
  }
  async function moveDeal(id, stage) {
    const previousStage = deals.find(d => d.id === id)?.stage;
    if (previousStage === stage) return;

    // Update the interface immediately
    setDeals(prev =>
      prev.map(d =>
        d.id === id ? { ...d, stage } : d
      )
    );

    // Save the stage in Supabase
    const { error } = await supabase
      .from('deals')
      .update({ stage })
      .eq('id', id);

    if (error) {
      console.error('Error updating deal stage:', error);

      // Restore the previous stage if the database update fails
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
        priority: newTicket.priority, category: newTicket.category, created_by: session.user.id
      }]).select(`*, customers (name, company)`).single();
      if (error) { console.error('Error adding ticket:', error); setTicketError(error.message); return; }
      setTickets(prev => [data, ...prev]);
      setNewTicket({ title: '', description: '', customer_id: '', status: 'Open', priority: 'Medium', category: 'General' });
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
        priority: editingTicket.priority, category: editingTicket.category, updated_at: new Date().toISOString()
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
            <div className="brand-mark"><OrbitLogo /></div>
            <span>
              orbit<span className="brand-accent">CRM</span>
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
  if (!session || !authorized) {
    return (
      <AuthScreen
        onGoogleSignIn={signInWithGoogle}
        onEmailSignIn={signInWithEmail}
        onEmailSignUp={signUpWithEmail}
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

  // The rendering of the entire page is done here
  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><OrbitLogo /></div>
        <span>orbit<span className="brand-accent">CRM</span></span>
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
      <section className="page-content">
        {page === 'Dashboard' && (
          <Dashboard revenue={revenue} customers={customers} deals={deals} activities={activities} tickets={tickets} setPage={setPage} formatAmount={formatAmount} onSelectCustomer={setSelectedCustomer} onEditCustomer={setEditingCustomer} onDeleteCustomer={deleteCustomer} />
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
        {page === 'Products' && <Products products={products} onAdd={addProduct} onDelete={deleteProduct} currentUserId={session.user.id} isAdmin={authorizationProfile?.role === 'admin'} />}
        {page === 'Leads' && <Leads leads={leads} customers={customers} onAdd={addLead} onUpdate={updateLead} onDelete={deleteLead} currentUserId={session.user.id} isAdmin={authorizationProfile?.role === 'admin'} />}
        {page === 'Email' && <EmailPage emailLogs={emailLogs} customers={customers} integrations={emailIntegrations} loading={emailIntegrationLoading} error={emailIntegrationError} onConnect={connectEmailProvider} onDisconnect={disconnectEmailProvider} onAdd={async payload => { try { await addEmailLog(payload); showToast('Email logged.'); } catch (e) { alert(e.message); } }} />}
        {page === 'Calendar' && <CalendarPage events={calendarEvents} customers={customers} onAdd={addCalendarEvent} onUpdate={updateCalendarEvent} onDelete={deleteCalendarEvent} />}
        {page === 'Quotes' && <Quotes quotes={quotes} customers={customers} onAdd={addQuote} onUpdate={updateQuote} formatAmount={formatAmount} currentUserId={session.user.id} isAdmin={authorizationProfile?.role === 'admin'} />}
        {page === 'Invoices' && <Invoices invoices={invoices} payments={payments} customers={customers} onAdd={addInvoice} onUpdate={updateInvoice} onAddPayment={addPayment} formatAmount={formatAmount} currentUserId={session.user.id} isAdmin={authorizationProfile?.role === 'admin'} />}
        {page === 'Documents' && <Documents documents={documents} customers={customers} onUpload={uploadDocument} onDownload={downloadDocument} onDelete={deleteDocument} />}
        {page === 'Automation' && <Automation workflows={workflows} onAdd={addWorkflow} onUpdate={updateWorkflow} />}
        {page === 'Segments' && <Segments segments={segments} customers={customers} onAdd={addSegment} onUpdate={updateSegment} />}
        {page === 'Forecast' && <Forecast deals={deals} formatAmount={formatAmount} />}
        {page === 'Pipeline' && (
          <Pipeline
            deals={deals}
            customers={customers}
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
                amount: String(deal.amount ?? '')
              });
            }}
            onAdd={() => {
              setDealError('');
              setNewDeal({ title: '', company: '', amount: '', stage: 'New Lead', customer_id: '', new_customer_name: '', new_customer_email: '', new_customer_company: '', closure_start_at: '', closure_end_at: '' });
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
          />
        )}
        {page === 'Chat' && <Chat />}
        {page === 'Reports' && <AdvancedReports customers={customers} deals={deals} activities={activities} tickets={tickets} leads={leads} quotes={quotes} invoices={invoices} payments={payments} formatAmount={formatAmount} />}
        {page === 'Email Logs' && <EmailLogs emailLogs={emailLogs} customers={customers} onAdd={addEmailLog} />}
        {page === 'UserManagement' && <UserManagement users={authorizedUsers} loading={usersLoading} error={usersError} onRefresh={fetchAuthorizedUsers} onUpdateUser={updateAuthorizedUser} currentUserId={session?.user?.id} />}
        {page === 'Settings' && <SettingsPage currency={currency} setCurrency={setCurrency} />}
      </section>
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
        onAddDeal={c => { setSelectedCustomer(null); setDealError(''); setNewDeal(d => ({ ...d, customer_id: c.id, company: c.company || '' })); setShowDealForm(true); }}
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
        <form className="modal" onSubmit={addDeal}>
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
              <label>Company name<input value={newDeal.new_customer_company} onChange={e => setNewDeal({ ...newDeal, new_customer_company: e.target.value, company: e.target.value || newDeal.company })} placeholder="Company (optional)" /></label>
            </div>
          )}
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
        <form className="modal" onSubmit={updateDeal}>
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
    {selectedTicket && <TicketDetail ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onEdit={ticket => { setSelectedTicket(null); setEditTicketError(''); setEditingTicket(ticket); }} />}
    {editingTicket && <div className="modal-backdrop" onClick={() => setEditingTicket(null)}><form className="modal" onSubmit={updateTicket} onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>Edit Ticket</h2><button type="button" className="icon-btn" onClick={() => setEditingTicket(null)}><X size={18} /></button></div>{editTicketError && <p className="form-error">{editTicketError}</p>}<label>Ticket title<input type="text" value={editingTicket.title || ''} onChange={e => setEditingTicket({ ...editingTicket, title: e.target.value })} required /></label><label>Description<textarea value={editingTicket.description || ''} onChange={e => setEditingTicket({ ...editingTicket, description: e.target.value })} rows="4" /></label><label>Customer<select value={editingTicket.customer_id || ''} onChange={e => setEditingTicket({ ...editingTicket, customer_id: e.target.value })}><option value="">No customer selected</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}{customer.company ? ` — ${customer.company}` : ''}</option>)}</select></label><label>Category<select value={editingTicket.category || 'General'} onChange={e => setEditingTicket({ ...editingTicket, category: e.target.value })}><option value="General">General</option><option value="Technical">Technical</option><option value="Billing">Billing</option><option value="Account">Account</option><option value="Feature Request">Feature Request</option></select></label><label>Priority<select value={editingTicket.priority || 'Medium'} onChange={e => setEditingTicket({ ...editingTicket, priority: e.target.value })}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Urgent">Urgent</option></select></label><label>Status<select value={editingTicket.status || 'Open'} onChange={e => setEditingTicket({ ...editingTicket, status: e.target.value })}><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option><option value="Closed">Closed</option></select></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setEditingTicket(null)}>Cancel</button><button type="submit" className="primary-btn" disabled={editTicketSaving}>{editTicketSaving ? 'Saving...' : 'Save changes'}</button></div></form></div>}
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
          <div className="modal-heading"><div><h2>Edit profile</h2><p>Your name is shown across Orbit CRM when provided.</p></div><button type="button" className="icon-btn" onClick={() => setProfileModalOpen(false)} aria-label="Close profile modal"><X size={18} /></button></div>
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

function PageHeading({ eyebrow, title, description, action, onAction }) {
  return <div className="page-heading">
    <div>
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    {action && <button className="primary-btn" onClick={onAction}>
      <Plus size={17} />{action}</button>}
  </div>
}
const PIPELINE_STAGES = ['New Lead', 'Qualified', 'Proposal', 'Won'];
const CUSTOMER_STATUSES = ['Lead', 'Active', 'Inactive'];

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
  const palette = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#db2777', '#0891b2', '#4f46e5', '#65a30d', '#9333ea', '#ea580c', '#0f766e'];
  if (!userId) return '#98a2b3';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = ((hash << 5) - hash) + userId.charCodeAt(i);
  return palette[Math.abs(hash) % palette.length];
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

function Dashboard({ revenue, customers, deals, activities, tickets, setPage, formatAmount, onSelectCustomer, onEditCustomer, onDeleteCustomer }) {
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
            <th>Value</th>
            <th>Open deals</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => {
            const status = c.status || 'Active';
            const openDeals = deals.filter(d => d.customer_id === c.id && d.stage !== 'Won').length;
            return (
              <tr key={c.id}>
                <td onClick={() => onSelectCustomer?.(c)} style={{ cursor: onSelectCustomer ? 'pointer' : 'default' }}>
                  <div className="customer-cell">
                    <div className="avatar small">{(c.name || '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()}</div>
                    <div>
                      <strong>{c.name}</strong>
                      <span>{c.email}</span>
                    </div>
                  </div>
                </td>
                <td>{c.company || '—'}</td>
                <td><span className={`status ${status.toLowerCase()}`}>{status}</span></td>
                <td>{formatAmount(lifetimeValue(c, deals))}</td>
                <td>{openDeals}</td>
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
      status: read(r, 'status')
    })));
  }

  function exportCustomers() {
    downloadCSV(
      'customers.csv',
      ['name', 'company', 'email', 'status', 'lifetime_value'],
      customers.map(c => [c.name, c.company || '', c.email, c.status || 'Active', lifetimeValue(c, deals)])
    );
  }

  const counts = CUSTOMER_STATUSES.reduce((acc, s) => ({ ...acc, [s]: allCustomers.filter(c => (c.status || 'Active') === s).length }), {});

  return (
    <>
      <PageHeading eyebrow="RELATIONSHIPS" title="Customers" description="Customers are created when you add a new deal from the Pipeline." />
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

function CustomerDetail({ customer, deals, activities, tickets, quotes = [], invoices = [], payments = [], emailLogs = [], documents = [], formatAmount, onClose, onEdit, onAddDeal, onAddActivity, onAddTicket }) {
  const myDeals = deals.filter(d => d.customer_id === customer.id);
  const myActivities = activities.filter(a => a.customer_id === customer.id);
  const myTickets = tickets.filter(t => t.customer_id === customer.id);
  const myQuotes = quotes.filter(q => q.customer_id === customer.id);
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
    ...myQuotes.map(q => ({ key: `q-${q.id}`, kind: 'Quote', title: q.title || q.quote_number || 'Quote', meta: `${q.quote_number || 'Quote'} · ${q.status || 'Draft'} · ${formatAmount(q.amount)}`, date: q.created_at })),
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
      </div>
    </div>
  );
}
function Pipeline({ deals, customers, moveDeal, deleteDeal, onEdit, onAdd, formatAmount, currentUserId, ownerProfiles = {}, isAdmin }) {
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

function Tickets({ tickets, error, onAdd, onStatusChange, onDelete, onEdit, onView, currentUserId, isAdmin }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const q = query.trim().toLowerCase();
  const filtered = tickets.filter(t => (status === 'All' || t.status === status) && (priority === 'All' || t.priority === priority) && (!q || `${t.title} ${t.description || ''} ${t.customers?.name || ''} ${t.category || ''}`.toLowerCase().includes(q)));
  const count = s => tickets.filter(t => t.status === s).length;
  return <>
    <PageHeading eyebrow="SUPPORT" title="Tickets" description="Manage customer issues and support requests." action="Create Ticket" onAction={onAdd} />
    <div className="stats-grid">
      <StatCard label="Open" value={count('Open')} hint="Waiting for a response" tone="orange" icon="!" />
      <StatCard label="In progress" value={count('In Progress')} hint="Being worked on" tone="blue" icon="◷" />
      <StatCard label="Resolved" value={count('Resolved') + count('Closed')} hint="Resolved or closed" tone="green" icon="✓" />
      <StatCard label="Urgent open" value={tickets.filter(t => t.priority === 'Urgent' && (t.status === 'Open' || t.status === 'In Progress')).length} hint="Highest priority" tone="purple" icon="↑" />
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
        <select value={status} onChange={e => setStatus(e.target.value)}>{['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map(x => <option key={x} value={x}>{x === 'All' ? 'All statuses' : x}</option>)}</select>
        <select value={priority} onChange={e => setPriority(e.target.value)}>
          {['All', 'Low', 'Medium', 'High', 'Urgent'].map(x => <option key={x} value={x}>{x === 'All' ? 'All priorities' : x}</option>)}</select>
      </div>
      {tickets.length === 0 ?
        <div className="empty-state">
          <p>No tickets yet.</p>
          <button type="button" className="secondary-btn" onClick={onAdd}>Create your first ticket</button>
        </div> : filtered.length === 0 ? <div className="empty-state"><p>No tickets match your filters.</p></div> : <div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Customer</th><th>Priority</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{filtered.map(ticket => { const canEdit = isAdmin || ticket.created_by === currentUserId; return <tr key={ticket.id}><td><button type="button" className="text-btn" onClick={() => onView(ticket)}><strong>{ticket.title}</strong></button><div className="deal-customer">{ticket.category || 'General'}</div></td><td>{ticket.customers?.name || 'Unassigned'}</td><td><span className={`status ${(ticket.priority || 'medium').toLowerCase()}`}>{ticket.priority || 'Medium'}</span></td><td><select className="ticket-status-select" value={ticket.status} onChange={e => onStatusChange(ticket.id, e.target.value)} disabled={!canEdit}><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option><option value="Closed">Closed</option></select></td><td>{formatDate(ticket.created_at)}</td><td><div className="toolbar-actions"><button type="button" className="secondary-btn" onClick={() => onView(ticket)}>View</button>{canEdit && <button type="button" className="secondary-btn" onClick={() => onEdit(ticket)}><Pencil size={14} /> Edit</button>}{canEdit && <button type="button" className="icon-btn" title="Delete ticket" onClick={() => onDelete(ticket.id)}><X size={16} /></button>}</div></td></tr> })}</tbody></table></div>}</div></>;
}

function TicketDetail({ ticket, onClose, onEdit }) { return <div className="modal-backdrop" onClick={onClose}><div className="modal modal-wide" onClick={e => e.stopPropagation()}><div className="modal-heading"><div><h2>{ticket.title}</h2><p>{ticket.category || 'General'} · {ticket.status || 'Open'}</p></div><div className="toolbar-actions"><button type="button" className="secondary-btn" onClick={() => onEdit(ticket)}><Pencil size={14} /> Edit</button><button type="button" className="icon-btn" onClick={onClose}><X size={18} /></button></div></div><div className="detail-grid"><div><small>Customer</small><p>{ticket.customers?.name || 'Unassigned'}</p></div><div><small>Company</small><p>{ticket.customers?.company || '—'}</p></div><div><small>Priority</small><p>{ticket.priority || 'Medium'}</p></div><div><small>Status</small><p>{ticket.status || 'Open'}</p></div><div><small>Category</small><p>{ticket.category || 'General'}</p></div><div><small>Created</small><p>{formatDate(ticket.created_at)}</p></div></div><h3 className="detail-title">Description</h3><p className="detail-empty" style={{ whiteSpace: 'pre-wrap' }}>{ticket.description || 'No description added.'}</p></div></div>; }

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

function Leads({ leads, customers, onAdd, onUpdate, onDelete, currentUserId, isAdmin }) {
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', source: 'Website', status: 'New', customer_id: '' });
  const [q, setQ] = useState('');
  const visible = leads.filter(x => `${x.name || ''} ${x.email || ''} ${x.company || ''} ${x.source || ''}`.toLowerCase().includes(q.toLowerCase()));
  const save = async e => {
    e.preventDefault();
    try {
      // The customer relationship is optional; never send an empty string to a UUID column.
      const payload = { ...form, customer_id: form.customer_id || null };
      if (editing) await onUpdate(editing.id, payload);
      else await onAdd(payload);
      setShow(false);
      setEditing(null);
    } catch (err) { alert(err.message) }
  };
  const openEdit = x => {
    setEditing(x); setForm({ name: x.name || '', email: x.email || '', phone: x.phone || '', company: x.company || '', source: x.source || 'Website', status: x.status || 'New', customer_id: x.customer_id || '' });
    setShow(true)
  };
  return <>
    <PageHeading eyebrow="PROSPECTING" title="Leads" description="Capture, qualify and convert prospects." action="New lead" onAction={() => {
      setEditing(null);
      setForm({ name: '', email: '', phone: '', company: '', source: 'Website', status: 'New', customer_id: '' });
      setShow(true)
    }} />
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
                <th>Source</th>
                <th>Status</th>
                <th>Actions</th>
              </tr></thead>
            <tbody>
              {visible.map(x => <tr key={x.id}>
                <td><strong>{x.name || x.email}</strong>
                  <div className="deal-customer">{x.email}
                  </div></td><td>{x.company || '—'}
                </td>
                <td>{x.source || '—'}</td>
                <td><span className="status">{x.status}</span></td>
                <td>
                  <div className="toolbar-actions">
                    <button className="secondary-btn" onClick={() => openEdit(x)}>Edit</button>
                    {(isAdmin || x.created_by === currentUserId) && <button className="icon-btn" onClick={() => onDelete(x.id)}>
                      <X size={16} />
                    </button>}
                  </div>
                </td>
              </tr>
              )}
            </tbody></table></div>}</div>{show && <div className="modal-backdrop" onClick={() => setShow(false)}><form className="modal" onSubmit={save} onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>{editing ? 'Edit lead' : 'New lead'}</h2><button type="button" className="icon-btn" onClick={() => setShow(false)}><X size={18} /></button></div>{[['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['company', 'Company']].map(([k, l]) => <label key={k}>{l}<input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required={k === 'name' || k === 'email'} /></label>)}<label>Source<select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>{['Website', 'Referral', 'Social', 'Campaign', 'Cold outreach', 'Other'].map(x => <option key={x}>{x}</option>)}</select></label><label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'].map(x => <option key={x}>{x}</option>)}</select></label><label>Convert/link customer<select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}><option value="">None</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShow(false)}>Cancel</button><button className="primary-btn">Save lead</button></div></form></div>}</>;
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

function CalendarPage({ events, customers, onAdd, onUpdate, onDelete }) {
  const [show, setShow] = useState(false); const [editing, setEditing] = useState(null);
  const blank = { title: '', description: '', start_at: '', end_at: '', event_type: 'Meeting', customer_id: '', location: '', status: 'Scheduled' };
  const [form, setForm] = useState(blank);
  const save = async e => {
    e.preventDefault();
    try {
      if (editing) await onUpdate(editing.id, form);
      else await onAdd(form);
      setShow(false);
      setEditing(null);
      setForm(blank)
    } catch (err) { alert(err.message) }
  };
  const open = x => {
    setEditing(x);
    setForm({ ...x, start_at: formatDateTimeLocal(x.start_at), end_at: formatDateTimeLocal(x.end_at) }); setShow(true)
  };
  return <>
    <PageHeading eyebrow="PRODUCTIVITY" title="Calendar" description="Manage meetings, calls and customer appointments." action="New event" onAction={() => { setEditing(null); setForm(blank); setShow(true) }} />
    <div className="panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Customer</th>
              <th>When</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{events.length === 0 ?
            <tr>
              <td colSpan="6">No calendar events yet.</td>
            </tr> : events.map(x => <tr key={x.id}>
              <td>
                <strong>{x.title}</strong>
                <div className="deal-customer">{x.location || ''}</div>
              </td>
              <td>{x.customers?.name || '—'}</td>
              <td>{formatDateTime(x.start_at)}</td>
              <td>{x.event_type}</td><td>{x.status}</td>
              <td>
                <div className="toolbar-actions">
                  <button className="secondary-btn" onClick={() => open(x)}>Edit</button>
                  <button className="icon-btn" onClick={() => onDelete(x.id)}><X size={16} /></button>
                </div>
              </td>
            </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    {show && <div className="modal-backdrop" onClick={() => setShow(false)}><form className="modal" onSubmit={save} onClick={e => e.stopPropagation()}>
      <div className="modal-heading">
        <h2>{editing ? 'Edit event' : 'New event'}</h2>
        <button type="button" className="icon-btn" onClick={() => setShow(false)}><X size={18} /></button>
      </div>
      <label>Title<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
      <label>Customer<select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}><option value="">None</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Start<input type="datetime-local" required value={form.start_at || ''} onChange={e => setForm({ ...form, start_at: e.target.value })} /></label><label>End<input type="datetime-local" value={form.end_at || ''} onChange={e => setForm({ ...form, end_at: e.target.value })} /></label><label>Type<select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>{['Meeting', 'Call', 'Demo', 'Task', 'Other'].map(x => <option key={x}>{x}</option>)}</select></label><label>Location<input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></label><label>Description<textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShow(false)}>Cancel</button><button className="primary-btn">Save event</button></div></form></div>}</>
}

function Quotes({ quotes, customers, onAdd, onUpdate, formatAmount, currentUserId, isAdmin }) { const [show, setShow] = useState(false); const [editing, setEditing] = useState(null); const blank = { title: '', quote_number: `Q-${Date.now().toString().slice(-6)}`, customer_id: '', amount: 0, status: 'Draft', valid_until: '', notes: '' }; const [form, setForm] = useState(blank); const save = async e => { e.preventDefault(); try { if (editing) await onUpdate(editing.id, form); else await onAdd(form); setShow(false); setEditing(null) } catch (err) { alert(err.message) } }; return <><PageHeading eyebrow="SALES OPERATIONS" title="Quotes" description="Create and track customer quotations." action="New quote" onAction={() => { setEditing(null); setForm({ ...blank, quote_number: `Q-${Date.now().toString().slice(-6)}` }); setShow(true) }} /><div className="panel"><div className="table-wrap"><table><thead><tr><th>Quote</th><th>Customer</th><th>Amount</th><th>Status</th><th>Valid until</th><th>Actions</th></tr></thead><tbody>{quotes.length === 0 ? <tr><td colSpan="6">No quotes yet.</td></tr> : quotes.map(q => <tr key={q.id}><td><strong>{q.quote_number}</strong><div className="deal-customer">{q.title}</div></td><td>{q.customers?.name || '—'}</td><td>{formatAmount(q.amount)}</td><td>{q.status}</td><td>{q.valid_until ? formatDate(q.valid_until) : '—'}</td><td>{(isAdmin || q.created_by === currentUserId) && <button className="secondary-btn" onClick={() => { setEditing(q); setForm(q); setShow(true) }}>Edit</button>}</td></tr>)}</tbody></table></div></div>{show && <div className="modal-backdrop" onClick={() => setShow(false)}><form className="modal" onSubmit={save} onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>{editing ? 'Edit quote' : 'New quote'}</h2><button type="button" className="icon-btn" onClick={() => setShow(false)}><X size={18} /></button></div><label>Quote number<input required value={form.quote_number} onChange={e => setForm({ ...form, quote_number: e.target.value })} /></label><label>Title<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label><label>Customer<select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}><option value="">None</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Amount<input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></label><label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'].map(x => <option key={x}>{x}</option>)}</select></label><label>Valid until<input type="date" value={form.valid_until || ''} onChange={e => setForm({ ...form, valid_until: e.target.value })} /></label><label>Notes<textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShow(false)}>Cancel</button><button className="primary-btn">Save quote</button></div></form></div>}</> }

function Invoices({ invoices, payments, customers, onAdd, onUpdate, onAddPayment, formatAmount, currentUserId, isAdmin }) { const [show, setShow] = useState(false); const [pay, setPay] = useState(null); const blank = { invoice_number: `INV-${Date.now().toString().slice(-6)}`, title: '', customer_id: '', amount: 0, due_date: '', status: 'Draft', notes: '' }; const [form, setForm] = useState(blank); const save = async e => { e.preventDefault(); try { await onAdd(form); setShow(false) } catch (err) { alert(err.message) } }; const paymentSave = async e => { e.preventDefault(); try { await onAddPayment({ ...pay, payment_method: pay.payment_method || 'Bank transfer' }); setPay(null) } catch (err) { alert(err.message) } }; return <><PageHeading eyebrow="BILLING" title="Invoices & payments" description="Track invoices, balances and payments." action="New invoice" onAction={() => { setForm({ ...blank, invoice_number: `INV-${Date.now().toString().slice(-6)}` }); setShow(true) }} /><div className="stats-grid"><StatCard label="Invoiced" value={formatAmount(invoices.reduce((s, x) => s + Number(x.amount || 0), 0))} hint={`${invoices.length} invoices`} tone="blue" icon="$" /><StatCard label="Paid" value={formatAmount(payments.reduce((s, x) => s + Number(x.amount || 0), 0))} hint={`${payments.length} payments`} tone="green" icon="✓" /><StatCard label="Outstanding" value={formatAmount(invoices.filter(x => !['Paid', 'Cancelled'].includes(x.status)).reduce((s, x) => s + Number(x.amount || 0), 0))} hint="Open balances" tone="orange" icon="!" /></div><div className="panel"><div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Status</th><th>Due</th><th>Actions</th></tr></thead><tbody>{invoices.length === 0 ? <tr><td colSpan="6">No invoices yet.</td></tr> : invoices.map(i => <tr key={i.id}><td><strong>{i.invoice_number}</strong><div className="deal-customer">{i.title}</div></td><td>{i.customers?.name || '—'}</td><td>{formatAmount(i.amount)}</td><td>{i.status}</td><td>{i.due_date ? formatDate(i.due_date) : '—'}</td><td><div className="toolbar-actions">{(isAdmin || i.created_by === currentUserId) && <button className="secondary-btn" onClick={() => onUpdate(i.id, { status: i.status === 'Paid' ? 'Sent' : 'Paid' })}>{i.status === 'Paid' ? 'Reopen' : 'Mark paid'}</button>}{i.status !== 'Paid' && <button className="secondary-btn" onClick={() => setPay({ invoice_id: i.id, amount: i.amount, paid_at: new Date().toISOString().slice(0, 16), payment_method: 'Bank transfer' })}>Record payment</button>}</div></td></tr>)}</tbody></table></div></div>{show && <div className="modal-backdrop" onClick={() => setShow(false)}><form className="modal" onSubmit={save} onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>New invoice</h2><button type="button" className="icon-btn" onClick={() => setShow(false)}><X size={18} /></button></div><label>Invoice number<input required value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} /></label><label>Title<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label><label>Customer<select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}><option value="">None</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Amount<input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></label><label>Due date<input type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} /></label><label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'].map(x => <option key={x}>{x}</option>)}</select></label><label>Notes<textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShow(false)}>Cancel</button><button className="primary-btn">Create invoice</button></div></form></div>}{pay && <div className="modal-backdrop" onClick={() => setPay(null)}><form className="modal" onSubmit={paymentSave} onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>Record payment</h2><button type="button" className="icon-btn" onClick={() => setPay(null)}><X size={18} /></button></div><label>Amount<input type="number" min="0" value={pay.amount} onChange={e => setPay({ ...pay, amount: Number(e.target.value) })} /></label><label>Method<select value={pay.payment_method} onChange={e => setPay({ ...pay, payment_method: e.target.value })}>{['Bank transfer', 'Card', 'Cash', 'Online', 'Other'].map(x => <option key={x}>{x}</option>)}</select></label><label>Date<input type="datetime-local" value={pay.paid_at} onChange={e => setPay({ ...pay, paid_at: e.target.value })} /></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setPay(null)}>Cancel</button><button className="primary-btn">Save payment</button></div></form></div>}</> }

function Documents({ documents, customers, onUpload, onDownload, onDelete }) { const [customerId, setCustomerId] = useState(''); const upload = e => { const f = e.target.files?.[0]; if (!f) return; onUpload(f, customerId).catch(err => alert(err.message)); e.target.value = '' }; return <><PageHeading eyebrow="FILES" title="Documents" description="Store customer and CRM files in Supabase Storage." /><div className="panel"><div className="toolbar"><select value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">No customer link</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><label className="secondary-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Upload size={15} /> Upload file<input type="file" hidden onChange={upload} /></label></div><div className="table-wrap"><table><thead><tr><th>File</th><th>Customer</th><th>Type</th><th>Size</th><th>Created</th><th>Actions</th></tr></thead><tbody>{documents.length === 0 ? <tr><td colSpan="6">No documents yet.</td></tr> : documents.map(d => <tr key={d.id}><td><strong>{d.name}</strong></td><td>{d.customers?.name || '—'}</td><td>{d.mime_type}</td><td>{Math.max(1, Math.round(Number(d.size_bytes || 0) / 1024))} KB</td><td>{formatDate(d.created_at)}</td><td><div className="toolbar-actions"><button className="secondary-btn" onClick={() => onDownload(d)}><Download size={14} /> Download</button><button className="icon-btn" onClick={() => onDelete(d)}><X size={16} /></button></div></td></tr>)}</tbody></table></div></div></> }

function Automation({ workflows, onAdd, onUpdate }) { const [show, setShow] = useState(false); const blank = { name: '', description: '', trigger_type: 'customer_created', action_type: 'create_notification', active: true, config: {} }; const [form, setForm] = useState(blank); const save = async e => { e.preventDefault(); try { await onAdd(form); setShow(false); setForm(blank) } catch (err) { alert(err.message) } }; return <><PageHeading eyebrow="AUTOMATION" title="Workflow automation" description="Define rules that turn CRM events into actions." action="New workflow" onAction={() => setShow(true)} /><div className="panel"><div className="table-wrap"><table><thead><tr><th>Workflow</th><th>Trigger</th><th>Action</th><th>Status</th><th>Created</th><th>Toggle</th></tr></thead><tbody>{workflows.length === 0 ? <tr><td colSpan="6">No workflows yet.</td></tr> : workflows.map(w => <tr key={w.id}><td><strong>{w.name}</strong><div className="deal-customer">{w.description}</div></td><td>{w.trigger_type}</td><td>{w.action_type}</td><td>{w.active ? 'Active' : 'Paused'}</td><td>{formatDate(w.created_at)}</td><td><button className="secondary-btn" onClick={() => onUpdate(w.id, { active: !w.active })}>{w.active ? 'Pause' : 'Activate'}</button></td></tr>)}</tbody></table></div></div>{show && <div className="modal-backdrop" onClick={() => setShow(false)}><form className="modal" onSubmit={save} onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>New workflow</h2><button type="button" className="icon-btn" onClick={() => setShow(false)}><X size={18} /></button></div><label>Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>Description<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><label>Trigger<select value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value })}>{['customer_created', 'lead_created', 'deal_stage_changed', 'ticket_created', 'invoice_overdue', 'activity_due'].map(x => <option key={x}>{x}</option>)}</select></label><label>Action<select value={form.action_type} onChange={e => setForm({ ...form, action_type: e.target.value })}>{['create_notification', 'create_activity', 'log_event', 'send_email'].map(x => <option key={x}>{x}</option>)}</select></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShow(false)}>Cancel</button><button className="primary-btn">Create workflow</button></div></form></div>}</> }

function Segments({ segments, customers, onAdd, onUpdate }) { const [show, setShow] = useState(false); const [form, setForm] = useState({ name: '', description: '', rule_json: { status: 'Active' }, active: true }); const [selected, setSelected] = useState(null); const save = async e => { e.preventDefault(); try { await onAdd(form); setShow(false) } catch (err) { alert(err.message) } }; const count = s => customers.filter(c => (c.status || 'Active') === (s.rule_json?.status || 'Active')).length; return <><PageHeading eyebrow="CUSTOMER INTELLIGENCE" title="Segments" description="Group customers for targeted follow-up and reporting." action="New segment" onAction={() => setShow(true)} /><div className="panel"><div className="table-wrap"><table><thead><tr><th>Segment</th><th>Rule</th><th>Customers</th><th>Status</th><th>Actions</th></tr></thead><tbody>{segments.length === 0 ? <tr><td colSpan="5">No segments yet.</td></tr> : segments.map(s => <tr key={s.id}><td><strong>{s.name}</strong><div className="deal-customer">{s.description}</div></td><td>Status = {s.rule_json?.status || 'Active'}</td><td>{count(s)}</td><td>{s.active ? 'Active' : 'Paused'}</td><td><button className="secondary-btn" onClick={() => onUpdate(s.id, { active: !s.active })}>{s.active ? 'Pause' : 'Activate'}</button></td></tr>)}</tbody></table></div></div>{show && <div className="modal-backdrop" onClick={() => setShow(false)}><form className="modal" onSubmit={save} onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>New segment</h2><button type="button" className="icon-btn" onClick={() => setShow(false)}><X size={18} /></button></div><label>Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>Description<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><label>Customer status<select value={form.rule_json.status} onChange={e => setForm({ ...form, rule_json: { ...form.rule_json, status: e.target.value } })}>{['Active', 'Inactive', 'Prospect', 'VIP'].map(x => <option key={x}>{x}</option>)}</select></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShow(false)}>Cancel</button><button className="primary-btn">Create segment</button></div></form></div>}</> }

function Forecast({ deals, formatAmount }) { const weighted = deals.filter(d => d.stage !== 'Lost' && d.stage !== 'Won').reduce((s, d) => s + (Number(d.amount) || 0) * stageProbability(d.stage), 0); const open = deals.filter(d => !['Lost', 'Won'].includes(d.stage)); return <><PageHeading eyebrow="SALES INTELLIGENCE" title="Sales forecast" description="Weighted forecast based on current pipeline stages." /><div className="stats-grid"><StatCard label="Weighted forecast" value={formatAmount(weighted)} hint="Open pipeline × stage probability" tone="purple" icon="↗" /><StatCard label="Open pipeline" value={formatAmount(open.reduce((s, d) => s + Number(d.amount || 0), 0))} hint={`${open.length} open deals`} tone="orange" icon="◈" /><StatCard label="Won revenue" value={formatAmount(deals.filter(d => d.stage === 'Won').reduce((s, d) => s + Number(d.amount || 0), 0))} hint="Closed won" tone="green" icon="✓" /></div><div className="panel"><h3>Forecast by stage</h3>{PIPELINE_STAGES.filter(s => s !== 'Lost').map(stage => { const list = deals.filter(d => d.stage === stage); const value = list.reduce((s, d) => s + Number(d.amount || 0), 0); return <BarRow key={stage} label={`${stage} (${Math.round(stageProbability(stage) * 100)}%)`} percent={weighted ? value * stageProbability(stage) / weighted * 100 : 0} display={formatAmount(value * stageProbability(stage))} /> })}</div></> }

function stageProbability(stage) { return ({ 'New Lead': 0.1, 'Qualified': 0.25, 'Proposal': 0.5, 'Negotiation': 0.75, 'Won': 1, 'Lost': 0 })[stage] ?? 0.2; }

function AdvancedReports({ customers, deals, activities, tickets, leads, quotes, invoices, payments, formatAmount }) { const pipeline = deals.filter(d => !['Won', 'Lost'].includes(d.stage)).reduce((s, d) => s + Number(d.amount || 0), 0); const won = deals.filter(d => d.stage === 'Won').reduce((s, d) => s + Number(d.amount || 0), 0); const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0); const leadConversion = leads.length ? leads.filter(l => l.status === 'Converted').length / leads.length * 100 : 0; const overdue = invoices.filter(i => i.status === 'Overdue').length; const response = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length; return <><PageHeading eyebrow="INSIGHTS" title="Advanced reports" description="Cross-module performance, conversion and revenue intelligence." /><div className="stats-grid"><StatCard label="Won revenue" value={formatAmount(won)} hint={`${deals.filter(d => d.stage === 'Won').length} won deals`} tone="green" icon="✓" /><StatCard label="Weighted forecast" value={formatAmount(deals.filter(d => !['Won', 'Lost'].includes(d.stage)).reduce((s, d) => s + Number(d.amount || 0) * stageProbability(d.stage), 0))} hint="Probability weighted" tone="purple" icon="↗" /><StatCard label="Lead conversion" value={`${leadConversion.toFixed(1)}%`} hint={`${leads.filter(l => l.status === 'Converted').length}/${leads.length} converted`} tone="blue" icon="◉" /><StatCard label="Collected" value={formatAmount(paid)} hint="Recorded payments" tone="orange" icon="$" /></div><div className="report-grid"><div className="panel report-summary"><h3>Sales funnel</h3><BarRow label="Leads" percent={100} display={leads.length} /><BarRow label="Qualified" percent={leads.length ? (leads.filter(l => l.status === 'Qualified').length / leads.length * 100) : 0} display={leads.filter(l => l.status === 'Qualified').length} /><BarRow label="Won deals" percent={leads.length ? (deals.filter(d => d.stage === 'Won').length / leads.length * 100) : 0} display={deals.filter(d => d.stage === 'Won').length} /></div><div className="panel report-summary"><h3>Revenue</h3><BarRow label="Open pipeline" percent={pipeline + won ? (pipeline / (pipeline + won)) * 100 : 0} display={formatAmount(pipeline)} /><BarRow label="Won" percent={pipeline + won ? (won / (pipeline + won)) * 100 : 0} display={formatAmount(won)} /><BarRow label="Collected" percent={won ? Math.min(100, paid / won * 100) : 0} display={formatAmount(paid)} /></div><div className="panel report-summary"><h3>Operations</h3><BarRow label="Activities completed" percent={activities.length ? activities.filter(a => a.status === 'Completed').length / activities.length * 100 : 0} display={`${activities.filter(a => a.status === 'Completed').length}/${activities.length}`} /><BarRow label="Tickets resolved" percent={tickets.length ? response / tickets.length * 100 : 0} display={`${response}/${tickets.length}`} /><BarRow label="Overdue invoices" percent={invoices.length ? overdue / invoices.length * 100 : 0} display={overdue} /></div><div className="panel report-summary"><h3>Quotes</h3><BarRow label="Accepted" percent={quotes.length ? quotes.filter(q => q.status === 'Accepted').length / quotes.length * 100 : 0} display={quotes.filter(q => q.status === 'Accepted').length} /><BarRow label="Sent" percent={quotes.length ? quotes.filter(q => q.status === 'Sent').length / quotes.length * 100 : 0} display={quotes.filter(q => q.status === 'Sent').length} /><BarRow label="Rejected" percent={quotes.length ? quotes.filter(q => q.status === 'Rejected').length / quotes.length * 100 : 0} display={quotes.filter(q => q.status === 'Rejected').length} /></div></div></> }

function Products({ products, onAdd, onDelete, currentUserId, isAdmin }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const save = async event => {
    event.preventDefault();
    if (!form.name.trim()) return;
    try {
      await onAdd({ name: form.name.trim(), description: form.description.trim() || null });
      setForm({ name: '', description: '' });
      setShow(false);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="PRODUCTS"
        title="Tech products"
        description="Manage the technology products your team can offer to customers."
        action="Add product"
        onAction={() => { setForm({ name: '', description: '' }); setShow(true); }}
      />
      {products.length === 0 ? (
        <div className="panel empty-state">
          <p>No products have been added yet.</p>
          <button className="primary-btn" onClick={() => setShow(true)}>Add your first product</button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <div className="panel product-card" key={product.id}>
              <div className="product-card-top">
                <div className="product-icon"><FileText size={18} /></div>
                {(isAdmin || product.created_by === currentUserId) && (
                  <button className="icon-btn" title="Delete product" onClick={() => onDelete(product.id)}><X size={16} /></button>
                )}
              </div>
              <h3>{product.name}</h3>
              <p>{product.description || 'No description added.'}</p>
              <small>Added {formatDate(product.created_at)}</small>
            </div>
          ))}
        </div>
      )}
      {show && (
        <div className="modal-backdrop" onClick={() => setShow(false)}>
          <form className="modal" onSubmit={save} onClick={e => e.stopPropagation()}>
            <div className="modal-heading">
              <h2>Add product</h2>
              <button type="button" className="icon-btn" onClick={() => setShow(false)}><X size={18} /></button>
            </div>
            <label>Product name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. IronScale" required /></label>
            <label>Description<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What does this product do?" /></label>
            <button className="primary-btn" type="submit">Add product</button>
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
function UserManagement({ users = [], loading = false, error = '', onRefresh, onUpdateUser, currentUserId }) {
  return (
    <>
      <PageHeading
        eyebrow="ADMIN"
        title="User Management"
        description="Manage user accounts and permissions."
      />
      <div className="panel user-management-panel">
        <div className="panel-header">
          <div>
            <h3>Authorized Users</h3>
            <p>View users and their current access permissions.</p>
          </div>
          <button
            type="button"
            className="secondary-btn"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No authorized users found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const isCurrentUser = user.user_id === currentUserId;
                  return (
                    <tr key={user.id}>
                      <td>{user.email}</td>

                      <td>
                        <select
                          value={user.role}
                          disabled={isCurrentUser}
                          onChange={(event) =>
                            onUpdateUser(user.id, {
                              role: event.target.value,
                            })
                          }
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="member">Member</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={user.status}
                          disabled={isCurrentUser}
                          onChange={(event) =>
                            onUpdateUser(user.id, {
                              status: event.target.value,
                            })
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td>
                        {user.status === 'pending' ? (
                          <button
                            type="button"
                            className="primary-btn"
                            onClick={() =>
                              onUpdateUser(user.id, {
                                status: 'active',
                              })
                            }
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="user-management-edit-label">
                            {isCurrentUser ? 'Current account' : 'Editable'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
function OrbitLogo({ className = "w-8 h-8" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="orbitGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <linearGradient id="orbitGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>

        <radialGradient id="coreGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </radialGradient>
      </defs>

      <ellipse
        cx="50" cy="50" rx="38" ry="14"
        stroke="url(#orbitGrad2)" strokeWidth="4.5" strokeLinecap="round"
        transform="rotate(-28 50 50)"
      />
      <ellipse
        cx="50" cy="50" rx="38" ry="14"
        stroke="url(#orbitGrad1)" strokeWidth="5" strokeLinecap="round"
        transform="rotate(32 50 50)"
      />
      <circle cx="50" cy="50" r="15" fill="url(#coreGrad)" />
      <circle cx="18" cy="30" r="3.5" fill="#10B981" />
      <circle cx="82" cy="70" r="3.5" fill="#10B981" />
      <circle cx="75" cy="28" r="3" fill="#6366F1" />
      <circle cx="25" cy="72" r="3" fill="#3B82F6" />
      <circle cx="45" cy="45" r="2.5" fill="#F8FAFC" opacity="0.8" />
    </svg>
  )
}

export default App;
