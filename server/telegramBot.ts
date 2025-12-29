/**
 * Telegram Bot Service
 * Sends notifications to users via Telegram Bot API
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Send a message to a Telegram user
 */
export async function sendTelegramMessage(
  telegramId: string,
  text: string,
  options?: {
    parseMode?: 'HTML' | 'Markdown';
    disableNotification?: boolean;
  }
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[TelegramBot] No TELEGRAM_BOT_TOKEN configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          text,
          parse_mode: options?.parseMode || 'HTML',
          disable_notification: options?.disableNotification || false,
        }),
      }
    );

    const result = await response.json();
    
    if (!result.ok) {
      console.error('[TelegramBot] Failed to send message:', result.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[TelegramBot] Error sending message:', error);
    return false;
  }
}

/**
 * Send welcome message to new users
 */
export async function sendWelcomeMessage(
  telegramId: string,
  firstName: string
): Promise<boolean> {
  const message = `🎉 <b>Добро пожаловать в VendHub, ${firstName}!</b>

Мы рады видеть вас в нашем приложении! 

<b>Что вас ждёт:</b>
☕ Заказ напитков из вендинговых автоматов
📍 Карта всех автоматов рядом с вами
🎁 Бонусная программа с кэшбэком
🏆 Задания и достижения
👥 Реферальная программа

<b>Приятного использования!</b>`;

  return sendTelegramMessage(telegramId, message);
}

/**
 * Send points notification
 */
export async function sendPointsNotification(
  telegramId: string,
  amount: number,
  type: 'earned' | 'spent',
  description: string,
  newBalance: number
): Promise<boolean> {
  const emoji = type === 'earned' ? '💰' : '💳';
  const sign = type === 'earned' ? '+' : '-';
  const action = type === 'earned' ? 'начислено' : 'списано';

  const message = `${emoji} <b>Баллы ${action}!</b>

<b>${sign}${amount.toLocaleString('ru-RU')}</b> баллов
${description}

Текущий баланс: <b>${newBalance.toLocaleString('ru-RU')}</b> баллов`;

  return sendTelegramMessage(telegramId, message);
}
