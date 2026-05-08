import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  X, Search, User as UserIcon, ArrowRight, 
  Download, Filter, Receipt, History, Calculator, Scale, Undo2, CheckCircle2
} from 'lucide-react';

export default function Finance() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchSettlementData(); }, []);

  const fetchSettlementData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('attendance').select(`
          wage_paid, advance_paid, status, workers ( name )
      `);
      if (error) throw error;
      const workerMap: Record<string, any> = {};
      data.forEach(item => {
        const name = item.workers?.name || 'Unknown';
        if (!workerMap[name]) {
          workerMap[name] = { 
            name, 
            totalEarned: 0, 
            totalAdvances: 0, 
            daysPresent: 0,
            isSettled: false // Added functional state for settlement
          };
        }
        if (item.status === 'present') {
          workerMap[name].totalEarned += Number(item.wage_paid || 0);
          workerMap[name].daysPresent += 1;
        }
        workerMap[name].totalAdvances += Number(item.advance_paid || 0);
      });
      setSettlements(Object.values(workerMap));
    } finally { setLoading(false); }
  };

  // Functional logic to toggle settlement
  const handleSettleToggle = (workerName: string) => {
    setSettlements(prev => prev.map(w => 
      w.name === workerName ? { ...w, isSettled: !w.isSettled } : w
    ));
    // Update the selected worker reference so the UI updates immediately
    if (selectedWorker && selectedWorker.name === workerName) {
      setSelectedWorker(prev => ({ ...prev, isSettled: !prev.isSettled }));
    }
  };

  const grandTotalEarned = settlements.reduce((sum, s) => sum + s.totalEarned, 0);
  const grandTotalAdvances = settlements.reduce((sum, s) => sum + s.totalAdvances, 0);
  const grandNetOwed = grandTotalEarned - grandTotalAdvances;

  const filteredSettlements = settlements.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative h-[calc(100vh-120px)] flex overflow-hidden bg-slate-50 rounded-3xl border border-slate-200 shadow-sm">
      
      {/* LEFT SIDE: MAIN LIST VIEW */}
      <div className={`flex-1 flex flex-col min-w-0 bg-white transition-all duration-500 ${selectedWorker ? 'mr-[450px]' : ''}`}>
        
        {/* HEADER SECTION */}
        <div className="p-8 border-b border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finance Ledger</h1>
              <p className="text-slate-500 text-sm font-medium">Monitor worker earnings and pending settlements</p>
            </div>
            <div className="flex gap-2">
                <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl flex flex-col justify-center shadow-sm">
                    <span className="text-[10px] font-black uppercase opacity-50 leading-none mb-1">Total Liability</span>
                    <span className="text-sm font-bold font-mono">Nu. {grandNetOwed.toLocaleString()}</span>
                </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl border border-slate-200">
             <div className="flex items-center gap-2 flex-1 px-3">
               <Search size={18} className="text-slate-500" />
               <input 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700 placeholder:text-slate-500" 
                 placeholder="Search workers..." 
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
                <th className="px-8 py-5">Worker Name</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Gross Earned</th>
                <th className="px-8 py-5">Advances</th>
                <th className="px-8 py-5 text-right">Net Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSettlements.map((worker, i) => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedWorker(worker)}
                  className={`group cursor-pointer transition-all hover:bg-slate-100 active:bg-slate-200 ${selectedWorker?.name === worker.name ? 'bg-indigo-50/90' : ''}`}
                >
                  <td className="px-8 py-5 font-bold text-slate-900 group-hover:text-black">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            <UserIcon size={14} />
                        </div>
                        {worker.name}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {worker.isSettled ? (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase">
                        <CheckCircle2 size={12} /> Settled
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-amber-500 uppercase">Pending</span>
                    )}
                  </td>
                  <td className="px-8 py-5 font-mono text-sm text-slate-700">Nu. {worker.totalEarned.toLocaleString()}</td>
                  <td className="px-8 py-5 text-rose-600 font-bold font-mono text-sm">Nu. {worker.totalAdvances.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right">
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold font-mono border ${worker.isSettled ? 'bg-slate-100 text-slate-400 border-slate-200 line-through' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>
                      Nu. {(worker.totalEarned - worker.totalAdvances).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT SIDEBAR: INDIVIDUAL AUDIT */}
      <div className={`fixed top-0 right-0 h-full w-[450px] bg-white border-l border-slate-300 z-40 transition-transform duration-500 ease-in-out shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col ${selectedWorker ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedWorker && (
          <>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shadow-lg">
               <div>
                 <h2 className="text-xl font-black italic uppercase tracking-tighter leading-tight">{selectedWorker.name}</h2>
                 <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Individual Audit Statement</p>
               </div>
               <button onClick={() => setSelectedWorker(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-90">
                 <X size={20} />
               </button>
            </div>

            <div className="p-6 bg-slate-50 border-b border-slate-200">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Advances</p>
                    <p className="text-lg font-black text-rose-600 font-mono">Nu. {selectedWorker.totalAdvances.toLocaleString()}</p>
                  </div>
                  <div className={`p-4 rounded-2xl shadow-xl transition-colors ${selectedWorker.isSettled ? 'bg-emerald-600' : 'bg-slate-900'}`}>
                    <p className="text-[10px] font-black text-white/50 uppercase mb-1">{selectedWorker.isSettled ? 'Amount Paid' : 'Balance Due'}</p>
                    <p className="text-lg font-black text-white font-mono">Nu. {(selectedWorker.totalEarned - selectedWorker.totalAdvances).toLocaleString()}</p>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-white">
               <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Performance Metrics</h4>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase">Days Present</span>
                    <span className="text-sm font-black text-slate-900">{selectedWorker.daysPresent} Days</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Avg Wage / Day</span>
                    <span className="text-sm font-black text-slate-900 font-mono">Nu. {Math.round(selectedWorker.totalEarned / selectedWorker.daysPresent || 0)}</span>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Scale size={16} className="text-slate-400" />
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Final Action</h4>
                  </div>
                  
                  <div className={`p-6 rounded-2xl border transition-all ${selectedWorker.isSettled ? 'bg-emerald-50 border-emerald-100' : 'bg-indigo-50 border-indigo-100'} text-center`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${selectedWorker.isSettled ? 'text-emerald-500' : 'text-indigo-400'}`}>
                        {selectedWorker.isSettled ? 'Account Cleared' : 'Account Reconciliation'}
                    </p>
                    
                    <button 
                      onClick={() => handleSettleToggle(selectedWorker.name)}
                      className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 ${
                        selectedWorker.isSettled 
                        ? 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {selectedWorker.isSettled ? (
                        <><Undo2 size={16} /> Undo Settlement</>
                      ) : (
                        'Settle Account'
                      )}
                    </button>
                    
                    <p className="mt-4 text-[10px] text-slate-400 font-medium italic">
                      {selectedWorker.isSettled 
                        ? 'This transaction is marked as complete.' 
                        : 'Clearing this will balance the ledger for this cycle.'}
                    </p>
                  </div>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}