import { describe, it, expect } from 'vitest';
import { calculateEnergyDrain, predictEnergyLevel } from './utils';
import { ItineraryBlock } from './types';

describe('Energy Optimization Logic', () => {
  const mockBlocks: ItineraryBlock[] = [
    {
      id: '1', startTime: '09:00', endTime: '11:00',
      title: 'Hike', description: '', location: '',
      type: 'activity', cost: 0, energyImpact: -20
    },
    {
      id: '2', startTime: '11:00', endTime: '12:00',
      title: 'Rest at Cafe', description: '', location: '',
      type: 'meal', cost: 10, energyImpact: 10
    }
  ];

  it('calculates total energy drain correctly', () => {
    const drain = calculateEnergyDrain(mockBlocks);
    expect(drain).toBe(-10); // -20 + 10
  });

  it('predicts energy level with bounds', () => {
    expect(predictEnergyLevel(80, mockBlocks)).toBe(70);
    
    // Should not exceed 100
    expect(predictEnergyLevel(100, [mockBlocks[1]])).toBe(100);
    
    // Should not drop below 0
    expect(predictEnergyLevel(5, [mockBlocks[0]])).toBe(0);
  });
});
