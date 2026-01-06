/**
 * Maintenance Workflow Management
 * Handles maintenance cycles for mixers and machines
 */

import { getDb } from './db';
import { eq } from 'drizzle-orm';
import { mixers, maintenanceHistory, bunkers, stockMovements } from '../drizzle/schema';

export type MaintenanceStatus = 'operational' | 'needs_cleaning' | 'needs_repair' | 'replaced';

export async function recordMaintenance(
  mixerId: number,
  maintenanceType: 'cleaning' | 'repair' | 'replacement',
  employeeId: number,
  notes?: string
) {
  // Get mixer info
  const database = await getDb();
  if (!database) throw new Error('Database connection failed');
  
  const mixerResult = await database.select().from(mixers).where(eq(mixers.id, mixerId)).limit(1);

  if (!mixerResult || mixerResult.length === 0) {
    throw new Error('Mixer not found');
  }

  const mixer = mixerResult[0];

  // Determine new status
  let newStatus: MaintenanceStatus = 'operational';
  if (maintenanceType === 'cleaning') {
    newStatus = 'needs_cleaning';
  } else if (maintenanceType === 'repair') {
    newStatus = 'needs_repair';
  } else if (maintenanceType === 'replacement') {
    newStatus = 'replaced';
  }

  // Update mixer
  await database.update(mixers)
    .set({
      status: newStatus,
      lastMaintenanceDate: new Date(),
      lastMaintenanceBy: employeeId,
      notes: notes || null,
    })
    .where(eq(mixers.id, mixerId));

  // Log maintenance action
  await database.insert(maintenanceHistory).values({
    machineId: mixer.machineId,
    employeeId,
    maintenanceType: maintenanceType as any,
    notes: notes || null,
  });

  return { success: true, newStatus };
}

export async function resetMixerCycles(mixerId: number, employeeId: number) {
  // Get mixer
  const database = await getDb();
  if (!database) throw new Error('Database connection failed');
  
  const mixerResult = await database.select().from(mixers).where(eq(mixers.id, mixerId)).limit(1);

  if (!mixerResult || mixerResult.length === 0) {
    throw new Error('Mixer not found');
  }
  
  const mixer = mixerResult[0];

  // Reset cycles
  await database.update(mixers)
    .set({
      totalCycles: 0,
      status: 'operational',
      lastMaintenanceDate: new Date(),
      lastMaintenanceBy: employeeId,
    })
    .where(eq(mixers.id, mixerId));

  // Log reset
  await database.insert(maintenanceHistory).values({
    machineId: mixer.machineId,
    employeeId,
    maintenanceType: 'inspection',
    notes: 'Cycles reset',
  });

  return { success: true };
}

export async function checkMaintenanceAlerts() {
  // Get mixers that need maintenance
  const database = await getDb();
  if (!database) return [];
  
  const mixersList = await database.select().from(mixers);

  const alerts = [];
  for (const mixer of mixersList) {
    const percentUsed = (mixer.totalCycles / (mixer.maxCyclesBeforeMaintenance || 1)) * 100;
    if (percentUsed >= 80 && mixer.status === 'operational') {
      alerts.push({
        mixerId: mixer.id,
        machineId: mixer.machineId,
        mixerType: mixer.mixerType,
        percentUsed,
        cyclesUsed: mixer.totalCycles,
        maxCycles: mixer.maxCyclesBeforeMaintenance,
        severity: percentUsed >= 95 ? 'critical' : percentUsed >= 80 ? 'warning' : 'info',
      });
    }
  }

  return alerts;
}

export async function getMaintenanceHistory(machineId: number, limit = 50) {
  const database = await getDb();
  if (!database) return [];
  
  return await database.select()
    .from(maintenanceHistory)
    .where(eq(maintenanceHistory.machineId, machineId))
    .limit(limit);
}

export async function recordBunkerRefill(
  bunkerId: number,
  refillAmount: number,
  employeeId: number,
  notes?: string
) {
  // Get bunker
  const database = await getDb();
  if (!database) throw new Error('Database connection failed');
  
  const bunkerResult = await database.select().from(bunkers).where(eq(bunkers.id, bunkerId)).limit(1);

  if (!bunkerResult || bunkerResult.length === 0) {
    throw new Error('Bunker not found');
  }

  const bunker = bunkerResult[0];
  const newLevel = Math.min((bunker.currentLevel || 0) + refillAmount, bunker.capacity);

  // Update bunker
  await database.update(bunkers)
    .set({
      currentLevel: newLevel,
      lastRefillDate: new Date(),
      lastRefillBy: employeeId,
    })
    .where(eq(bunkers.id, bunkerId));

  // Log refill
  await database.insert(stockMovements).values({
    itemType: 'ingredient',
    itemId: bunker.ingredientId || 0,
    movementType: 'in',
    quantity: refillAmount,
    machineId: bunker.machineId,
    employeeId,
    notes: notes || null,
  });

  return {
    success: true,
    previousLevel: bunker.currentLevel || 0,
    newLevel,
    refillAmount,
  };
}

export async function checkBunkerAlerts() {
  // Get bunkers with low levels
  const database = await getDb();
  if (!database) return [];
  
  const bunkersList = await database.select().from(bunkers);

  const alerts = [];
  for (const bunker of bunkersList) {
    const percentFull = ((bunker.currentLevel || 0) / bunker.capacity) * 100;
    if (percentFull <= (bunker.lowLevelThreshold || 30)) {
      alerts.push({
        bunkerId: bunker.id,
        machineId: bunker.machineId,
        currentLevel: bunker.currentLevel || 0,
        capacity: bunker.capacity,
        percentFull,
        severity: percentFull <= 10 ? 'critical' : percentFull <= 30 ? 'warning' : 'info',
      });
    }
  }

  return alerts;
}
