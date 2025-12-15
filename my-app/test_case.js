const API_URL = "http://localhost:3000/api/generate" // Adjust if your route folder is named differently

async function runTest() {
  let history = [];

  // --- Turn 1: Start the Case ---
  console.log("\n🔹 1. User: Start a case...");
  const response1 = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      prompt: "I am ready. Give me a profitability case.",
      history: [] 
    })
  });
  
  const data1 = await response1.json();
  console.log("🔸 AI (Interviewer):", data1.output);

  // Update history manually (This mimics what your Frontend will do)
  history.push({ role: "user", parts: [{ text: "I am ready. Give me a profitability case." }] });
  history.push({ role: "model", parts: [{ text: data1.output }] });

  // --- Turn 2: Reply to the Case ---
  // If the memory works, the AI will understand "revenue" in the context of the specific case above.
  console.log("\n🔹 2. User: I'd like to analyze the revenue streams.");
  const response2 = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      prompt: "How have the revenue streams changed over the last year?",
      history: history // <--- PASSING THE MEMORY
    })
  });

  const data2 = await response2.json();
  console.log("🔸 AI (Interviewer):", data2.output);
}

runTest();