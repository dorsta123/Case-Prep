"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";

const industries = [
  { name: "🎲 Surprise Me (Random)", value: "Random" },
  { category: "TMT (Tech, Media, Telecom)", options: ["Technology & SaaS", "Media & Entertainment", "Telecommunications"] },
  { category: "Consumer & Retail", options: ["Retail & E-commerce", "CPG (Food, Bev, Household)", "Automotive & Mobility"] },
  { category: "Heavy Industry", options: ["Energy, Oil & Gas", "Mining & Metals", "Airlines & Logistics", "Manufacturing & Industrials"] },
  { category: "Services & Public", options: ["Financial Services & Fintech", "Healthcare & Pharma", "Private Equity", "Public Sector & Education"] },
];

const domains = [
  { name: "🎲 Surprise Me (Random)", value: "Random" },
  { category: "Core Strategy", options: ["Profitability", "Market Entry", "Growth Strategy", "Pricing Strategy"] },
  { category: "Transactions", options: ["M&A", "Private Equity Deal"] },
  { category: "Operations & Specialized", options: ["Operations & Supply Chain", "New Product Launch", "Turnaround", "Non-Profit / Social Impact"] },
];

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
    const query = new URLSearchParams({ session_id: sessionId, user_name: name, industry, domain }).toString();
    router.push(`/interview?${query}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-bold text-center mb-2 text-black">Case Prep AI</h1>
        <p className="text-gray-500 text-center mb-8">Customize your interview session</p>

        <form onSubmit={handleStart} className="space-y-6">
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

          {/* Industry Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Industry</label>
            <Listbox value={industry} onChange={setIndustry}>
              <ListboxButton className="relative w-full p-3 border border-gray-300 rounded-lg text-left bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500">
                <span className="block truncate">{industry}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </ListboxButton>
              <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {industries.map((item, i) => (
                    <div key={i}>
                      {item.name ? (
                        <ListboxOption value={item.value} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}>
                          {item.name}
                        </ListboxOption>
                      ) : (
                        <>
                          <div className="bg-gray-50 px-3 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider">{item.category}</div>
                          {item.options?.map((opt) => (
                            <ListboxOption key={opt} value={opt} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'}`}>
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{opt}</span>
                                  {selected ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600"><CheckIcon className="h-5 w-5" /></span> : null}
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
            </Listbox>
          </div>

          {/* Case Type Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
            <Listbox value={domain} onChange={setDomain}>
              <ListboxButton className="relative w-full p-3 border border-gray-300 rounded-lg text-left bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500">
                <span className="block truncate">{domain}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </ListboxButton>
              <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {domains.map((item, i) => (
                    <div key={i}>
                      {item.name ? (
                        <ListboxOption value={item.value} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}>
                          {item.name}
                        </ListboxOption>
                      ) : (
                        <>
                          <div className="bg-gray-50 px-3 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider">{item.category}</div>
                          {item.options?.map((opt) => (
                            <ListboxOption key={opt} value={opt} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'}`}>
                              {opt}
                            </ListboxOption>
                          ))}
                        </>
                      )}
                    </div>
                  ))}
                </ListboxOptions>
              </Transition>
            </Listbox>
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