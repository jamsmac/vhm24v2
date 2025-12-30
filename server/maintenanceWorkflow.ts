/**
 * Maintenance Workflow Management
 * Handles maintenance cycles for mixers and machines
 */

import { db } from './_core/db';

export type MaintenanceStatus = 'operational' | 'needs_cleaning' | 'needs_repair' | 'replaced';

export async function recordMaintenance(
  mixerId: number,
  maintenanceType: 'cleaning' | 'repair' | 'replacement',
  employeeId: number,
  notes?: string
) {
  // Get mixer info
  const mixerResult = await db.execute(
    `SELECT * FROM mixers WHERE id = ?`,
    [mixerId]
  );

  if (!mixerResult || mixerResult.length === 0) {
    throw new Error('Mixer not found');
  }

  const mixer = mixerResult[0] as any;

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
  await db.execute(
    `UPDATE mixers SET 
      status = ?, 
      lastMaintenanceDate = NOW(), 
      lastMaintenanceBy = ?,
      notes = ?,
      updatedAt = NOW()
     WHERE id = ?`,
    [newStatus, employeeId, notes || null, mixerId]
  );

  // Log maintenance action
  await db.execute(
    `INSERT INTO maintenance_logs (mixerId, maintenanceType, performedBy, notes, createdAt)
     VALUES (?, ?, ?, ?, NOW())`,
    [mixerId, maintenanceType, employeeId, notes || null]
  );

  return { success: true, newStatus };
}

export async function resetMixerCycles(mixerId: number, employeeId: number) {
  // Get mixer
  const mixerResult = await db.execute(
    `SELECT * FROM mixers WHERE id = ?`,
    [mixerId]
  );

  if (!mixerResult || mixerResult.length === 0) {
    throw new Error('Mixer not found');
  }

  // Reset cycles
  await db.execute(
    `UPDATE mixers SET 
      totalCycles = 0,
      status = 'operational',
      lastMaintenanceDate = NOW(),
      lastMaintenanceBy = ?,
      updatedAt = NOW()
     WHERE id = ?`,
    [employeeId, mixerId]
  );

  // Log reset
  await db.execute(
    `INSERT INTO maintenance_logs (mixerId, maintenanceType, performedBy, notes, createdAt)
     VALUES (?, 'reset', ?, 'Cycles reset', NOW())`,
    [mixerId, employeeId]
  );

  return { success: true };
}

export async function checkMaintenanceAlerts() {
  // Get mixers that need maintenance
  const mixers = await db.execute(
    `SELECT * FROM mixers 
     WHERE totalCycles >= (maxCyclesBeforeMaintenance * 0.8)
     AND status = 'operational'`
  );

  const alerts = [];
  for (const mixer of mixers as any[]) {
    const percentUsed = (mixer.totalCycles / mixer.maxCyclesBeforeMaintenance) * 100;
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

  return alerts;
}

export async function getMaintenanceHistory(mixerId: number, limit = 50) {
  return await db.execute(
    `SELECT * FROM maintenance_logs 
     WHERE mixerId = ? 
     ORDER BY createdAt DESC 
     LIMIT ?`,
    [mixerId, limit]
  );
}

export async function recordBunkerRefill(
  bunkerId: number,
  refillAmount: number,
  employeeId: number,
  notes?: string
) {
  // Get bunker
  const bunkerResult = await db.execute(
    `SELECT * FROM bunkers WHERE id = ?`,
    [bunkerId]
  );

  if (!bunkerResult || bunkerResult.length === 0) {
    throw new Error('Bunker not found');
  }

  const bunker = bunkerResult[0] as any;
  const newLevel = Math.min(bunker.currentLevel + refillAmount, bunker.capacity);

  // Update bunker
  await db.execute(
    `UPDATE bunkers SET 
      currentLevel = ?,
      lastRefillDate = NOW(),
      lastRefillBy = ?,
      updatedAt = NOW()
     WHERE id = ?`,
    [newLevel, employeeId, bunkerId]
  );

  // Log refill
  await db.execute(
    `INSERT INTO stock_movements (bunkerOrMachineId, movementType, quantity, performedBy, notes, createdAt)
     VALUES (?, 'refill', ?, ?, ?, NOW())`,
    [bunkerId, refillAmount, employeeId, notes || null]
  );

  return {
    success: true,
    previousLevel: bunker.currentLevel,
    newLevel,
    refillAmount,
  };
}

export async function checkBunkerAlerts() {
  // Get bunkers with low levels
  const bunkers = await db.execute(
    `SELECT b.*, i.name as ingredientName, m.name as machineName
     FROM bunkers b
     LEFT JOIN ingredients i ON b.ingredientId = i.id
     LEFT JOIN machines m ON b.machineId = m.id
     WHERE (b.currentLevel / b.capacity * 100) <= b.lowLevelThreshold`
  );

  const alerts = [];
  for (const bunker of bunkers as any[]) {
    const percentFull = (bunker.currentLevel / bunker.capacity) * 100;
    alerts.push({
      bunkerId: bunker.id,
      machineId: bunker.machineId,
      machineName: bunker.machineName,
      ingredientName: bunker.ingredientName,
      currentLevel: bunker.currentLevel,
      capacity: bunker.capacity,
      percentFull,
      severity: percentFull <= 10 ? 'critical' : percentFull <= 30 ? 'warning' : 'info',
    });
  }

  return alerts;
}
