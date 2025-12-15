import { NextResponse } from "next/server";
import { generateText } from "@/lib/gemini"; // Check this path!
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

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
    const { prompt, session_id, user_name } = body;

    console.log("1. Received Request:", { session_id, user_name, prompt });

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

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Not Found" which is okay
       console.error("Supabase Fetch Error:", fetchError);
    }

    let history = session?.history || [];
    console.log("3. History found:", history.length, "messages");

    // 3. Generate Text
    console.log("4. Calling Gemini...");
    const aiResponseText = await generateText(history, prompt);
    console.log("5. Gemini Replied");

    // 4. Update DB
    const updatedHistory = [
      ...history,
      { role: "user", parts: [{ text: prompt }] },
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
    // Return a JSON error so the frontend doesn't crash with "Unexpected token <"
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}