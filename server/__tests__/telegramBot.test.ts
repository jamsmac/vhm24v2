import { describe, it, expect } from 'vitest';
import { formatPointsNotificationForTelegram } from '../telegramBot';

describe('Telegram Bot Notifications', () => {
  describe('formatPointsNotificationForTelegram', () => {
    it('should format task completion notification correctly', () => {
      const message = formatPointsNotificationForTelegram('task_completion', 100, 500, 'Выполнено задание');
      
      expect(message).toContain('✨ Выполнение задания');
      expect(message).toContain('Начислено');
      expect(message).toContain('+100');
      expect(message).toContain('Выполнено задание');
      expect(message).toContain('500');
    });

    it('should format order reward notification correctly', () => {
      const message = formatPointsNotificationForTelegram('order_reward', 50, 550);
      
      expect(message).toContain('☕ Кэшбэк за заказ');
      expect(message).toContain('Начислено');
      expect(message).toContain('+50');
      expect(message).toContain('550');
    });

    it('should format referral bonus notification correctly', () => {
      const message = formatPointsNotificationForTelegram('referral_bonus', 200, 750);
      
      expect(message).toContain('👥 Реферальный бонус');
      expect(message).toContain('Начислено');
      expect(message).toContain('+200');
    });

    it('should format redemption notification correctly', () => {
      const message = formatPointsNotificationForTelegram('redemption', -300, 450);
      
      expect(message).toContain('🛒 Оплата баллами');
      expect(message).toContain('Списано');
      expect(message).toContain('-300');
      expect(message).toContain('450');
    });

    it('should format admin adjustment credit correctly', () => {
      const message = formatPointsNotificationForTelegram('admin_adjustment', 1000, 1500);
      
      expect(message).toContain('⚙️ Начисление');
      expect(message).toContain('+1');
    });

    it('should format admin adjustment debit correctly', () => {
      const message = formatPointsNotificationForTelegram('admin_adjustment', -500, 1000);
      
      expect(message).toContain('⚙️ Корректировка');
      expect(message).toContain('Списано');
      expect(message).toContain('-500');
    });

    it('should format expiration notification correctly', () => {
      const message = formatPointsNotificationForTelegram('expiration', -100, 400);
      
      expect(message).toContain('⏰ Истечение срока');
      expect(message).toContain('Списано');
      expect(message).toContain('-100');
    });

    it('should include description when provided', () => {
      const message = formatPointsNotificationForTelegram('task_completion', 50, 100, 'Тестовое описание');
      
      expect(message).toContain('📝 Тестовое описание');
    });

    it('should format large numbers with thousand separators', () => {
      const message = formatPointsNotificationForTelegram('order_reward', 10000, 50000);
      
      // Russian locale uses non-breaking space as thousand separator
      expect(message).toMatch(/10[\s\u00A0]000/);
      expect(message).toMatch(/50[\s\u00A0]000/);
    });

    it('should use HTML formatting', () => {
      const message = formatPointsNotificationForTelegram('task_completion', 100, 500);
      
      expect(message).toContain('<b>');
      expect(message).toContain('</b>');
    });
  });
});
