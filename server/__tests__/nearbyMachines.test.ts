import { describe, it, expect } from 'vitest';
import { getNearbyMachines, getAllMachines } from '../db';

describe('Nearby Machines API', () => {
  // Test coordinates for Tashkent
  const TASHKENT_LAT = 41.2995;
  const TASHKENT_LNG = 69.2401;

  it('should return machines sorted by distance', async () => {
    const machines = await getNearbyMachines(TASHKENT_LAT, TASHKENT_LNG, 10, 100);
    expect(Array.isArray(machines)).toBe(true);
    
    // Check that machines are sorted by distance
    for (let i = 1; i < machines.length; i++) {
      expect(machines[i].distance).toBeGreaterThanOrEqual(machines[i - 1].distance);
    }
  });

  it('should include distance and walkTime fields', async () => {
    const machines = await getNearbyMachines(TASHKENT_LAT, TASHKENT_LNG, 10, 100);
    
    if (machines.length > 0) {
      const machine = machines[0];
      expect(machine).toHaveProperty('distance');
      expect(machine).toHaveProperty('walkTime');
      expect(typeof machine.distance).toBe('number');
      expect(typeof machine.walkTime).toBe('number');
      expect(machine.distance).toBeGreaterThanOrEqual(0);
      expect(machine.walkTime).toBeGreaterThanOrEqual(0);
    }
  });

  it('should respect limit parameter', async () => {
    const limit = 3;
    const machines = await getNearbyMachines(TASHKENT_LAT, TASHKENT_LNG, limit, 100);
    expect(machines.length).toBeLessThanOrEqual(limit);
  });

  it('should filter by max distance', async () => {
    const maxDistanceKm = 10;
    const machines = await getNearbyMachines(TASHKENT_LAT, TASHKENT_LNG, 100, maxDistanceKm);
    
    for (const machine of machines) {
      expect(machine.distance).toBeLessThanOrEqual(maxDistanceKm);
    }
  });

  it('should calculate reasonable walk times', async () => {
    const machines = await getNearbyMachines(TASHKENT_LAT, TASHKENT_LNG, 10, 100);
    
    for (const machine of machines) {
      // Walk time should be roughly distance / 5 km/h * 60 minutes
      const expectedWalkTime = Math.round(machine.distance / 5 * 60);
      expect(machine.walkTime).toBe(expectedWalkTime);
    }
  });

  it('should return machines with all required fields', async () => {
    const machines = await getNearbyMachines(TASHKENT_LAT, TASHKENT_LNG, 5, 100);
    
    for (const machine of machines) {
      expect(machine).toHaveProperty('id');
      expect(machine).toHaveProperty('machineCode');
      expect(machine).toHaveProperty('name');
      expect(machine).toHaveProperty('status');
      expect(machine).toHaveProperty('distance');
      expect(machine).toHaveProperty('walkTime');
    }
  });

  it('should handle edge case with zero limit', async () => {
    // This should be handled by the API validation (min: 1)
    // But the function itself should handle it gracefully
    const machines = await getNearbyMachines(TASHKENT_LAT, TASHKENT_LNG, 0, 100);
    expect(machines.length).toBe(0);
  });
});
