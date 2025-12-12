import { NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    // Basic validation
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Call the service layer
    const output = await generateText(prompt);

    return NextResponse.json({ output });
    
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}