import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY as string;
if (!apiKey) throw new Error("GEMINI_API_KEY is missing in .env.local");

export type ChatMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

const genAI = new GoogleGenerativeAI(apiKey);

const config = {
  // Use the reasoning model you confirmed is available
  model: "gemini-2.5-pro", 
  
  // FIXED: The "Passive Interviewer" Persona
  systemInstruction: `You are an expert MBA Case Interviewer (McKinsey/BCG style). 
  1. Start by presenting a brief, open-ended business case.
  2. Wait for the candidate to lead. Do not list options.
  3. Only provide data (revenues, costs, market trends) if the candidate asks for it. 
  4. If the candidate makes a calculation error, correct them.
  5. If the candidate loses structure, nudge them back.`,

  generationConfig: {
    temperature: 0.6, // Low temp prevents it from inventing fake numbers mid-case
    maxOutputTokens: 2048,
  },
};

const model = genAI.getGenerativeModel(config);

export async function generateText(history: ChatMessage[], prompt: string) {
  try {
    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(prompt);
    return result.response.text();
    
  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw new Error("Failed to generate response from Gemini");
  }
}