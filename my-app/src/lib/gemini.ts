import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Initialize Client
const apiKey = process.env.GEMINI_API_KEY as string;
if (!apiKey) throw new Error("GEMINI_API_KEY is missing in .env.local");

const genAI = new GoogleGenerativeAI(apiKey);

// 2. Modular Configuration (Easy to tweak later)
const config = {
  model: "gemini-2.5-pro", // Switch to 'gemini-pro' if needed
  generationConfig: {
    temperature: 0.9,
    maxOutputTokens: 2048,
  },
};

const model = genAI.getGenerativeModel(config);

// 3. Reusable Helper Function
export async function generateText(prompt: string) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw new Error("Failed to generate response from Gemini");
  }
}