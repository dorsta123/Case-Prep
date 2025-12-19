"use client";
import { useState, useEffect, Suspense } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  
  // New States for UX Buffer
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // --- 1. STEADY & PLAUSIBLE PROGRESS LOGIC ---
  const calculatePlausibleProgress = (currentMessages: Message[]) => {
    if (currentMessages.length === 0) return 0;

    const userMessages = currentMessages.filter(m => m.role === 'user');
    const historyText = currentMessages.map(m => m.parts[0].text.toLowerCase()).join(" ");

    // Base Momentum: Steady growth that slows down over time (Decay function)
    let baseScore = 0;
    for (let i = 1; i <= userMessages.length; i++) {
      baseScore += Math.max(4 - (i * 0.1), 0.5); 
    }

    // Logical Milestones: Multi-category data keywords
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

    // Quant Check
    if (/\d+|%/.test(historyText) && userMessages.length > 5) {
      milestoneBoost += 15;
    }

    // Final Phase Detection
    const lastAI = currentMessages.filter(m => m.role === 'model').pop()?.parts[0].text.toLowerCase() || "";
    const isClosing = lastAI.includes("recommendation") || lastAI.includes("conclude") || lastAI.includes("summary");

    let totalProgress = baseScore + milestoneBoost;
    if (isClosing) totalProgress = Math.max(totalProgress, 85);

    return Math.min(totalProgress, 98); 
  };

  const currentProgress = calculatePlausibleProgress(messages);

  // --- 2. END CASE FLOW (WITH BUFFER) ---
  const handleEndCase = async () => {
    setShowConfirm(false);
    setIsEvaluating(true);
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          history: messages, 
          session_id: sessionId,
          user_name: userName,
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

  // --- 3. MESSAGING LOGIC ---
  useEffect(() => {
    if (!sessionId) return;
    const fetchHistory = async () => {
      const { data } = await supabase.from("chat_sessions").select("history").eq("session_id", sessionId).single();
      if (data?.history) setMessages(data.history);
    };
    fetchHistory();
  }, [sessionId]);

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

  if (!sessionId) return <div className="p-10">Error: No Session ID found.</div>;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-50">
      <div className="w-full max-w-3xl flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-black tracking-tight">Case Session</h1>
          <a href="/" className="text-sm font-bold text-blue-600">New Case</a>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white p-6 rounded-xl shadow-sm overflow-y-auto mb-4 border border-gray-200 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-gray-400">Welcome, <strong>{userName}</strong>.<br />Type "Start" to begin the case.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`mb-4 p-4 rounded-2xl max-w-[85%] shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white ml-auto" : "bg-gray-100 text-gray-800 mr-auto"}`}>
                <strong className="block text-[10px] uppercase tracking-widest mb-1 opacity-70">{msg.role === "user" ? "Candidate" : "Interviewer"}</strong>
                <p className="text-sm leading-relaxed">{msg.parts[0].text}</p>
              </div>
            ))
          )}
          {isLoading && <p className="text-blue-500 text-xs font-bold animate-pulse">Partner is analyzing...</p>}
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-6">
          <div className="flex justify-between items-center mb-1 px-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Case Progress</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{Math.round(currentProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-full transition-all duration-1000 ease-out" style={{ width: `${currentProgress}%` }} />
          </div>
        </div>

        {/* Input Controls */}
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 p-4 border border-gray-200 rounded-xl text-black focus:ring-2 focus:ring-blue-500 outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Address the prompt..."
            disabled={isLoading || isEvaluating}
          />
          <button onClick={sendMessage} disabled={isLoading || isEvaluating} className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">Send</button>
          <button onClick={() => setShowConfirm(true)} disabled={isLoading || isEvaluating} className="bg-red-500 text-white px-4 rounded-xl font-bold hover:bg-red-600 transition">End Case</button>
        </div>

        {/* --- MODALS & OVERLAYS --- */}

        {/* 1. Confirmation Pop-up */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white p-8 rounded-2xl max-w-sm w-full shadow-2xl text-center">
              <h3 className="text-xl font-black mb-2">Finish Interview?</h3>
              <p className="text-gray-500 text-sm mb-6">Are you ready to receive your final Partner evaluation? You cannot resume after this.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-xl transition">Back</button>
                <button onClick={handleEndCase} className="flex-1 py-3 font-bold bg-black text-white rounded-xl shadow-lg">Confirm</button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Circular Loading Buffer */}
        {isEvaluating && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-[70]">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-black text-black uppercase tracking-widest animate-pulse">Partner is synthesizing results...</p>
          </div>
        )}

        {/* 3. Evaluation Result Modal (Scrollable) */}
        {evaluation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl font-black text-black">Case Results</h2>
                  <p className="text-blue-600 font-bold text-sm">Score: {evaluation.overall_score}/100</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-400">LP Gained</p>
                  <p className="text-3xl font-black text-green-600">+{Math.max(1, Math.floor((evaluation.overall_score * (currentProgress / 100)) / 10))}</p>
                </div>
              </div>

              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Completion", val: Math.round(currentProgress), color: "text-teal-600" },
                    { label: "Structure", val: evaluation.structure, color: "text-purple-600" },
                    { label: "Logic", val: evaluation.business_logic, color: "text-green-600" },
                    { label: "Quant", val: evaluation.quant_accuracy, color: "text-orange-600" }
                  ].map((stat) => (
                    <div key={stat.label} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">{stat.label}</p>
                      <p className={`text-2xl font-black ${stat.color}`}>{stat.val}%</p>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Partner Feedback</h3>
                  <p className="text-sm text-blue-900 leading-relaxed italic whitespace-pre-wrap">"{evaluation.feedback}"</p>
                </div>
              </div>

              <div className="p-8 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                <button onClick={() => window.location.href = '/leaderboard'} className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:shadow-xl transition-all">View Leaderboard</button>
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-400 font-bold">Initialing Session...</div>}>
      <ChatInterface />
    </Suspense>
  );
}