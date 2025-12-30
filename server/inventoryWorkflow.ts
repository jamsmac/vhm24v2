/**
 * Inventory Check Workflow Management
 * Handles state transitions and validations for inventory checks
 */

import { db } from './_core/db';

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
  const check = await db.execute(
    `SELECT * FROM inventory_checks WHERE id = ?`,
    [checkId]
  );

  if (!check || check.length === 0) {
    return { valid: false, error: 'Inventory check not found' };
  }

  const currentCheck = check[0] as any;
  const fromStatus = currentCheck.status;

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
      if (!currentCheck[field]) {
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

  // Update check
  const setClause = Object.keys(updateData)
    .map(k => `${k} = ?`)
    .join(', ');
  const values = [...Object.values(updateData), checkId];

  try {
    await db.execute(
      `UPDATE inventory_checks SET ${setClause}, updatedAt = NOW() WHERE id = ?`,
      values
    );

    // Fetch updated check
    const result = await db.execute(
      `SELECT * FROM inventory_checks WHERE id = ?`,
      [checkId]
    );

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
  return await db.execute(
    `SELECT * FROM inventory_check_items WHERE checkId = ? ORDER BY itemType, itemId`,
    [checkId]
  );
}

export async function updateInventoryCheckItem(
  itemId: number,
  actualQuantity: number,
  discrepancyReason?: string,
  countedBy?: number
) {
  const expectedResult = await db.execute(
    `SELECT expectedQuantity FROM inventory_check_items WHERE id = ?`,
    [itemId]
  );

  if (!expectedResult || expectedResult.length === 0) {
    throw new Error('Inventory check item not found');
  }

  const expectedQuantity = (expectedResult[0] as any).expectedQuantity;
  const discrepancy = actualQuantity - expectedQuantity;

  const updateData = {
    actualQuantity,
    discrepancy,
    discrepancyReason: discrepancyReason || null,
    countedBy: countedBy || null,
    countedAt: new Date(),
  };

  const setClause = Object.keys(updateData)
    .map(k => `${k} = ?`)
    .join(', ');
  const values = [...Object.values(updateData), itemId];

  await db.execute(
    `UPDATE inventory_check_items SET ${setClause} WHERE id = ?`,
    values
  );

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

  for (const item of items as any[]) {
    if (item.discrepancy !== 0 && item.discrepancy !== null) {
      summary.itemsWithDiscrepancies++;
      summary.totalDiscrepancy += item.discrepancy;
    }
  }

  return summary;
}
