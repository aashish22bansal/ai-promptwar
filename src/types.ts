/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TravelPace {
  RELAXED = 'relaxed',
  MODERATE = 'moderate',
  INTENSE = 'intense',
}

export interface TripPreferences {
  destination: string;
  numDays: number;
  budget: number;
  currency: string;
  travelStyle: string;
  interests: string[];
  pace: TravelPace;
  constraints: string[];
  weatherPreference: string;
  foodPreference: string;
  transportPreference: string;
}

export interface ItineraryBlock {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  type: 'activity' | 'meal' | 'transit' | 'rest';
  cost: number;
  energyImpact: number; // -10 to +10
  isOptional?: boolean;
  imageSearchTerm?: string;
  latitude: number;
  longitude: number;
}

export interface Accommodation {
  name: string;
  description: string;
  location: string;
  costPerNight: number;
  rating: number;
  latitude: number;
  longitude: number;
}

export interface DailyPlan {
  day: number;
  date: string;
  blocks: ItineraryBlock[];
}

export interface TripPlan {
  id: string;
  preferences: TripPreferences;
  days: DailyPlan[];
  accommodation: Accommodation;
  totalEstimatedCost: number;
  createdAt: string;
}

export interface UserState {
  currentTripId: string | null;
  trips: TripPlan[];
  userEnergy: number; // 0 to 100
}
