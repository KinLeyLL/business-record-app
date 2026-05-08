import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Role } from '../types/auth';
import { 
  ShieldCheck, Plus, User, CreditCard, 
  FileText, X, Search, Trash2, Edit3
} from 'lucide-react';

export default function DocumentManager({ userRole }: { userRole: Role }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState<'COMPANY' | 'EMPLOYEE' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    id_number: '',
    license_number: '',
    tpn_number: '',
    issue_date: '',
    expiry_date: '',
    file: null as File | null
  });

  useEffect(() => { fetchDocuments(); }, []);

  async function fetchDocuments() {
    const { data } = await supabase.from('company_documents').select('*').order('created_at', { ascending: false });
    if (data) setDocs(data);
  }

  const getDaysRemaining = (expiry: string) => {
    if (!expiry) return null;
    const diff = new Date(expiry).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  async function handleDelete(id: number, fileUrl: string | null) {
    if (!window.confirm("Are you sure you want to delete this record? This cannot be undone.")) return;
    
    setLoading(true);
    try {
      // 1. Delete file from storage if it exists
      if (fileUrl) {
        const fileName = fileUrl.split('/').pop();
        if (fileName) {
          await supabase.storage.from('documents').remove([fileName]);
        }
      }
      
      // 2. Delete database record
      const { error } = await supabase.from('company_documents').delete().eq('id', id);
      if (error) throw error;
      
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert("Failed to delete record.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let fileUrl = '';
    // Use existing URL if editing and no new file is selected
    const existingDoc = docs.find(d => d.id === editingId);
    if (existingDoc && !formData.file) {
      fileUrl = existingDoc.file_url;
    }

    if (formData.file) {
      const fileName = `${Math.random()}-${formData.file.name}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, formData.file);
      if (!uploadError) {
        fileUrl = supabase.storage.from('documents').getPublicUrl(fileName).data.publicUrl;
      }
    }

    const payload: any = {
      doc_name: formData.name,
      doc_type: showAdd,
      id_number: formData.id_number,
      license_number: formData.license_number,
      tpn_number: showAdd === 'COMPANY' ? formData.tpn_number : null,
      file_url: fileUrl,
      issue_date: showAdd === 'COMPANY' ? formData.issue_date : null,
      expiry_date: showAdd === 'COMPANY' ? formData.expiry_date : null,
      recorded_by: userRole
    };

    // If editing, include the ID so Supabase performs an UPDATE instead of INSERT
    if (editingId) {
      payload.id = editingId;
    }

    const { error } = await supabase.from('company_documents').upsert([payload]);
    
    if (!error) {
      setShowAdd(null);
      setEditingId(null);
      setFormData({ name: '', id_number: '', license_number: '', tpn_number: '', issue_date: '', expiry_date: '', file: null });
      fetchDocuments();
    }
    setLoading(false);
  }

  const startEdit = (doc: any) => {
    setEditingId(doc.id);
    setShowAdd(doc.doc_type);
    setFormData({
      name: doc.doc_name,
      id_number: doc.id_number,
      license_number: doc.license_number || '',
      tpn_number: doc.tpn_number || '',
      issue_date: doc.issue_date || '',
      expiry_date: doc.expiry_date || '',
      file: null // Files cannot be pre-filled for security, user can re-upload if needed
    });
  };

  const companyDocs = docs.filter(d => d.doc_type === 'COMPANY' && d.doc_name.toLowerCase().includes(searchTerm.toLowerCase()));
  const employeeDocs = docs.filter(d => d.doc_type === 'EMPLOYEE' && d.doc_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Registry</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-indigo-500" /> Compliance Vault
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setEditingId(null); setShowAdd('COMPANY'); }} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-200"><Plus size={16}/> Company Doc</button>
          <button onClick={() => { setEditingId(null); setShowAdd('EMPLOYEE'); }} className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-200"><Plus size={16}/> Employee ID</button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border-2 border-indigo-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 shadow-2xl relative">
          <button type="button" onClick={() => { setShowAdd(null); setEditingId(null); }} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500"><X /></button>
          <h2 className="col-span-full text-xl font-black uppercase italic text-indigo-600 mb-2">
            {editingId ? 'Edit Record' : (showAdd === 'COMPANY' ? 'Register Company Document' : 'Add Employee Record')}
          </h2>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Name / Title</label>
            <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{showAdd === 'COMPANY' ? 'Business License No.' : 'National ID / CID'}</label>
            <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm" value={formData.id_number} onChange={e => setFormData({...formData, id_number: e.target.value})} />
          </div>

          {showAdd === 'COMPANY' ? (
             <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-indigo-500 ml-2">TPN Number</label>
               <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm" value={formData.tpn_number} onChange={e => setFormData({...formData, tpn_number: e.target.value})} />
             </div>
          ) : (
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Driving License (Opt)</label>
               <input className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm" value={formData.license_number} onChange={e => setFormData({...formData, license_number: e.target.value})} />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Upload File {editingId && '(Optional)'}</label>
            <input type="file" onChange={e => setFormData({...formData, file: e.target.files ? e.target.files[0] : null})} className="w-full text-xs font-bold p-3 bg-slate-50 rounded-2xl" />
          </div>

          {showAdd === 'COMPANY' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Issue Date</label>
                <input required type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-rose-500 ml-2">Expiry Date</label>
                <input required type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} />
              </div>
            </>
          )}

          <button disabled={loading} className="col-span-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all">
            {loading ? 'Processing...' : (editingId ? 'Update Record' : 'Save Record')}
          </button>
        </form>
      )}

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input placeholder="Search records..." className="pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl w-full font-bold outline-none focus:border-indigo-500 shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {/* COMPANY SECTION */}
      <section>
        <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6 flex items-center gap-4">
          <div className="h-px bg-slate-200 flex-1"></div> Company Compliance <div className="h-px bg-slate-200 flex-1"></div>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {companyDocs.map(doc => {
            const daysLeft = getDaysRemaining(doc.expiry_date);
            return (
              <div key={doc.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative group overflow-hidden">
                <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase ${daysLeft !== null && daysLeft < 30 ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                  {daysLeft !== null && daysLeft <= 0 ? 'Expired' : `${daysLeft} Days Left`}
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic mb-6">{doc.doc_name}</h3>
                <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase">License No.</span>
                    <span className="text-sm font-bold">{doc.id_number}</span>
                  </div>
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col">
                    <span className="text-[8px] font-black text-indigo-400 uppercase">TPN</span>
                    <span className="text-sm font-bold text-indigo-700">{doc.tpn_number || 'N/A'}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white p-3 rounded-xl text-[10px] font-black uppercase">
                        <FileText size={14}/> View
                      </a>
                    )}
                    <button onClick={() => startEdit(doc)} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-100 hover:text-indigo-600 transition-all">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(doc.id, doc.file_url)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* EMPLOYEE SECTION */}
      <section className="pt-10">
        <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6 flex items-center gap-4">
          <div className="h-px bg-slate-200 flex-1"></div> Employee Records <div className="h-px bg-slate-200 flex-1"></div>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employeeDocs.map(doc => (
            <div key={doc.id} className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative group overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-10"><User size={80}/></div>
              <h3 className="text-xl font-black uppercase italic mb-6 text-indigo-400 leading-tight">{doc.doc_name}</h3>
              <div className="space-y-3 relative z-10">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                   <p className="text-[8px] font-black text-slate-500 uppercase mb-1">National ID / CID</p>
                   <p className="text-sm font-mono font-bold">{doc.id_number}</p>
                </div>
                {doc.license_number && (
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Driving License</p>
                    <p className="text-sm font-mono font-bold text-emerald-400">{doc.license_number}</p>
                  </div>
                )}
                
                <div className="flex gap-2 mt-4">
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-900 p-3 rounded-xl text-[10px] font-black uppercase">
                      <CreditCard size={14}/> View ID
                    </a>
                  )}
                  <button onClick={() => startEdit(doc)} className="p-3 bg-white/10 text-white rounded-xl hover:bg-indigo-500 transition-all">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(doc.id, doc.file_url)} className="p-3 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}