import { describe, it, expect } from 'vitest';
import { getPointsNotification } from '../pointsNotifications';

describe('Points Notifications', () => {
  describe('getPointsNotification', () => {
    it('should generate task completion notification', () => {
      const notification = getPointsNotification('task_completion', 100, 1100);
      
      expect(notification.title).toBe('Задание выполнено!');
      expect(notification.message).toContain('+100');
      expect(notification.message).toContain('1');
      expect(notification.message).toContain('100');
      expect(notification.message).toContain('баллов');
    });

    it('should generate order reward notification', () => {
      const notification = getPointsNotification('order_reward', 200, 1300);
      
      expect(notification.title).toBe('Кэшбэк за заказ!');
      expect(notification.message).toContain('+200');
      expect(notification.message).toContain('кэшбэка');
    });

    it('should generate referral bonus notification', () => {
      const notification = getPointsNotification('referral_bonus', 500, 1800);
      
      expect(notification.title).toBe('Реферальный бонус!');
      expect(notification.message).toContain('+500');
      expect(notification.message).toContain('приглашение друга');
    });

    it('should generate admin adjustment credit notification', () => {
      const notification = getPointsNotification('admin_adjustment', 1000, 2800, 'Бонус за отзыв');
      
      expect(notification.title).toBe('Начисление баллов');
      expect(notification.message).toContain('+1');
      expect(notification.message).toContain('000');
      expect(notification.message).toContain('Бонус за отзыв');
    });

    it('should generate admin adjustment debit notification', () => {
      const notification = getPointsNotification('admin_adjustment', -500, 2300, 'Корректировка');
      
      expect(notification.title).toBe('Корректировка баланса');
      expect(notification.message).toContain('-500');
      expect(notification.message).toContain('Корректировка');
    });

    it('should generate redemption notification', () => {
      const notification = getPointsNotification('redemption', -10000, 15000);
      
      expect(notification.title).toBe('Оплата баллами');
      expect(notification.message).toContain('-10');
      expect(notification.message).toContain('000');
      expect(notification.message).toContain('оплаты заказа');
    });

    it('should generate expiration notification', () => {
      const notification = getPointsNotification('expiration', -2000, 13000);
      
      expect(notification.title).toBe('Баллы истекли');
      expect(notification.message).toContain('-2');
      expect(notification.message).toContain('000');
      expect(notification.message).toContain('истечением срока');
    });

    it('should format large numbers correctly', () => {
      const notification = getPointsNotification('order_reward', 25000, 125000);
      
      // Russian locale uses non-breaking space (\u00A0) as thousands separator
      expect(notification.message).toContain('25');
      expect(notification.message).toContain('000');
      expect(notification.message).toContain('125');
    });

    it('should include new balance in all notifications', () => {
      const types = [
        'task_completion',
        'order_reward', 
        'referral_bonus',
        'redemption',
        'expiration'
      ] as const;
      
      types.forEach(type => {
        const amount = type === 'redemption' || type === 'expiration' ? -100 : 100;
        const notification = getPointsNotification(type, amount, 5000);
        // Russian locale uses non-breaking space, so check for parts
        expect(notification.message).toContain('5');
        expect(notification.message).toContain('000');
        expect(notification.message).toContain('баллов');
      });
    });

    it('should handle unknown type with credit', () => {
      // @ts-expect-error - testing unknown type
      const notification = getPointsNotification('unknown_type', 100, 1000);
      
      expect(notification.title).toBe('Начисление баллов');
      expect(notification.message).toContain('+100');
    });

    it('should handle unknown type with debit', () => {
      // @ts-expect-error - testing unknown type
      const notification = getPointsNotification('unknown_type', -100, 900);
      
      expect(notification.title).toBe('Списание баллов');
      expect(notification.message).toContain('-100');
    });
  });
});
