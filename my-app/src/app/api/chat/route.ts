import { NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    // 1. Parse the JSON body
    // We now expect 'history' (the array) AND 'prompt' (the new message)
    const body = await req.json();
    const { history, prompt } = body;

    // 2. Basic validation
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 3. Call the service layer with BOTH arguments
    // We default history to [] in case it's the very first message
    const output = await generateText(history || [], prompt);

    return NextResponse.json({ output });
    
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}