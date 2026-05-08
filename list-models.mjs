import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.list();
    for await (const model of response) {
      if (model.name.includes("flash") || model.name.includes("gemini")) {
        console.log(model.name);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
listModels();
