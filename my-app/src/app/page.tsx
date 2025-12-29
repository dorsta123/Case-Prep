"use client";
import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { 
  ChevronUpDownIcon, 
  CheckIcon, 
  BoltIcon, 
  ShieldCheckIcon, 
  ChartBarIcon 
} from "@heroicons/react/24/outline";

// --- CUSTOM ICON: "THE ISOMETRIC SANDBOX" ---
// Replaces the "Gemini Sparkle" with a structural Cube/Sandbox icon.
// Represents: The "Safe Sandbox" environment and "Structuring" a case.
const LogoIcon = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Outer Glow (Subtle) */}
    <path 
      d="M24 8L40 16V32L24 40L8 32V16L24 8Z" 
      className="fill-cyan-500/5 stroke-cyan-500/20" 
      strokeWidth="1"
    />
    
    {/* Top Face (The "Open" Lid) */}
    <path 
      d="M24 10L36 16L24 22L12 16L24 10Z" 
      className="fill-cyan-400/20 stroke-cyan-400" 
      strokeWidth="2"
      strokeLinejoin="round"
    />
    
    {/* Right Face (Structure) */}
    <path 
      d="M36 16V30L24 36V22L36 16Z" 
      className="fill-blue-600/20 stroke-blue-500" 
      strokeWidth="2"
      strokeLinejoin="round"
    />
    
    {/* Left Face (Logic) */}
    <path 
      d="M12 16V30L24 36V22L12 16Z" 
      className="fill-slate-800/80 stroke-slate-600" 
      strokeWidth="2"
      strokeLinejoin="round"
    />

    {/* Internal Core (The AI Engine) */}
    <path 
      d="M24 22V28" 
      className="stroke-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// --- Configuration Arrays ---
const industries = [
  { name: "🎲 Surprise Me (Random)", value: "Random" },
  { category: "TMT (Tech, Media, Telecom)", options: ["Technology & SaaS", "Media & Entertainment", "Telecommunications"] },
  { category: "Consumer & Retail", options: ["Retail & E-commerce", "CPG (Food, Bev, Household)", "Automotive & Mobility"] },
  { category: "Heavy Industry", options: ["Energy, Oil & Gas", "Mining & Metals", "Airlines & Logistics", "Manufacturing & Industrials"] },
  { category: "Services & Public", options: ["Financial Services & Fintech", "Healthcare & Pharma", "Private Equity", "Public Sector & Education", "Environment and Sustainability"] },
];

