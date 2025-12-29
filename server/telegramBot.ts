/**
 * Telegram Bot Service
 * Sends notifications to users via Telegram Bot API
 * Handles bot registration with deep links for bonus rewards
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = 'vendhubbot';

// Bonus amount for registering with the bot (same as welcome bonus)
export const TELEGRAM_REGISTRATION_BONUS = 15000;

/**
 * Get the Telegram bot deep link for registration
 * @param userId - Optional user ID to track referral
 */
export function getTelegramBotLink(userId?: number): string {
  const startParam = userId ? `start_${userId}` : 'start';
  return `https://t.me/${BOT_USERNAME}?start=${startParam}`;
}

/**
 * Send a message to a Telegram user
 */
export async function sendTelegramMessage(
  telegramId: string,
  text: string,
  options?: {
    parseMode?: 'HTML' | 'Markdown';
    disableNotification?: boolean;
    replyMarkup?: object;
  }
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[TelegramBot] No TELEGRAM_BOT_TOKEN configured');
    return false;
  }

  try {
    const body: Record<string, unknown> = {
      chat_id: telegramId,
      text,
      parse_mode: options?.parseMode || 'HTML',
      disable_notification: options?.disableNotification || false,
    };
    
    if (options?.replyMarkup) {
      body.reply_markup = options.replyMarkup;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
 * Send welcome message to new users who registered via bot
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
 * Send registration bonus notification
 */
export async function sendRegistrationBonusMessage(
  telegramId: string,
  firstName: string,
  bonusAmount: number
): Promise<boolean> {
  const message = `🎁 <b>Поздравляем, ${firstName}!</b>

Вы успешно подключили уведомления VendHub!

<b>+${bonusAmount.toLocaleString('ru-RU')} баллов</b> начислено на ваш счёт! ☕

Это эквивалент бесплатного эспрессо! Используйте баллы для оплаты заказов.

<b>Теперь вы будете получать:</b>
• Уведомления о статусе заказов
• Информацию о новых акциях
• Персональные предложения
• Напоминания о бонусах

Спасибо, что выбрали VendHub! 🙏`;

  // Add inline keyboard with link to mini app
  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '☕ Открыть VendHub',
          web_app: { url: process.env.VITE_APP_URL || 'https://t.me/vendhubbot/app' }
        }
      ]
    ]
  };

  return sendTelegramMessage(telegramId, message, { replyMarkup });
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

/**
 * Send first order bonus notification
 */
export async function sendFirstOrderBonusMessage(
  telegramId: string,
  bonusAmount: number,
  newBalance: number
): Promise<boolean> {
  const message = `🎊 <b>Бонус за первый заказ!</b>

Поздравляем с первым заказом в VendHub!

<b>+${bonusAmount.toLocaleString('ru-RU')} баллов</b> начислено!

Текущий баланс: <b>${newBalance.toLocaleString('ru-RU')}</b> баллов

Продолжайте заказывать и копите баллы! 🚀`;

  return sendTelegramMessage(telegramId, message);
}

/**
 * Send level up notification
 */
export async function sendLevelUpMessage(
  telegramId: string,
  newLevel: string,
  discountPercent: number
): Promise<boolean> {
  const levelEmoji: Record<string, string> = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎'
  };

  const levelNames: Record<string, string> = {
    bronze: 'Бронзовый',
    silver: 'Серебряный',
    gold: 'Золотой',
    platinum: 'Платиновый'
  };

  const message = `${levelEmoji[newLevel] || '🏆'} <b>Новый уровень!</b>

Поздравляем! Вы достигли уровня <b>${levelNames[newLevel] || newLevel}</b>!

🎁 Теперь у вас постоянная скидка <b>${discountPercent}%</b> на все заказы!

Продолжайте заказывать для повышения уровня! 🚀`;

  return sendTelegramMessage(telegramId, message);
}
