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
                imageSearchTerm: { type: Type.STRING },
                latitude: { type: Type.NUMBER },
                longitude: { type: Type.NUMBER },
              },
              required: ["title", "description", "location", "startTime", "endTime", "type", "cost", "energyImpact", "imageSearchTerm", "latitude", "longitude"],
            },
          },
        },
        required: ["day", "blocks"],
      },
    },
    accommodation: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        location: { type: Type.STRING },
        costPerNight: { type: Type.NUMBER },
        rating: { type: Type.NUMBER },
        latitude: { type: Type.NUMBER },
        longitude: { type: Type.NUMBER },
      },
      required: ["name", "description", "location", "costPerNight", "rating", "latitude", "longitude"],
    },
    totalEstimatedCost: { type: Type.NUMBER },
  },
  required: ["days", "accommodation", "totalEstimatedCost"],
};

// API Endpoints
app.post('/api/generate-trip', async (req, res) => {
  const prefs = req.body;
  if (!prefs || !prefs.destination) {
    return res.status(400).json({ error: 'Invalid preferences' });
  }

  const prompt = `
    Generate a detailed travel itinerary for ${prefs.destination}.
    Number of Days: ${prefs.numDays}.
    Budget: ${prefs.budget} ${prefs.currency}.
    Travel Style: ${prefs.travelStyle}.
    Interests: ${prefs.interests?.join(", ") || 'General'}.
    Pace: ${prefs.pace}.
    Weather Preference: ${prefs.weatherPreference}.
    Food Preference: ${prefs.foodPreference}.
    Transport Preference: ${prefs.transportPreference}.
    Constraints: ${prefs.constraints?.join(", ") || 'None'}.

    For each activity block:
    - Include a descriptive title and detailed description.
    - Provide a highly specific, 1-2 word Wikipedia search term for an image representing this place in "imageSearchTerm" (e.g. "Eiffel Tower", "Ramen").
    - Provide an estimated cost in ${prefs.currency}.
    - Assign an "energyImpact" score from -20 (very exhausting) to +10 (restorative).
    - Ensure a logical route order to minimize travel time.
    - Include meal times and transit blocks.
    - Respect the budget constraints.
    - Create flexible modular blocks.
    - Generate accurate decimal GPS coordinates (latitude, longitude) for EVERY block to be plotted on a map.

    Also, recommend a specific Hotel/Accommodation that perfectly fits the travel style and budget, and include its precise latitude and longitude.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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
      accommodation: data.accommodation,
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
      model: "gemini-2.0-flash",
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
