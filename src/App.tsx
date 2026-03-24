import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, ReactNode } from 'react';
import { auth } from './firebase';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  ShoppingCart, 
  ReceiptIndianRupee, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  UserCircle,
  Plus,
  Moon,
  Sun,
  Lock,
  User as UserIcon
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

// Pages
import Dashboard from './pages/Dashboard';
import StaffManagement from './pages/StaffManagement';
import AttendanceModule from './pages/AttendanceModule';
import SalesModule from './pages/SalesModule';
import ExpensesModule from './pages/ExpensesModule';
import ReportsModule from './pages/ReportsModule';

interface DemoUser {
  uid: string;
  email: string;
  displayName: string;
  isDemo: boolean;
}

type AppUser = DemoUser;

function Layout({ children, user, onLogout, isDarkMode, setIsDarkMode }: { children: ReactNode; user: AppUser; onLogout: () => void; isDarkMode: boolean; setIsDarkMode: (val: boolean) => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Staff', path: '/staff', icon: Users },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Sales', path: '/sales', icon: ShoppingCart },
    { name: 'Expenses', path: '/expenses', icon: ReceiptIndianRupee },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  const bottomNavItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Staff', path: '/staff', icon: Users },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Sales', path: '/sales', icon: ShoppingCart },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0a0a0f] flex flex-col lg:flex-row transition-colors duration-500 relative overflow-hidden">
      <div className="atmosphere" />
      <Toaster position="top-center" richColors />
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 glass-card transform transition-transform duration-500 lg:translate-x-0 lg:static lg:inset-0 m-4 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        isSidebarOpen ? "translate-x-0" : "-translate-x-[150%]"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white purple-glow shadow-lg">
                S
              </div>
              <span className="gradient-text">Stone Edge</span>
            </h1>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group",
                    isActive 
                      ? "bg-purple-500/10 text-purple-500 shadow-[inset_0_0_20px_rgba(147,51,234,0.1)] border border-purple-500/20" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-purple-500" : "text-slate-400 group-hover:text-purple-400")} />
                  {item.name}
                  {isActive && (
                    <motion.div 
                      layoutId="activeNav"
                      className="w-1.5 h-1.5 rounded-full bg-purple-500 ml-auto shadow-[0_0_8px_rgba(147,51,234,0.8)]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-6 border-t border-white/5 space-y-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-white/5 transition-all group"
            >
              <div className="p-2 rounded-lg bg-white/5 group-hover:bg-purple-500/10 transition-colors">
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-purple-500" />}
              </div>
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            
            <div className="flex items-center gap-3 px-5 py-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                {user.displayName?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.displayName || 'Admin'}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-bold uppercase tracking-tighter opacity-50">{user.email}</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-20 lg:pb-0">
        <header className="h-14 lg:h-20 glass-card border-x-0 border-t-0 flex items-center justify-between px-3 sm:px-4 lg:px-10 shrink-0 z-30 relative">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 sm:p-2.5 glass-card text-slate-600 dark:text-slate-400 hover:bg-white/5 rounded-xl lg:hidden purple-glow"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white lg:hidden tracking-tight truncate max-w-[150px] sm:max-w-none">
              {navItems.find(i => i.path === location.pathname)?.name || 'Stone Edge'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 sm:p-2.5 glass-card text-slate-600 dark:text-slate-400 hover:bg-white/5 rounded-xl transition-all purple-glow"
            >
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />}
            </button>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Welcome back,</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest opacity-50">Managing Operations</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Bottom Navigation (Mobile) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#0a0a0f]/90 backdrop-blur-2xl border-t border-white/5 lg:hidden flex items-center justify-around px-2 py-2 z-40 shadow-[0_-8px_32px_rgba(0,0,0,0.2)]">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-300 relative flex-1 py-1",
                  isActive ? "text-purple-600 dark:text-purple-400" : "text-slate-400 dark:text-slate-500"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300 relative",
                  isActive ? "bg-purple-500/10 shadow-[0_0_15px_rgba(147,51,234,0.1)]" : "hover:bg-white/5"
                )}>
                  <item.icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "scale-110" : "scale-100")} />
                  {isActive && (
                    <div className="absolute inset-0 bg-purple-500/20 blur-lg rounded-full animate-pulse" />
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-tighter">{item.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeBottomNav"
                    className="absolute -top-2 w-1 h-1 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(147,51,234,0.8)]"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function Login({ onDemoLogin }: { onDemoLogin: (user: DemoUser) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Admin@123' && password === 'Admin@123') {
      const demoUser: DemoUser = {
        uid: 'demo-admin',
        email: 'admin@stoneedge.demo',
        displayName: 'Demo Admin',
        isDemo: true
      };
      onDemoLogin(demoUser);
      toast.success('Welcome back, Admin!');
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      <div className="atmosphere" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card rounded-[32px] p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 purple-glow">
            S
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Stone Edge Manager</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to manage your business</p>
        </div>

        <form onSubmit={handleDemoLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-900 dark:text-white"
                placeholder="Enter username"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-900 dark:text-white"
                placeholder="Enter password"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full gradient-bg text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-all purple-glow"
          >
            Login
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-8">
          Authorized personnel only. All access is logged.
        </p>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return true; // Default to dark mode
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Check for demo user in session storage
    const savedDemoUser = sessionStorage.getItem('demoUser');
    if (savedDemoUser) {
      setUser(JSON.parse(savedDemoUser));
    }
    setLoading(false);
  }, []);

  const handleDemoLogin = (demoUser: DemoUser) => {
    setUser(demoUser);
    sessionStorage.setItem('demoUser', JSON.stringify(demoUser));
  };

  const handleLogout = async () => {
    setUser(null);
    sessionStorage.removeItem('demoUser');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
        <div className="atmosphere" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center text-white text-3xl font-bold purple-glow animate-pulse">
            S
          </div>
          <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-full h-full gradient-bg shadow-[0_0_15px_rgba(147,51,234,0.5)]"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onDemoLogin={handleDemoLogin} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/staff" element={<StaffManagement />} />
          <Route path="/attendance" element={<AttendanceModule />} />
          <Route path="/sales" element={<SalesModule />} />
          <Route path="/expenses" element={<ExpensesModule />} />
          <Route path="/reports" element={<ReportsModule />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
