"use client";
import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Message = {
  role: "user" | "model";
  parts: { text: string }[];
};

function ChatInterface() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const userName = searchParams.get("user_name");
  const industry = searchParams.get("industry") || "Random";
  const domain = searchParams.get("domain") || "Random";

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Default to true to show loading immediately
  const [evaluation, setEvaluation] = useState<any>(null);
  
  // UX State
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const hasInitialized = useRef(false);

  // --- 1. AUTO-START & HISTORY SYNC ---
  useEffect(() => {
    if (!sessionId || hasInitialized.current) return;
    hasInitialized.current = true;

    const initSession = async () => {
      try {
        // 1. Check DB for existing history
        const { data } = await supabase.from("chat_sessions").select("history").eq("session_id", sessionId).single();
        
        if (data?.history && data.history.length > 0) {
          setMessages(data.history);
          setIsLoading(false);
        } else {
          // 2. No history? TRIGGER AUTO-START immediately.
          // We don't ask the user to type anything. We send a hidden system prompt.
          await triggerAutoStart();
        }
      } catch (e) {
        console.error("Session init error:", e);
        setIsLoading(false);
      }
    };

    initSession();
  }, [sessionId]);

  const triggerAutoStart = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // HIDDEN PROMPT: This tells the AI to start the case immediately
        body: JSON.stringify({ 
            prompt: `SYSTEM_AUTO_START: The candidate ${userName} has entered the room. Immediately start the mock interview for a ${industry} case in the ${domain} domain. Introduce the problem context clearly and concisely. Do not wait for the user to say hello.`, 
            session_id: sessionId, 
            user_name: userName, 
            industry, 
            domain 
        }),
      });
      const data = await response.json();
      
      const aiMsg: Message = { role: "model", parts: [{ text: data.output }] };
      setMessages([aiMsg]);
    } catch (error) {
      console.error("Auto-start failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. PROGRESS LOGIC ---
  const calculatePlausibleProgress = (currentMessages: Message[]) => {
    if (currentMessages.length === 0) return 0;
    const userMessages = currentMessages.filter(m => m.role === 'user');
    const historyText = currentMessages.map(m => m.parts[0].text.toLowerCase()).join(" ");

    let baseScore = 0;
    for (let i = 1; i <= userMessages.length; i++) {
      baseScore += Math.max(4 - (i * 0.1), 0.5); 
    }

    let milestoneBoost = 0;
    const dataLibrary = {
      profitability: ["revenue", "cost", "profit", "margin", "fixed", "variable", "ebitda", "opex", "cogs"],
      market: ["competitor", "market share", "fragmented", "saturated", "growth rate", "trends", "barriers"],
      customer: ["segmentation", "acquisition", "churn", "clv", "demographics", "b2b", "b2c", "retention"],
      operational: ["capacity", "utilization", "supply chain", "efficiency", "bottleneck", "output", "logistics"]
    };

    const allKeywords = Object.values(dataLibrary).flat();
    const uniqueKeywordsFound = allKeywords.filter(kw => historyText.includes(kw));
    milestoneBoost += Math.min(uniqueKeywordsFound.length * 3, 30); 

    if (/\d+|%/.test(historyText) && userMessages.length > 5) milestoneBoost += 15;

    const lastAI = currentMessages.filter(m => m.role === 'model').pop()?.parts[0].text.toLowerCase() || "";
    const isClosing = lastAI.includes("recommendation") || lastAI.includes("conclude") || lastAI.includes("summary");

    let totalProgress = baseScore + milestoneBoost;
    if (isClosing) totalProgress = Math.max(totalProgress, 85);

    return Math.min(totalProgress, 98); 
  };

  const currentProgress = calculatePlausibleProgress(messages);

  // --- 3. END CASE LOGIC ---
  const handleEndCase = async () => {
    setShowConfirm(false);
    setIsEvaluating(true);

    try {
      const lpToGain = Math.max(1, Math.floor((evaluation?.overall_score || 0 * (currentProgress / 100)) / 10));

      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          history: messages, 
          session_id: sessionId,
          user_name: userName,
          lp_to_add: lpToGain, 
          completion_rate: Math.round(currentProgress)
        }),
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setEvaluation(data);
    } catch (error: any) {
      alert("Evaluation failed: " + error.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  // --- 4. SEND MESSAGE LOGIC ---
  const sendMessage = async () => {
    if (!input.trim() || !sessionId || isLoading) return;
    const userMsg: Message = { role: "user", parts: [{ text: input }] };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, session_id: sessionId, user_name: userName, industry, domain }),
      });
      const data = await response.json();
      const aiMsg: Message = { role: "model", parts: [{ text: data.output }] };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      alert("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionId) return <div className="p-10 font-bold">Error: No Session ID found.</div>;

  return (
    <main className="flex h-dvh w-full flex-col items-center bg-neutral-950 md:p-4 text-slate-100 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      
      {/* Ambient Background Effects (Made brighter for contrast) */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
         <div className="absolute -right-[10%] top-[40%] h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      {/* CONTAINER CHANGES: 
         1. bg-slate-900 (Lighter than background)
         2. shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)] (Blue glow shadow)
         3. border-white/10 (Crisper border)
      */}
      <div className="z-10 w-full max-w-3xl flex flex-col h-full bg-slate-900 md:rounded-3xl border-x md:border border-white/10 md:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
        
        {/* HEADER - slightly lighter than container to separate it */}
        <div className="shrink-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex justify-between items-center sticky top-0">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white tracking-tight leading-none flex items-center gap-2">
              Case Session
            </h1>
            <a href="/" className="text-[10px] font-medium text-slate-400 mt-1 hover:text-cyan-400 transition-colors">Back to Home</a>
          </div>
          <button 
            onClick={() => setShowConfirm(true)} 
            disabled={isLoading || isEvaluating} 
            className="text-xs font-bold text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 transition-colors disabled:opacity-50"
          >
            End Case
          </button>
        </div>

        {/* PROGRESS BAR */}
        <div className="shrink-0 w-full bg-slate-900 px-4 py-2 border-b border-white/5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Progress</span>
            <span className="text-[9px] font-bold text-cyan-400">{Math.round(currentProgress)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${currentProgress}%` }} />
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-5 pb-4 bg-slate-900">
          
          {messages.map((msg, index) => (
            <div key={index} className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}>
              <span className="text-[10px] text-slate-500 mb-1 ml-1 uppercase tracking-wider font-bold">
                {msg.role === "user" ? "You" : "Partner"}
              </span>
              <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-md border ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-br-none border-blue-500" 
                  : "bg-slate-800 text-slate-200 rounded-bl-none border-slate-700"
              }`}>
                {msg.parts[0].text}
              </div>
            </div>
          ))}

          {/* LOADING INDICATOR */}
          {isLoading && (
             <div className="flex items-center gap-3 ml-2 mt-4 mb-2 animate-pulse">
                <div className="w-5 h-5 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
                <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">
                  Partner is replying...
                </span>
             </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="shrink-0 p-4 bg-slate-900 border-t border-white/5 pb-safe"> 
          <div className="flex items-end gap-2 bg-slate-950 p-2 rounded-[24px] border border-slate-700 focus-within:border-cyan-500/50 focus-within:ring-2 focus-within:ring-cyan-500/10 transition-all shadow-inner">
            <textarea
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-600 resize-none max-h-32 py-3 px-4 text-sm"
              rows={1}
              value={input}
              onChange={(e) => {
                 setInput(e.target.value);
                 e.target.style.height = 'auto';
                 e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Address the prompt..."
              disabled={isLoading || isEvaluating}
              style={{ minHeight: '48px' }} 
            />
            <button 
              onClick={sendMessage} 
              disabled={isLoading || isEvaluating || !input.trim()} 
              className="bg-cyan-500 hover:bg-cyan-400 text-black p-3 rounded-full disabled:opacity-30 disabled:hover:bg-cyan-500 transition-all flex-shrink-0 mb-1 shadow-lg shadow-cyan-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* CONFIRMATION MODAL */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-xs w-full shadow-2xl text-center">
              <h3 className="text-lg font-bold mb-2 text-white">Finish Interview?</h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">You cannot resume after this.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">Back</button>
                <button onClick={handleEndCase} className="flex-1 py-3 text-sm font-bold bg-white text-black hover:bg-slate-200 rounded-xl transition-colors">Confirm</button>
              </div>
            </div>
          </div>
        )}

        {/* EVALUATING OVERLAY */}
        {isEvaluating && (
          <div className="fixed inset-0 bg-[#0B0C10]/95 backdrop-blur-xl flex flex-col items-center justify-center z-[70]">
            <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-bold text-cyan-500 uppercase tracking-widest animate-pulse">Synthesizing Feedback...</p>
          </div>
        )}

        {/* RESULTS CARD */}
        {evaluation && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center z-50 md:p-4">
            <div className="bg-slate-900 w-full rounded-t-3xl md:rounded-3xl max-w-lg shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] animate-slide-up">
              
              <div className="p-6 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 flex justify-between items-center">
                 <div>
                    <h2 className="text-xl font-black text-white">Results</h2>
                    <p className="text-cyan-400 font-bold text-xs mt-1">Score: {evaluation.overall_score}/100</p>
                 </div>
                 <button onClick={() => window.location.href = '/leaderboard'} className="text-xs font-bold bg-white text-black hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors">
                   Done
                 </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 pb-12">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Completion", val: Math.round(currentProgress), color: "text-cyan-400" },
                    { label: "Structure", val: evaluation.structure, color: "text-purple-400" },
                    { label: "Logic", val: evaluation.business_logic, color: "text-emerald-400" },
                    { label: "Quant", val: evaluation.quant_accuracy, color: "text-orange-400" }
                  ].map((stat) => (
                    <div key={stat.label} className="bg-slate-800 p-3 rounded-xl border border-white/5">
                      <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1">{stat.label}</p>
                      <p className={`text-xl font-black ${stat.color}`}>{stat.val}%</p>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-blue-500/20 relative">
                   <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 rounded-r"></div>
                   <h3 className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Feedback</h3>
                   <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{evaluation.feedback}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-400 font-bold animate-pulse">Initializing Session...</div>}>
      <ChatInterface />
    </Suspense>
  );
}