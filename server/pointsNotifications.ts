/**
 * Points Notifications Helper
 * Generates notification content for points transactions
 */

export type PointsTransactionType = 
  | 'task_completion' 
  | 'order_reward' 
  | 'referral_bonus' 
  | 'admin_adjustment' 
  | 'redemption' 
  | 'expiration';

export interface PointsNotification {
  title: string;
  message: string;
}

/**
 * Generate notification content for points transactions
 */
export function getPointsNotification(
  type: PointsTransactionType,
  amount: number,
  newBalance: number,
  description?: string
): PointsNotification {
  const formattedAmount = new Intl.NumberFormat('ru-RU').format(Math.abs(amount));
  const formattedBalance = new Intl.NumberFormat('ru-RU').format(newBalance);
  const isCredit = amount > 0;
  
  switch (type) {
    case 'task_completion':
      return {
        title: 'Задание выполнено!',
        message: `Вам начислено +${formattedAmount} баллов за выполнение задания. Баланс: ${formattedBalance} баллов.`,
      };
    
    case 'order_reward':
      return {
        title: 'Кэшбэк за заказ!',
        message: `Вам начислено +${formattedAmount} баллов кэшбэка за заказ. Баланс: ${formattedBalance} баллов.`,
      };
    
    case 'referral_bonus':
      return {
        title: 'Реферальный бонус!',
        message: `Вам начислено +${formattedAmount} баллов за приглашение друга. Баланс: ${formattedBalance} баллов.`,
      };
    
    case 'admin_adjustment':
      if (isCredit) {
        return {
          title: 'Начисление баллов',
          message: `Вам начислено +${formattedAmount} баллов${description ? `: ${description}` : ''}. Баланс: ${formattedBalance} баллов.`,
        };
      } else {
        return {
          title: 'Корректировка баланса',
          message: `Списано -${formattedAmount} баллов${description ? `: ${description}` : ''}. Баланс: ${formattedBalance} баллов.`,
        };
      }
    
    case 'redemption':
      return {
        title: 'Оплата баллами',
        message: `Списано -${formattedAmount} баллов для оплаты заказа. Баланс: ${formattedBalance} баллов.`,
      };
    
    case 'expiration':
      return {
        title: 'Баллы истекли',
        message: `Сгорело -${formattedAmount} баллов в связи с истечением срока. Баланс: ${formattedBalance} баллов.`,
      };
    
    default:
      if (isCredit) {
        return {
          title: 'Начисление баллов',
          message: `Вам начислено +${formattedAmount} баллов. Баланс: ${formattedBalance} баллов.`,
        };
      } else {
        return {
          title: 'Списание баллов',
          message: `Списано -${formattedAmount} баллов. Баланс: ${formattedBalance} баллов.`,
        };
      }
  }
}
