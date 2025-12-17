import { NextResponse } from "next/server";
import { generateText } from "@/lib/gemini"; 
import { createClient } from "@supabase/supabase-js";

// DEBUG: Log to see if keys are loaded
console.log("Checking Keys:", {
  supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  geminiKey: !!process.env.GEMINI_API_KEY
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // 1. Destructure the NEW fields (industry, domain)
    const { prompt, session_id, user_name, industry, domain } = body;

    console.log("1. Received Request:", { session_id, user_name, industry, domain });

    // Validate inputs
    if (!prompt || !session_id) {
      console.error("Missing fields");
      return NextResponse.json({ error: "Missing prompt or session_id" }, { status: 400 });
    }

    // 2. Fetch History
    console.log("2. Fetching from Supabase...");
    let { data: session, error: fetchError } = await supabase
      .from("chat_sessions")
      .select("history")
      .eq("session_id", session_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
       console.error("Supabase Fetch Error:", fetchError);
    }

    let history = session?.history || [];
    console.log("3. History found:", history.length, "messages");

    // --- NEW LOGIC: CONTEXT INJECTION ---
    // We only modify the prompt if:
    // A) It is the start of the chat (history is empty)
    // B) The user actually selected something specific (not "Random")
    let finalPrompt = prompt;

    if (history.length === 0) {
      const selectedIndustry = industry && industry !== "Random" ? industry : null;
      const selectedDomain = domain && domain !== "Random" ? domain : null;

      if (selectedIndustry || selectedDomain) {
        console.log(">> Injecting Custom Context:", selectedIndustry, selectedDomain);
        finalPrompt = `${prompt} 
        [SYSTEM HIDDEN INSTRUCTION: The candidate explicitly requested a '${selectedDomain || "General"}' case in the '${selectedIndustry || "General"}' industry. 
        Ignore your default randomizer. 
        Start a case fitting this description immediately.]`;
      }
    }

    // 3. Generate Text (Send the INJECTED prompt to Gemini)
    console.log("4. Calling Gemini...");
    const aiResponseText = await generateText(history, finalPrompt);
    console.log("5. Gemini Replied");

    // 4. Update DB
    // IMPORTANT: We save the ORIGINAL 'prompt' to the DB, not 'finalPrompt'.
    // This keeps the user's chat bubble clean (hides the system instruction from the UI).
    const updatedHistory = [
      ...history,
      { role: "user", parts: [{ text: prompt }] }, // <--- Clean prompt saved
      { role: "model", parts: [{ text: aiResponseText }] },
    ];

    const { error: saveError } = await supabase.from("chat_sessions").upsert({
      session_id,
      user_name,
      history: updatedHistory,
    });

    if (saveError) {
      console.error("Supabase Save Error:", saveError);
      return NextResponse.json({ error: "Failed to save to DB" }, { status: 500 });
    }

    return NextResponse.json({ output: aiResponseText });

  } catch (error: any) {
    console.error("CRITICAL SERVER ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}