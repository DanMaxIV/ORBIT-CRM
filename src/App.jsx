import { useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from './lib/supabase';
import { LayoutDashboard, Users, Kanban, CalendarCheck, BarChart3, Settings, Bell, Search, Plus, ArrowUpRight, MoreHorizontal, Menu, X, UserRound, Pencil, Receipt, LogOut, UserCog, MessageCircle } from 'lucide-react';

function AuthScreen({ onGoogleSignIn, onEmailSignIn, onEmailSignUp, authMode, setAuthMode, email, setEmail, password, setPassword,
  error,
  loading
}) {

  const [showSignupModal, setShowSignupModal] = useState(false);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">O</div>
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
              <a
                type="button"
                className="auth-toggle-btn"
                onClick={() => setShowSignupModal(true)}
                disabled={loading}
              >
                Create
              </a>
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
              <a type="button"
                className="auth-toggle-btn"
                onClick={() => setShowSignupModal(false)}
                disabled={loading} >Sign in
              </a>
            </p>

          </form>
        </div>
      )}
    </div>
  );
}

const navItems = [
  ['Dashboard', LayoutDashboard], ['Customers', Users], ['Pipeline', Kanban], ['Activities', CalendarCheck], ['Tickets', Receipt], ['Reports', BarChart3],
  ['Chat', MessageCircle], ['Settings', Settings]
];

const EXCHANGE_RATES = {
  NGN: { symbol: '₦', rate: 1600 },
  USD: { symbol: '$', rate: 1 },
  EUR: { symbol: '€', rate: 0.92 }
};

