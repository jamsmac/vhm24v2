/**
 * Assignment System Tests
 * Tests for employee assignments, work logs, and performance tracking
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';

describe('Employee Assignment System', () => {
  let testEmployee: any;
  let testMachine: any;
  let testAssignment: any;
  let testWorkLog: any;

  beforeAll(async () => {
    // Create test employee
    testEmployee = await db.createEmployee({
      fullName: 'Test Assignment Employee',
      role: 'technician',
      status: 'active',
      phone: '+998901234567',
      email: 'test.assignment@vendhub.uz',
    });

    // Create test machine
    testMachine = await db.createMachine({
      machineCode: 'TEST-ASSIGN-001',
      name: 'Test Assignment Machine',
      address: 'Test Location',
      status: 'online',
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testWorkLog) {
      await db.deleteWorkLog(testWorkLog.id);
    }
    if (testAssignment) {
      await db.deleteMachineAssignment(testAssignment.id);
    }
    if (testMachine) {
      await db.deleteMachine(testMachine.id);
    }
    if (testEmployee) {
      await db.deleteEmployee(testEmployee.id);
    }
  });

  describe('Machine Assignments', () => {
    it('should create a machine assignment', async () => {
      testAssignment = await db.createMachineAssignment({
        machineId: testMachine.id,
        employeeId: testEmployee.id,
        assignmentType: 'primary',
        assignmentStatus: 'active',
        responsibilities: 'Maintenance and refills',
        notes: 'Test assignment',
      });

      expect(testAssignment).toBeDefined();
      expect(testAssignment.machineId).toBe(testMachine.id);
      expect(testAssignment.employeeId).toBe(testEmployee.id);
      expect(testAssignment.assignmentType).toBe('primary');
      expect(testAssignment.status).toBe('active');
    });

    it('should get assignment by ID', async () => {
      const assignment = await db.getMachineAssignmentById(testAssignment.id);
      expect(assignment).toBeDefined();
      expect(assignment?.id).toBe(testAssignment.id);
    });

    it('should get assignments by employee', async () => {
      const assignments = await db.getMachineAssignmentsByEmployee(testEmployee.id);
      expect(assignments.length).toBeGreaterThan(0);
      expect(assignments[0].employeeId).toBe(testEmployee.id);
    });

    it('should get active assignments by employee', async () => {
      const assignments = await db.getActiveMachineAssignmentsByEmployee(testEmployee.id);
      expect(assignments.length).toBeGreaterThan(0);
      expect(assignments[0].status).toBe('active');
    });

    it('should get assignments by machine', async () => {
      const assignments = await db.getMachineAssignmentsByMachine(testMachine.id);
      expect(assignments.length).toBeGreaterThan(0);
      expect(assignments[0].machineId).toBe(testMachine.id);
    });

    it('should update assignment', async () => {
      const updated = await db.updateMachineAssignment(testAssignment.id, {
        notes: 'Updated notes',
      });
      expect(updated).toBeDefined();
      expect(updated?.notes).toBe('Updated notes');
    });

    it('should deactivate assignment', async () => {
      const deactivated = await db.deactivateMachineAssignment(testAssignment.id);
      expect(deactivated).toBeDefined();
      expect(deactivated?.assignmentStatus).toBe('inactive');
      expect(deactivated?.endDate).toBeDefined();

      // Reactivate for other tests
      await db.updateMachineAssignment(testAssignment.id, {
        assignmentStatus: 'active',
        endDate: null,
      });
    });
  });

  describe('Work Logs', () => {
    it('should create a work log', async () => {
      testWorkLog = await db.createWorkLog({
        employeeId: testEmployee.id,
        machineId: testMachine.id,
        workType: 'maintenance',
        workStatus: 'in_progress',
        description: 'Test maintenance work',
        notes: 'Test notes',
      });

      expect(testWorkLog).toBeDefined();
      expect(testWorkLog.employeeId).toBe(testEmployee.id);
      expect(testWorkLog.machineId).toBe(testMachine.id);
      expect(testWorkLog.workType).toBe('maintenance');
      expect(testWorkLog.workStatus).toBe('in_progress');
    });

    it('should get work log by ID', async () => {
      const log = await db.getWorkLogById(testWorkLog.id);
      expect(log).toBeDefined();
      expect(log?.id).toBe(testWorkLog.id);
    });

    it('should get work logs by employee', async () => {
      const logs = await db.getWorkLogsByEmployee(testEmployee.id);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].employeeId).toBe(testEmployee.id);
    });

    it('should get work logs by machine', async () => {
      const logs = await db.getWorkLogsByMachine(testMachine.id);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].machineId).toBe(testMachine.id);
    });

    it('should get in-progress work logs', async () => {
      const logs = await db.getInProgressWorkLogs();
      expect(logs.length).toBeGreaterThan(0);
      const ourLog = logs.find(l => l.id === testWorkLog.id);
      expect(ourLog).toBeDefined();
      expect(ourLog?.status).toBe('in_progress');
    });

    it('should complete work log', async () => {
      const completed = await db.completeWorkLog(
        testWorkLog.id,
        new Date(),
        'Work completed successfully',
        5
      );

      expect(completed).toBeDefined();
      expect(completed?.status).toBe('completed');
      expect(completed?.endTime).toBeDefined();
      expect(completed?.duration).toBeGreaterThanOrEqual(0); // Duration can be 0 if completed immediately
      expect(completed?.rating).toBe(5);
    });

    it('should update work log', async () => {
      const updated = await db.updateWorkLog(testWorkLog.id, {
        notes: 'Updated work notes',
      });
      expect(updated).toBeDefined();
      expect(updated?.notes).toBe('Updated work notes');
    });
  });

  describe('Employee Performance', () => {
    it('should initialize employee performance', async () => {
      const performance = await db.initializeEmployeePerformance(testEmployee.id);
      expect(performance).toBeDefined();
      expect(performance?.employeeId).toBe(testEmployee.id);
      expect(performance?.totalWorkLogs).toBeGreaterThanOrEqual(0);
    });

    it('should get employee performance', async () => {
      const performance = await db.getEmployeePerformance(testEmployee.id);
      expect(performance).toBeDefined();
      expect(performance?.employeeId).toBe(testEmployee.id);
    });

    it('should update performance on work completion', async () => {
      await db.updateEmployeePerformanceOnWorkComplete(testEmployee.id);
      
      const performance = await db.getEmployeePerformance(testEmployee.id);
      expect(performance).toBeDefined();
      expect(performance?.totalWorkLogs).toBeGreaterThan(0);
      expect(performance?.completedTasks).toBeGreaterThan(0);
      expect(performance?.totalWorkHours).toBeGreaterThanOrEqual(0); // Can be 0 if completed immediately
    });

    it('should update performance on assignment', async () => {
      await db.updateEmployeePerformanceOnAssignment(testEmployee.id);
      
      const performance = await db.getEmployeePerformance(testEmployee.id);
      expect(performance).toBeDefined();
      expect(performance?.activeMachines).toBeGreaterThanOrEqual(0);
      expect(performance?.totalMachinesAssigned).toBeGreaterThan(0);
    });

    it('should calculate average rating correctly', async () => {
      const performance = await db.getEmployeePerformance(testEmployee.id);
      expect(performance).toBeDefined();
      
      if (performance && parseFloat(performance.averageRating || '0') > 0) {
        const rating = parseFloat(performance.averageRating || '0');
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(5);
      }
    });

    it('should get all employee performance records', async () => {
      const allPerformance = await db.getAllEmployeePerformance();
      expect(allPerformance.length).toBeGreaterThan(0);
      
      const ourPerformance = allPerformance.find(p => p.employeeId === testEmployee.id);
      expect(ourPerformance).toBeDefined();
    });
  });

  describe('Work Log Date Range', () => {
    it('should get work logs by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // 7 days ago
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1); // tomorrow

      const logs = await db.getWorkLogsByDateRange(startDate, endDate);
      expect(logs.length).toBeGreaterThan(0);
      
      const ourLog = logs.find(l => l.id === testWorkLog.id);
      expect(ourLog).toBeDefined();
    });
  });

  describe('Assignment Status Changes', () => {
    it('should track assignment status changes', async () => {
      // Create a new assignment
      const newAssignment = await db.createMachineAssignment({
        machineId: testMachine.id,
        employeeId: testEmployee.id,
        assignmentType: 'temporary',
        assignmentStatus: 'pending',
      });

      expect(newAssignment?.assignmentStatus).toBe('pending');

      // Update to active
      const activated = await db.updateMachineAssignment(newAssignment!.id, {
        assignmentStatus: 'active',
      });
      expect(activated?.assignmentStatus).toBe('active');

      // Deactivate
      const deactivated = await db.deactivateMachineAssignment(newAssignment!.id);
      expect(deactivated?.assignmentStatus).toBe('inactive');
      expect(deactivated?.endDate).toBeDefined();

      // Cleanup
      await db.deleteMachineAssignment(newAssignment!.id);
    });
  });

  describe('Work Log Cancellation', () => {
    it('should cancel work log', async () => {
      // Create a new work log
      const newLog = await db.createWorkLog({
        employeeId: testEmployee.id,
        machineId: testMachine.id,
        workType: 'cleaning',
        workStatus: 'in_progress',
        description: 'Test cleaning',
      });

      expect(newLog?.workStatus).toBe('in_progress');

      // Cancel it
      const cancelled = await db.cancelWorkLog(newLog!.id, 'Test cancellation');
      expect(cancelled?.workStatus).toBe('cancelled');
      expect(cancelled?.endTime).toBeDefined();
      expect(cancelled?.notes).toBe('Test cancellation');

      // Cleanup
      await db.deleteWorkLog(newLog!.id);
    });
  });
});
