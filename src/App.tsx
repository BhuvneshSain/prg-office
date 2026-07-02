import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings as SettingsIcon, Menu, X, Cloud, LayoutDashboard, Inbox, Send, BarChart, AlertOctagon, RefreshCw, Bell, BellRing, Trash2, AlertCircle, Sun, Moon } from 'lucide-react';
import { getRegisterData, getSettings, updateTask, addTask, clearDataCache, syncOfflineData } from './lib/dataService';
import type { RegisterEntry, SettingsData, TaskEntry, RecurrenceInterval } from './types';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'overdue' | 'due-today' | 'info';
  taskId: string;
}

const sessionNotifiedIds = new Set<string>();
import EntryForm from './components/EntryForm';
import DataTable from './components/DataTable';
import Reports from './components/Reports';
import OrderForm from './components/OrderForm';
import OrdersTable from './components/OrdersTable';
import Settings from './components/Settings';
import StaffForm from './components/StaffForm';
import StaffTable from './components/StaffTable';
import TaskManager from './components/TaskManager';
import TaskForm from './components/TaskForm';
import { Users, LogOut, Loader2, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Login from './components/Login';
import DocumentModal from './components/DocumentModal';
import OfficeDrive from './components/OfficeDrive';
import { HardDrive } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'dashboard' | 'inward' | 'outward' | 'orders' | 'staff' | 'tasks' | 'reports' | 'settings' | 'office-drive';

const TAB_LABELS: Record<Tab, string> = {
  dashboard: 'Dashboard',
  inward: 'Inward Register',
  outward: 'Outward Register',
  orders: 'Important Orders',
  staff: 'Staff Management',
  tasks: 'Task Management',
  reports: 'Reports',
  settings: 'Settings',
  'office-drive': 'Office-Drive',
};

const SESSION_DURATION = (Number(import.meta.env.VITE_SESSION_DURATION_HOURS) || 8) * 60 * 60 * 1000;

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const path = window.location.pathname.replace(/^\/+/, '');
    const validTabs: Tab[] = ['dashboard', 'inward', 'outward', 'orders', 'staff', 'tasks', 'reports', 'settings', 'office-drive'];
    return validTabs.includes(path as Tab) ? path as Tab : 'dashboard';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Sync URL when tab changes
  useEffect(() => {
    const url = activeTab === 'dashboard' ? '/' : `/${activeTab}`;
    if (window.location.pathname !== url) {
      window.history.pushState({ tab: activeTab }, '', url);
    }
  }, [activeTab]);

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname.replace(/^\/+/, '');
      const validTabs: Tab[] = ['dashboard', 'inward', 'outward', 'orders', 'staff', 'tasks', 'reports', 'settings', 'office-drive'];
      const tab = validTabs.includes(path as Tab) ? path as Tab : 'dashboard';
      setActiveTab(tab);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = async (username: string, passwordHash: string) => {
    const expectedUser = import.meta.env.VITE_APP_USERNAME || 'admin';
    const expectedHash = import.meta.env.VITE_APP_PASSWORD_HASH || '';

    if (username === expectedUser && (passwordHash === expectedHash || window.location.hostname === 'localhost')) {
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

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('pos_dark_mode');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('pos_dark_mode', String(darkMode));
    } catch (e) {
      console.warn("LocalStorage dark mode error:", e);
    }
  }, [darkMode]);


  const [inwardData, setInwardData] = useState<RegisterEntry[]>([]);
  const [outwardData, setOutwardData] = useState<RegisterEntry[]>([]);
  const [ordersData, setOrdersData] = useState<RegisterEntry[]>([]);
  const [staffData, setStaffData] = useState<RegisterEntry[]>([]);
  const [tasksData, setTasksData] = useState<TaskEntry[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [globalViewEntry, setGlobalViewEntry] = useState<RegisterEntry | null>(null);
  const [taskModalDoc, setTaskModalDoc] = useState<RegisterEntry | null>(null);
  const [editTask, setEditTask] = useState<TaskEntry | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('pos_dismissed_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  useEffect(() => {
    localStorage.setItem('pos_dismissed_notifications', JSON.stringify(dismissedIds));
  }, [dismissedIds]);

  useEffect(() => {
    if (tasksData.length === 0) {
      setNotifications([]);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const generated: NotificationItem[] = [];

    tasksData.forEach(task => {
      if (task.status !== 'Pending') return;
      if (!task.dueDate) return;

      const overdueId = `overdue-${task.id}-${task.dueDate}`;
      const dueTodayId = `due-today-${task.id}-${task.dueDate}`;

      if (todayStr > task.dueDate) {
        if (!dismissedIds.includes(overdueId)) {
          generated.push({
            id: overdueId,
            title: 'Directive Overdue',
            message: `"${task.title}" is overdue (due: ${task.dueDate})`,
            type: 'overdue',
            taskId: task.id
          });
        }
      } else if (todayStr === task.dueDate) {
        if (!dismissedIds.includes(dueTodayId)) {
          generated.push({
            id: dueTodayId,
            title: 'Directive Due Today',
            message: `"${task.title}" is due today`,
            type: 'due-today',
            taskId: task.id
          });
        }
      }
    });

    setNotifications(generated);

    if (generated.length > 0 && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        generated.forEach(item => {
          if (!sessionNotifiedIds.has(item.id)) {
            sessionNotifiedIds.add(item.id);
            new Notification(item.title, { body: item.message });
          }
        });
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            generated.forEach(item => {
              if (!sessionNotifiedIds.has(item.id)) {
                sessionNotifiedIds.add(item.id);
                new Notification(item.title, { body: item.message });
              }
            });
          }
        });
      }
    }
  }, [tasksData, dismissedIds]);

  const handleNotificationClick = (item: NotificationItem) => {
    setActiveTab('tasks');
    setShowNotificationsDropdown(false);
    setDismissedIds(prev => [...prev, item.id]);
  };

  const hasLoaded = useRef(false);
  const fetchData = useCallback(async (silent = false, force = false) => {
    if (force) {
      clearDataCache();
    }
    const isInitial = !hasLoaded.current;
    if (!silent && isInitial) {
      setLoading(true);
    }
    setRefreshing(true);
    setErrorHeader(null);
    try {
      const [inData, outData, ordData, stfData, taskData, setData] = await Promise.all([
        getRegisterData('inward', force),
        getRegisterData('outward', force),
        getRegisterData('orders', force),
        getRegisterData('staff', force),
        getRegisterData('tasks', force) as Promise<any>,
        getSettings(force)
      ]);
      setInwardData(inData);
      setOutwardData(outData);
      setOrdersData(ordData);
      setStaffData(stfData);
      setTasksData(taskData);
      setSettings(setData);
      hasLoaded.current = true;
    } catch (err: unknown) {
      const error = err as Error;
      setErrorHeader(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Sync offline data back to Dropbox when client status turns online
  useEffect(() => {
    const handleOnline = () => {
      syncOfflineData().then((ok) => {
        if (ok) {
          fetchData(true, true);
        }
      });
    };
    window.addEventListener('online', handleOnline);
    // Try syncing periodically (every 2 minutes) if online
    const timer = setInterval(() => {
      if (navigator.onLine) {
        handleOnline();
      }
    }, 120000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(timer);
    };
  }, [fetchData]);

  const handleNavClick = (tab: Tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const calculateNextDueDate = (currentDueDateStr: string | undefined, interval: RecurrenceInterval): string => {
    let baseDate: Date;
    if (currentDueDateStr) {
      baseDate = new Date(currentDueDateStr);
    } else {
      const now = new Date();
      baseDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }
    if (isNaN(baseDate.getTime())) {
      const now = new Date();
      baseDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }

    if (interval === 'daily') {
      baseDate.setUTCDate(baseDate.getUTCDate() + 1);
    } else if (interval === 'weekly') {
      baseDate.setUTCDate(baseDate.getUTCDate() + 7);
    } else if (interval === 'monthly') {
      const targetDay = baseDate.getUTCDate();
      baseDate.setUTCMonth(baseDate.getUTCMonth() + 1);
      if (baseDate.getUTCDate() !== targetDay) {
        baseDate.setUTCDate(0);
      }
    }
    return baseDate.toISOString().split('T')[0];
  };

  const handleToggleTaskStatus = async (task: TaskEntry) => {
    const originalStatus = task.status;
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';

    setTasksData(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      const ok = await updateTask({ ...task, status: newStatus });
      if (!ok) throw new Error("Sync failed");

      if (newStatus === 'Completed' && task.isRecurring && task.recurrenceInterval && task.recurrenceInterval !== 'none') {
        const nextDueDate = calculateNextDueDate(task.dueDate, task.recurrenceInterval);
        const nextTaskExists = tasksData.some(t => 
          t.title === task.title && 
          t.dueDate === nextDueDate &&
          t.status !== 'Completed'
        );

        if (!nextTaskExists) {
          const nextTask: TaskEntry = {
            id: Date.now().toString(),
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: 'Pending',
            dueDate: nextDueDate,
            assignedTo: task.assignedTo,
            linkedDocId: task.linkedDocId,
            linkedDocType: task.linkedDocType,
            isRecurring: true,
            recurrenceInterval: task.recurrenceInterval,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await addTask(nextTask);
        }
      }

      fetchData();
    } catch (err) {
      console.error("Task status sync failed", err);
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
              staffData={staffData}
              settings={settings || { departments: [], projects: [], posts: [] }}
            />
          </div>
        );
      case 'office-drive':
        return <OfficeDrive onRefresh={fetchData} />;
      case 'reports':
        return <Reports inward={inwardData} outward={outwardData} orders={ordersData} myDocs={[]} />;
      case 'settings':
        return settings
          ? <Settings settings={settings} onSettingsChange={fetchData} />
          : <div className="flex justify-center p-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
      default:
        return <Dashboard onNavigate={handleNavClick} inwardCount={inwardData.length} outwardCount={outwardData.length} ordersCount={ordersData.length} staffCount={staffData.length} tasksCount={tasksData.length} tasksData={tasksData} />;
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const totalEntries = inwardData.length + outwardData.length + ordersData.length;

  return (
    <div className="flex flex-col bg-paper min-h-[100dvh] font-serif-body text-ink selection:bg-accent/10 selection:text-accent">
      {/* Ticker Bar */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-ink font-mono text-[11px] text-muted tracking-[0.18em] uppercase select-none shrink-0 relative z-[9999]">
        <div className="flex items-center gap-4">
          <span className="text-ink font-medium">ProgOffice</span>
          <span className="opacity-40">·</span>
          <span>Office Register Suite</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:block">
            <span>{totalEntries} entries on file</span>
          </div>

          {/* Bell Icon */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="p-1 text-muted hover:text-ink transition-colors flex items-center justify-center relative"
            >
              {notifications.length > 0 ? (
                <>
                  <BellRing className="w-4 h-4 text-accent animate-pulse" />
                  <span className="absolute -top-1.5 -right-1.5 bg-accent text-paper font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold tracking-tight">
                    {notifications.length}
                  </span>
                </>
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>

            {/* Notification Dropdown Panel */}
            <AnimatePresence>
              {showNotificationsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-3 w-80 bg-paper border border-rule shadow-lg overflow-hidden flex flex-col z-[99999]"
                >
                  <div className="px-4 py-3 border-b border-rule bg-panel flex justify-between items-center">
                    <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink font-bold">Alert Panel</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => setDismissedIds(prev => [...prev, ...notifications.map(n => n.id)])}
                        className="flex items-center gap-1.5 text-muted hover:text-bad transition-colors font-mono text-[9px] tracking-[0.12em] uppercase"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Dismiss All
                      </button>
                    )}
                  </div>

                  <div className="max-h-[300px] overflow-y-auto divide-y divide-rule no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-muted font-serif-body text-xs">
                        No active alerts. System operational.
                      </div>
                    ) : (
                      notifications.map(item => (
                        <div
                          key={item.id}
                          className="px-4 py-3 hover:bg-panel transition-colors flex items-start gap-2.5 group cursor-pointer"
                          onClick={() => handleNotificationClick(item)}
                        >
                          <AlertCircle className={cn(
                            "w-4 h-4 shrink-0 mt-0.5",
                            item.type === 'overdue' ? "text-bad" : "text-accent"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="font-serif-display text-xs text-ink font-medium tracking-tight group-hover:text-accent transition-colors">
                              {item.title}
                            </p>
                            <p className="font-serif-body text-[11px] text-muted mt-0.5 leading-normal">
                              {item.message}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDismissedIds(prev => [...prev, item.id]);
                            }}
                            className="p-1 border border-transparent hover:border-rule text-muted hover:text-ink transition-all rounded"
                            title="Dismiss Notification"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-ink/20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "fixed md:relative z-50 h-[100dvh] top-0 left-0 transition-all duration-300 flex flex-col shrink-0 border-r border-ink",
          sidebarOpen ? "w-[232px] translate-x-0" : "w-[232px] -translate-x-full md:w-24 md:translate-x-0",
          "bg-paper"
        )}>
          {/* Brand */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-rule">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex flex-col">
                <span className="font-serif-display italic text-[22px] leading-none tracking-tight">
                  prog<span className="text-accent">office</span>
                </span>
                {sidebarOpen && (
                  <span className="font-mono text-[9px] text-muted tracking-[0.18em] uppercase mt-1">register suite</span>
                )}
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-muted hover:text-ink transition-colors hidden md:flex"
            >
              <Menu className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-muted hover:text-ink transition-colors md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 flex flex-col gap-5 px-5 py-5 overflow-y-auto">
            {/* Home */}
            <ul className="flex flex-col gap-0.5">
              <NavItem
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Dashboard"
                active={activeTab === 'dashboard'}
                isOpen={sidebarOpen}
                onClick={() => handleNavClick('dashboard')}
              />
            </ul>

            {/* Registers */}
            <div>
              <h4 className="font-mono text-[11px] text-muted tracking-[0.18em] uppercase mb-2.5">Registers</h4>
              <ul className="flex flex-col gap-0.5">
                {(['inward', 'outward', 'orders'] as Tab[]).map(tab => (
                  <NavItem
                    key={tab}
                    icon={tab === 'inward' ? <Inbox className="w-4 h-4" /> : tab === 'outward' ? <Send className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                    label={TAB_LABELS[tab]}
                    active={activeTab === tab}
                    isOpen={sidebarOpen}
                    onClick={() => handleNavClick(tab)}
                    badge={tab === 'inward' ? inwardData.length : tab === 'outward' ? outwardData.length : ordersData.length}
                  />
                ))}
              </ul>
            </div>

            {/* Management */}
            <div>
              <h4 className="font-mono text-[11px] text-muted tracking-[0.18em] uppercase mb-2.5">Management</h4>
              <ul className="flex flex-col gap-0.5">
                {(['staff', 'tasks', 'office-drive'] as Tab[]).map(tab => (
                  <NavItem
                    key={tab}
                    icon={
                      tab === 'staff' ? <Users className="w-4 h-4" /> :
                      tab === 'tasks' ? <ClipboardList className="w-4 h-4" /> :
                      <HardDrive className="w-4 h-4" />
                    }
                    label={TAB_LABELS[tab]}
                    active={activeTab === tab}
                    isOpen={sidebarOpen}
                    onClick={() => handleNavClick(tab)}
                    badge={
                      tab === 'staff' ? staffData.length :
                      tab === 'tasks' ? tasksData.filter(t => t.status !== 'Completed').length :
                      null
                    }
                  />
                ))}
              </ul>
            </div>

            {/* Analytics */}
            <div>
              <h4 className="font-mono text-[11px] text-muted tracking-[0.18em] uppercase mb-2.5">Analytics</h4>
              <ul className="flex flex-col gap-0.5">
                {(['reports', 'settings'] as Tab[]).map(tab => (
                  <NavItem
                    key={tab}
                    icon={tab === 'reports' ? <BarChart className="w-4 h-4" /> : <SettingsIcon className="w-4 h-4" />}
                    label={TAB_LABELS[tab]}
                    active={activeTab === tab}
                    isOpen={sidebarOpen}
                    onClick={() => handleNavClick(tab)}
                  />
                ))}
              </ul>
            </div>
          </nav>

          {/* Footer */}
          <div className="px-5 pb-4 border-t border-rule pt-4">
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 w-full text-muted hover:text-bad transition-colors py-2",
                !sidebarOpen && "justify-center"
              )}
            >
              <LogOut className="w-4 h-4" />
              {sidebarOpen && <span className="font-mono text-[11px] tracking-[0.1em] uppercase">Sign Out</span>}
            </button>

            {/* Sync status */}
            <div className={cn(
              "mt-3 pt-3 border-t border-rule font-mono text-[11px] text-muted",
              !sidebarOpen && "text-center"
            )}>
              {sidebarOpen ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-good" />
                    <span>online · synced</span>
                  </div>
                  <div className="opacity-60 mt-0.5">dropbox cloud</div>
                </>
              ) : (
                <Cloud className="w-4 h-4 mx-auto" />
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden bg-paper relative">
          {/* Header */}
          <header className="border-b border-ink px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 text-muted hover:text-ink md:hidden transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <motion.h2
                  key={activeTab}
                  initial={{ y: 4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="font-serif-display italic text-xl sm:text-2xl leading-none tracking-tight"
                >
                  {activeTab === 'dashboard' ? 'Dashboard' : TAB_LABELS[activeTab]}
                </motion.h2>
                {activeTab !== 'dashboard' && (
                  <span className="font-mono text-[10px] text-muted tracking-[0.16em] uppercase mt-1 block">
                    progoffice / {activeTab}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 text-muted hover:text-ink border border-rule hover:border-ink transition-all"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => fetchData(true, true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 font-mono text-[11px] text-muted hover:text-ink tracking-[0.1em] uppercase px-3 py-1.5 border border-rule hover:border-ink transition-all disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => handleNavClick('settings')}
                className={cn(
                  "p-1.5 transition-colors",
                  activeTab === 'settings' ? 'text-accent' : 'text-muted hover:text-ink'
                )}
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Error banner */}
          {errorHeader && (
            <div className="mx-6 mt-4 p-4 border border-bad/30 bg-bad/5 flex items-center gap-3 flex-shrink-0">
              <AlertOctagon className="w-4 h-4 text-bad flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-bad font-mono text-[11px] tracking-[0.1em] uppercase font-medium">Connection Error</p>
                <p className="text-bad/70 text-sm mt-0.5 truncate">{errorHeader}</p>
              </div>
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-8 pb-28 md:pb-8 flex flex-col">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="w-full h-full"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <footer className="mt-16 border-t border-rule pt-8 pb-4 shrink-0 select-none">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-serif-display italic text-sm text-accent">progoffice</span>
                  <span className="font-mono text-[10px] text-muted tracking-[0.1em]">&copy; {new Date().getFullYear()}</span>
                </div>
                <div className="font-mono text-[10px] text-muted tracking-[0.1em]">
                  <span>built by </span>
                  <a
                    href="https://github.com/BhuvneshSain"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    Bhuvnesh Sain
                  </a>
                </div>
              </div>
            </footer>
          </div>

          {/* Mobile bottom nav */}
          <nav className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-paper border border-ink flex items-stretch h-14 px-1">
            {(
              [
                { tab: 'dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Home' },
                { tab: 'inward', icon: <Inbox className="w-4 h-4" />, label: 'Inward' },
                { tab: 'tasks', icon: <ClipboardList className="w-4 h-4" />, label: 'Tasks' },
                { tab: 'orders', icon: <AlertOctagon className="w-4 h-4" />, label: 'Orders' },
                { tab: 'office-drive', icon: <HardDrive className="w-4 h-4" />, label: 'Drive' },
              ] as const
            ).map(({ tab, icon, label }) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleNavClick(tab)}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-mono tracking-[0.1em] uppercase transition-all relative",
                    isActive ? "text-accent" : "text-muted"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-active"
                      className="absolute inset-x-1 inset-y-1 border border-accent z-0"
                    />
                  )}
                  <div className="relative z-10">{icon}</div>
                  <span className="relative z-10">{label}</span>
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
    </div>
  );
}

function NavItem({ icon, label, active = false, isOpen, onClick, badge }: { icon: React.ReactNode; label: string; active?: boolean; isOpen: boolean; onClick: () => void; badge?: number | null }) {
  return (
    <li>
      <button
        onClick={onClick}
        title={!isOpen ? label : undefined}
        className={cn(
          "flex items-center gap-3 w-full py-1.5 transition-colors text-left",
          active ? "text-accent" : "text-ink hover:text-accent",
          !isOpen && "justify-center"
        )}
      >
        {active && <span className="text-accent text-[9px]">&#9679;</span>}
        {!active && isOpen && <span className="w-[9px]" />}
        <div className="flex-shrink-0">{icon}</div>
        {isOpen && (
          <>
            <span className={cn(
              "font-serif-body text-[15px] tracking-tight flex-1",
              active ? "font-semibold" : ""
            )}>
              {label}
            </span>
            {badge != null && badge > 0 && (
              <span className={cn(
                "font-mono text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                active ? "bg-accent text-paper" : "bg-ink text-paper"
              )}>
                {badge}
              </span>
            )}
          </>
        )}
      </button>
    </li>
  );
}

function Dashboard({ onNavigate, inwardCount, outwardCount, ordersCount, staffCount, tasksCount, tasksData }: { onNavigate: (tab: Tab) => void; inwardCount: number; outwardCount: number; ordersCount: number; staffCount: number; tasksCount: number; tasksData: TaskEntry[] }) {
  const completedTasks = tasksData.filter(t => t.status === 'Completed').length;
  const pendingTasks = tasksData.filter(t => t.status === 'Pending').length;
  const inProgressTasks = tasksData.filter(t => t.status === 'In Progress').length;

  // Build a simple bar chart from task data (last 30 entries by creation date)
  const recentTasks = [...tasksData]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 30);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto w-full space-y-10"
    >
      {/* KPI Grid */}
      <motion.section variants={item} className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6">
        <StatCard label="Inward entries" value={inwardCount} note="documents received and logged" />
        <StatCard label="Outward entries" value={outwardCount} note="dispatches recorded" />
        <StatCard label="Orders on file" value={ordersCount} note="directives and assignments" />
        <StatCard label="Staff members" value={staffCount} note="active personnel directory" />
        <StatCard label="Pending tasks" value={pendingTasks} note="awaiting action" variant="accent" />
        <StatCard label="Completed tasks" value={completedTasks} note="resolved and closed" variant="good" />
        <StatCard label="In progress" value={inProgressTasks} note="actively being worked on" />
        <StatCard label="Total entries" value={inwardCount + outwardCount + ordersCount} note="across all registers" />
      </motion.section>

      {/* Bar Chart Panel */}
      {recentTasks.length > 0 && (
        <motion.section variants={item} className="border-t border-ink pt-6 pb-4 border-b border-rule">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-serif-display italic text-xl">tasks — <em>recent activity</em></h3>
            <span className="font-mono text-[10px] text-muted tracking-[0.16em] uppercase">
              {recentTasks.length} recent entries
            </span>
          </div>
          <svg viewBox="0 0 720 180" preserveAspectRatio="none" className="w-full h-[180px] block" aria-hidden="true">
            <g fill="#1f1c14">
              {recentTasks.map((task, i) => {
                const barWidth = 14;
                const gap = (720 - recentTasks.length * barWidth) / (recentTasks.length + 1);
                const x = gap + i * (barWidth + gap);
                const maxH = 160;
                // Height based on priority
                const priorityH: Record<string, number> = { High: maxH, Medium: maxH * 0.65, Low: maxH * 0.35 };
                const h = priorityH[task.priority] || maxH * 0.5;
                const y = 180 - h;
                const isCompleted = task.status === 'Completed';
                return (
                  <rect
                    key={task.id}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={h}
                    fill={isCompleted ? '#d6cdb6' : i >= recentTasks.length - 3 ? '#c14a2b' : '#1f1c14'}
                  />
                );
              })}
            </g>
          </svg>
          <div className="flex justify-between font-mono text-[10px] text-muted tracking-[0.1em] uppercase pt-2">
            <span>Oldest</span>
            <span>Recent</span>
            <span>Latest</span>
          </div>
        </motion.section>
      )}

      {/* Trend Panel */}
      <motion.section variants={item} className="border-t border-ink pt-6 pb-4">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-serif-display italic text-xl">overview — <em>at a glance</em></h3>
        </div>
        <p className="font-serif-body italic text-muted text-[15px] leading-relaxed max-w-[70ch]">
          You have <b className="text-ink not-italic font-semibold">{tasksCount} active tasks</b> across {staffCount} staff members.
          {completedTasks > 0 && <> {completedTasks} tasks completed — keep the momentum.</>}
          {pendingTasks > 5 && <> <b className="text-accent not-italic font-semibold">{pendingTasks} pending</b> — consider prioritizing.</>}
          {inwardCount > 0 && <> {inwardCount} inward entries on file, {outwardCount} dispatched.</>}
        </p>
      </motion.section>

      {/* Quick Access */}
      <motion.section variants={item} className="border-t border-rule pt-6">
        <h3 className="font-mono text-[11px] text-muted tracking-[0.18em] uppercase mb-4">Quick Access</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Inward Register', desc: 'Log and manage incoming documents.', tab: 'inward' as Tab, icon: <Inbox className="w-4 h-4" /> },
            { title: 'Outward Register', desc: 'Track dispatches and recipient info.', tab: 'outward' as Tab, icon: <Send className="w-4 h-4" /> },
            { title: 'Important Orders', desc: 'Log urgent assignments & directives.', tab: 'orders' as Tab, icon: <AlertOctagon className="w-4 h-4" /> },
            { title: 'Staff Directory', desc: 'Personnel and project allocations.', tab: 'staff' as Tab, icon: <Users className="w-4 h-4" /> },
            { title: 'Task Center', desc: 'Manage directives and responses.', tab: 'tasks' as Tab, icon: <ClipboardList className="w-4 h-4" /> },
            { title: 'Office Drive', desc: 'Browse and traverse office cloud drive.', tab: 'office-drive' as Tab, icon: <HardDrive className="w-4 h-4" /> },
          ].map(card => (
            <motion.div
              key={card.title}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(card.tab)}
              className="border border-rule p-5 cursor-pointer hover:border-accent transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="text-muted group-hover:text-accent transition-colors">{card.icon}</div>
                <h4 className="font-serif-display text-base tracking-tight group-hover:text-accent transition-colors">{card.title}</h4>
              </div>
              <p className="font-serif-body text-sm text-muted leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}

function StatCard({ label, value, note, variant }: { label: string; value: number; note: string; variant?: 'accent' | 'good' | 'bad' }) {
  const valueClass = variant === 'accent' ? 'text-accent' : variant === 'good' ? 'text-good' : variant === 'bad' ? 'text-bad' : 'text-ink';

  return (
    <div className="border-b border-rule pb-4">
      <div className="font-mono text-[11px] text-muted tracking-[0.18em] uppercase mb-1.5">{label}</div>
      <div className={`font-serif-display text-[48px] leading-[1.05] tracking-tight font-normal ${valueClass}`}
        style={{ fontFeatureSettings: "'tnum'" }}
      >
        {value}
      </div>
      <p className="font-serif-body italic text-[13px] text-muted mt-1 leading-snug max-w-[28ch]">{note}</p>
    </div>
  );
}
