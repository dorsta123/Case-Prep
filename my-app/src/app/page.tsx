"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Random");
  const [domain, setDomain] = useState("Random");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);

    const sessionId = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    // Pass the selected Industry and Domain to the URL
    const query = new URLSearchParams({
      session_id: sessionId,
      user_name: name,
      industry: industry,
      domain: domain
    }).toString();

    router.push(`/interview?${query}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-bold text-center mb-2 text-black">Case Prep AI</h1>
        <p className="text-gray-500 text-center mb-8">Customize your interview session</p>

        <form onSubmit={handleStart} className="space-y-4">
          
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Sahil"
            />
          </div>

          {/* Expanded Industry List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Random">🎲 Surprise Me (Random)</option>
              <optgroup label="TMT (Tech, Media, Telecom)">
                <option value="Technology & SaaS">Technology & SaaS</option>
                <option value="Media & Entertainment">Media & Entertainment</option>
                <option value="Telecommunications">Telecommunications</option>
              </optgroup>
              <optgroup label="Consumer & Retail">
                <option value="Retail & E-commerce">Retail & E-commerce</option>
                <option value="CPG (Consumer Packaged Goods)">CPG (Food, Bev, Household)</option>
                <option value="Automotive & Mobility">Automotive & Mobility</option>
              </optgroup>
              <optgroup label="Heavy Industry">
                <option value="Energy, Oil & Gas">Energy, Oil & Gas</option>
                <option value="Mining & Metals">Mining & Metals</option>
                <option value="Airlines & Logistics">Airlines & Logistics</option>
                <option value="Manufacturing">Manufacturing & Industrials</option>
              </optgroup>
              <optgroup label="Services & Public">
                <option value="Financial Services & Fintech">Financial Services & Fintech</option>
                <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                <option value="Private Equity">Private Equity</option>
                <option value="Public Sector & Education">Public Sector & Education</option>
              </optgroup>
            </select>
          </div>

          {/* Expanded Domain List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Random">🎲 Surprise Me (Random)</option>
              <optgroup label="Core Strategy">
                <option value="Profitability">Profitability (Declining Profits)</option>
                <option value="Market Entry">Market Entry (New Geo/Product)</option>
                <option value="Growth Strategy">Growth Strategy (Revenue Uplift)</option>
                <option value="Pricing Strategy">Pricing Strategy</option>
              </optgroup>
              <optgroup label="Transactions">
                <option value="M&A">M&A (Acquisition / Due Diligence)</option>
                <option value="Private Equity Deal">Private Equity LBO</option>
              </optgroup>
              <optgroup label="Operations & Specialized">
                <option value="Operations & Supply Chain">Operations & Supply Chain</option>
                <option value="New Product Launch">New Product Launch</option>
                <option value="Turnaround">Turnaround (Failing Business)</option>
                <option value="Non-Profit / Social Impact">Non-Profit / Social Impact</option>
              </optgroup>
            </select>
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