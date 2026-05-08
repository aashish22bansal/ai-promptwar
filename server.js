import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"]
    }
  }
}));
app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TRIP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER },
          date: { type: Type.STRING },
          blocks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                location: { type: Type.STRING },
                startTime: { type: Type.STRING },
                endTime: { type: Type.STRING },
                type: { type: Type.STRING },
                cost: { type: Type.NUMBER },
                energyImpact: { type: Type.NUMBER },
                isOptional: { type: Type.BOOLEAN },
              },
              required: ["title", "description", "location", "startTime", "endTime", "type", "cost", "energyImpact"],
            },
          },
        },
        required: ["day", "date", "blocks"],
      },
    },
    totalEstimatedCost: { type: Type.NUMBER },
  },
  required: ["days", "totalEstimatedCost"],
};

// API Endpoints
app.post('/api/generate-trip', async (req, res) => {
  const prefs = req.body;
  if (!prefs || !prefs.destination) {
    return res.status(400).json({ error: 'Invalid preferences' });
  }

  const prompt = `
    Generate a detailed travel itinerary for ${prefs.destination}.
    Dates: ${prefs.startDate} to ${prefs.endDate}.
    Budget: ${prefs.budget} ${prefs.currency}.
    Travel Style: ${prefs.interests?.join(", ") || 'General'}.
    Pace: ${prefs.pace}.
    Constraints: ${prefs.constraints?.join(", ") || 'None'}.

    For each activity block:
    - Include a descriptive title and detailed description.
    - Provide an estimated cost in ${prefs.currency}.
    - Assign an "energyImpact" score from -20 (very exhausting) to +10 (restorative).
    - Ensure a logical route order to minimize travel time.
    - Include meal times and transit blocks.
    - Respect the budget constraints.
    - Create flexible modular blocks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: TRIP_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: "EMPTY_RESPONSE" });
    }

    const data = JSON.parse(text);
    
    res.json({
      id: Math.random().toString(36).substr(2, 9),
      preferences: prefs,
      days: data.days,
      totalEstimatedCost: data.totalEstimatedCost,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "GENERATION_FAILED" });
  }
});

app.post('/api/replan', async (req, res) => {
  const { currentPlan, currentEnergy, disruption } = req.body;
  if (!currentPlan || !disruption) {
    return res.status(400).json({ error: 'Invalid replanning request' });
  }

  const prompt = `
    The user is currently on a trip to ${currentPlan.preferences.destination}.
    Current user energy level: ${currentEnergy}/100.
    A disruption has occurred: "${disruption}".
    
    Review the current itinerary and suggest an alternative for the next 4-8 hours.
    Focus on minimizing decision fatigue and adapting to the current situation (energy/disruption).
    Return only the updated blocks for the current day.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: TRIP_SCHEMA,
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.error("Gemini API Error (Replanning):", error);
    res.status(500).json({ error: "REPLAN_FAILED" });
  }
});

// Serve static frontend in production
app.use(express.static(path.join(__dirname, 'dist')));

// Wildcard route to serve index.html for React Router / SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
