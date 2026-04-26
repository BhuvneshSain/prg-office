import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Menu, X, Cloud, LayoutDashboard, Inbox, Send, BarChart, AlertOctagon, RefreshCw, Heart, Moon, Sun } from 'lucide-react';
import { getRegisterData, getSettings, updateTask } from './lib/dataService';
import type { RegisterEntry, SettingsData, TaskEntry } from './types';
import EntryForm from './components/EntryForm';
import DataTable from './components/DataTable';
import Reports from './components/Reports';
import OrderForm from './components/OrderForm';
import OrdersTable from './components/OrdersTable';
import Settings from './components/Settings';
import StaffForm from './components/StaffForm';
import StaffTable from './components/StaffTable';
import EssentialDocs from './components/EssentialDocs';
import TaskManager from './components/TaskManager';
import TaskForm from './components/TaskForm';
import { Users, FileText, LogOut, Loader2, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Login from './components/Login';
import DocumentModal from './components/DocumentModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'dashboard' | 'inward' | 'outward' | 'orders' | 'staff' | 'tasks' | 'essential-docs' | 'reports' | 'settings';

const TAB_LABELS: Record<Tab, string> = {
  dashboard: 'Dashboard',
  inward: 'Inward Register',
  outward: 'Outward Register',
  orders: 'Important Orders',
  staff: 'Staff Management',
  tasks: 'Task Management',
  'essential-docs': 'Essential Tools / Docs',
  reports: 'Reports',
  settings: 'Settings',
};

const SESSION_DURATION = (Number(import.meta.env.VITE_SESSION_DURATION_HOURS) || 8) * 60 * 60 * 1000;

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('pos_theme') === 'dark');

  // Theme Sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pos_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pos_theme', 'light');
    }
  }, [isDarkMode]);

  // Check authentication on mount
  useEffect(() => {
    const authTime = localStorage.getItem('pos_auth_time');
    const authUser = localStorage.getItem('pos_auth_user');
    
    if (authTime && authUser) {
      const elapsed = Date.now() - Number(authTime);
      if (elapsed < SESSION_DURATION) {
        setIsAuthenticated(true);
      } else {
        localStorage.clear();
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Periodic check for session expiry
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        const authTime = localStorage.getItem('pos_auth_time');
        if (authTime) {
          const elapsed = Date.now() - Number(authTime);
          if (elapsed >= SESSION_DURATION) {
            handleLogout();
          }
        }
      }, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = async (username: string, passwordHash: string) => {
    const expectedUser = import.meta.env.VITE_APP_USERNAME || 'admin';
    const expectedHash = import.meta.env.VITE_APP_PASSWORD_HASH || '';

    if (username === expectedUser && passwordHash === expectedHash) {
      localStorage.setItem('pos_auth', 'true');
      localStorage.setItem('pos_auth_time', Date.now().toString());
      localStorage.setItem('pos_auth_user', username);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_auth');
    localStorage.removeItem('pos_auth_time');
    localStorage.removeItem('pos_auth_user');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (window.innerWidth >= 768) setSidebarOpen(true);
  }, []);

  const [inwardData, setInwardData] = useState<RegisterEntry[]>([]);
  const [outwardData, setOutwardData] = useState<RegisterEntry[]>([]);
  const [ordersData, setOrdersData] = useState<RegisterEntry[]>([]);
  const [staffData, setStaffData] = useState<RegisterEntry[]>([]);
  const [tasksData, setTasksData] = useState<TaskEntry[]>([]);
  const [myDocsData, setMyDocsData] = useState<RegisterEntry[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [globalViewEntry, setGlobalViewEntry] = useState<RegisterEntry | null>(null);
  const [taskModalDoc, setTaskModalDoc] = useState<RegisterEntry | null>(null);
  const [editTask, setEditTask] = useState<TaskEntry | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setRefreshing(true);
    setErrorHeader(null);
    try {
      const [inData, outData, ordData, stfData, taskData, docData, setData] = await Promise.all([
        getRegisterData('inward'),
        getRegisterData('outward'),
        getRegisterData('orders'),
        getRegisterData('staff'),
        getRegisterData('tasks') as Promise<any>,
        getRegisterData('essential-docs'),
        getSettings()
      ]);
      setInwardData(inData);
      setOutwardData(outData);
      setOrdersData(ordData);
      setStaffData(stfData);
      setTasksData(taskData);
      setMyDocsData(docData);
      setSettings(setData);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorHeader(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleNavClick = (tab: Tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleToggleTaskStatus = async (task: TaskEntry) => {
    const originalStatus = task.status;
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    
    // Optimistic Update
    setTasksData(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    try {
      const ok = await updateTask({ ...task, status: newStatus });
      if (!ok) throw new Error("Sync failed");
      fetchData(); // Sync with server source of truth
    } catch (err) {
      console.error("Task status sync failed", err);
      // Rollback on failure
      setTasksData(prev => prev.map(t => t.id === task.id ? { ...t, status: originalStatus } : t));
      alert("Operational error: Network synchronization failed. Status reverted.");
    }
  };

  const handleViewLinkedDoc = (id: string, type: 'inward' | 'orders') => {
    const dataSource = type === 'inward' ? inwardData : ordersData;
    const doc = dataSource.find(d => d.id === id);
    if (doc) setGlobalViewEntry(doc);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inward':
        return (
          <div className="space-y-6">
            <EntryForm type="inward" existingDepts={settings?.departments || []} existingProjects={settings?.projects || []} onSuccess={fetchData} />
            <DataTable 
              type="inward" 
              data={inwardData} 
              loading={loading} 
              departments={settings?.departments || []} 
              projects={settings?.projects || []} 
              tasks={tasksData}
              onRefresh={fetchData} 
              onLinkTask={(doc) => { 
                setTaskModalDoc(doc); 
                setActiveTab('tasks');
                setShowTaskForm(true); 
              }}
            />
          </div>
        );
      case 'outward':
        return (
          <div className="space-y-6">
            <EntryForm type="outward" existingDepts={settings?.departments || []} existingProjects={settings?.projects || []} onSuccess={fetchData} />
            <DataTable type="outward" data={outwardData} loading={loading} departments={settings?.departments || []} projects={settings?.projects || []} onRefresh={fetchData} />
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-6">
            <OrderForm existingProjects={settings?.projects || []} onSuccess={fetchData} />
            <OrdersTable data={ordersData} loading={loading} projects={settings?.projects || []} onRefresh={fetchData} />
          </div>
        );
      case 'staff':
        return (
          <div className="space-y-6">
            <StaffForm existingProjects={settings?.projects || []} existingPosts={settings?.posts || []} onSuccess={fetchData} />
            <StaffTable data={staffData} loading={loading} projects={settings?.projects || []} posts={settings?.posts || []} onRefresh={fetchData} />
          </div>
        );
      case 'tasks':
        return (
          <div className="space-y-6">
            {showTaskForm && (
              <TaskForm 
                staffNames={staffData.map(s => s.partyName)} 
                onSuccess={fetchData} 
                editTask={editTask}
                linkedDoc={taskModalDoc}
                onClose={() => { setShowTaskForm(false); setEditTask(null); setTaskModalDoc(null); }} 
              />
            )}
            <TaskManager 
              tasks={tasksData} 
              loading={loading} 
              onRefresh={fetchData} 
              onEdit={(t) => { setEditTask(t); setShowTaskForm(true); }}
              onToggleStatus={handleToggleTaskStatus}
              onViewDoc={handleViewLinkedDoc}
              onNew={() => { setEditTask(null); setTaskModalDoc(null); setShowTaskForm(true); }}
            />
          </div>
        );
      case 'essential-docs':
        return <EssentialDocs data={myDocsData} onRefresh={fetchData} />;
      case 'reports':
        return (
          <div>
            <Reports inward={inwardData} outward={outwardData} orders={ordersData} myDocs={myDocsData} />
          </div>
        );
      case 'settings':
        return (
          <div>
            {settings
              ? <Settings settings={settings} onSettingsChange={fetchData} />
              : <div className="flex justify-center p-16"><div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" /></div>
            }
          </div>
        );
      default:
        return <Dashboard onNavigate={handleNavClick} inwardCount={inwardData.length} outwardCount={outwardData.length} ordersCount={ordersData.length} staffCount={staffData.length} myDocsCount={myDocsData.length} tasksCount={tasksData.length} />;
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex bg-[var(--bg-page)] min-h-[100dvh] font-sans text-[var(--text-primary)] selection:bg-cyber-violet/10 selection:text-cyber-violet">

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, slide-in overlay */}
      <aside className={cn(
        "fixed md:relative z-50 h-[100dvh] top-0 left-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col py-6 gap-6 shrink-0",
        sidebarOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full md:w-24 md:translate-x-0",
        "bg-[var(--bg-sidebar)] backdrop-blur-3xl border-r border-[var(--glass-border)] shadow-[0_0_40px_rgba(0,0,0,0.02)]"
      )}>
        {/* Logo row */}
        <div className="flex items-center justify-between px-6 mb-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyber-violet to-cyber-cyan flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyber"
            >
              <span className="text-white font-black text-sm">POS</span>
            </motion.div>
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="font-extrabold text-sm tracking-tight text-[var(--text-primary)] leading-none">Programmer</span>
                <span className="font-bold text-[11px] text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Office Suite</span>
              </motion.div>
            )}
          </div>
          
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all active:scale-90 hidden md:flex"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl bg-slate-50 text-slate-400 transition-all active:scale-90 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-1.5 px-4 overflow-y-auto pb-4 custom-scrollbar">
          {(Object.entries(TAB_LABELS) as [Tab, string][]).map(([tab, label]) => {
            const icons: Record<Tab, React.ReactNode> = {
              dashboard: <LayoutDashboard className="w-5 h-5" />,
              inward: <Inbox className="w-5 h-5" />,
              outward: <Send className="w-5 h-5" />,
              orders: <AlertOctagon className="w-5 h-5" />,
              staff: <Users className="w-5 h-5" />,
              tasks: <ClipboardList className="w-5 h-5" />,
              'essential-docs': <FileText className="w-5 h-5" />,
              reports: <BarChart className="w-5 h-5" />,
              settings: <SettingsIcon className="w-5 h-5" />,
            };
            const counts: Record<string, number> = {
              inward: inwardData.length,
              outward: outwardData.length,
              orders: ordersData.length,
              staff: staffData.length,
              tasks: tasksData.filter(t => t.status !== 'Completed').length,
              'essential-docs': myDocsData.length,
            };

            return (
              <NavItem 
                key={tab}
                icon={icons[tab]} 
                label={label} 
                active={activeTab === tab} 
                isOpen={sidebarOpen} 
                onClick={() => handleNavClick(tab)} 
                badge={counts[tab]} 
              />
            );
          })}

          <div className="flex-1" />
          
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group w-full text-slate-400 hover:text-red-500 hover:bg-red-50/50",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            {sidebarOpen && <span className="font-bold text-sm">Sign Out</span>}
          </motion.button>
        </nav>

        {/* Dropbox status */}
        <div className="px-4 pb-2">
          <div className={cn(
            "p-3 rounded-[24px] bg-[var(--card-bg)] border border-[var(--border-primary)] flex items-center gap-3",
            !sidebarOpen && "justify-center"
          )}>
            <div className="relative flex-shrink-0">
              <Cloud className="w-5 h-5 text-indigo-400" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Dropbox Cloud</p>
                <p className="text-xs font-bold text-slate-700">Healthy</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden bg-[var(--bg-page)] relative">
        {/* Ambient glows */}
        <div className="absolute top-0 left-0 w-[60%] h-[40%] bg-indigo-400/4 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[40%] bg-purple-400/4 blur-[100px] rounded-full pointer-events-none" />

        {/* Top header bar */}
        <header className="relative z-10 bg-[var(--bg-sidebar)] backdrop-blur-2xl border-b border-[var(--border-primary)] h-14 flex items-center justify-between px-3 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1 text-slate-500 hover:text-indigo-600 md:hidden transition-colors rounded-xl hover:bg-indigo-50 active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <motion.h1 
                key={activeTab}
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-lg font-extrabold text-[var(--text-primary)] leading-none tracking-tight"
              >
                {TAB_LABELS[activeTab]}
              </motion.h1>
              {activeTab !== 'dashboard' && (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Register</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl transition-all active:scale-95 border border-transparent text-slate-400 hover:text-cyber-violet hover:bg-cyber-violet/5 dark:hover:bg-cyber-violet/10"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleNavClick('settings')}
              className={`p-2 rounded-xl transition-all active:scale-95 border ${activeTab === 'settings' ? 'bg-cyber-violet/5 text-cyber-violet border-cyber-violet/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-transparent'}`}
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Error banner */}
        {errorHeader && (
          <div className="mx-3 sm:mx-6 mt-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 flex-shrink-0">
            <div className="p-1.5 bg-red-100 text-red-600 rounded-full flex-shrink-0">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-red-800 font-bold text-sm">Connection Error</p>
              <p className="text-red-600 text-xs font-medium truncate">{errorHeader}</p>
            </div>
          </div>
        )}

        {/* Scrollable content — with bottom padding for mobile tab bar */}
        <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-8 sm:py-10 pb-28 md:pb-8 custom-scrollbar flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-full h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Footer */}
          <footer className="mt-8 pt-6 pb-2 border-t border-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-primary)] flex items-center justify-center shadow-sm">
                <span className="text-cyber-violet font-black text-[9px]">POS</span>
              </div>
              <p>© {new Date().getFullYear()} ProOffice Suite. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
              <span>Built with</span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
              <span>by</span>
              <a 
                href="https://github.com/BhuvneshSain" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors underline decoration-indigo-200 underline-offset-2"
              >
                Bhuvnesh Sain
              </a>
            </div>
          </footer>
        </div>
        {/* Mobile bottom navigation tab bar */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 z-40 bg-[var(--bg-sidebar)] backdrop-blur-3xl border border-[var(--glass-border)] flex items-stretch h-16 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] px-2">
          {(
            [
              { tab: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Home' },
              { tab: 'inward', icon: <Inbox className="w-5 h-5" />, label: 'Inward' },
              { tab: 'tasks', icon: <ClipboardList className="w-5 h-5" />, label: 'Tasks' },
              { tab: 'orders', icon: <AlertOctagon className="w-5 h-5" />, label: 'Orders' },
              { tab: 'essential-docs', icon: <FileText className="w-5 h-5" />, label: 'Docs' },
            ] as const
          ).map(({ tab, icon, label }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleNavClick(tab)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-all relative px-1",
                  isActive ? "text-cyber-violet" : "text-slate-400"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="mobile-nav-active"
                    className="absolute inset-x-1 inset-y-2 bg-cyber-violet/5 rounded-2xl z-0"
                  />
                )}
                <motion.div 
                  animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                  className="relative z-10"
                >
                  {icon}
                </motion.div>
                <span className="relative z-10 scale-90">{label}</span>
              </button>
            );
          })}
        </nav>
      </main>
      {/* Global Document Modal */}
      {globalViewEntry && (
        <DocumentModal 
          entry={globalViewEntry} 
          onClose={() => setGlobalViewEntry(null)} 
        />
      )}
    </div>
  );
}

function NavItem({ icon, label, isOpen, active = false, onClick, badge }: { icon: React.ReactNode; label: string; isOpen: boolean; active?: boolean; onClick: () => void; badge?: number | null }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      title={!isOpen ? label : undefined}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-[20px] transition-all duration-300 group w-full relative",
        active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
        !isOpen && "justify-center px-0"
      )}
    >
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
          className="absolute inset-0 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-slate-100 rounded-[20px] z-0"
        />
      )}
      
      <div className={cn(
        "relative z-10 transition-colors flex-shrink-0",
        active ? "text-cyber-violet" : "group-hover:text-[var(--text-secondary)]"
      )}>
        {icon}
      </div>
      
      {isOpen && (
        <span className={cn(
          "relative z-10 font-bold text-sm tracking-tight transition-all",
          active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
        )}>
          {label}
        </span>
      )}
      
      {isOpen && badge != null && badge > 0 && (
        <motion.span 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={cn(
            "relative z-10 text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center ml-auto",
            active ? "bg-cyber-violet/10 text-cyber-violet/80" : "bg-slate-100 text-slate-400"
          )}
        >
          {badge}
        </motion.span>
      )}
    </motion.button>
  );
}