function App() {

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
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
  const [showDealForm, setShowDealForm] = useState(false);
  const [newDeal, setNewDeal] = useState({ title: '', company: '', amount: '', stage: 'New Lead', customer_id: '' });
  const [dealSaving, setDealSaving] = useState(false);
  const [dealError, setDealError] = useState('');
  const [editingDeal, setEditingDeal] = useState(null);
  const [editDealSaving, setEditDealSaving] = useState(false);
  const [editDealError, setEditDealError] = useState('');
  const [search, setSearch] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', company: '', email: '' });
  const [activities, setActivities] = useState([]);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '', type: 'Task', activity_date: '', customer_id: '',
    notes: '', status: 'Scheduled'
  });
  const [activityError, setActivityError] = useState('');
  const [activitySaving, setActivitySaving] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSaving, setTicketSaving] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [newTicket, setNewTicket] = useState({
    title: '', description: '', customer_id: '', status: 'Open', priority: 'Medium',
    category: 'General'
  });
  const [saving, setSaving] = useState(false);
  const [customerError, setCustomerError] = useState('');

  const [currency, setCurrency] = useState('NGN');

  const formatAmount = (amountInUSD) => {
    const numericAmount = Number(amountInUSD) || 0;
    const config = EXCHANGE_RATES[currency] || EXCHANGE_RATES.NGN;
    const convertedAmount = numericAmount * config.rate;

    return `${config.symbol}${convertedAmount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  const filteredCustomers = useMemo(() => customers.filter(c => `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(search.toLowerCase())), [customers, search]);
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
    setAuthError('');
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
      setAuthError(
        'Account created successfully. Please check your email if confirmation is required. An administrator must approve your account before you can access the CRM.'
      );
    }

    setEmailLoading(false);
  }
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      setAuthError('Unable to sign out. Please try again.');
    }
  };
  const checkAuthorization = async (currentSession) => {
    if (!currentSession?.user) {
      setAuthorized(false);
      setAuthorizationProfile(null);
      setAuthorizationLoading(false);
      return;
    }

    setAuthorizationLoading(true);

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
      setAuthError(
        "Your Google account has not been approved. Please contact your administrator."
      );
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

  useEffect(() => {
    if (!session) {
      setAuthorized(false);
      setAuthorizationLoading(false);
      return;
    }
    checkAuthorization(session);
  }, [session]);

  useEffect(() => {
    if (!authorized || authorizationProfile?.role !== 'admin') {
      return;
    }

    fetchAuthorizedUsers();
  }, [authorized, authorizationProfile?.role]);

  // Fetch when page loads
  useEffect(() => {
    if (!session || !authorized) return;

    fetchCustomers();
    fetchDeals();
    fetchActivities();
    fetchTickets();
  }, [session, authorized]);


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
            status: 'Active'
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
        email: ''
      });

      setShowCustomerForm(false);

    } catch (error) {
      console.error('Unexpected error:', error);
      setCustomerError('Something went wrong. Please try again.');

    } finally {
      setSaving(false);
    }
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

    setDealSaving(true);

    try {
      const { data, error } = await supabase
        .from('deals')
        .insert([
          {
            title: newDeal.title.trim(),
            company: newDeal.company.trim() || null,
            amount: Number(newDeal.amount),
            stage: newDeal.stage,
            customer_id: newDeal.customer_id || null
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
        customer_id: ''
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
    const previousDeals = deals;

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
      setDeals(previousDeals);

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
          customer_id: editingDeal.customer_id || null
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
          status: newActivity.status
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
      status: 'Scheduled'
    });
    setShowActivityForm(false);
    fetchActivities();
  }
  async function updateActivityStatus(id, status) {
    const { data, error } = await supabase
      .from('activities')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating activity:', error);
      alert(error.message);
      return;
    }

    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === data.id ? data : activity
      )
    );
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
    if (!newTicket.title.trim()) {
      setTicketError('Ticket title is required.');
      return;
    }
    setTicketSaving(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([
          {
            title: newTicket.title.trim(),
            description: newTicket.description.trim() || null,
            customer_id: newTicket.customer_id || null,
            status: newTicket.status,
            priority: newTicket.priority,
            category: newTicket.category
          }
        ])
        .select(`
        *,
        customers (
          name,
          company
        )
      `)
        .single();
      if (error) {
        console.error('Error adding ticket:', error);
        setTicketError(error.message);
        return;
      }
      setTickets(prev => [data, ...prev]);
      setNewTicket({
        title: '',
        description: '',
        customer_id: '',
        status: 'Open',
        priority: 'Medium',
        category: 'General'
      });
      setShowTicketForm(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setTicketError('Something went wrong. Please try again.');
    } finally {
      setTicketSaving(false);
    }
  }
  async function updateTicketStatus(id, status) {
    setTicketError('');
    const { data, error } = await supabase
      .from('tickets')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
      *,
      customers (
        name,
        company
      )
    `)
      .single();
    if (error) {
      console.error('Error updating ticket status:', error);
      setTicketError(error.message);
      return;
    }
    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === id ? data : ticket
      )
    );
  }
  async function deleteTicket(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this ticket?'
    );
    if (!confirmed) return;
    setTicketError('');
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting ticket:', error);
      setTicketError(error.message);
      return;
    }
    setTickets(prev =>
      prev.filter(ticket => ticket.id !== id)
    );
  }

  if (authLoading || authorizationLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-loading">
          <div className="auth-brand">
            <div className="brand-mark">O</div>
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
        loading={authLoading || authorizationLoading || emailLoading}
      />
    );
  }

  // The rendering of the entire page is done here
  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark">O</div><span>orbit<span className="brand-accent">CRM</span></span><button className="icon-btn close-mobile" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        {navItems.map(([label, Icon]) => (
          <button
            key={label} className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => {
              setPage(label); setSidebarOpen(false);
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}

        {authorizationProfile?.role === 'admin' && (
          <button
            className={`nav-item ${page === 'UserManagement' ? 'active' : ''}`}
            onClick={() => {
              setPage('UserManagement');
              setSidebarOpen(false);
            }}
          >
            <UserCog size={18} />
            <span>User Management</span>
          </button>
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
            {(session?.user?.email?.[0] || 'U').toUpperCase()}
          </div>

          <div className="profile-details">
            <strong>{session?.user?.email || 'Signed-in user'}</strong>
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
      <header className="topbar"><button className="icon-btn menu-mobile" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{page}</strong></div><div className="top-actions"><div className="global-search"><Search size={16} /><input placeholder="Search anything..." value={search} onChange={e => setSearch(e.target.value)} /><kbd>⌘ K</kbd></div><button className="icon-btn"><Bell size={19} /><span className="notification-dot" /></button><div className="avatar">{(session?.user?.email?.[0] || 'U').toUpperCase()}</div></div></header>
      <section className="page-content">
        {page === 'Dashboard' && (
          <Dashboard revenue={revenue} customers={customers} deals={deals} activities={activities} setPage={setPage} formatAmount={formatAmount} />
        )}
        {page === 'Customers' && <Customers customers={filteredCustomers} search={search} setSearch={setSearch} onAdd={() => setShowCustomerForm(true)} formatAmount={formatAmount} />}
        {page === 'Pipeline' && (
          <Pipeline
            deals={deals}
            customers={customers}
            moveDeal={moveDeal}
            deleteDeal={deleteDeal}
            formatAmount={formatAmount}
            onEdit={deal => {
              setEditDealError('');
              setEditingDeal({
                ...deal,
                amount: String(deal.amount ?? '')
              });
            }}
            onAdd={() => {
              setDealError('');
              setShowDealForm(true);
            }}
          />
        )}
        {page === 'Activities' && (
          <Activities activities={activities} customers={customers} onAdd={() => { setActivityError(''); setShowActivityForm(true); }} onStatusChange={updateActivityStatus} onDelete={deleteActivity} />
        )}
        {page === 'Tickets' && (
          <>
            <PageHeading
              eyebrow="SUPPORT"
              title="Tickets"
              description="Manage customer issues and support requests."
              action="Create Ticket"
              onAction={() => {
                setTicketError('');
                setShowTicketForm(true);
              }}
            />

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>All Tickets</h3>
                  <p>{tickets.length} total tickets</p>
                </div>
              </div>

              {tickets.length === 0 ? (
                <div className="empty-state">
                  <p>No tickets yet.</p>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setTicketError('');
                      setShowTicketForm(true);
                    }}
                  >
                    Create your first ticket
                  </button>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Customer</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => (
                        <tr key={ticket.id}>
                          <td>
                            <strong>{ticket.title}</strong>
                            <div className="deal-customer">
                              {ticket.category || 'General'}
                            </div>
                          </td>
                          <td>
                            {ticket.customers?.name || 'Unassigned'}
                          </td>
                          <td>
                            <span className={`status ${ticket.priority.toLowerCase()}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td>
                            <select
                              className="ticket-status-select"
                              value={ticket.status}
                              onChange={e =>
                                updateTicketStatus(ticket.id, e.target.value)
                              }
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>
                          <td>
                            {ticket.created_at
                              ? new Date(ticket.created_at).toLocaleDateString()
                              : '—'}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="icon-btn"
                              title="Delete ticket"
                              onClick={() => deleteTicket(ticket.id)}
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
        {page === 'Chat' && <Chat />}
        {page === 'Reports' && <Reports customers={customers} deals={deals} formatAmount={formatAmount} />}
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
              placeholder="e.g. Acme Ltd"
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
                  company: selectedCustomer?.company || newDeal.company
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
            Deal amount

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
            Deal amount

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
              Date and time
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
    {customerError && (
      <div className="form-error">
        {customerError}
      </div>
    )}
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
function StatCard({ label, value, change, icon, tone }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-change"><span>↗ {change}</span><small>vs last month</small></div></div> }
function Dashboard({ revenue, customers, deals, activities, setPage, onAddCustomer, formatAmount }) {
  return <>
    <PageHeading eyebrow="OVERVIEW" title="Good morning, Dan" description="Here's what's happening with your business today." />
    <div className="stats-grid">
      <StatCard label="Total revenue" value={formatAmount(revenue)} change="0%" tone="purple" icon="↗" />
      <StatCard label="Total customers" value={customers.length} change="8.2%" tone="blue" icon="♙" />
      <StatCard label="Open opportunities" value={deals.filter(d => d.stage !== 'Won').length} change="4.6%" tone="orange" icon="◈" />
      <StatCard label="Conversion rate" value="24.8%" change="2.4%" tone="green" icon="◉" />
    </div>
    <div className="dashboard-grid">
      <div className="panel chart-panel">
        <div className="panel-heading">
          <div><h3>Revenue overview</h3><p>Monthly revenue performance</p></div>
          <select><option>Last 6 months</option><option>Last 12 months</option></select>
        </div>
        <div className="chart">
          <div className="chart-y"><span>$40k</span><span>$30k</span><span>$20k</span><span>$10k</span><span>$0</span></div>
          <div className="chart-body">
            <div className="grid-lines"><i /><i /><i /><i /><i /></div>
            <svg viewBox="0 0 600 220" preserveAspectRatio="none" className="line-chart">
              <defs>
                <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7357f0" stopOpacity=".25" /><stop offset="100%" stopColor="#7357f0" stopOpacity="0" /></linearGradient>
              </defs>
              <path d="M0 180 C55 160 75 120 120 140 S190 105 240 120 S300 60 360 90 S430 30 480 65 S550 15 600 25 L600 220 L0 220 Z" fill="url(#fill)" />
              <path d="M0 180 C55 160 75 120 120 140 S190 105 240 120 S300 60 360 90 S430 30 480 65 S550 15 600 25" fill="none" stroke="#7357f0" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div className="chart-labels"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span>
            </div>
          </div>
        </div>
      </div>
      <div className="panel activity-panel"><div className="panel-heading">
        <div><h3>Recent activity</h3><p>Your latest updates</p></div>
        <button className="text-btn" onClick={() => setPage('Activities')}>View all</button>
      </div>
        {activities.length === 0 ? (
          <div className="empty-state">
            <p>No activities yet.</p>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => setPage('Activities')}
            >
              View activities
            </button>
          </div>
        ) : (
          activities.slice(0, 4).map((activity) => (
            <Activity
              key={activity.id}
              icon={
                activity.status === 'Completed'
                  ? '✓'
                  : activity.type === 'Call'
                    ? '☎'
                    : activity.type === 'Meeting'
                      ? '◷'
                      : '↗'
              }
              title={activity.title}
              text={activity.type || 'Task'}
              time={
                activity.activity_date
                  ? new Date(
                    activity.activity_date
                  ).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                  : 'No date'
              }
            />
          ))
        )}
      </div>
    </div>
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h3>Recent customers</h3>
          <p>Your newest customer relationships</p>
        </div>
        <button className="text-btn" onClick={() => setPage('Customers')}>View all</button>
      </div>
      <CustomerTable customers={customers.slice(0, 4)} formatAmount={formatAmount} />
    </div></>
}
function Activity({ icon, title, text, time }) {
  return (
    <div className="activity-row">
      <div className="activity-icon">{icon}</div>
      <div><strong>{title}</strong><p>{text}</p></div>
      <time>{time}</time>
    </div>
  )
}
function CustomerTable({ customers, formatAmount }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Company</th>
            <th>Status</th>
            <th>Value</th>
            <th></th>
          </tr>
        </thead>
        <tbody>{customers.map(c => <tr key={c.id}>
          <td>
            <div className="customer-cell">
              <div className="avatar small">{c.name.split(' ').map(x => x[0]).join('')}</div>
              <div><strong>{c.name}</strong><span>{c.email}</span></div>
            </div></td>
          <td>{c.company || '—'}</td>
          <td><span className={`status ${c.status.toLowerCase()}`}>{c.status}</span></td><td>${(c.value || 0).toLocaleString()}</td>
          <td>{formatAmount(c.value || 0)}</td>
          <td>
            <button className="icon-btn"><MoreHorizontal size={17} /></button>
          </td>
        </tr>)}
        </tbody>
      </table>
    </div>
  )
}
function Customers({ customers, onAdd, formatAmount }) {
  return (
    <>
      <PageHeading eyebrow="RELATIONSHIPS" title="Customers" description="Manage your customer relationships in one place." action="Add customer" onAction={onAdd} />
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>All customers <span className="count-badge">{customers.length}</span></h3>
            <p>Search and manage your contacts.</p>
          </div>
          <button className="secondary-btn"><Users size={15} /> Import</button>
        </div>
        <CustomerTable customers={customers} formatAmount={formatAmount} />
      </div>
    </>

  )
}
function Pipeline({ deals, customers, moveDeal, deleteDeal, onEdit, onAdd, formatAmount }) {
  const stages = ['New Lead', 'Qualified', 'Proposal', 'Won'];
  return (
    <>
      <PageHeading
        eyebrow="SALES"
        title="Sales pipeline"
        description="Track deals from first contact to closed revenue."
        action="New deal"
        onAction={onAdd}
      />
      <div className="pipeline-grid">
        {stages.map(stage => (
          <div className="pipeline-column" key={stage}>
            <div className="pipeline-title">
              <span>{stage}</span>
              <span className="count-badge">{deals.filter(d => d.stage === stage).length}</span>
            </div>
            {deals.filter(d => d.stage === stage).map(deal => (
              <div className="deal-card" key={deal.id}>
                <div className="deal-top">
                  <span className="deal-label">DEAL</span>

                  <div className="deal-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Edit deal"
                      onClick={() => onEdit(deal)}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      className="icon-btn"
                      title="Delete deal"
                      onClick={() => deleteDeal(deal.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <h3>{deal.title}</h3>
                <p>{deal.company || 'No company specified'}</p>
                {deal.customer_id && (
                  <small className="deal-customer">
                    Customer:{' '}
                    {customers.find(
                      customer => customer.id === deal.customer_id
                    )?.name || 'Unknown customer'}
                  </small>
                )}

                <strong>{formatAmount(deal.amount)}</strong>
                <select value={deal.stage} onChange={e => moveDeal(deal.id, e.target.value)}>
                  {stages.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
function Activities({ activities, customers, onAdd, onStatusChange, onDelete, }) {
  function getCustomerName(customerId) {
    const customer = customers.find(
      (item) => item.id === customerId
    );

    return customer ? customer.name : 'No customer linked';
  }

  function formatActivityDate(dateValue) {
    if (!dateValue) return 'No date';

    return new Date(dateValue).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <>
      <PageHeading
        eyebrow="PRODUCTIVITY"
        title="Activities"
        description="Keep track of meetings, calls, and follow-ups."
        action="New activity"
        onAction={onAdd}
      />

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Upcoming activities</h3>
            <p>Your schedule and follow-ups.</p>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="empty-state">
            <p>No activities yet.</p>
            <button
              type="button"
              className="primary-btn"
              onClick={onAdd}
            >
              Create your first activity
            </button>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              className="activity-row large"
              key={activity.id}
            >
              <div className="date-box">
                <strong>
                  {activity.activity_date
                    ? new Date(
                      activity.activity_date
                    ).getDate()
                    : '--'}
                </strong>

                <span>
                  {activity.activity_date
                    ? new Date(
                      activity.activity_date
                    )
                      .toLocaleDateString('en-US', {
                        month: 'short',
                      })
                      .toUpperCase()
                    : '---'}
                </span>
              </div>

              <div className="activity-content">
                <strong>{activity.title}</strong>

                <p>
                  {activity.type || 'Task'} ·{' '}
                  {getCustomerName(activity.customer_id)}
                </p>

                <small>
                  {formatActivityDate(activity.activity_date)}
                </small>
              </div>

              <div className="activity-actions">
                <select
                  value={activity.status || 'Scheduled'}
                  onChange={(event) =>
                    onStatusChange(
                      activity.id,
                      event.target.value
                    )
                  }
                >
                  <option value="Scheduled">
                    Scheduled
                  </option>

                  <option value="In Progress">
                    In Progress
                  </option>

                  <option value="Completed">
                    Completed
                  </option>
                  <option value="Cancelled">
                    Cancelled
                  </option>
                </select>
                <button
                  type="button"
                  className="icon-btn"
                  title="Delete activity"
                  onClick={() => onDelete(activity.id)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
function Reports({ customers, deals, formatAmount }) {
  const customerValue = customers.reduce(
    (sum, customer) =>
      sum + (Number(customer.value) || 0),
    0
  );

  const wonDeals = deals.filter(
    (deal) => deal.stage === 'Won'
  ).length;

  return (
    <>
      <PageHeading eyebrow="INSIGHTS" title="Reports & analytics" description="Understand your sales and customer performance." />
      <div className="stats-grid">
        <StatCard label="Customer value" value={formatAmount(customerValue)} change="0%" tone="purple" icon="↗" />
        <StatCard label="Won deals" value={wonDeals} change="6.1%" tone="green" icon="✓" />
      </div>
      <div className="panel report-summary">
        <h3>Pipeline distribution</h3>
        {['New Lead', 'Qualified', 'Proposal', 'Won'].map(
          (stage) => {
            const count = deals.filter(
              (deal) => deal.stage === stage
            ).length;

            const percentage = deals.length
              ? (count / deals.length) * 100
              : 0;

            return (
              <div className="report-row" key={stage}>
                <span>{stage}</span>

                <div className="progress">
                  <i
                    style={{
                      width: `${count > 0
                        ? Math.max(8, percentage)
                        : 0
                        }%`,
                    }}
                  />
                </div>
                <strong>{count}</strong>
              </div>
            );
          }
        )}
      </div>
    </>
  );
}
function SettingsPage({ currency, setCurrency, loading, error }) {

  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

 const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
  
    setCurrency(selectedCurrency);

    await new Promise(resolve => setTimeout(resolve, 800));

    setIsSaving(false);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };
  return (
    <>
      <PageHeading eyebrow="WORKSPACE" title="Settings" description="Manage your workspace preferences." />
      <div className="panel settings-panel">
        <h3>Workspace settings</h3>
        <label>Workspace name<input defaultValue="Orbit CRM" /></label>
        <label>Default currency
          <select value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value)}>
            <option value="NGN">NGN — Nigerian Naira (₦)</option>
            <option value="USD">USD — US Dollar ($)</option>
            <option value="EUR">EUR — Euro (€)</option>
            </select>
        </label>
        <button className="primary-btn" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : saved ? 'Changes saved!' : 'Save changes'}</button>
      </div>
    </>
  )
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
export default App;
