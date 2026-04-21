import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Menu, X, Cloud, LayoutDashboard, Inbox, Send, BarChart, AlertOctagon, RefreshCw, Heart } from 'lucide-react';
import { getRegisterData, getSettings } from './lib/dropbox';
import type { RegisterEntry, SettingsData } from './types';
import EntryForm from './components/EntryForm';
import DataTable from './components/DataTable';
import Reports from './components/Reports';
import OrderForm from './components/OrderForm';
import OrdersTable from './components/OrdersTable';
import Settings from './components/Settings';
import StaffForm from './components/StaffForm';
import StaffTable from './components/StaffTable';
import EssentialDocs from './components/EssentialDocs';
import { Users, FileText, LogOut, Loader2 } from 'lucide-react';
import Login from './components/Login';

type Tab = 'dashboard' | 'inward' | 'outward' | 'orders' | 'staff' | 'essential-docs' | 'reports' | 'settings';

const TAB_LABELS: Record<Tab, string> = {
  dashboard: 'Dashboard',
  inward: 'Inward Register',
  outward: 'Outward Register',
  orders: 'Important Orders',
  staff: 'Staff Management',
  'essential-docs': 'Essential Tools / Docs',
  reports: 'Reports',
  settings: 'Settings',
};

const SESSION_DURATION = (Number(import.meta.env.VITE_SESSION_DURATION_HOURS) || 8) * 60 * 60 * 1000;

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const auth = localStorage.getItem('pos_auth');
    const authTime = localStorage.getItem('pos_auth_time');
    
    if (auth === 'true' && authTime) {
      const elapsed = Date.now() - Number(authTime);
      if (elapsed < SESSION_DURATION) {
        setIsAuthenticated(true);
      } else {
        handleLogout();
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
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_auth');
    localStorage.removeItem('pos_auth_time');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (window.innerWidth >= 768) setSidebarOpen(true);
  }, []);

  const [inwardData, setInwardData] = useState<RegisterEntry[]>([]);
  const [outwardData, setOutwardData] = useState<RegisterEntry[]>([]);
  const [ordersData, setOrdersData] = useState<RegisterEntry[]>([]);
  const [staffData, setStaffData] = useState<RegisterEntry[]>([]);
  const [myDocsData, setMyDocsData] = useState<RegisterEntry[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setRefreshing(true);
    setErrorHeader(null);
    try {
      const [inData, outData, ordData, stfData, docData, setData] = await Promise.all([
        getRegisterData('inward'),
        getRegisterData('outward'),
        getRegisterData('orders'),
        getRegisterData('staff'),
        getRegisterData('essential-docs'),
        getSettings()
      ]);
      setInwardData(inData);
      setOutwardData(outData);
      setOrdersData(ordData);
      setStaffData(stfData);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'inward':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <EntryForm type="inward" existingDepts={settings?.departments || []} existingProjects={settings?.projects || []} onSuccess={fetchData} />
            <DataTable type="inward" data={inwardData} loading={loading} departments={settings?.departments || []} projects={settings?.projects || []} onRefresh={fetchData} />
          </div>
        );
      case 'outward':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <EntryForm type="outward" existingDepts={settings?.departments || []} existingProjects={settings?.projects || []} onSuccess={fetchData} />
            <DataTable type="outward" data={outwardData} loading={loading} departments={settings?.departments || []} projects={settings?.projects || []} onRefresh={fetchData} />
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <OrderForm existingProjects={settings?.projects || []} onSuccess={fetchData} />
            <OrdersTable data={ordersData} loading={loading} projects={settings?.projects || []} onRefresh={fetchData} />
          </div>
        );
      case 'staff':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StaffForm existingProjects={settings?.projects || []} existingPosts={settings?.posts || []} onSuccess={fetchData} />
            <StaffTable data={staffData} loading={loading} projects={settings?.projects || []} posts={settings?.posts || []} onRefresh={fetchData} />
          </div>
        );
      case 'essential-docs':
        return <EssentialDocs data={myDocsData} onRefresh={fetchData} />;
      case 'reports':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Reports inward={inwardData} outward={outwardData} orders={ordersData} myDocs={myDocsData} />
          </div>
        );
      case 'settings':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {settings
              ? <Settings settings={settings} onSettingsChange={fetchData} />
              : <div className="flex justify-center p-16"><div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" /></div>
            }
          </div>
        );
      default:
        return <Dashboard onNavigate={handleNavClick} inwardCount={inwardData.length} outwardCount={outwardData.length} ordersCount={ordersData.length} staffCount={staffData.length} myDocsCount={myDocsData.length} />;
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
    <div className="flex bg-slate-50/50 min-h-[100dvh] font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, slide-in overlay */}
      <aside className={`fixed md:relative z-50 h-[100dvh] top-0 left-0
        ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-20 md:translate-x-0'}
        bg-white/95 backdrop-blur-2xl border-r border-slate-200/60 transition-all duration-300
        ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col py-5 gap-4
        shadow-[4px_0_30px_rgba(0,0,0,0.04)] md:shadow-none shrink-0`}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between px-4 mb-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-200">
              <span className="text-white font-black text-xs">POS</span>
            </div>
            {sidebarOpen && (
              <span className="font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap leading-tight">
                Programmer<br />Office Suite
              </span>
            )}
          </div>
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all active:scale-95 hidden md:flex"
          >
            <Menu className="w-4 h-4" />
          </button>
          {/* Close button (mobile only) */}
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition-all active:scale-95 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto pb-4">
          <NavItem icon={<LayoutDashboard className="w-[18px] h-[18px]" />} label="Dashboard" active={activeTab === 'dashboard'} isOpen={sidebarOpen} onClick={() => handleNavClick('dashboard')} />
          <NavItem icon={<Inbox className="w-[18px] h-[18px]" />} label="Inward Register" active={activeTab === 'inward'} isOpen={sidebarOpen} onClick={() => handleNavClick('inward')} badge={inwardData.length} />
          <NavItem icon={<Send className="w-[18px] h-[18px]" />} label="Outward Register" active={activeTab === 'outward'} isOpen={sidebarOpen} onClick={() => handleNavClick('outward')} badge={outwardData.length} />
          <NavItem icon={<AlertOctagon className="w-[18px] h-[18px]" />} label="Important Orders" active={activeTab === 'orders'} isOpen={sidebarOpen} onClick={() => handleNavClick('orders')} badge={ordersData.length} />
          <NavItem icon={<Users className="w-[18px] h-[18px]" />} label="Staff Management" active={activeTab === 'staff'} isOpen={sidebarOpen} onClick={() => handleNavClick('staff')} badge={staffData.length} />
          <NavItem icon={<FileText className="w-[18px] h-[18px]" />} label="Essential Tools / Docs" active={activeTab === 'essential-docs'} isOpen={sidebarOpen} onClick={() => handleNavClick('essential-docs')} badge={myDocsData.length} />
          <NavItem icon={<BarChart className="w-[18px] h-[18px]" />} label="Reports" active={activeTab === 'reports'} isOpen={sidebarOpen} onClick={() => handleNavClick('reports')} />

          <div className="my-1 border-t border-slate-100 mx-1" />

          <NavItem icon={<SettingsIcon className="w-[18px] h-[18px]" />} label="Settings" active={activeTab === 'settings'} isOpen={sidebarOpen} onClick={() => handleNavClick('settings')} />
          
          <div className="flex-1" />
          
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group w-full text-red-500 hover:bg-red-50 active:scale-95 ${!sidebarOpen && 'justify-center'}`}
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <LogOut className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="font-bold text-sm">Logout</span>}
          </button>
        </nav>

        {/* Dropbox sync badge */}
        <div className="px-3 mt-auto">
          <div className={`flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/60 ${!sidebarOpen && 'justify-center'}`}>
            <div className="relative flex-shrink-0">
              <Cloud className="w-4 h-4 text-indigo-500" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-white animate-pulse" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">Dropbox Sync</p>
                <p className="text-[10px] text-emerald-600 font-medium">Connected</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden bg-slate-50/50 relative">
        {/* Ambient glows */}
        <div className="absolute top-0 left-0 w-[60%] h-[40%] bg-indigo-400/4 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[40%] bg-purple-400/4 blur-[100px] rounded-full pointer-events-none" />

        {/* Top header bar */}
        <header className="relative z-10 bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 h-14 flex items-center justify-between px-3 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1 text-slate-500 hover:text-indigo-600 md:hidden transition-colors rounded-xl hover:bg-indigo-50 active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-none">{TAB_LABELS[activeTab]}</h1>
              {activeTab !== 'dashboard' && (
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Programmer Office Suite</p>
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
              onClick={() => handleNavClick('settings')}
              className={`p-2 rounded-xl transition-all active:scale-95 border ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-transparent'}`}
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-24 md:pb-6 custom-scrollbar flex flex-col">
          <div className="flex-1">
            {renderContent()}
          </div>
          
          {/* Footer */}
          <footer className="mt-8 pt-6 pb-2 border-t border-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                <span className="text-indigo-600 font-black text-[9px]">POS</span>
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-2xl border-t border-slate-200/60 flex items-stretch h-16 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          {(
            [
              { tab: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Home' },
              { tab: 'inward', icon: <Inbox className="w-5 h-5" />, label: 'Inward' },
              { tab: 'outward', icon: <Send className="w-5 h-5" />, label: 'Outward' },
              { tab: 'orders', icon: <AlertOctagon className="w-5 h-5" />, label: 'Orders' },
              { tab: 'staff', icon: <Users className="w-5 h-5" />, label: 'Staff' },
              { tab: 'essential-docs', icon: <FileText className="w-5 h-5" />, label: 'Docs' },
              { tab: 'reports', icon: <BarChart className="w-5 h-5" />, label: 'Reports' },
              { tab: 'settings', icon: <SettingsIcon className="w-5 h-5" />, label: 'Settings' },
            ] as const
          ).map(({ tab, icon, label }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleNavClick(tab)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-all active:scale-90 ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                  {icon}
                </div>
                {label}
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

function NavItem({ icon, label, isOpen, active = false, onClick, badge }: { icon: React.ReactNode; label: string; isOpen: boolean; active?: boolean; onClick: () => void; badge?: number | null }) {
  return (
    <button
      onClick={onClick}
      title={!isOpen ? label : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group w-full relative
        ${active
          ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/60'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'}
        ${!isOpen && 'justify-center'}`}
    >
      <div className={`flex-shrink-0 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
        {icon}
      </div>
      {isOpen && (
        <span className={`font-medium text-sm whitespace-nowrap flex-1 text-left ${active ? '' : 'opacity-80 group-hover:opacity-100'}`}>
          {label}
        </span>
      )}
      {isOpen && badge != null && badge > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${active ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function Dashboard({ onNavigate, inwardCount, outwardCount, ordersCount, staffCount, myDocsCount }: { onNavigate: (tab: Tab) => void; inwardCount: number; outwardCount: number; ordersCount: number; staffCount: number; myDocsCount: number }) {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <header className="mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">Welcome back</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">Programmer Office Suite</h2>
        <p className="text-slate-500 text-sm sm:text-base mt-1 max-w-xl">Secure, serverless document management synced with Dropbox.</p>
      </header>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        {[
          { label: 'Inward', count: inwardCount, color: 'bg-blue-50 border-blue-100 text-blue-700' },
          { label: 'Outward', count: outwardCount, color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
          { label: 'Orders', count: ordersCount, color: 'bg-amber-50 border-amber-100 text-amber-700' },
          { label: 'Staff', count: staffCount, color: 'bg-violet-50 border-violet-100 text-violet-700' },
          { label: 'Docs', count: myDocsCount, color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`${color} border rounded-2xl p-3 sm:p-4 text-center`}>
            <p className="text-2xl sm:text-3xl font-black">{count}</p>
            <p className="text-xs font-semibold mt-0.5 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Tool cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ToolCard title="Inward Register" icon={<Inbox className="w-6 h-6 text-blue-500" />} desc="Log incoming documents and attach scanned copies." gradient="from-blue-500 to-indigo-500" delay="0" onClick={() => onNavigate('inward')} />
        <ToolCard title="Outward Register" icon={<Send className="w-6 h-6 text-emerald-500" />} desc="Record dispatched documents and track recipient references." gradient="from-emerald-500 to-teal-500" delay="50" onClick={() => onNavigate('outward')} />
        <ToolCard title="Important Orders" icon={<AlertOctagon className="w-6 h-6 text-amber-50" />} desc="Log and track urgent assignments and directives." gradient="from-amber-400 to-orange-500" delay="100" onClick={() => onNavigate('orders')} />
        <ToolCard title="Staff Management" icon={<Users className="w-6 h-6 text-violet-500" />} desc="Manage personnel, designations and project allocations." gradient="from-violet-500 to-purple-500" delay="125" onClick={() => onNavigate('staff')} />
        <ToolCard title="Essential Tools / Docs" icon={<FileText className="w-6 h-6 text-indigo-500" />} desc="Company tools, resources, and essential documents." gradient="from-indigo-500 to-purple-500" delay="140" onClick={() => onNavigate('essential-docs')} />
        <ToolCard title="Analytics & Reports" icon={<BarChart className="w-6 h-6 text-purple-500" />} desc="View aggregated statistics and timelines of all records." gradient="from-purple-500 to-fuchsia-500" delay="160" onClick={() => onNavigate('reports')} />
      </div>
    </div>
  );
}

function ToolCard({ title, icon, desc, gradient, delay, onClick }: { title: string; icon: React.ReactNode; desc: string; gradient: string; delay: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-300 cursor-pointer group overflow-hidden animate-in fade-in slide-in-from-bottom-4 ease-out fill-mode-both"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-5 flex items-start gap-4 relative">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-[0.04] group-hover:opacity-[0.08] rounded-bl-full transition-opacity duration-500`} />
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex-shrink-0 shadow-sm">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug">{title}</h4>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}
