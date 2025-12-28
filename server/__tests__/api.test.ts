import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, seedInitialData, getAllProducts, getProductBySlug, getAllMachines, getMachineByCode } from '../db';

describe('Database Connection', () => {
  it('should connect to database', async () => {
    const db = await getDb();
    expect(db).toBeDefined();
  });
});

describe('Products API', () => {
  beforeAll(async () => {
    // Seed initial data if not exists
    await seedInitialData();
  });

  it('should get all products', async () => {
    const products = await getAllProducts();
    expect(Array.isArray(products)).toBe(true);
  });

  it('should get product by slug', async () => {
    const product = await getProductBySlug('cappuccino');
    if (product) {
      expect(product.slug).toBe('cappuccino');
      expect(product.name).toBe('Cappuccino');
      expect(product.price).toBeGreaterThan(0);
    }
  });

  it('should return undefined for non-existent product', async () => {
    const product = await getProductBySlug('non-existent-product');
    expect(product).toBeUndefined();
  });
});

describe('Machines API', () => {
  it('should get all machines', async () => {
    const machines = await getAllMachines();
    expect(Array.isArray(machines)).toBe(true);
  });

  it('should get machine by code', async () => {
    const machine = await getMachineByCode('M-001');
    if (machine) {
      expect(machine.machineCode).toBe('M-001');
      expect(machine.name).toBeDefined();
    }
  });

  it('should return undefined for non-existent machine', async () => {
    const machine = await getMachineByCode('INVALID-CODE');
    expect(machine).toBeUndefined();
  });
});

describe('Schema Validation', () => {
  it('should have correct product schema', async () => {
    const products = await getAllProducts();
    if (products.length > 0) {
      const product = products[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('slug');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('isAvailable');
    }
  });

  it('should have correct machine schema', async () => {
    const machines = await getAllMachines();
    if (machines.length > 0) {
      const machine = machines[0];
      expect(machine).toHaveProperty('id');
      expect(machine).toHaveProperty('machineCode');
      expect(machine).toHaveProperty('name');
      expect(machine).toHaveProperty('status');
    }
  });
});
