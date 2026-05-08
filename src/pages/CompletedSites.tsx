import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Role } from '../types/auth';
import { CheckCircle2, Search, Plus, Calendar, User, MessageSquare, Building2, X, Trash2, Edit3 } from 'lucide-react';

export default function CompletedSites({ userRole }: { userRole: Role }) {
  const [sites, setSites] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    site_name: '',
    client_name: '',
    completion_date: new Date().toISOString().split('T')[0],
    remarks: '',
    completed_by_name: '' 
  });

  useEffect(() => { fetchCompletedSites(); }, []);

  async function fetchCompletedSites() {
    const { data } = await supabase.from('completed_sites').select('*').order('completion_date', { ascending: false });
    if (data) setSites(data);
  }

  // Handle Edit Click
  const startEdit = (site: any) => {
    setEditingId(site.id);
    setFormData({
      site_name: site.site_name,
      client_name: site.client_name,
      completion_date: site.completion_date,
      remarks: site.remarks,
      completed_by_name: '' // Reset or parse from remarks if needed
    });
    setShowAdd(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Delete
  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this record?")) return;
    
    const { error } = await supabase.from('completed_sites').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchCompletedSites();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const payload = {
      site_name: formData.site_name,
      client_name: formData.client_name,
      completion_date: formData.completion_date,
      remarks: formData.completed_by_name 
        ? `Finished by: ${formData.completed_by_name}. ${formData.remarks}`
        : formData.remarks,
      recorded_by: userRole 
    };

    let result;
    if (editingId) {
      // UPDATE EXISTING
      result = await supabase.from('completed_sites').update(payload).eq('id', editingId);
    } else {
      // INSERT NEW
      result = await supabase.from('completed_sites').insert([payload]);
    }

    if (result.error) {
      alert(result.error.message);
    } else {
      setShowAdd(false);
      setEditingId(null);
      setFormData({ site_name: '', client_name: '', completion_date: new Date().toISOString().split('T')[0], remarks: '', completed_by_name: '' });
      fetchCompletedSites();
    }
  }

  const filteredSites = sites.filter(s => s.site_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Completed Sites</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" /> Finished Project Registry
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input placeholder="Search sites..." className="pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl w-full font-bold outline-none focus:border-indigo-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button 
                onClick={() => { setShowAdd(!showAdd); setEditingId(null); }} 
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
            >
                {showAdd ? <X size={16}/> : <Plus size={16}/>}
            </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 shadow-2xl">
          <div className="md:col-span-3 mb-2">
             <h2 className="text-xl font-black uppercase italic text-indigo-600">
                {editingId ? "Update Site Details" : "Register New Completed Site"}
             </h2>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Site Name</label>
            <input required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold" value={formData.site_name} onChange={e => setFormData({...formData, site_name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Client Name</label>
            <input required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Date Finished</label>
            <input required type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold" value={formData.completion_date} onChange={e => setFormData({...formData, completion_date: e.target.value})} />
          </div>
          
          <div className="md:col-span-3 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Remarks / Delivery Notes</label>
            <div className="flex gap-2">
                <input placeholder="Add details or missing parts delivered..." className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-xs" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
                <button className="bg-indigo-600 text-white px-8 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-900 transition-all whitespace-nowrap">
                    {editingId ? "Update Entry" : "Save Entry"}
                </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSites.map((site) => (
          <div key={site.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter pr-10">{site.site_name}</h3>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(site)} className="p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all">
                        <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(site.id)} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <p className="text-xs font-bold text-indigo-600 uppercase mb-6 flex items-center gap-2">
                <Building2 size={14}/> {site.client_name}
            </p>

            <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-3 rounded-xl">
                    <Calendar size={16} />
                    <span className="text-xs font-bold font-mono">{site.completion_date}</span>
                </div>
                
                <div className="flex items-center gap-3 text-slate-500 bg-slate-100 p-3 rounded-xl">
                    <MessageSquare size={16} />
                    <span className="text-xs font-bold italic">"{site.remarks || 'No remarks'}"</span>
                </div>

                <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-slate-400 uppercase">
                    <User size={12} />
                    Logged by: {site.recorded_by}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}