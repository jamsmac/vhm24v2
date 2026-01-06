/**
 * Role-Based Access Control Tests
 * Tests for server-side role verification and access control
 */

import { describe, it, expect } from 'vitest';
import * as db from './db';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Role-Based Access Control', () => {
  async function getUserByEmail(email: string) {
    const dbConn = await getDb();
    if (!dbConn) throw new Error('Database connection failed');
    const [user] = await dbConn.select().from(users).where(eq(users.email, email));
    return user;
  }

  describe('User Roles in Database', () => {
    it('should have admin user with admin role', async () => {
      const adminUser = await getUserByEmail('admin@vendhub.uz');
      expect(adminUser).toBeDefined();
      expect(adminUser?.role).toBe('admin');
      expect(adminUser?.name).toBe('Admin User');
    });

    it('should have employee user with employee role', async () => {
      const employeeUser = await getUserByEmail('employee@vendhub.uz');
      expect(employeeUser).toBeDefined();
      expect(employeeUser?.role).toBe('employee');
      expect(employeeUser?.name).toBe('Employee User');
    });

    it('should have customer user with user role', async () => {
      const customerUser = await getUserByEmail('customer@vendhub.uz');
      expect(customerUser).toBeDefined();
      expect(customerUser?.role).toBe('user');
      expect(customerUser?.name).toBe('Customer User');
    });
  });

  describe('Role Validation', () => {
    it('should identify admin as staff', async () => {
      const adminUser = await getUserByEmail('admin@vendhub.uz');
      const isStaff = adminUser?.role === 'admin' || adminUser?.role === 'employee';
      expect(isStaff).toBe(true);
    });

    it('should identify employee as staff', async () => {
      const employeeUser = await getUserByEmail('employee@vendhub.uz');
      const isStaff = employeeUser?.role === 'admin' || employeeUser?.role === 'employee';
      expect(isStaff).toBe(true);
    });

    it('should identify customer as non-staff', async () => {
      const customerUser = await getUserByEmail('customer@vendhub.uz');
      const isStaff = customerUser?.role === 'admin' || customerUser?.role === 'employee';
      expect(isStaff).toBe(false);
    });
  });

  describe('getUserById returns role', () => {
    it('should return admin role for admin user', async () => {
      const adminUser = await getUserByEmail('admin@vendhub.uz');
      if (!adminUser) return;
      const user = await db.getUserById(adminUser.id);
      expect(user).toBeDefined();
      expect(user?.role).toBe('admin');
    });

    it('should return employee role for employee user', async () => {
      const employeeUser = await getUserByEmail('employee@vendhub.uz');
      if (!employeeUser) return;
      const user = await db.getUserById(employeeUser.id);
      expect(user).toBeDefined();
      expect(user?.role).toBe('employee');
    });

    it('should return user role for customer', async () => {
      const customerUser = await getUserByEmail('customer@vendhub.uz');
      if (!customerUser) return;
      const user = await db.getUserById(customerUser.id);
      expect(user).toBeDefined();
      expect(user?.role).toBe('user');
    });
  });
});
