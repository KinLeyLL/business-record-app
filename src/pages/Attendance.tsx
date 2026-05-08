import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, XCircle, CheckCircle2, Banknote, 
  UserPlus, Trash2, HandCoins, History, X, Search, 
  ChevronLeft, ChevronRight, Users, ListFilter
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; 

export default function Attendance() {
  const [masterWorkers, setMasterWorkers] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: '', default_wage: '' });
  const [dailyWages, setDailyWages] = useState<Record<string, number>>({});
  const [advances, setAdvances] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'attendance' | 'ledger'>('attendance');
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination (10 items)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { loadAttendancePageData(); }, []);

  const fetchWorkers = async () => {
    const { data, error } = await supabase.from('workers').select('*').order('name', { ascending: true });
    if (!error) setMasterWorkers(data || []);
  };

  const fetchAttendanceLogs = async () => {
    const { data, error } = await supabase.from('attendance').select(`*, workers (name)`).order('date', { ascending: false });
    if (!error) setAttendanceLogs(data || []);
  };

  const loadAttendancePageData = async () => {
    setLoading(true);
    await Promise.all([fetchWorkers(), fetchAttendanceLogs()]);
    setLoading(false);
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('workers').insert([{ name: newWorker.name, default_wage: Number(newWorker.default_wage) }]);
    if (error) alert(error.message);
    else { setNewWorker({ name: '', default_wage: '' }); setShowAddWorker(false); fetchWorkers(); }
  };

  const handleSaveAll = async () => {
    try {
      const workersWithData = masterWorkers.filter(w => 
        Object.prototype.hasOwnProperty.call(dailyWages, w.id) || (advances[w.id] || 0) > 0
      );
      if (workersWithData.length === 0) return alert("No data to save.");

      const logs = workersWithData.map(w => ({
        worker_id: w.id, worker_name: w.name, date: selectedDate,
        wage_paid: dailyWages[w.id] || 0, advance_paid: advances[w.id] || 0,
        status: (dailyWages[w.id] || 0) > 0 ? 'present' : 'absent'
      }));

      await supabase.from('attendance').insert(logs);
      alert("Records saved successfully.");
      setDailyWages({}); setAdvances({}); fetchAttendanceLogs();
    } catch (e: any) { alert(e.message); }
  };

  const filteredLogs = attendanceLogs.filter(item => 
    (item.workers?.name || item.worker_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentItems = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="p-10 text-center font-bold text-slate-400">Loading...</div>;

  return (
    <div className="bg-[#F9FAFB] min-h-screen p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP NAV/HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Attendance Management</span>
            </div>
          </div>
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
            <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'attendance' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Mark Attendance</button>
            <button onClick={() => {setActiveTab('ledger'); setCurrentPage(1)}} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'ledger' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>View Ledger</button>
          </div>
        </div>

        {activeTab === 'attendance' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: FORM/MASTER LIST */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-slate-800">Master Staff</h3>
                  <button onClick={() => setShowAddWorker(!showAddWorker)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition">
                    <UserPlus size={16} />
                  </button>
                </div>
                
                {showAddWorker && (
                  <form onSubmit={handleAddWorker} className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <input required placeholder="Full Name" className="w-full p-3 bg-white rounded-xl text-xs border border-slate-200 focus:ring-2 ring-slate-100 outline-none" value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})} />
                    <input required type="number" placeholder="Daily Rate" className="w-full p-3 bg-white rounded-xl text-xs border border-slate-200 focus:ring-2 ring-slate-100 outline-none" value={newWorker.default_wage} onChange={e => setNewWorker({...newWorker, default_wage: e.target.value})} />
                    <button className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest">Add Worker</button>
                  </form>
                )}

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {masterWorkers.map(w => (
                    <div key={w.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-2xl hover:bg-slate-50 transition">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{w.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Nu. {w.default_wage}</p>
                      </div>
                      <button onClick={() => {if(window.confirm('Delete?')) supabase.from('workers').delete().eq('id', w.id).then(()=>fetchWorkers())}} className="text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Date Selection</h3>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="date" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-xs font-bold border-none outline-none cursor-pointer" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* RIGHT: ATTENDANCE INPUT */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-4">Worker Details</th>
                      <th className="px-6 py-4 text-center">Marking</th>
                      <th className="px-6 py-4 text-right">Cash Adjustments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {masterWorkers.map((worker) => (
                      <tr key={worker.id} className="group hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-800 text-sm">{worker.name}</p>
                          <p className="text-[10px] text-slate-400">Rate: Nu. {worker.default_wage}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => setDailyWages(p => ({...p, [worker.id]: worker.default_wage}))} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${dailyWages[worker.id] > 0 ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>PRESENT</button>
                            <button onClick={() => setDailyWages(p => ({...p, [worker.id]: 0}))} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${dailyWages[worker.id] === 0 ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>ABSENT</button>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-3">
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Advance</p>
                              <input type="number" placeholder="0" className="w-20 p-2 bg-slate-50 border border-slate-100 rounded-lg text-right text-xs font-bold outline-none focus:ring-1 ring-slate-200" value={advances[worker.id] ?? ""} onChange={(e) => setAdvances(p => ({...p, [worker.id]: Number(e.target.value)}))} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculated Payout</p>
                     <p className="text-xl font-black text-slate-900">Nu. {masterWorkers.reduce((sum, w) => sum + (dailyWages[w.id] || 0) + (advances[w.id] || 0), 0).toLocaleString()}</p>
                   </div>
                   <button onClick={handleSaveAll} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 transition shadow-lg">Save Daily Record</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* LEDGER TAB WITH PAGINATION */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input placeholder="Search records..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-xs font-medium outline-none" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Page {currentPage} of {totalPages || 1}</span>
                <div className="flex gap-1">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={16}/></button>
                  <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={16}/></button>
                </div>
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">Worker</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Amount (Wage/Adv)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-8 py-4 text-xs font-medium text-slate-500">{item.date}</td>
                    <td className="px-8 py-4 text-xs font-bold text-slate-800 uppercase">{item.workers?.name || item.worker_name}</td>
                    <td className="px-8 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${item.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{item.status}</span>
                    </td>
                    <td className="px-8 py-4 text-right font-mono text-xs font-bold">
                      Nu. {(Number(item.wage_paid) + Number(item.advance_paid)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}