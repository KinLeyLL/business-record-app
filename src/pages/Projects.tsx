import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Loader2, X, Target, History, Banknote,
  ChevronDown, ChevronUp, CheckCircle2,
  Trash2, TrendingUp, MapPin, Edit3, ShieldCheck, Calendar
} from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [editingAdvanceId, setEditingAdvanceId] = useState<string | null>(null);

  const [activeProject, setActiveProject] = useState<any>(null);

  const [projectForm, setProjectForm] = useState({ 
    name: "", 
    client: "", 
    package_name: "", 
    budget: "", 
    deadline: "",
    retention_percentage: "10" 
  });

  const [claimForm, setClaimForm] = useState({
    site_name: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0]
  });

  const [advanceForm, setAdvanceForm] = useState({
    amount: "",
    remarks: "",
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select(`*, site_bills (*), advance_records (*)`)
      .order('created_at', { ascending: false });

    if (data) setProjects(data);
    setLoading(false);
  }

  async function handleDeleteProject(id: string, name: string) {
    if (window.confirm(`Permanently delete project: ${name}?`)) {
      await supabase.from('projects').delete().eq('id', id);
      fetchProjects();
    }
  }

  async function handleProjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...projectForm,
      budget: Number(projectForm.budget),
      retention_percentage: Number(projectForm.retention_percentage),
      status: 'In Progress'
    };

    if (editingProjectId) {
      await supabase.from('projects').update(payload).eq('id', editingProjectId);
    } else {
      await supabase.from('projects').insert([payload]);
    }

    setIsProjectModalOpen(false);
    setEditingProjectId(null);
    setProjectForm({ name: "", client: "", package_name: "", budget: "", deadline: "", retention_percentage: "10" });
    fetchProjects();
  }

  async function toggleRetentionClaim(project: any) {
    const isCurrentlyClaimed = (project.retention_amount || 0) > 0;
    const percentage = project.retention_percentage || 10;
    const calculatedValue = (project.budget * percentage) / 100;
    const newRetentionValue = isCurrentlyClaimed ? 0 : calculatedValue;

    const { error } = await supabase
      .from('projects')
      .update({ retention_amount: newRetentionValue })
      .eq('id', project.id);

    if (error) alert("Error: " + error.message);
    else fetchProjects();
  }

  function openEditModal(project: any) {
    setEditingProjectId(project.id);
    setProjectForm({
      name: project.name,
      client: project.client,
      package_name: project.package_name,
      budget: project.budget.toString(),
      deadline: project.deadline,
      retention_percentage: (project.retention_percentage || 10).toString()
    });
    setIsProjectModalOpen(true);
  }

  async function handleSiteClaim(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      project_id: activeProject.id,
      site_name: claimForm.site_name,
      bill_description: claimForm.description,
      amount: Number(claimForm.amount),
      claimed_date: claimForm.date
    };

    if (editingClaimId) {
      await supabase.from('site_bills').update(payload).eq('id', editingClaimId);
    } else {
      await supabase.from('site_bills').insert([payload]);
    }

    setIsClaimModalOpen(false);
    setEditingClaimId(null);
    setClaimForm({ site_name: "", description: "", amount: "", date: new Date().toISOString().split('T')[0] });
    fetchProjects();
  }

  async function handleDeleteBill(billId: string, siteName: string) {
    if (window.confirm(`Remove bill record for ${siteName}?`)) {
      await supabase.from('site_bills').delete().eq('id', billId);
      fetchProjects();
    }
  }

  async function handleAddAdvance(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      project_id: activeProject.id,
      amount: Number(advanceForm.amount),
      remarks: advanceForm.remarks,
      received_date: advanceForm.date
    };

    if (editingAdvanceId) {
      await supabase.from('advance_records').update(payload).eq('id', editingAdvanceId);
    } else {
      await supabase.from('advance_records').insert([payload]);
    }

    setIsAdvanceModalOpen(false);
    setEditingAdvanceId(null);
    setAdvanceForm({ amount: "", remarks: "", date: new Date().toISOString().split('T')[0] });
    fetchProjects();
  }

  async function handleDeleteAdvance(id: string) {
    if (window.confirm("Delete this advance record?")) {
      await supabase.from('advance_records').delete().eq('id', id);
      fetchProjects();
    }
  }

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4 text-slate-400 font-bold uppercase tracking-tighter">
      <Loader2 className="animate-spin text-indigo-600" size={30} />
      Syncing Tender Ledger...
    </div>
  );

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter">PROJECT REVENUE</h1>
          <p className="text-slate-500 font-semibold uppercase text-[10px] tracking-widest">Installment & Collection Tracking</p>
        </div>
        <button onClick={() => { setEditingProjectId(null); setIsProjectModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-700 transition-all">+ REGISTER TENDER</button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {projects.map((project) => {
          const totalClaims = project.site_bills?.reduce((sum: number, b: any) => sum + b.amount, 0) || 0;
          const totalAdvances = project.advance_records?.reduce((sum: number, a: any) => sum + a.amount, 0) || 0;
          const currentRetentionValue = project.retention_amount || 0;
          const totalReceived = totalAdvances + totalClaims + currentRetentionValue;

          const isRetentionClaimed = (project.retention_amount || 0) > 0;
          const retentionPercentage = project.retention_percentage || 10;
          const retentionDisplayAmount = isRetentionClaimed ? project.retention_amount : (project.budget * retentionPercentage) / 100;
          
          const remaining = project.budget - totalReceived;
          const percentCollected = Math.min(Math.round((totalReceived / project.budget) * 100), 100);
          const isExpanded = expandedProjectId === project.id;

          return (
            <div key={project.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden border-b-8 border-b-emerald-500 transition-all">
              <div className="p-6">
                <div className="flex flex-col xl:flex-row justify-between items-start gap-4 mb-6">
                  <div className="space-y-3 w-full">
                    <div className="flex justify-between items-center">
                      <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{project.package_name || 'TENDER PACKAGE'}</span>
                      <div className="flex gap-3">
                        <button onClick={() => openEditModal(project)} className="text-slate-300 hover:text-indigo-600"><Edit3 size={18} /></button>
                        <button onClick={() => handleDeleteProject(project.id, project.name)} className="text-slate-300 hover:text-rose-500"><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase leading-tight">{project.name}</h3>
                    <div className="flex flex-wrap gap-3">
                      <div className="bg-slate-50 px-3 py-1.5 rounded-lg border flex items-center gap-2"><Target size={14} className="text-slate-400" /> <span className="text-slate-600 font-bold text-xs uppercase">{project.client}</span></div>
                      <div className="bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 flex items-center gap-2"><Calendar size={14} className="text-rose-600" /> <span className="text-rose-900 font-black text-xs uppercase">DEADLINE: {project.deadline || 'N/A'}</span></div>
                    </div>
                  </div>
                  <div className="bg-slate-900 px-6 py-4 rounded-2xl text-right min-w-[200px]">
                    <p className="text-[9px] font-black text-slate-500 uppercase">Contract Value</p>
                    <p className="text-xl font-black text-white font-mono">Nu. {project.budget?.toLocaleString()}</p>
                  </div>
                </div>

                <div onClick={() => toggleRetentionClaim(project)} className={`mb-6 p-4 rounded-2xl border flex justify-between items-center cursor-pointer transition-all ${isRetentionClaimed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                        <ShieldCheck className={isRetentionClaimed ? 'text-emerald-600' : 'text-slate-300'} size={20} />
                        <div>
                            <p className={`text-[9px] font-black uppercase ${isRetentionClaimed ? 'text-emerald-700' : 'text-slate-500'}`}>Retention ({retentionPercentage}%)</p>
                            <p className="text-sm font-black text-slate-800 font-mono">Nu. {retentionDisplayAmount.toLocaleString()}</p>
                        </div>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${isRetentionClaimed ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>{isRetentionClaimed ? 'CLAIMED' : 'MARK AS CLAIMED'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-5 rounded-2xl border cursor-pointer hover:border-indigo-300 transition-all" onClick={() => { setActiveProject(project); setEditingAdvanceId(null); setAdvanceForm({ amount: "", remarks: "", date: new Date().toISOString().split('T')[0] }); setIsAdvanceModalOpen(true); }}>
                    <p className="text-[9px] font-black text-slate-400 uppercase flex justify-between">Total Advance <History size={12}/></p>
                    <p className="text-lg font-black text-slate-800 font-mono">Nu. {totalAdvances.toLocaleString()}</p>
                    <span className="text-[8px] font-black text-indigo-600 uppercase mt-2 block">+ Add Installment</span>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border cursor-pointer hover:border-emerald-300 transition-all" onClick={() => { setActiveProject(project); setEditingClaimId(null); setClaimForm({ site_name: "", description: "", amount: "", date: new Date().toISOString().split('T')[0] }); setIsClaimModalOpen(true); }}>
                    <p className="text-[9px] font-black text-slate-400 uppercase flex justify-between">Claims Paid <CheckCircle2 size={12}/></p>
                    <p className="text-lg font-black text-slate-800 font-mono">Nu. {totalClaims.toLocaleString()}</p>
                    <span className="text-[8px] font-black text-emerald-600 uppercase mt-2 block">+ Record Payment</span>
                  </div>
                  <div className="bg-emerald-600 p-5 rounded-2xl text-white shadow-md flex flex-col justify-center">
                    <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">Total Collected</p>
                    <p className="text-lg font-black font-mono">Nu. {totalReceived.toLocaleString()}</p>
                    <p className="text-[8px] font-black opacity-70 uppercase mt-1">Due: Nu. {remaining.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-end">
                    <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2"><TrendingUp size={12} className="text-emerald-500" /> Progress</div>
                    <div className="text-lg font-black text-emerald-600 italic">{percentCollected}%</div>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${percentCollected}%` }} />
                  </div>
                </div>

                <button onClick={() => setExpandedProjectId(isExpanded ? null : project.id)} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 rounded-xl text-white text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all">
                  {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} {isExpanded ? "Close Ledger" : "View History"}
                </button>

                {isExpanded && (
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-top duration-300">
                    <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                      <h4 className="text-[9px] font-black text-slate-500 uppercase mb-4 flex items-center gap-2"><Banknote size={14} className="text-indigo-600"/> Advances</h4>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {project.advance_records?.map((adv: any) => (
                          <div key={adv.id} className="group bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                            <div>
                                <p className="text-sm font-black text-slate-800">Nu. {adv.amount.toLocaleString()}</p>
                                {adv.remarks && <p className="text-[10px] text-indigo-600 font-bold italic mb-1">"{adv.remarks}"</p>}
                                <p className="text-[8px] text-slate-400 uppercase font-bold">{adv.received_date}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => { setActiveProject(project); setEditingAdvanceId(adv.id); setAdvanceForm({ amount: adv.amount.toString(), remarks: adv.remarks || "", date: adv.received_date }); setIsAdvanceModalOpen(true); }} className="text-slate-300 hover:text-indigo-600"><Edit3 size={14}/></button>
                                <button onClick={() => handleDeleteAdvance(adv.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-emerald-50/20 rounded-2xl p-5 border border-emerald-100">
                      <h4 className="text-[9px] font-black text-slate-500 uppercase mb-4 flex items-center gap-2"><MapPin size={14} className="text-emerald-600"/> Site Bills</h4>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {project.site_bills?.map((bill: any) => (
                          <div key={bill.id} className="group flex justify-between items-center bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                            <div>
                              <p className="text-sm font-black text-emerald-700">Nu. {bill.amount.toLocaleString()}</p>
                              <p className="text-[9px] font-black text-slate-800 uppercase">{bill.site_name}</p>
                              {bill.bill_description && <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{bill.bill_description}</p>}
                              <p className="text-[8px] text-slate-300 font-bold uppercase mt-1">{bill.claimed_date}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => { setActiveProject(project); setEditingClaimId(bill.id); setClaimForm({ site_name: bill.site_name, description: bill.bill_description || "", amount: bill.amount.toString(), date: bill.claimed_date }); setIsClaimModalOpen(true); }} className="text-slate-300 hover:text-indigo-600"><Edit3 size={14}/></button>
                                <button onClick={() => handleDeleteBill(bill.id, bill.site_name)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALS */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-emerald-600 text-white flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-tighter">{editingClaimId ? 'Update Claim' : 'Record Site Claim'}</h2>
              <button onClick={() => { setIsClaimModalOpen(false); setEditingClaimId(null); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSiteClaim} className="p-6 space-y-4">
              <input required placeholder="Site Name" className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none" value={claimForm.site_name} onChange={e => setClaimForm({...claimForm, site_name: e.target.value})} />
              <input placeholder="Work Description" className="w-full p-4 bg-slate-50 rounded-xl font-bold text-xs outline-none" value={claimForm.description} onChange={e => setClaimForm({...claimForm, description: e.target.value})} />
              <input required type="number" placeholder="Nu. Amount" className="w-full p-4 bg-slate-50 rounded-xl font-black text-lg outline-none" value={claimForm.amount} onChange={e => setClaimForm({...claimForm, amount: e.target.value})} />
              <input required type="date" className="w-full p-4 bg-slate-50 rounded-xl outline-none text-sm" value={claimForm.date} onChange={e => setClaimForm({...claimForm, date: e.target.value})} />
              <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest">{editingClaimId ? 'Save Changes' : 'Add Claim'}</button>
            </form>
          </div>
        </div>
      )}

      {isAdvanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-indigo-600 text-white flex justify-between items-center">
              <h2 className="text-sm font-black uppercase">{editingAdvanceId ? 'Update Advance' : 'Add Advance'}</h2>
              <button onClick={() => { setIsAdvanceModalOpen(false); setEditingAdvanceId(null); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddAdvance} className="p-6 space-y-4">
              <input required type="number" placeholder="Amount" className="w-full p-4 bg-slate-50 rounded-xl font-black text-lg outline-none" value={advanceForm.amount} onChange={e => setAdvanceForm({...advanceForm, amount: e.target.value})} />
              <input required type="date" className="w-full p-4 bg-slate-50 rounded-xl outline-none text-sm" value={advanceForm.date} onChange={e => setAdvanceForm({...advanceForm, date: e.target.value})} />
              <input className="w-full p-4 bg-slate-50 rounded-xl outline-none text-sm" placeholder="Remarks" value={advanceForm.remarks} onChange={e => setAdvanceForm({...advanceForm, remarks: e.target.value})} />
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest">{editingAdvanceId ? 'Save Changes' : 'Confirm'}</button>
            </form>
          </div>
        </div>
      )}

      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="p-6 bg-slate-100 flex justify-between items-center border-b border-slate-200">
              <h2 className="text-lg font-black uppercase italic tracking-tighter text-slate-800">{editingProjectId ? 'Update Project' : 'New Tender'}</h2>
              <button onClick={() => setIsProjectModalOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleProjectSubmit} className="p-8 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Project Name</label>
                <input placeholder="Project Name" required className="w-full p-4 bg-slate-50 rounded-xl outline-none text-sm font-bold" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} />
              </div>
              <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Package ID</label><input placeholder="Package ID" required className="w-full p-4 bg-slate-50 rounded-xl outline-none text-xs" value={projectForm.package_name} onChange={e => setProjectForm({...projectForm, package_name: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Client</label><input placeholder="Client" required className="w-full p-4 bg-slate-50 rounded-xl outline-none text-xs" value={projectForm.client} onChange={e => setProjectForm({...projectForm, client: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Budget</label><input placeholder="Budget" required type="number" className="w-full p-4 bg-slate-50 rounded-xl outline-none text-sm font-black" value={projectForm.budget} onChange={e => setProjectForm({...projectForm, budget: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Retention %</label><input placeholder="10" required type="number" className="w-full p-4 bg-slate-50 rounded-xl outline-none text-sm font-black text-indigo-600" value={projectForm.retention_percentage} onChange={e => setProjectForm({...projectForm, retention_percentage: e.target.value})} /></div>
              <div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Deadline</label><input required type="date" className="w-full p-4 bg-slate-50 rounded-xl outline-none text-xs font-bold" value={projectForm.deadline} onChange={e => setProjectForm({...projectForm, deadline: e.target.value})} /></div>
              <button type="submit" className="col-span-2 bg-indigo-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest mt-2 hover:bg-indigo-700 transition-all">{editingProjectId ? 'Save Changes' : 'Initialize'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}