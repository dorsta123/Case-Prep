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

  return (
    <main className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-black p-8 text-white">
          <h1 className="text-3xl font-black italic tracking-tighter">GLOBAL RANKINGS</h1>
          <p className="text-gray-400 text-sm mt-1">Top Case Solvers based on LP Gained</p>
        </div>

        <div className="p-4">
          {loading ? (
            <p className="text-center py-10 animate-pulse font-bold text-gray-300">Loading Rankings...</p>
          ) : (
            <div className="space-y-2">
              {leaders.map((user, index) => {
                const tier = getTier(user.rating);
                return (
                  <div key={user.username} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-gray-200 w-8">#{index + 1}</span>
                      <div>
                        <p className="font-bold text-black">{user.username}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${tier.color}`}>{tier.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-black">{user.rating}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">LP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-6 bg-gray-50 border-t">
          <button onClick={() => window.location.href = '/'} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all">
            Start New Case
          </button>
        </div>
      </div>
    </main>
  );
}