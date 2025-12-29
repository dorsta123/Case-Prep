"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("username, rating")
        .order("rating", { ascending: false })
        .limit(10);

      if (!error) setLeaders(data);
      setLoading(false);
    };
    fetchLeaders();
  }, []);

  const getTier = (rating: number) => {
    if (rating >= 2000) return { label: "Senior Partner", color: "text-red-600" };
    if (rating >= 1000) return { label: "Engagement Manager", color: "text-blue-600" };
    return { label: "Business Associate", color: "text-gray-600" };
  };

  // --- MASKING HELPER FUNCTION ---
  const maskUsername = (name: string) => {
    if (!name) return "Unknown";
    if (name.length <= 2) return name; // Show full name if very short (or return "****")
    
    const start = name.substring(0, 1);
    const end = name.substring(name.length - 1);
    return `${start}...${end}`;
  };

  return (
   <main className="min-h-screen bg-[#0B0C10] p-4 md:p-8 flex flex-col items-center relative overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute left-1/2 -top-[20%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
         <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-2xl bg-[#0F1115]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative z-10">
        
        {/* HEADER */}
        <div className="bg-[#161b22] p-8 border-b border-white/5 relative overflow-hidden">
          {/* Decorative shine */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 blur-2xl rounded-full"></div>
          
          <h1 className="text-3xl font-black italic tracking-tighter text-white relative z-10 flex items-center gap-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">GLOBAL</span> RANKINGS
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Top Case Solvers based on LP Gained</p>
        </div>

        {/* LIST AREA */}
        <div className="p-4 md:p-6 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
               <div className="w-8 h-8 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
               <p className="animate-pulse font-bold text-xs text-slate-500 uppercase tracking-widest">Loading Leaderboard...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaders.map((user, index) => {
                const tier = getTier(user.rating);
                // Highlight Top 3
                const isTop3 = index < 3;
                const rankColor = index === 0 ? "text-yellow-400" : index === 1 ? "text-slate-300" : index === 2 ? "text-orange-400" : "text-slate-700";
                
                return (
                  <div 
                    key={index} 
                    className={`group flex items-center justify-between p-4 rounded-2xl transition-all border ${
                      isTop3 
                        ? "bg-slate-800/60 border-white/10 hover:border-cyan-500/30 hover:bg-slate-800" 
                        : "bg-transparent border-transparent hover:bg-slate-800/40 hover:border-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <span className={`text-2xl font-black italic w-8 text-center ${rankColor}`}>
                        #{index + 1}
                      </span>
                      
                      <div>
                        {/* Masking Applied Here */}
                        <p className={`font-bold text-base ${isTop3 ? "text-white" : "text-slate-300"} group-hover:text-white transition-colors`} title={user.username}>
                          {maskUsername(user.username)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                           <span className={`h-1.5 w-1.5 rounded-full ${index === 0 ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-slate-600"}`}></span>
                           <p className={`text-[9px] font-black uppercase tracking-widest ${tier.color} opacity-80`}>
                             {tier.label}
                           </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-black text-white font-mono tracking-tight">{user.rating}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">LP Gained</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER ACTION */}
        <div className="p-6 bg-[#0B0C10] border-t border-white/5">
          <button 
            onClick={() => window.location.href = '/'} 
            className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl font-bold shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Start New Case
          </button>
        </div>
        
      </div>
    </main>
  );
}