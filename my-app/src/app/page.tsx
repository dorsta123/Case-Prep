"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);

    // 1. Generate a simple unique Session ID (e.g., "sahil-170123999")
    const sessionId = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    // 2. Redirect to the Chat Room with this ID
    // We pass the name too so the backend can save it later
    router.push(`/interview?session_id=${sessionId}&user_name=${encodeURIComponent(name)}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-bold text-center mb-2 text-black">Case Prep AI</h1>
        <p className="text-gray-500 text-center mb-8">Enter your name to start a new case.</p>

        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
              placeholder="e.g. Sahil"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? "Starting..." : "Start Interview"}
          </button>
        </form>
      </div>
    </main>
  );
}