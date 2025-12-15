"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// --- CONFIG ---
// Initialize Supabase Client for the Frontend (to fetch history)
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
  // Get data from URL (e.g., /chat?session_id=...&user_name=...)
  const sessionId = searchParams.get("session_id");
  const userName = searchParams.get("user_name");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. ON LOAD: Fetch existing history from Supabase
  useEffect(() => {
    if (!sessionId) return;

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("history")
        .eq("session_id", sessionId)
        .single();

      if (data?.history) {
        setMessages(data.history); // Restore the chat!
      }
    };

    fetchHistory();
  }, [sessionId]);

  // 2. ON SEND: Post to API (API handles saving to DB)
  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    // Optimistic Update (Show user message immediately)
    const userMsg: Message = { role: "user", parts: [{ text: input }] };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input,
          session_id: sessionId,
          user_name: userName,
        }),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // Add AI response
      const aiMsg: Message = { role: "model", parts: [{ text: data.output }] };
      setMessages((prev) => [...prev, aiMsg]);
      
    } catch (error) {
      console.error("Chat Error:", error);
      alert("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionId) return <div className="p-10">Error: No Session ID found. Go back to Home.</div>;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-50">
      <div className="w-full max-w-3xl flex flex-col h-[90vh]">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-black">Case: {sessionId.split("-")[0]}</h1>
          <a href="/" className="text-sm text-gray-500 hover:underline">New Case</a>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white p-6 rounded-xl shadow-sm overflow-y-auto mb-4 border border-gray-200">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center mt-20">
              Welcome, {userName}.<br />Type "Start" to begin the case.
            </p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 p-3 rounded-lg max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-gray-100 text-gray-800 mr-auto"
                }`}
              >
                <strong className="block text-xs mb-1 opacity-70">
                  {msg.role === "user" ? "You" : "Interviewer"}
                </strong>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.parts[0].text}</p>
              </div>
            ))
          )}
          {isLoading && <p className="text-gray-400 text-sm animate-pulse">Interviewer is typing...</p>}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            className="flex-1 p-4 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your response..."
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}

// Wrap in Suspense because useSearchParams causes hydration issues in Next.js App Router
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatInterface />
    </Suspense>
  );
}