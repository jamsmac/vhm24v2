import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql from 'mysql2/promise';

let connection: mysql.Connection;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for tests');
  }
  connection = await mysql.createConnection(process.env.DATABASE_URL);
});

afterAll(async () => {
  await connection.end();
});

describe('Admin Inventory Management - Database Tables', () => {
  describe('Employees Table', () => {
    it('should have employees table', async () => {
      const [rows] = await connection.query("SHOW TABLES LIKE 'employees'");
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have employeeRole column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM employees WHERE Field = 'employeeRole'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have employeeStatus column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM employees WHERE Field = 'employeeStatus'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });
  });

  describe('Ingredients Table', () => {
    it('should have ingredients table', async () => {
      const [rows] = await connection.query("SHOW TABLES LIKE 'ingredients'");
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have category column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM ingredients WHERE Field = 'category'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have stock tracking columns', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM ingredients WHERE Field IN ('currentStock', 'minStock', 'maxStock')"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(3);
    });
  });

  describe('Cleaning Supplies Table', () => {
    it('should have cleaning_supplies table', async () => {
      const [rows] = await connection.query("SHOW TABLES LIKE 'cleaning_supplies'");
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have category column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM cleaning_supplies WHERE Field = 'category'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });
  });

  describe('Spare Parts Table', () => {
    it('should have spare_parts table', async () => {
      const [rows] = await connection.query("SHOW TABLES LIKE 'spare_parts'");
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have category column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM spare_parts WHERE Field = 'category'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have partNumber column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM spare_parts WHERE Field = 'partNumber'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });
  });

  describe('Bunkers Table', () => {
    it('should have bunkers table', async () => {
      const [rows] = await connection.query("SHOW TABLES LIKE 'bunkers'");
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have capacity column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM bunkers WHERE Field = 'capacity'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have currentLevel column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM bunkers WHERE Field = 'currentLevel'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have lowLevelThreshold column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM bunkers WHERE Field = 'lowLevelThreshold'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });
  });

  describe('Mixers Table', () => {
    it('should have mixers table', async () => {
      const [rows] = await connection.query("SHOW TABLES LIKE 'mixers'");
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have mixerType column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM mixers WHERE Field = 'mixerType'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have mixerStatus column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM mixers WHERE Field = 'mixerStatus'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });
  });

  describe('Warehouse Inventory Table', () => {
    it('should have warehouse_inventory table', async () => {
      const [rows] = await connection.query("SHOW TABLES LIKE 'warehouse_inventory'");
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have itemType column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM warehouse_inventory WHERE Field = 'itemType'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });
  });

  describe('Stock Movements Table', () => {
    it('should have stock_movements table', async () => {
      const [rows] = await connection.query("SHOW TABLES LIKE 'stock_movements'");
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have movementType column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM stock_movements WHERE Field = 'movementType'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have itemType column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM stock_movements WHERE Field = 'itemType'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });
  });

  describe('Contractors Table', () => {
    it('should have contractors table', async () => {
      const [rows] = await connection.query("SHOW TABLES LIKE 'contractors'");
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have contractorType column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM contractors WHERE Field = 'contractorType'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });

    it('should have rating column', async () => {
      const [rows] = await connection.query(
        "SHOW COLUMNS FROM contractors WHERE Field = 'rating'"
      );
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });
  });

  describe('Inventory Checks Table', () => {
    it('should have inventory_checks table', async () => {
      const [rows] = await connection.query("SHOW TABLES LIKE 'inventory_checks'");
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });
  });

  describe('Inventory Check Items Table', () => {
    it('should have inventory_check_items table', async () => {
      const [rows] = await connection.query("SHOW TABLES LIKE 'inventory_check_items'");
      expect(Array.isArray(rows)).toBe(true);
      expect((rows as any[]).length).toBe(1);
    });
  });
});

describe('Database Table Relationships', () => {
  it('should have all required admin tables', async () => {
    const [tables] = await connection.query("SHOW TABLES");
    const tableNames = (tables as any[]).map(t => Object.values(t)[0]);
    
    const requiredTables = [
      'employees',
      'ingredients', 
      'cleaning_supplies',
      'spare_parts',
      'bunkers',
      'mixers',
      'warehouse_inventory',
      'stock_movements',
      'contractors',
      'inventory_checks',
      'inventory_check_items'
    ];
    
    for (const table of requiredTables) {
      expect(tableNames).toContain(table);
    }
  });
});
