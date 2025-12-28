/**
 * Referral System API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('../db', () => ({
  getOrCreateReferralCode: vi.fn(),
  getReferralCodeByCode: vi.fn(),
  getReferralStats: vi.fn(),
  trackReferralClick: vi.fn(),
  createReferral: vi.fn(),
  completeReferral: vi.fn(),
  getUserReferrals: vi.fn(),
  getUserReferrer: vi.fn(),
}));

import * as db from '../db';

describe('Referral System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateReferralCode', () => {
    it('should return existing referral code for user', async () => {
      const mockCode = {
        id: 1,
        userId: 1,
        code: 'ABC12345',
        totalClicks: 10,
        totalReferrals: 5,
        totalPointsEarned: 1000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(db.getOrCreateReferralCode).mockResolvedValue(mockCode);
      
      const result = await db.getOrCreateReferralCode(1);
      
      expect(result).toEqual(mockCode);
      expect(db.getOrCreateReferralCode).toHaveBeenCalledWith(1);
    });

    it('should create new referral code if none exists', async () => {
      const mockCode = {
        id: 2,
        userId: 2,
        code: 'XYZ98765',
        totalClicks: 0,
        totalReferrals: 0,
        totalPointsEarned: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(db.getOrCreateReferralCode).mockResolvedValue(mockCode);
      
      const result = await db.getOrCreateReferralCode(2);
      
      expect(result).toEqual(mockCode);
      expect(result?.code).toHaveLength(8);
    });
  });

  describe('getReferralCodeByCode', () => {
    it('should return referral code data for valid code', async () => {
      const mockCode = {
        id: 1,
        userId: 1,
        code: 'ABC12345',
        totalClicks: 10,
        totalReferrals: 5,
        totalPointsEarned: 1000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(db.getReferralCodeByCode).mockResolvedValue(mockCode);
      
      const result = await db.getReferralCodeByCode('ABC12345');
      
      expect(result).toEqual(mockCode);
    });

    it('should return null for invalid code', async () => {
      vi.mocked(db.getReferralCodeByCode).mockResolvedValue(null);
      
      const result = await db.getReferralCodeByCode('INVALID');
      
      expect(result).toBeNull();
    });
  });

  describe('getReferralStats', () => {
    it('should return referral statistics for user', async () => {
      const mockStats = {
        code: 'ABC12345',
        totalClicks: 50,
        totalReferrals: 10,
        totalPointsEarned: 2000,
        pendingReferrals: 3,
        completedReferrals: 7,
      };
      
      vi.mocked(db.getReferralStats).mockResolvedValue(mockStats);
      
      const result = await db.getReferralStats(1);
      
      expect(result).toEqual(mockStats);
      expect(result?.totalReferrals).toBe(10);
      expect(result?.totalPointsEarned).toBe(2000);
    });

    it('should return null for user without referral code', async () => {
      vi.mocked(db.getReferralStats).mockResolvedValue(null);
      
      const result = await db.getReferralStats(999);
      
      expect(result).toBeNull();
    });
  });

  describe('trackReferralClick', () => {
    it('should track click and return true for valid code', async () => {
      vi.mocked(db.trackReferralClick).mockResolvedValue(true);
      
      const result = await db.trackReferralClick('ABC12345');
      
      expect(result).toBe(true);
    });

    it('should return false for invalid code', async () => {
      vi.mocked(db.trackReferralClick).mockResolvedValue(false);
      
      const result = await db.trackReferralClick('INVALID');
      
      expect(result).toBe(false);
    });

    it('should return false for inactive code', async () => {
      vi.mocked(db.trackReferralClick).mockResolvedValue(false);
      
      const result = await db.trackReferralClick('INACTIVE');
      
      expect(result).toBe(false);
    });
  });

  describe('createReferral', () => {
    it('should create referral for new user', async () => {
      const mockReferral = {
        id: 1,
        referrerId: 1,
        referrerCode: 'ABC12345',
        referredUserId: 2,
        status: 'registered' as const,
        referrerPointsAwarded: 0,
        referredPointsAwarded: 0,
        clickCount: 0,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(db.createReferral).mockResolvedValue(mockReferral);
      
      const result = await db.createReferral('ABC12345', 2);
      
      expect(result).toEqual(mockReferral);
      expect(result?.status).toBe('registered');
    });

    it('should return null for self-referral', async () => {
      vi.mocked(db.createReferral).mockResolvedValue(null);
      
      const result = await db.createReferral('ABC12345', 1); // Same user
      
      expect(result).toBeNull();
    });

    it('should return null for already referred user', async () => {
      vi.mocked(db.createReferral).mockResolvedValue(null);
      
      const result = await db.createReferral('ABC12345', 2);
      
      expect(result).toBeNull();
    });
  });

  describe('completeReferral', () => {
    it('should complete referral and award points', async () => {
      vi.mocked(db.completeReferral).mockResolvedValue(true);
      
      const result = await db.completeReferral(2, 200, 100);
      
      expect(result).toBe(true);
      expect(db.completeReferral).toHaveBeenCalledWith(2, 200, 100);
    });

    it('should return false for already completed referral', async () => {
      vi.mocked(db.completeReferral).mockResolvedValue(false);
      
      const result = await db.completeReferral(2, 200, 100);
      
      expect(result).toBe(false);
    });

    it('should return false for non-existent referral', async () => {
      vi.mocked(db.completeReferral).mockResolvedValue(false);
      
      const result = await db.completeReferral(999, 200, 100);
      
      expect(result).toBe(false);
    });
  });

  describe('getUserReferrals', () => {
    it('should return list of user referrals', async () => {
      const mockReferrals = [
        {
          id: 1,
          referredUserId: 2,
          referredUserName: 'John',
          status: 'completed',
          pointsAwarded: 200,
          createdAt: new Date(),
          completedAt: new Date(),
        },
        {
          id: 2,
          referredUserId: 3,
          referredUserName: 'Jane',
          status: 'registered',
          pointsAwarded: 0,
          createdAt: new Date(),
          completedAt: null,
        },
      ];
      
      vi.mocked(db.getUserReferrals).mockResolvedValue(mockReferrals);
      
      const result = await db.getUserReferrals(1);
      
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('completed');
      expect(result[1].status).toBe('registered');
    });

    it('should return empty array for user with no referrals', async () => {
      vi.mocked(db.getUserReferrals).mockResolvedValue([]);
      
      const result = await db.getUserReferrals(999);
      
      expect(result).toEqual([]);
    });
  });

  describe('getUserReferrer', () => {
    it('should return referrer info for referred user', async () => {
      const mockReferrer = {
        referrerId: 1,
        referrerName: 'John',
        bonusReceived: 100,
      };
      
      vi.mocked(db.getUserReferrer).mockResolvedValue(mockReferrer);
      
      const result = await db.getUserReferrer(2);
      
      expect(result).toEqual(mockReferrer);
      expect(result?.bonusReceived).toBe(100);
    });

    it('should return null for user not referred', async () => {
      vi.mocked(db.getUserReferrer).mockResolvedValue(null);
      
      const result = await db.getUserReferrer(1);
      
      expect(result).toBeNull();
    });
  });
});
