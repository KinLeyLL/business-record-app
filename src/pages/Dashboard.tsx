import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  Sparkles,
  Bell,
  Info,
  ChartPie,
  Users,
  DollarSign,
  Briefcase,
  FileText,
  AlertCircle,
  CalendarX,
  Eye,
  CheckSquare,
  ChevronRight
} from 'lucide-react';

interface DashboardProps {
  userRole: string;
  // Added onNavigate prop to handle button clicks
  onNavigate?: (view: string) => void;
}

export default function Dashboard({ userRole, onNavigate }: DashboardProps) {
  const isAdmin = userRole === 'ADMIN';
  const [stats, setStats] = useState({
    totalExpenses: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingWages: 0,
    totalWagesDistributed: 0,
    attendanceCount: 0,
    attendanceRate: 0,
    dsaRecords: 0,
    completedSites: 0,
    expiringDocuments: 0,
    totalWorkers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealDashboardData();
  }, []);

  async function fetchRealDashboardData() {
    setLoading(true);
    try {
      const { data: finData } = await supabase.from('financial_records').select('amount');
      const totalExp = finData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      const { data: projectsData } = await supabase.from('projects').select('*');
      const activeProj = projectsData?.filter(p => p.status !== 'Completed').length || 0;
      const completedProj = projectsData?.filter(p => p.status === 'Completed').length || 0;

      const { data: attData } = await supabase.from('attendance').select('*');
      const totalWages = attData?.reduce((sum, item) => sum + (item.wage_paid || 0), 0) || 0;
      const attRate = attData?.length ? Math.round((attData.filter(a => a.present).length / attData.length) * 100) : 0;

      const { count: dsaCount } = await supabase.from('dsa').select('*', { count: 'exact', head: true });

      setStats({
        totalExpenses: totalExp,
        activeProjects: activeProj,
        completedProjects: completedProj,
        pendingWages: totalWages,
        totalWagesDistributed: totalWages,
        attendanceCount: attData?.length || 0,
        attendanceRate: attRate,
        dsaRecords: dsaCount || 0,
        completedSites: completedProj,
        expiringDocuments: 3, 
        totalWorkers: new Set(attData?.map(a => a.worker_id)).size || 0
      });
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Functional Handler for Navigation
  const handleAction = (target: string) => {
    if (onNavigate) {
      onNavigate(target);
    } else {
      console.log(`Navigating to: ${target}`);
      // Fallback: If you haven't passed onNavigate yet, you can use window.location or a state setter
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-4 space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Company Overview</h1>
          <p className="text-slate-500 font-medium">Real-time pulse of your operations.</p>
        </div>
        <button 
          onClick={() => fetchRealDashboardData()}
          className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full transition-all active:scale-95"
        >
          <Sparkles size={16} />
          Refresh Insights
        </button>
      </div>

      {/* MAIN BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* FINANCE CARD - Clickable */}
        <div 
          onClick={() => handleAction('finance')}
          className="lg:col-span-2 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-indigo-900 p-8 text-white shadow-xl relative overflow-hidden cursor-pointer group transition-all hover:shadow-indigo-200/50 hover:scale-[1.01]"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/10 group-hover:bg-white/20 transition-colors">
                <DollarSign className="text-indigo-300" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200/70">Financial Health</span>
            </div>
            <h2 className="text-5xl font-black mb-2 group-hover:translate-x-1 transition-transform">Nu. {stats.totalExpenses.toLocaleString()}</h2>
            <p className="text-indigo-200/60 font-medium">Total operational expenses • View Details</p>
          </div>
          <TrendingUp size={180} className="absolute -bottom-10 -right-10 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
        </div>

        {/* ATTENDANCE CARD - Clickable */}
        <div 
          onClick={() => handleAction('attendance')}
          className="rounded-[2.5rem] bg-white border border-slate-200 p-8 shadow-sm cursor-pointer group transition-all hover:border-emerald-200 hover:bg-emerald-50/30"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 group-hover:scale-110 transition-transform">
              <Users className="text-emerald-600" />
            </div>
            <span className="text-emerald-500 font-black text-lg">{stats.attendanceRate}%</span>
          </div>
          <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Attendance Rate</h3>
          <p className="text-3xl font-black text-slate-900">{stats.attendanceCount}</p>
          <div className="mt-4 flex items-center text-xs font-bold text-emerald-600">
            View Records <ChevronRight size={14} />
          </div>
        </div>

        {/* PROJECTS CARD - Clickable */}
        <div 
          onClick={() => handleAction('projects')}
          className="rounded-[2.5rem] bg-white border border-slate-200 p-8 shadow-sm cursor-pointer group transition-all hover:border-amber-200 hover:bg-amber-50/30"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 group-hover:scale-110 transition-transform">
              <Briefcase className="text-amber-600" />
            </div>
            <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-md font-bold uppercase">Live</span>
          </div>
          <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Active Projects</h3>
          <p className="text-3xl font-black text-slate-900">{stats.activeProjects}</p>
          <div className="mt-4 flex items-center text-xs font-bold text-amber-600">
            Site Map <ChevronRight size={14} />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* DSA & COMPLETED SITES */}
        <div className="lg:col-span-2 rounded-[2.5rem] bg-slate-50 border border-slate-200 p-8">
           <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <CheckSquare size={20}/>
            </div>
            <h3 className="text-xl font-black text-slate-900">Project Milestones</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => handleAction('dsa')}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all active:scale-95"
            >
               <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl">
                 {stats.dsaRecords}
               </div>
               <div>
                 <p className="font-black text-slate-900">DSA Records</p>
                 <p className="text-sm text-slate-500">Daily Site Activities</p>
               </div>
            </div>
            <div 
              onClick={() => handleAction('projects')}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all active:scale-95"
            >
               <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-2xl">
                 {stats.completedSites}
               </div>
               <div>
                 <p className="font-black text-slate-900">Completed Sites</p>
                 <p className="text-sm text-slate-500">View History</p>
               </div>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS / EXPIRY */}
        <div className="rounded-[2.5rem] bg-rose-50 border border-rose-100 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-rose-900">Alert Center</h3>
              <div className="h-8 w-8 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                {stats.expiringDocuments}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/60 p-4 rounded-2xl border border-rose-200 flex items-start gap-4">
                <CalendarX className="text-rose-600 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-black text-rose-900">Document Expiry</p>
                  <p className="text-xs text-rose-700/70">{stats.expiringDocuments} files need renewal.</p>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => handleAction('documents')}
            className="w-full mt-6 py-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-200 active:scale-95"
          >
            Review All Documents
          </button>
        </div>

      </div>
    </div>
  );
}