function Dashboard({ onNavigate, inwardCount, outwardCount, ordersCount, staffCount, myDocsCount, tasksCount }: { onNavigate: (tab: Tab) => void; inwardCount: number; outwardCount: number; ordersCount: number; staffCount: number; myDocsCount: number; tasksCount: number }) {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", bounce: 0.3, duration: 0.6 } 
    }
  };

  const stats = [
    { label: 'Inward', count: inwardCount, color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-100' },
    { label: 'Outward', count: outwardCount, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
    { label: 'Orders', count: ordersCount, color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100' },
    { label: 'Staff', count: staffCount, color: 'text-violet-600', bg: 'bg-violet-50/50', border: 'border-violet-100' },
    { label: 'Tasks', count: tasksCount, color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100' },
    { label: 'Docs', count: myDocsCount, color: 'text-cyber-violet', bg: 'bg-indigo-50/50', border: 'border-indigo-100' },
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto w-full space-y-10 py-4"
    >
      <motion.header variants={item} className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-[1px] w-8 bg-cyber-violet/30" />
          <p className="text-[10px] font-black text-cyber-violet uppercase tracking-[0.2em]">Operational Overview</p>
        </div>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight leading-[1.1]">
          System <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-violet to-cyber-cyan">Dashboard</span>
        </h2>
        <p className="text-[var(--text-secondary)] text-sm sm:text-lg font-medium max-w-2xl leading-relaxed">
          Welcome back. Your document repository is fully synchronized and secured.
        </p>
      </motion.header>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <motion.div 
            key={stat.label}
            variants={item}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={cn(
              "group relative overflow-hidden rounded-[32px] p-5 border shadow-sm transition-all duration-300",
              stat.bg, stat.border
            )}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 blur-2xl rounded-full translate-x-8 -translate-y-8" />
            <p className={cn("text-3xl sm:text-4xl font-black tracking-tighter", stat.color)}>{stat.count}</p>
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tool cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ToolCard title="Inward Register" icon={<Inbox className="w-6 h-6" />} desc="Log and manage incoming documents." variant="blue" variants={item} onClick={() => onNavigate('inward')} />
        <ToolCard title="Outward Register" icon={<Send className="w-6 h-6" />} desc="Track dispatches and recipient info." variant="emerald" variants={item} onClick={() => onNavigate('outward')} />
        <ToolCard title="Important Orders" icon={<AlertOctagon className="w-6 h-6" />} desc="Log urgent assignments & directives." variant="amber" variants={item} onClick={() => onNavigate('orders')} />
        <ToolCard title="Staff Directory" icon={<Users className="w-6 h-6" />} desc="Personnel and project allocations." variant="violet" variants={item} onClick={() => onNavigate('staff')} />
        <ToolCard title="Task Center" icon={<ClipboardList className="w-6 h-6" />} desc="Manage directives and responses." variant="indigo" variants={item} onClick={() => onNavigate('tasks')} />
        <ToolCard title="Resource Hub" icon={<FileText className="w-6 h-6" />} desc="Essential tools and documentation." variant="indigo" variants={item} onClick={() => onNavigate('essential-docs')} />
        <ToolCard title="Analytics" icon={<BarChart className="w-6 h-6" />} desc="Aggregated stats and timelines." variant="fuchsia" variants={item} onClick={() => onNavigate('reports')} />
      </div>
    </motion.div>
  );
}

function ToolCard({ title, icon, desc, variant, variants, onClick }: { title: string; icon: React.ReactNode; desc: string; variant: string; variants: Variants; onClick: () => void }) {
  const colorVariants: Record<string, { icon: string, glow: string }> = {
    blue: { icon: 'text-blue-500 bg-blue-50', glow: 'shadow-blue-500/10' },
    emerald: { icon: 'text-emerald-500 bg-emerald-50', glow: 'shadow-emerald-500/10' },
    amber: { icon: 'text-amber-500 bg-amber-50', glow: 'shadow-amber-500/10' },
    violet: { icon: 'text-violet-500 bg-violet-50', glow: 'shadow-violet-500/10' },
    indigo: { icon: 'text-indigo-500 bg-indigo-50', glow: 'shadow-indigo-500/10' },
    fuchsia: { icon: 'text-fuchsia-500 bg-fuchsia-50', glow: 'shadow-fuchsia-500/10' },
  };

  return (
    <motion.div
      variants={variants}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "glass-card group p-6 rounded-[32px] cursor-pointer relative overflow-hidden transition-all duration-500",
        colorVariants[variant].glow
      )}
    >
      <div className="relative z-10 flex flex-col gap-4">
        <div className={cn(
          "w-14 h-14 rounded-[22px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
          colorVariants[variant].icon
        )}>
          {icon}
        </div>
        <div>
          <h4 className="font-extrabold text-[var(--text-primary)] text-lg tracking-tight group-hover:text-cyber-violet transition-colors">{title}</h4>
          <p className="text-sm text-[var(--text-secondary)] font-medium mt-1 leading-relaxed opacity-80">{desc}</p>
        </div>
      </div>
      
      {/* Refined subtle glow edge */}
      <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-current opacity-[0.03] blur-3xl group-hover:opacity-[0.08] transition-opacity" />
    </motion.div>
  );
}
