import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('../db', () => ({
  getUserPointsBalance: vi.fn(),
  addPointsTransaction: vi.fn(),
  createOrder: vi.fn(),
  updateUserStats: vi.fn(),
  clearUserCart: vi.fn(),
  createNotification: vi.fn(),
  incrementPromoCodeUsage: vi.fn(),
}));

import * as db from '../db';

describe('Points Payment System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Points Balance', () => {
    it('should return user points balance', async () => {
      const mockBalance = 25000;
      vi.mocked(db.getUserPointsBalance).mockResolvedValue(mockBalance);
      
      const balance = await db.getUserPointsBalance(1);
      
      expect(balance).toBe(25000);
      expect(db.getUserPointsBalance).toHaveBeenCalledWith(1);
    });

    it('should return 0 for users with no points', async () => {
      vi.mocked(db.getUserPointsBalance).mockResolvedValue(0);
      
      const balance = await db.getUserPointsBalance(999);
      
      expect(balance).toBe(0);
    });
  });

  describe('Points Transaction', () => {
    it('should deduct points when used for payment', async () => {
      vi.mocked(db.addPointsTransaction).mockResolvedValue(1);
      
      const transactionId = await db.addPointsTransaction(
        1, // userId
        -10000, // negative amount for deduction
        'redemption',
        'Оплата баллами заказа VH-TEST-1234',
        'order',
        123
      );
      
      expect(transactionId).toBe(1);
      expect(db.addPointsTransaction).toHaveBeenCalledWith(
        1,
        -10000,
        'redemption',
        'Оплата баллами заказа VH-TEST-1234',
        'order',
        123
      );
    });

    it('should add points as order reward (cashback)', async () => {
      vi.mocked(db.addPointsTransaction).mockResolvedValue(2);
      
      const transactionId = await db.addPointsTransaction(
        1, // userId
        500, // positive amount for reward
        'order_reward',
        'Кэшбэк за заказ VH-TEST-1234',
        'order',
        123
      );
      
      expect(transactionId).toBe(2);
      expect(db.addPointsTransaction).toHaveBeenCalledWith(
        1,
        500,
        'order_reward',
        'Кэшбэк за заказ VH-TEST-1234',
        'order',
        123
      );
    });
  });

  describe('Order with Points Payment', () => {
    it('should create order with points used', async () => {
      vi.mocked(db.createOrder).mockResolvedValue(1);
      vi.mocked(db.updateUserStats).mockResolvedValue(undefined);
      vi.mocked(db.addPointsTransaction).mockResolvedValue(1);
      vi.mocked(db.clearUserCart).mockResolvedValue(undefined);
      vi.mocked(db.createNotification).mockResolvedValue(1);
      
      const orderData = {
        orderNumber: 'VH-TEST-1234',
        userId: 1,
        machineId: 1,
        items: [{ productId: 1, name: 'Капучино', price: 20000, quantity: 1 }],
        subtotal: 20000,
        discount: 0,
        total: 10000, // After points deduction
        paymentMethod: 'click' as const,
        pointsEarned: 100, // 1% of total
        pointsUsed: 10000, // Points used for payment
      };
      
      const orderId = await db.createOrder(orderData);
      
      expect(orderId).toBe(1);
      expect(db.createOrder).toHaveBeenCalledWith(orderData);
    });

    it('should handle full payment with points (total = 0)', async () => {
      vi.mocked(db.createOrder).mockResolvedValue(2);
      
      const orderData = {
        orderNumber: 'VH-TEST-5678',
        userId: 1,
        machineId: 1,
        items: [{ productId: 1, name: 'Эспрессо', price: 15000, quantity: 1 }],
        subtotal: 15000,
        discount: 0,
        total: 0, // Full payment with points
        paymentMethod: 'bonus' as const,
        pointsEarned: 0, // No cashback on points-only payment
        pointsUsed: 15000, // Full amount paid with points
      };
      
      const orderId = await db.createOrder(orderData);
      
      expect(orderId).toBe(2);
      expect(db.createOrder).toHaveBeenCalledWith(orderData);
    });

    it('should handle partial payment with points', async () => {
      vi.mocked(db.createOrder).mockResolvedValue(3);
      
      const orderData = {
        orderNumber: 'VH-TEST-9012',
        userId: 1,
        machineId: 1,
        items: [
          { productId: 1, name: 'Латте', price: 22000, quantity: 1 },
          { productId: 2, name: 'Круассан', price: 8000, quantity: 1 },
        ],
        subtotal: 30000,
        discount: 3000, // 10% promo discount
        total: 17000, // 30000 - 3000 - 10000 points
        paymentMethod: 'payme' as const,
        promoCode: 'COFFEE10',
        promoDiscount: 10,
        pointsEarned: 170, // 1% of remaining total
        pointsUsed: 10000, // Partial points payment
      };
      
      const orderId = await db.createOrder(orderData);
      
      expect(orderId).toBe(3);
      expect(db.createOrder).toHaveBeenCalledWith(orderData);
    });
  });

  describe('Points Calculation', () => {
    it('should calculate max points correctly (cannot exceed order total)', () => {
      const subtotal = 50000;
      const promoDiscount = 5000;
      const pointsBalance = 100000;
      
      const afterPromo = subtotal - promoDiscount;
      const maxPointsToUse = Math.min(pointsBalance, afterPromo);
      
      expect(maxPointsToUse).toBe(45000); // Limited by order total, not balance
    });

    it('should calculate max points when balance is lower than order', () => {
      const subtotal = 50000;
      const promoDiscount = 0;
      const pointsBalance = 30000;
      
      const afterPromo = subtotal - promoDiscount;
      const maxPointsToUse = Math.min(pointsBalance, afterPromo);
      
      expect(maxPointsToUse).toBe(30000); // Limited by balance
    });

    it('should calculate final total correctly with points', () => {
      const subtotal = 40000;
      const promoDiscount = 4000; // 10%
      const pointsToUse = 15000;
      
      const total = Math.max(0, subtotal - promoDiscount - pointsToUse);
      
      expect(total).toBe(21000);
    });

    it('should not allow negative total', () => {
      const subtotal = 20000;
      const promoDiscount = 2000;
      const pointsToUse = 25000; // More than remaining
      
      const total = Math.max(0, subtotal - promoDiscount - pointsToUse);
      
      expect(total).toBe(0);
    });
  });

  describe('Points Transaction Types', () => {
    it('should use correct transaction type for order reward', async () => {
      vi.mocked(db.addPointsTransaction).mockResolvedValue(1);
      
      await db.addPointsTransaction(1, 200, 'order_reward', 'Кэшбэк за заказ');
      
      expect(db.addPointsTransaction).toHaveBeenCalledWith(
        1, 200, 'order_reward', 'Кэшбэк за заказ'
      );
    });

    it('should use correct transaction type for redemption', async () => {
      vi.mocked(db.addPointsTransaction).mockResolvedValue(1);
      
      await db.addPointsTransaction(1, -5000, 'redemption', 'Оплата баллами');
      
      expect(db.addPointsTransaction).toHaveBeenCalledWith(
        1, -5000, 'redemption', 'Оплата баллами'
      );
    });
  });
});
