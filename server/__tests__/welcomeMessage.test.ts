import { describe, it, expect } from 'vitest';
import { formatWelcomeMessage } from '../telegramBot';

describe('Welcome Message', () => {
  describe('formatWelcomeMessage', () => {
    it('should include personalized greeting with user name', () => {
      const message = formatWelcomeMessage('Александр');
      
      expect(message).toContain('Привет, <b>Александр</b>!');
      expect(message).toContain('👋');
    });

    it('should include generic greeting without user name', () => {
      const message = formatWelcomeMessage();
      
      expect(message).toContain('Привет! 👋');
      expect(message).not.toContain('<b>undefined</b>');
    });

    it('should include VendHub welcome text', () => {
      const message = formatWelcomeMessage();
      
      expect(message).toContain('Добро пожаловать в VendHub');
      expect(message).toContain('☕');
    });

    it('should include app features', () => {
      const message = formatWelcomeMessage();
      
      expect(message).toContain('Карта автоматов');
      expect(message).toContain('QR-сканер');
      expect(message).toContain('Бонусная программа');
      expect(message).toContain('Задания');
      expect(message).toContain('Реферальная программа');
    });

    it('should include points conversion info', () => {
      const message = formatWelcomeMessage();
      
      expect(message).toContain('1 балл = 1 сум');
    });

    it('should include cashback info', () => {
      const message = formatWelcomeMessage();
      
      expect(message).toContain('кэшбэк 1%');
    });

    it('should use HTML formatting', () => {
      const message = formatWelcomeMessage('Test');
      
      expect(message).toContain('<b>');
      expect(message).toContain('</b>');
    });

    it('should end with coffee emoji', () => {
      const message = formatWelcomeMessage();
      
      expect(message).toContain('☕️');
    });
  });
});
