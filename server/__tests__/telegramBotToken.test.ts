import { describe, it, expect } from 'vitest';

describe('Telegram Bot Token Validation', () => {
  it('should have TELEGRAM_BOT_TOKEN configured', () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    expect(token).toBeDefined();
    expect(token).not.toBe('');
  });

  it('should validate token with Telegram API getMe', async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.warn('TELEGRAM_BOT_TOKEN not set, skipping API validation');
      return;
    }
    
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json() as { ok: boolean; result?: { username: string } };
    
    expect(data.ok).toBe(true);
    expect(data.result).toBeDefined();
    expect(data.result?.username).toBeDefined();
    
    console.log(`Bot validated: @${data.result?.username}`);
  });
});
