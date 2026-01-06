/**
 * Inventory Check Workflow Management
 * Handles state transitions and validations for inventory checks
 */

import { getDb } from './db';
import { eq } from 'drizzle-orm';
import { inventoryChecks, inventoryCheckItems } from '../drizzle/schema';

export type InventoryCheckStatus = 'draft' | 'in_progress' | 'completed' | 'approved';

interface WorkflowTransition {
  from: InventoryCheckStatus;
  to: InventoryCheckStatus;
  requiredFields?: string[];
  requiresApproval?: boolean;
}

const validTransitions: WorkflowTransition[] = [
  { from: 'draft', to: 'in_progress', requiredFields: ['conductedBy'] },
  { from: 'in_progress', to: 'completed', requiredFields: ['completedAt'] },
  { from: 'completed', to: 'approved', requiredFields: ['approvedBy'], requiresApproval: true },
  { from: 'draft', to: 'draft' }, // Allow draft to draft (editing)
  { from: 'completed', to: 'in_progress' }, // Allow rollback to in_progress
];

export async function validateTransition(
  checkId: number,
  toStatus: InventoryCheckStatus,
  userId: number,
  isAdmin: boolean
): Promise<{ valid: boolean; error?: string }> {
  // Get current check
  const database = await getDb();
  if (!database) {
    return { valid: false, error: 'Database connection failed' };
  }
  
  const checks = await database.select().from(inventoryChecks).where(eq(inventoryChecks.id, checkId)).limit(1);
  const check = checks[0];

  if (!check) {
    return { valid: false, error: 'Inventory check not found' };
  }

  const fromStatus = check.status as InventoryCheckStatus;

  // Find valid transition
  const transition = validTransitions.find(
    t => t.from === fromStatus && t.to === toStatus
  );

  if (!transition) {
    return {
      valid: false,
      error: `Cannot transition from ${fromStatus} to ${toStatus}`,
    };
  }

  // Check required fields
  if (transition.requiredFields) {
    for (const field of transition.requiredFields) {
      const value = check[field as keyof typeof check];
      if (!value) {
        return {
          valid: false,
          error: `Missing required field: ${field}`,
        };
      }
    }
  }

  // Check approval permission
  if (transition.requiresApproval && !isAdmin) {
    return {
      valid: false,
      error: 'Only admin can approve inventory checks',
    };
  }

  return { valid: true };
}

export async function transitionInventoryCheck(
  checkId: number,
  toStatus: InventoryCheckStatus,
  userId: number,
  isAdmin: boolean,
  additionalData?: Record<string, any>
): Promise<{ success: boolean; error?: string; check?: any }> {
  // Validate transition
  const validation = await validateTransition(checkId, toStatus, userId, isAdmin);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Build update data
  const updateData: Record<string, any> = { status: toStatus };

  if (toStatus === 'in_progress' && !additionalData?.startedAt) {
    updateData.startedAt = new Date();
  }

  if (toStatus === 'completed' && !additionalData?.completedAt) {
    updateData.completedAt = new Date();
  }

  if (toStatus === 'approved') {
    updateData.approvedAt = new Date();
    updateData.approvedBy = userId;
  }

  // Merge additional data
  if (additionalData) {
    Object.assign(updateData, additionalData);
  }

  try {
    const database = await getDb();
    if (!database) {
      return { success: false, error: 'Database connection failed' };
    }

    await database.update(inventoryChecks)
      .set(updateData)
      .where(eq(inventoryChecks.id, checkId));

    // Fetch updated check
    const result = await database.select().from(inventoryChecks).where(eq(inventoryChecks.id, checkId)).limit(1);

    return {
      success: true,
      check: result[0],
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to update inventory check: ${(error as Error).message}`,
    };
  }
}

export async function getInventoryCheckItems(checkId: number) {
  const database = await getDb();
  if (!database) return [];
  return await database.select().from(inventoryCheckItems).where(eq(inventoryCheckItems.checkId, checkId));
}

export async function updateInventoryCheckItem(
  itemId: number,
  actualQuantity: number,
  discrepancyReason?: string,
  countedBy?: number
) {
  const database = await getDb();
  if (!database) throw new Error('Database connection failed');
  
  const items = await database.select().from(inventoryCheckItems).where(eq(inventoryCheckItems.id, itemId)).limit(1);

  if (!items || items.length === 0) {
    throw new Error('Inventory check item not found');
  }

  const expectedQuantity = items[0].expectedQuantity;
  const discrepancy = actualQuantity - expectedQuantity;

  const updateData = {
    actualQuantity,
    discrepancy,
    discrepancyReason: discrepancyReason || null,
    countedBy: countedBy || null,
    countedAt: new Date(),
  };

  await database.update(inventoryCheckItems)
    .set(updateData)
    .where(eq(inventoryCheckItems.id, itemId));

  return { actualQuantity, discrepancy, discrepancyReason };
}

export async function getInventoryCheckSummary(checkId: number) {
  const items = await getInventoryCheckItems(checkId);
  
  const summary = {
    totalItems: items.length,
    itemsWithDiscrepancies: 0,
    totalDiscrepancy: 0,
    totalDiscrepancyValue: 0,
  };

  for (const item of items) {
    if (item.discrepancy !== 0 && item.discrepancy !== null) {
      summary.itemsWithDiscrepancies++;
      summary.totalDiscrepancy += item.discrepancy;
    }
  }

  return summary;
}
