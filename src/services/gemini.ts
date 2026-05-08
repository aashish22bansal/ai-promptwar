/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TripPreferences, TripPlan, TravelPace } from "../types";

export async function generateTripPlan(prefs: TripPreferences): Promise<TripPlan> {
  try {
    const response = await fetch('/api/generate-trip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prefs)
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "GENERATION_FAILED");
    }

    return await response.json();
  } catch (error: any) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function suggestReplanning(
  currentPlan: TripPlan, 
  currentEnergy: number, 
  disruption: string
): Promise<Partial<TripPlan>> {
  try {
    const response = await fetch('/api/replan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPlan, currentEnergy, disruption })
    });

    if (!response.ok) {
      throw new Error("REPLAN_FAILED");
    }

    return await response.json();
  } catch (error) {
    console.error("API Error (Replanning):", error);
    return {};
  }
}
