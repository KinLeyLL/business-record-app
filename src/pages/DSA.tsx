import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Calendar, 
  PlusCircle, 
  CheckCircle2,
  Clock,
  Loader2,
  Check,
  CreditCard,
  Car,
  Search,
  X,
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3
} from 'lucide-react';

type Role = 'OWNER' | 'MANAGER' | 'EMPLOYEE' | 'ADMIN';

interface Worker {
  id: string;
  name: string;
}

interface DSALog {
  id: number;
  employee_id: string;   
  employee_name: string; 
  date: string;
  initial_location: string;
  destination: string;
  days: number;
  vehicle_number: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Paid'; 
}

const BHUTAN_DZONGKHAGS = [
  "Bumthang", "Chukha", "Dagana", "Gasa", "Haa", 
  "Lhuentse", "Mongar", "Paro", "Pema Gatshel", "Punakha", 
  "Samdrup Jongkhar", "Samtse", "Sarpang", "Thimphu", "Trashigang", 
  "Trashi Yangtse", "Trongsa", "Tsirang", "Wangdue Phodrang", "Zhemgang"
];

export default function DSA() {
  const [userRole, setUserRole] = useState<Role>('EMPLOYEE');
  const currentUser = { id: 'MGR-001', name: 'Sangay (Manager)' }; 

  const [logs, setLogs] = useState<DSALog[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    initial_location: '',
    destination: '',
    days: 1,
    vehicle_number: '',
    amount: 0,
    selected_worker_id: '', 
    selected_worker_name: '' 
  });

  useEffect(() => {
    fetchData();
  }, [userRole]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: workerData } = await supabase.from('workers').select('id, name');
      let combinedWorkers: Worker[] = workerData || [];
      const managerAlreadyInList = combinedWorkers.some(w => w.id === currentUser.id);
      if (!managerAlreadyInList) {
        combinedWorkers = [{ id: currentUser.id, name: `${currentUser.name} (Me)` }, ...combinedWorkers];
      }
      setWorkers(combinedWorkers);

      let query = supabase.from('dsa').select('*').order('date', { ascending: false });
      if (userRole === 'EMPLOYEE') {
        query = query.eq('employee_id', currentUser.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching data:', err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (id: number) => {
    setUpdatingId(id);
    let nextStatus: 'Pending' | 'Approved' | 'Paid' = 'Pending';
    if (userRole === 'MANAGER') nextStatus = 'Approved';
    else if (userRole === 'OWNER') nextStatus = 'Paid';

    try {
      const { error } = await supabase.from('dsa').update({ status: nextStatus }).eq('id', id);
      if (error) throw error;
      setLogs(logs.map(log => log.id === id ? { ...log, status: nextStatus } : log));
    } catch (err: any) {
      alert("Update failed: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVehicleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (/^[A-Za-z]{1,2}\d/.test(value)) {
      let formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (formatted.length > 2 && formatted.length <= 3) formatted = `${formatted.slice(0, 2)}-${formatted.slice(2)}`;
      else if (formatted.length > 3) formatted = `${formatted.slice(0, 2)}-${formatted.slice(2, 3)}-${formatted.slice(3, 8)}`;
      setFormData({ ...formData, vehicle_number: formatted });
    } else {
      setFormData({ ...formData, vehicle_number: value });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const { error } = await supabase.from('dsa').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEdit = (log: DSALog) => {
    setEditingId(log.id);
    setFormData({
      date: log.date,
      initial_location: log.initial_location,
      destination: log.destination,
      days: log.days,
      vehicle_number: log.vehicle_number,
      amount: log.amount,
      selected_worker_id: log.employee_id,
      selected_worker_name: log.employee_name
    });
    setShowAdd(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalId = currentUser.id;
    let finalName = currentUser.name;
    
    if (userRole === 'MANAGER' && formData.selected_worker_id) {
      finalId = formData.selected_worker_id;
      finalName = formData.selected_worker_name.replace(' (Me)', ''); 
    }

    const payload = {
      date: formData.date,
      initial_location: formData.initial_location,
      destination: formData.destination,
      days: formData.days,
      vehicle_number: formData.vehicle_number || 'Personal Arrangement',
      amount: formData.amount,
      employee_id: finalId,
      employee_name: finalName,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('dsa').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('dsa').insert([{ ...payload, status: 'Pending' }]);
        if (error) throw error;
      }
      
      setFormData({ date: new Date().toISOString().split('T')[0], initial_location: '', destination: '', days: 1, vehicle_number: '', amount: 0, selected_worker_id: '', selected_worker_name: '' });
      setShowAdd(false);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredLogs = logs.filter(log => 
    (log.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.destination || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="relative h-[calc(100vh-120px)] flex overflow-hidden bg-slate-50 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex-1 flex flex-col min-w-0 bg-white transition-all duration-500">
        <div className="p-8 border-b border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business DSA</h1>
              <p className="text-slate-500 text-sm font-medium">Official Record Management System</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mr-2">
                {(['EMPLOYEE', 'MANAGER', 'OWNER'] as Role[]).map((r) => (
                  <button key={r} onClick={() => {setUserRole(r); setSearchTerm(''); setCurrentPage(1);}} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${userRole === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{r}</button>
                ))}
              </div>

              {(userRole !== 'OWNER') && (
                <button 
                  onClick={() => { setShowAdd(!showAdd); if(showAdd) setEditingId(null); }} 
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${showAdd ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {showAdd ? <X size={18} /> : <Plus size={18} />}
                  {showAdd ? 'Cancel' : (editingId ? 'Edit Mode' : 'New Log')}
                </button>
              )}
            </div>
          </div>

          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showAdd ? 'max-h-[600px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
            <form onSubmit={handleFormSubmit} className="bg-slate-100 p-6 rounded-2xl space-y-4 border border-slate-200 shadow-inner">
              {userRole === 'MANAGER' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Select Employee</label>
                  <select required className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold outline-none" value={formData.selected_worker_id} onChange={(e) => setFormData({...formData, selected_worker_id: e.target.value, selected_worker_name: workers.find(w => w.id === e.target.value)?.name || ''})}>
                    <option value="">-- Choose Name --</option>
                    {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Date</label>
                  <input type="date" required className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">From</label>
                  <select required className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold outline-none" value={formData.initial_location} onChange={e => setFormData({...formData, initial_location: e.target.value})}>
                    <option value="">-- Select --</option>
                    {BHUTAN_DZONGKHAGS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">To</label>
                  <select required className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold outline-none" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})}>
                    <option value="">-- Select --</option>
                    {BHUTAN_DZONGKHAGS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Vehicle No. / Mode</label>
                  <input type="text" placeholder="BP-1-A1234 or Personal" className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold outline-none uppercase" value={formData.vehicle_number} onChange={handleVehicleInput} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Days</label>
                  <input type="number" required className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold outline-none" value={formData.days} onChange={e => setFormData({...formData, days: parseInt(e.target.value) || 1})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Amount (Nu.)</label>
                  <div className="flex gap-2">
                    <input type="number" required className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-emerald-600 outline-none" value={formData.amount} onChange={e => setFormData({...formData, amount: parseInt(e.target.value) || 0})} />
                    <button type="submit" className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-all active:scale-95 shadow-md">
                      {editingId ? <Check size={20} /> : <ArrowRight size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl border border-slate-200">
             <div className="flex items-center gap-2 flex-1 px-3">
               <Search size={18} className="text-slate-500" />
               <input 
                 value={searchTerm}
                 onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                 className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700 placeholder:text-slate-500" 
                 placeholder="Search by name or destination..." 
               />
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <tr className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="px-8 py-5">Employee</th>
                <th className="px-8 py-5">Route & Vehicle</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Action / Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.map((log) => (
                <tr key={log.id} className="group transition-all hover:bg-slate-100">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-[10px] uppercase">
                        {log.employee_name ? log.employee_name.substring(0, 1) : '?'}
                      </div>
                      <span className="font-bold text-slate-900 group-hover:text-black tracking-tight">{log.employee_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="font-black text-slate-900 flex items-center gap-2 text-sm italic">
                      {log.initial_location} <span className="text-indigo-400 not-italic">➝</span> {log.destination}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 mt-1 uppercase flex items-center gap-3">
                      <span className="flex items-center gap-1"><Calendar size={12}/> {log.date}</span>
                      <span className="flex items-center gap-1"><Car size={12}/> {log.vehicle_number}</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{log.days} Days</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter inline-flex items-center gap-2 border ${
                      log.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : log.status === 'Approved' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {log.status === 'Paid' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                      {log.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {log.status === 'Pending' && (
                          <>
                             <button onClick={() => startEdit(log)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Edit3 size={16}/></button>
                             <button onClick={() => handleDelete(log.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button>
                          </>
                        )}
                      </div>
                      {userRole === 'MANAGER' && log.status === 'Pending' && (
                        <button onClick={() => handleUpdateStatus(log.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 hover:bg-indigo-700 transition-colors">
                          {updatingId === log.id ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>} Approve
                        </button>
                      )}
                      {userRole === 'OWNER' && log.status === 'Approved' && (
                        <button onClick={() => handleUpdateStatus(log.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 hover:bg-emerald-700 transition-colors">
                          {updatingId === log.id ? <Loader2 size={12} className="animate-spin"/> : <CreditCard size={12}/>} Mark Paid
                        </button>
                      )}
                      <div className="font-mono font-bold text-slate-700 text-sm">Nu. {log.amount.toLocaleString()}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
            Showing <span className="text-slate-900">{indexOfFirstItem + 1}</span> to <span className="text-slate-900">{Math.min(indexOfLastItem, filteredLogs.length)}</span> of <span className="text-slate-900">{filteredLogs.length}</span> records
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16} /></button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i + 1} onClick={() => paginate(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}>{i + 1}</button>
              ))}
            </div>
            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}