/**
 * Telegram Bot Notification Service
 * Sends notifications to users via Telegram Bot API
 */

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disableNotification?: boolean;
}

export interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
  error_code?: number;
}

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegramMessage(message: TelegramMessage): Promise<TelegramResponse> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.warn('[TelegramBot] TELEGRAM_BOT_TOKEN not configured');
    return { ok: false, description: 'Bot token not configured' };
  }
  
  try {
    const response = await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: message.chatId,
        text: message.text,
        parse_mode: message.parseMode || 'HTML',
        disable_notification: message.disableNotification || false,
      }),
    });
    
    const data = await response.json() as TelegramResponse;
    
    if (!data.ok) {
      console.error('[TelegramBot] Failed to send message:', data.description);
    }
    
    return data;
  } catch (error) {
    console.error('[TelegramBot] Error sending message:', error);
    return { ok: false, description: String(error) };
  }
}

/**
 * Format points notification for Telegram
 */
export function formatPointsNotificationForTelegram(
  type: string,
  amount: number,
  newBalance: number,
  description?: string
): string {
  const formattedAmount = new Intl.NumberFormat('ru-RU').format(Math.abs(amount));
  const formattedBalance = new Intl.NumberFormat('ru-RU').format(newBalance);
  const isCredit = amount > 0;
  
  const emoji = isCredit ? '💰' : '💸';
  const action = isCredit ? 'Начислено' : 'Списано';
  const sign = isCredit ? '+' : '-';
  
  let typeLabel = '';
  switch (type) {
    case 'task_completion':
      typeLabel = '✨ Выполнение задания';
      break;
    case 'order_reward':
      typeLabel = '☕ Кэшбэк за заказ';
      break;
    case 'referral_bonus':
      typeLabel = '👥 Реферальный бонус';
      break;
    case 'admin_adjustment':
      typeLabel = isCredit ? '⚙️ Начисление' : '⚙️ Корректировка';
      break;
    case 'redemption':
      typeLabel = '🛒 Оплата баллами';
      break;
    case 'expiration':
      typeLabel = '⏰ Истечение срока';
      break;
    default:
      typeLabel = isCredit ? '💰 Начисление' : '💸 Списание';
  }
  
  let message = `${emoji} <b>${typeLabel}</b>\n\n`;
  message += `${action}: <b>${sign}${formattedAmount}</b> баллов\n`;
  
  if (description) {
    message += `📝 ${description}\n`;
  }
  
  message += `\n💳 Баланс: <b>${formattedBalance}</b> баллов`;
  
  return message;
}

/**
 * Send points notification via Telegram
 */
export async function sendPointsNotificationTelegram(
  telegramId: string,
  type: string,
  amount: number,
  newBalance: number,
  description?: string
): Promise<boolean> {
  const text = formatPointsNotificationForTelegram(type, amount, newBalance, description);
  
  const response = await sendTelegramMessage({
    chatId: telegramId,
    text,
    parseMode: 'HTML',
  });
  
  return response.ok;
}
