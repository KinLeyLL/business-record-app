import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  CircleDollarSign, 
  LogOut,
  User,
  Timer,
  HardHat,
  CheckCircle2,
  ShieldCheck,
  Bell,
  Search,
  ChevronDown,
  LineChart,
  Box,
  Activity,
  FolderOpen,
  Menu,
  X,
  ClipboardList
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  userRole: string;
  onLogout: () => void;
}

export default function MainLayout({ children, userRole, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  
  const linkStyle = (path: string) => `
    flex items-center justify-between py-2.5 px-4 rounded-xl transition-all duration-300 group
    ${isActive(path) 
      ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm scale-[1.02]' 
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'}
  `;

  const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';

  return (
    <div className="flex h-screen bg-[#F8F9FB] overflow-hidden">
      
      {/* SIDEBAR with SLIDE EFFECT */}
      <aside 
        className={`bg-white border-r border-slate-200 flex flex-col z-30 transition-all duration-500 ease-in-out shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'}`}
      >
        <div className={`p-8 transition-opacity duration-300 ${!isSidebarOpen && 'md:opacity-0'}`}>
          <div className="flex items-center gap-3">
             <div className="h-9 w-9 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center shrink-0">
                <span className="text-white font-black text-lg">K</span>
             </div>
             {isSidebarOpen && <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">K.B Company</span>}
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
          {/* Main Group */}
          <Link to="/dashboard" className={linkStyle('/dashboard')}>
            <div className="flex items-center gap-3">
              <LayoutDashboard size={20} className={isActive('/dashboard') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'} />
              {isSidebarOpen && <span className="text-[14px]">Overview</span>}
            </div>
          </Link>

          <Link to="/projects" className={linkStyle('/projects')}>
            <div className="flex items-center gap-3">
              <Briefcase size={20} className={isActive('/projects') ? 'text-indigo-600' : 'text-slate-400'} />
              {isSidebarOpen && <span className="text-[14px]">Projects</span>}
            </div>
          </Link>

          <Link to="/completed-sites" className={linkStyle('/completed-sites')}>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className={isActive('/completed-sites') ? 'text-indigo-600' : 'text-slate-400'} />
              {isSidebarOpen && <span className="text-[14px]">Completed Sites</span>}
            </div>
          </Link>

          {/* DSA RESTORED TO MAIN MENU */}
          <Link to="/dsa" className={linkStyle('/dsa')}>
            <div className="flex items-center gap-3">
              <FileText size={20} className={isActive('/dsa') ? 'text-indigo-600' : 'text-slate-400'} />
              {isSidebarOpen && <span className="text-[14px]">DSA Logs</span>}
            </div>
          </Link>

          <Link to="/documents" className={linkStyle('/documents')}>
            <div className="flex items-center gap-3">
              <FolderOpen size={20} className={isActive('/documents') ? 'text-indigo-600' : 'text-slate-400'} />
              {isSidebarOpen && <span className="text-[14px]">infoDocuments</span>}
            </div>
          </Link>

          {isAdminOrManager && (
            <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
               {isSidebarOpen && <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Admin</p>}
               
               <Link to="/attendance" className={linkStyle('/attendance')}>
                <div className="flex items-center gap-3">
                  <Timer size={20} className={isActive('/attendance') ? 'text-indigo-600' : 'text-slate-400'} />
                  {isSidebarOpen && <span className="text-[14px]">Labor Attendance</span>}
                </div>
              </Link>

               <Link to="/finance" className={linkStyle('/finance')}>
                <div className="flex items-center gap-3">
                  <LineChart size={20} className={isActive('/finance') ? 'text-indigo-600' : 'text-slate-400'} />
                  {isSidebarOpen && <span className="text-[14px]">Financials</span>}
                </div>
              </Link>

              <Link to="/lumpsum" className={linkStyle('/lumpsum')}>
                <div className="flex items-center gap-3">
                  <HardHat size={20} className={isActive('/lumpsum') ? 'text-indigo-600' : 'text-slate-400'} />
                  {isSidebarOpen && <span className="text-[14px]">Lumpsum</span>}
                </div>
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 py-3 px-4 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-sm font-bold group">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-4 flex-1">
             <button 
               onClick={() => setSidebarOpen(!isSidebarOpen)}
               className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
             >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
             </button>
             <h2 className="text-xl font-bold text-slate-900 hidden sm:block">Dashboard</h2>
             
             <div className="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl w-full max-w-md focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white transition-all">
                <Search size={18} className="text-slate-400" />
                <input type="search" placeholder="Quick search..." className="bg-transparent outline-none text-sm text-slate-700 w-full" />
             </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Access Level</p>
                <p className="text-xs font-bold text-indigo-600 mt-1">{userRole}</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>
            <button className="relative p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white" />
            </button>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm">
               <User size={18} />
            </div>
          </div>
        </header>

        {/* MAIN AREA with POP-UP EFFECT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
           <div className="max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500 ease-out fill-mode-forwards">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
}