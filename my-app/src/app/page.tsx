"use client";
import { useState } from "react";

// Define the shape of a message for the UI
type Message = {
  role: "user" | "model";
  text: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to send data to your API
  const sendMessage = async () => {
    if (!input.trim()) return;

    // 1. Add User Message to UI immediately
    const newHistory = [...messages, { role: "user", text: input }];
    setMessages(newHistory as Message[]); // Typescript casting
    setInput("");
    setIsLoading(true);

    try {
      // 2. Transform UI messages back to API format (parts: [{text:...}])
      const apiHistory = newHistory.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      // 3. Call your working API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: apiHistory.slice(0, -1), // Send past history
          prompt: input, // Send current input
        }),
      });

      const data = await response.json();

      // 4. Add AI Response to UI
      setMessages([
        ...newHistory,
        { role: "model", text: data.output },
      ] as Message[]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50">
      <div className="z-10 w-full max-w-2xl items-center justify-between font-mono text-sm">
        <h1 className="text-2xl font-bold mb-4 text-center text-black">MBA Case Partner</h1>
        
        {/* Chat Window */}
        <div className="bg-white p-6 rounded-lg shadow-md h-[600px] overflow-y-auto mb-4 border border-gray-200">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center mt-20">
              Type "Start a case" to begin your interview.
            </p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 p-3 rounded-lg max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white ml-auto" // User Style
                    : "bg-gray-100 text-gray-800 mr-auto" // AI Style
                }`}
              >
                <strong>{msg.role === "user" ? "You" : "Interviewer"}:</strong>
                <p className="whitespace-pre-wrap mt-1">{msg.text}</p>
              </div>
            ))
          )}
          {isLoading && <p className="text-gray-500 italic">Interviewer is thinking...</p>}
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <input
            className="flex-1 p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your response..."
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}