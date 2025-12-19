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
    const { history, session_id, user_name } = await req.json();

    if (!history || !user_name) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    // 1. Setup the High-Strictness Model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: { temperature: 0.2 } // Lower temperature for more consistent JSON
    });

    // src/app/api/evaluate/route.ts

const evaluationPrompt = `
  SYSTEM: You are a Senior McKinsey Partner conducting a rigorous performance audit.
  TASK: Evaluate the candidate's interview performance based on the provided transcript.

  GRADING SCALES (CRITICAL):
  - 0-30: Fail. Lacks structure, fails to ask clarifying questions, or logical errors in math.
  - 31-60: Developing. Shows potential but needs significant coaching on case-specific skills.
  - 61-85: Strong. Demonstrates "consultant-ready" thinking and clear communication.
  - 86-100: Exceptional. Clear, structured, data-driven, and provides a crisp synthesis.

  MANDATORY CONSISTENCY RULES:
  1. The "overall_score" must be the mathematical average of Structure, Logic, Communication, and Quant.
  2. If your feedback is praiseful, the scores MUST be above 70%.
  3. If the candidate failed to provide a final recommendation, the "completion_rate" cannot exceed 80%.

  OUTPUT FORMAT (STRICT JSON ONLY):
  {
    "overall_score": number,
    "completion_rate": number,
    "structure": number,
    "business_logic": number,
    "communication": number,
    "quant_accuracy": number,
    "feedback": "string (Start with 1 sentence identifying the specific peak performance moment, followed by 1 sentence on the biggest area for growth.)"
  }

  TRANSCRIPT:
  ${JSON.stringify(history)}
`;

    // 2. Call Gemini
    const result = await model.generateContent(evaluationPrompt);
    const responseText = result.response.text();

    // 3. Clean the response (Removes ```json or accidental conversational text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI failed to provide a valid JSON structure.");
    }

    const evaluation = JSON.parse(jsonMatch[0]);

    

    // 4. Update Database: Save evaluation and update User Rating
    // We update the session with the scores and increment the user's total rating
    const { error: dbError } = await supabase.from("chat_sessions").update({
      evaluation: evaluation
    }).eq("session_id", session_id);

    if (dbError) console.error("Session Update Error:", dbError);


// Calculate gain: (Score * Completion%) / 10
const weightedScore = (evaluation.overall_score * (evaluation.completion_rate / 100));
const scoreGain = Math.floor(weightedScore / 10);

const { error: userError } = await supabase.rpc('increment_rating', { 
  username_param: user_name, 
  score_gain: scoreGain 
});

    // If the RPC above isn't set up yet, use a standard update:
    if (userError) {
        await supabase
          .from("users")
          .update({ rating: evaluation.overall_score }) // Simple overwrite for now
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