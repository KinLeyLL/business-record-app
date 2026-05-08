import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  ArrowLeft, Trash2, Plus, X, ChevronDown, 
  Search, Calculator, User as UserIcon, MapPin, 
  ArrowRight, FileText, Download, Filter
} from 'lucide-react';

export default function LumpsumThrikha() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [advances, setAdvances] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({ leader_name: '', site_location: '', total_contract_amount: '', initial_advance: '0' });
  const [advForm, setAdvForm] = useState({ worker_name: '', amount: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    const { data } = await supabase.from('lumpsum_projects').select('*').order('created_at', { ascending: false });
    if (data) setProjects(data);
  }

  async function fetchAdvances(projectId: string) {
    const { data } = await supabase.from('lumpsum_advances').select('*').eq('project_id', projectId).order('date', { ascending: false });
    if (data) setAdvances(data);
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase.from('lumpsum_projects').insert([{
      leader_name: formData.leader_name,
      site_location: formData.site_location,
      total_contract_amount: Number(formData.total_contract_amount),
      advances_paid: Number(formData.initial_advance)
    }]).select();

    if (!error && data && Number(formData.initial_advance) > 0) {
      await supabase.from('lumpsum_advances').insert([{
        project_id: data[0].id,
        worker_name: 'Initial Group Advance',
        amount: Number(formData.initial_advance),
        date: new Date().toISOString().split('T')[0]
      }]);
    }
    setShowAdd(false);
    setFormData({ leader_name: '', site_location: '', total_contract_amount: '', initial_advance: '0' });
    fetchProjects();
  }

  async function handleAddAdvance(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('lumpsum_advances').insert([{
      project_id: selectedProject.id,
      worker_name: advForm.worker_name,
      amount: Number(advForm.amount),
      date: advForm.date
    }]);

    if (!error) {
      const newTotal = selectedProject.advances_paid + Number(advForm.amount);
      await supabase.from('lumpsum_projects').update({ advances_paid: newTotal }).eq('id', selectedProject.id);
      setAdvForm({ worker_name: '', amount: '', date: new Date().toISOString().split('T')[0] });
      fetchAdvances(selectedProject.id);
      fetchProjects();
      setSelectedProject({...selectedProject, advances_paid: newTotal});
    }
  }

  async function deleteAdvance(adv: any) {
    if (!confirm("Remove this advance record?")) return;
    const { error } = await supabase.from('lumpsum_advances').delete().eq('id', adv.id);
    if (!error) {
      const newTotal = selectedProject.advances_paid - adv.amount;
      await supabase.from('lumpsum_projects').update({ advances_paid: newTotal }).eq('id', selectedProject.id);
      fetchAdvances(selectedProject.id);
      fetchProjects();
      setSelectedProject({...selectedProject, advances_paid: newTotal});
    }
  }

  const filteredProjects = projects.filter(p => 
    p.site_location.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.leader_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative h-[calc(100vh-120px)] flex overflow-hidden bg-slate-50 rounded-3xl border border-slate-200 shadow-sm">
      
      {/* LEFT SIDE: MAIN LIST VIEW */}
      <div className={`flex-1 flex flex-col min-w-0 bg-white transition-all duration-500 ${selectedProject ? 'mr-[450px]' : ''}`}>
        
        {/* HEADER SECTION */}
        <div className="p-8 border-b border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lumpsum Ledgers</h1>
              <p className="text-slate-500 text-sm font-medium">Manage group contract advances and balances</p>
            </div>
            <button 
              onClick={() => setShowAdd(!showAdd)} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${showAdd ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              {showAdd ? <X size={18} /> : <Plus size={18} />}
              {showAdd ? 'Cancel' : 'New Contract'}
            </button>
          </div>

          {/* DOWNWARD SLIDER FORM (ACCORDION) */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showAdd ? 'max-h-[400px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
            <form onSubmit={handleCreateProject} className="bg-slate-100 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 border border-slate-200 shadow-inner">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Leader Name</label>
                <input required className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Leader Name" value={formData.leader_name} onChange={e => setFormData({...formData, leader_name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Site Location</label>
                <input required className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Site Location" value={formData.site_location} onChange={e => setFormData({...formData, site_location: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Total Contract (Nu)</label>
                <input required type="number" className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="0.00" value={formData.total_contract_amount} onChange={e => setFormData({...formData, total_contract_amount: e.target.value})} />
              </div>
              <div className="flex items-end gap-2">
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Initial Advance</label>
                  <input type="number" className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-200 outline-none" value={formData.initial_advance} onChange={e => setFormData({...formData, initial_advance: e.target.value})} />
                </div>
                <button className="bg-slate-900 text-white p-3.5 rounded-xl hover:bg-black transition-all active:scale-95 shadow-md">
                  <ArrowRight size={20} />
                </button>
              </div>
            </form>
          </div>

          {/* SEARCH & FILTER */}
          <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl border border-slate-200">
             <div className="flex items-center gap-2 flex-1 px-3">
               <Search size={18} className="text-slate-500" />
               <input 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700 placeholder:text-slate-500" 
                 placeholder="Search records..." 
               />
             </div>
             <div className="h-6 w-[1px] bg-slate-300"></div>
             <button className="flex items-center gap-2 px-4 text-slate-600 hover:text-slate-900 transition-colors font-bold">
               <Filter size={16} />
               <span className="text-sm">Filters</span>
             </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <tr className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="px-8 py-5">Site Location</th>
                <th className="px-8 py-5">Leader</th>
                <th className="px-8 py-5">Contract Nu.</th>
                <th className="px-8 py-5">Paid</th>
                <th className="px-8 py-5 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => { setSelectedProject(item); fetchAdvances(item.id); }}
                  className={`group cursor-pointer transition-all hover:bg-slate-100 active:bg-slate-200 ${selectedProject?.id === item.id ? 'bg-indigo-50/90' : ''}`}
                >
                  <td className="px-8 py-5 font-bold text-slate-900 group-hover:text-black">{item.site_location}</td>
                  <td className="px-8 py-5 text-slate-600 font-medium">{item.leader_name}</td>
                  <td className="px-8 py-5 font-mono text-sm text-slate-700">Nu. {item.total_contract_amount.toLocaleString()}</td>
                  <td className="px-8 py-5 text-rose-600 font-bold font-mono text-sm">Nu. {item.advances_paid.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right">
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg text-sm font-bold font-mono border border-emerald-200">
                      Nu. {(item.total_contract_amount - item.advances_paid).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT SIDEBAR: LEDGER SLIDER */}
      <div className={`fixed top-0 right-0 h-full w-[450px] bg-white border-l border-slate-300 z-40 transition-transform duration-500 ease-in-out shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col ${selectedProject ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedProject && (
          <>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shadow-lg">
               <div>
                 <h2 className="text-xl font-black italic uppercase tracking-tighter leading-tight">{selectedProject.site_location}</h2>
                 <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">{selectedProject.leader_name}</p>
               </div>
               <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-90">
                 <X size={20} />
               </button>
            </div>

            <div className="p-6 bg-slate-50 border-b border-slate-200">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm group hover:border-slate-400 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Advance Ratio</p>
                    <p className="text-lg font-black text-rose-600">
                      {Math.round((selectedProject.advances_paid / selectedProject.total_contract_amount) * 100)}%
                    </p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-2xl shadow-xl shadow-slate-200 group hover:bg-black transition-colors">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Balance Due</p>
                    <p className="text-lg font-black text-white font-mono">Nu. {(selectedProject.total_contract_amount - selectedProject.advances_paid).toLocaleString()}</p>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-white">
               {/* MINI FORM SLIDER FOR ADDING ADVANCE */}
               <form onSubmit={handleAddAdvance} className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Update Ledger Record</h4>
                  <input required className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400 transition-colors" placeholder="Worker Name / Reason" value={advForm.worker_name} onChange={e => setAdvForm({...advForm, worker_name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-2">
                    <input required type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none focus:border-indigo-400 transition-colors" placeholder="Amount Nu." value={advForm.amount} onChange={e => setAdvForm({...advForm, amount: e.target.value})} />
                    <input required type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400 transition-colors text-slate-600" value={advForm.date} onChange={e => setAdvForm({...advForm, date: e.target.value})} />
                  </div>
                  <button className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-md">Add Advance</button>
               </form>

               {/* LEDGER LIST */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Transaction History</h4>
                    <span className="text-[10px] font-black bg-slate-200 px-2 py-1 rounded-md text-slate-600 uppercase">{advances.length} Items</span>
                  </div>
                  <div className="space-y-2">
                    {advances.map(adv => (
                      <div key={adv.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all group shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                             <Calculator size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{adv.worker_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold font-mono">{adv.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <p className="text-sm font-black text-slate-900 font-mono">Nu. {adv.amount.toLocaleString()}</p>
                           <button onClick={() => deleteAdvance(adv)} className="text-slate-300 hover:text-rose-600 p-2 transition-colors active:scale-75"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}