const domains = [
  { name: "🎲 Surprise Me (Random)", value: "Random" },
  { category: "Core Strategy", options: ["Profitability", "Market Entry", "Growth Strategy", "Pricing Strategy"] },
  { category: "Transactions", options: ["M&A", "Private Equity Deal"] },
  { category: "Operations & Specialized", options: ["Operations & Supply Chain", "New Product Launch", "Turnaround", "Non-Profit / Social Impact"] },
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("username")
        .eq("username", name)
        .single();

      if (error && error.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from("users")
          .insert([{ username: name }]);
        if (insertError) throw insertError;
      } 

      const sessionId = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const query = new URLSearchParams({
        session_id: sessionId,
        user_name: name,
        industry,
        domain
      }).toString();

      router.push(`/interview?${query}`);
    } catch (err) {
      console.error("Login error:", err);
      alert("Could not assign Guest ID. Try a different name.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#0B0C10] p-4 font-sans text-slate-100 selection:bg-cyan-500/30">
      
      {/* --- Minimalist Background Elements --- */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="absolute bottom-20 right-20 h-80 w-80 rounded-full bg-blue-600/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-6xl overflow-hidden rounded-3xl border border-white/5 bg-black/40 shadow-2xl backdrop-blur-md">
        
        {/* --- MOBILE HEADER (Visible only on Mobile) --- */}
        <div className="block lg:hidden p-8 pb-0 text-center">
            <div className="flex justify-center mb-4">
              <LogoIcon className="w-16 h-16" />
            </div>
            <h1 className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Case Prep AI
            </h1>
            <p className="mt-2 text-sm font-light text-slate-400">
              Democratizing "Day 0" Consulting Prep.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
        
          {/* --- LEFT COLUMN: Value Props --- */}
          <div className="order-2 flex flex-col justify-between bg-gradient-to-b from-slate-900/50 to-black/50 p-6 lg:order-1 lg:col-span-5 lg:p-12">
            
            {/* Desktop-Only Header Title */}
            <div className="hidden lg:block">
              <div className="flex items-center gap-4 mb-2">
                <LogoIcon className="w-12 h-12" />
                <h1 className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent lg:text-5xl">
                  Case Prep AI
                </h1>
              </div>
              <p className="mt-4 text-lg font-light text-slate-400">
                Democratizing "Day 0" Consulting Prep.
              </p>
            </div>

            {/* --- Value Cards --- */}
            <div className="mt-6 lg:mt-10 grid gap-4">
              
              {/* Value 1: The Safe Space */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                  <ShieldCheckIcon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-white">The "Safe" Sandbox</h3>
                <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                  Eliminate the "Fear of Labeling." Fail privately at 2 AM so you can succeed publicly at 9 AM.
                </p>
              </div>

              {/* Value 2: Granular Feedback */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-white">"X-Ray" Audit</h3>
                <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                   Get specific scores on <strong className="text-purple-300">Logic</strong>, <strong className="text-purple-300">Structure</strong>, and <strong className="text-purple-300">Quant</strong>—not just a generic "Good job".
                </p>
              </div>

              {/* Value 3: Real-Time Pressure */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <BoltIcon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-white">Real-Time Pressure</h3>
                <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                  Simulates live interviewer pushback. The AI tracks intellectual milestones, not just time.
                </p>
              </div>

            </div>
          </div>

          {/* --- RIGHT COLUMN: The Form --- */}
          <div className="order-1 flex flex-col justify-center border-l border-white/5 bg-black/20 p-8 lg:order-2 lg:col-span-7 lg:p-20">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-medium text-white">Initialize Session</h2>
              <p className="text-slate-500">Configure your simulation parameters.</p>
            </div>

            <form onSubmit={handleStart} className="space-y-6">
              
              {/* Name Input */}
              <div className="group">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-cyan-400">Candidate Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-white placeholder-slate-600 outline-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                  placeholder="Enter your name..."
                />
              </div>

              {/* Industry Dropdown */}
              <div className="group relative">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-cyan-400">Target Industry</label>
                <Listbox value={industry} onChange={setIndustry}>
                  <div className="relative">
                    <ListboxButton className="relative w-full cursor-pointer rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-left text-white outline-none transition-all hover:bg-slate-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50">
                      <span className="block truncate">{industry}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <ChevronUpDownIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                      </span>
                    </ListboxButton>
                    <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-slate-700 bg-[#0F1115] py-1 text-base shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm custom-scrollbar">
                        {industries.map((item, i) => (
                          <div key={i}>
                            {item.name ? (
                              <ListboxOption value={item.value} className={({ active }) => `relative cursor-pointer select-none py-3 pl-10 pr-4 ${active ? 'bg-cyan-900/30 text-cyan-400' : 'text-slate-300'}`}>
                                {item.name}
                              </ListboxOption>
                            ) : (
                              <>
                                <div className="bg-black/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600">{item.category}</div>
                                {item.options?.map((opt) => (
                                  <ListboxOption key={opt} value={opt} className={({ active }) => `relative cursor-pointer select-none py-3 pl-10 pr-4 ${active ? 'bg-cyan-900/30 text-cyan-400' : 'text-slate-300'}`}>
                                    {({ selected }) => (
                                      <>
                                        <span className={`block truncate ${selected ? 'font-medium text-white' : 'font-normal'}`}>{opt}</span>
                                        {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cyan-400"><CheckIcon className="h-4 w-4" /></span> : null}
                                      </>
                                    )}
                                  </ListboxOption>
                                ))}
                              </>
                            )}
                          </div>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>
              </div>

              {/* Domain Dropdown */}
              <div className="group relative">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors group-focus-within:text-cyan-400">Case Type</label>
                <Listbox value={domain} onChange={setDomain}>
                  <div className="relative">
                    <ListboxButton className="relative w-full cursor-pointer rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-left text-white outline-none transition-all hover:bg-slate-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50">
                      <span className="block truncate">{domain}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <ChevronUpDownIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                      </span>
                    </ListboxButton>
                    <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-slate-700 bg-[#0F1115] py-1 text-base shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm custom-scrollbar">
                        {domains.map((item, i) => (
                           <div key={i}>
                            {item.name ? (
                              <ListboxOption value={item.value} className={({ active }) => `relative cursor-pointer select-none py-3 pl-10 pr-4 ${active ? 'bg-cyan-900/30 text-cyan-400' : 'text-slate-300'}`}>
                                {item.name}
                              </ListboxOption>
                            ) : (
                              <>
                                <div className="bg-black/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600">{item.category}</div>
                                {item.options?.map((opt) => (
                                  <ListboxOption key={opt} value={opt} className={({ active }) => `relative cursor-pointer select-none py-3 pl-10 pr-4 ${active ? 'bg-cyan-900/30 text-cyan-400' : 'text-slate-300'}`}>
                                    {({ selected }) => (
                                      <>
                                        <span className={`block truncate ${selected ? 'font-medium text-white' : 'font-normal'}`}>{opt}</span>
                                        {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cyan-400"><CheckIcon className="h-4 w-4" /></span> : null}
                                      </>
                                    )}
                                  </ListboxOption>
                                ))}
                              </>
                            )}
                          </div>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full overflow-hidden rounded-lg bg-white py-4 text-sm font-bold uppercase tracking-widest text-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                   <span className="flex items-center justify-center gap-2">
                     <svg className="h-5 w-5 animate-spin text-black" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                     </svg>
                     Connecting...
                   </span>
                ) : (
                  "Start Interview"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}