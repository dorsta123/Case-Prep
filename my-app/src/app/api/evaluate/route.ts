import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Initialize Gemini and Supabase
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Extract data from request
    const { history, session_id, user_name, lp_to_add } = await req.json();

    if (!history || !user_name) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    // 2. Configure Gemini with JSON Mode
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: { 
        temperature: 0.1,
        responseMimeType: "application/json" 
      } 
    });

    const evaluationPrompt = `
      SYSTEM: You are a Senior McKinsey Partner.
      TASK: Evaluate the candidate's interview performance based on the transcript.

      GRADING SCALES (CRITICAL):
      - 0-30: Fail. 
      - 31-60: Developing.
      - 61-85: Strong.
      - 86-100: Exceptional.

      CONSISTENCY RULES:
      1. Feedback text MUST align with the numerical score (Positive feedback = 70+ score).
      2. If no recommendation was made, completion_rate cannot exceed 80%.

      OUTPUT FORMAT (STRICT JSON):
      {
        "overall_score": number,
        "completion_rate": number,
        "structure": number,
        "business_logic": number,
        "communication": number,
        "quant_accuracy": number,
        "feedback": "string (1 sentence peak performance, 1 sentence growth area.)"
      }

      TRANSCRIPT: ${JSON.stringify(history)}
    `;

    // 3. Generate Evaluation and Clean JSON
    const result = await model.generateContent(evaluationPrompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("AI failed to provide valid JSON.");
    const evaluation = JSON.parse(jsonMatch[0]);

    // 4. Update the Specific Case Session
    await supabase
      .from("chat_sessions")
      .update({ evaluation: evaluation })
      .eq("session_id", session_id);

    // 5. Atomic Update: Add LP to the Global Ranking
    // We call the SQL function 'increment_lp' to handle Old Rating + LP Gained
    const { error: rpcError } = await supabase.rpc('increment_lp', { 
      user_name_input: user_name, 
      lp_to_add: lp_to_add || 1 
    });

    // 6. Manual Fallback if RPC fails
    if (rpcError) {
      console.warn("RPC failed, performing manual increment fallback:", rpcError.message);
      
      const { data: userData } = await supabase
        .from("users")
        .select("rating")
        .eq("username", user_name)
        .single();

      const currentRating = userData?.rating ?? 1200; // Professional baseline
      const newRating = currentRating + (lp_to_add || 1);

      await supabase
        .from("users")
        .update({ rating: newRating })
        .eq("username", user_name);
    }

    return NextResponse.json(evaluation);

  } catch (error: any) {
    console.error("Evaluation Route Error:", error);
    return NextResponse.json(
      { error: "Failed to process evaluation", details: error.message }, 
      { status: 500 }
    );
  }
}