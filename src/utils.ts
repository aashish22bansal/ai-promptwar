import { ItineraryBlock } from './types';

export function calculateEnergyDrain(blocks: ItineraryBlock[]): number {
  return blocks.reduce((acc, b) => acc + (b.energyImpact || 0), 0);
}

export function predictEnergyLevel(currentEnergy: number, blocks: ItineraryBlock[]): number {
  const drain = calculateEnergyDrain(blocks);
  const newLevel = currentEnergy + drain;
  // Ensure it stays between 0 and 100
  return Math.max(0, Math.min(100, newLevel));
}
