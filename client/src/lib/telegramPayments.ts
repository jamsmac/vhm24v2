/**
 * VendHub TWA - Telegram Payments Integration Guide
 * 
 * This file contains types and utilities for Telegram Payments integration.
 * 
 * SETUP GUIDE:
 * 
 * 1. Configure Payment Provider in BotFather:
 *    - Open @BotFather in Telegram
 *    - Send /mybots and select your bot
 *    - Go to "Payments" section
 *    - Choose a payment provider (e.g., Stripe, YooMoney, etc.)
 *    - Follow the setup instructions to get your PAYMENT_PROVIDER_TOKEN
 * 
 * 2. Backend Implementation:
 *    - Create an endpoint to generate invoice links using Bot API
 *    - Store the PAYMENT_PROVIDER_TOKEN securely on your server
 *    - Never expose the token to the frontend
 * 
 * 3. Handle Payment Updates:
 *    - Set up a webhook to receive payment updates
 *    - Process successful_payment updates to fulfill orders
 *    - Handle pre_checkout_query to validate orders before payment
 */

// Invoice item for Telegram Payments
export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Invoice request data
export interface InvoiceRequest {
  items: InvoiceItem[];
  total: number;
  currency: string;
  description?: string;
  machineId?: string;
  machineName?: string;
  promoCode?: string;
  discount?: number;
  userId?: number;
}

// Invoice response from backend
export interface InvoiceResponse {
  invoiceUrl: string;
  invoiceId: string;
}

// Payment status from Telegram
export type PaymentStatus = 'paid' | 'cancelled' | 'failed' | 'pending';

// LabeledPrice for Bot API
export interface LabeledPrice {
  label: string;
  amount: number; // Amount in smallest currency unit (e.g., cents for USD)
}

/**
 * Convert invoice items to LabeledPrice array for Bot API
 * @param items - Cart items
 * @param currency - Currency code (e.g., 'UZS', 'USD')
 * @returns Array of LabeledPrice objects
 */
export function itemsToLabeledPrices(items: InvoiceItem[], currency: string): LabeledPrice[] {
  // For UZS, amount is in tiyin (1 UZS = 100 tiyin)
  // For USD, amount is in cents (1 USD = 100 cents)
  const multiplier = getCurrencyMultiplier(currency);
  
  return items.map(item => ({
    label: `${item.name} x${item.quantity}`,
    amount: Math.round(item.price * item.quantity * multiplier),
  }));
}

/**
 * Get currency multiplier for converting to smallest unit
 * @param currency - Currency code
 * @returns Multiplier (usually 100 for most currencies)
 */
export function getCurrencyMultiplier(currency: string): number {
  // Most currencies use 100 (cents, tiyin, etc.)
  // Some currencies like JPY use 1 (no decimal places)
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND'];
  return noDecimalCurrencies.includes(currency.toUpperCase()) ? 1 : 100;
}

/**
 * Format price for display
 * @param amount - Amount in smallest currency unit
 * @param currency - Currency code
 * @returns Formatted price string
 */
export function formatInvoicePrice(amount: number, currency: string): string {
  const multiplier = getCurrencyMultiplier(currency);
  const value = amount / multiplier;
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: multiplier === 1 ? 0 : 2,
  }).format(value);
}

/**
 * Example backend implementation (Node.js with node-telegram-bot-api):
 * 
 * ```javascript
 * const TelegramBot = require('node-telegram-bot-api');
 * const express = require('express');
 * 
 * const bot = new TelegramBot(process.env.BOT_TOKEN);
 * const app = express();
 * 
 * // Create invoice link endpoint
 * app.post('/api/telegram/create-invoice', async (req, res) => {
 *   const { items, total, currency, description, userId } = req.body;
 *   
 *   const prices = items.map(item => ({
 *     label: `${item.name} x${item.quantity}`,
 *     amount: item.price * item.quantity * 100, // Convert to smallest unit
 *   }));
 *   
 *   // Add discount if applicable
 *   if (req.body.discount > 0) {
 *     prices.push({
 *       label: 'Скидка',
 *       amount: -req.body.discount * 100,
 *     });
 *   }
 *   
 *   try {
 *     const invoiceLink = await bot.createInvoiceLink(
 *       'VendHub Coffee',                    // title
 *       description || 'Заказ кофе',         // description
 *       JSON.stringify({                     // payload (sent to bot on payment)
 *         items,
 *         total,
 *         userId,
 *         machineId: req.body.machineId,
 *         timestamp: Date.now(),
 *       }),
 *       process.env.PAYMENT_PROVIDER_TOKEN,  // provider token from BotFather
 *       currency,                            // currency code
 *       prices,                              // array of LabeledPrice
 *       {
 *         photo_url: 'https://example.com/coffee.jpg',
 *         photo_width: 512,
 *         photo_height: 512,
 *         need_name: false,
 *         need_phone_number: false,
 *         need_email: false,
 *         need_shipping_address: false,
 *         is_flexible: false,
 *       }
 *     );
 *     
 *     res.json({ 
 *       invoiceUrl: invoiceLink,
 *       invoiceId: `inv_${Date.now()}`,
 *     });
 *   } catch (error) {
 *     console.error('Invoice creation error:', error);
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 * 
 * // Handle pre-checkout query (validate order before payment)
 * bot.on('pre_checkout_query', async (query) => {
 *   try {
 *     const payload = JSON.parse(query.invoice_payload);
 *     
 *     // Validate order (check stock, prices, etc.)
 *     const isValid = await validateOrder(payload);
 *     
 *     if (isValid) {
 *       await bot.answerPreCheckoutQuery(query.id, true);
 *     } else {
 *       await bot.answerPreCheckoutQuery(query.id, false, {
 *         error_message: 'Товар недоступен. Попробуйте позже.',
 *       });
 *     }
 *   } catch (error) {
 *     await bot.answerPreCheckoutQuery(query.id, false, {
 *       error_message: 'Ошибка обработки заказа.',
 *     });
 *   }
 * });
 * 
 * // Handle successful payment
 * bot.on('message', async (msg) => {
 *   if (msg.successful_payment) {
 *     const payment = msg.successful_payment;
 *     const payload = JSON.parse(payment.invoice_payload);
 *     
 *     // Process the order
 *     await processOrder({
 *       userId: msg.from.id,
 *       chatId: msg.chat.id,
 *       payload,
 *       telegramPaymentChargeId: payment.telegram_payment_charge_id,
 *       providerPaymentChargeId: payment.provider_payment_charge_id,
 *       totalAmount: payment.total_amount,
 *       currency: payment.currency,
 *     });
 *     
 *     // Send confirmation message
 *     await bot.sendMessage(msg.chat.id, 
 *       '✅ Оплата успешна! Ваш заказ готовится.',
 *       { parse_mode: 'HTML' }
 *     );
 *   }
 * });
 * ```
 */

// Supported currencies for Telegram Payments
export const SUPPORTED_CURRENCIES = [
  'UZS', // Uzbek Som
  'USD', // US Dollar
  'EUR', // Euro
  'RUB', // Russian Ruble
  'GBP', // British Pound
  'UAH', // Ukrainian Hryvnia
  'KZT', // Kazakhstani Tenge
  // Add more as needed
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

/**
 * Check if currency is supported by Telegram Payments
 * @param currency - Currency code to check
 * @returns Whether the currency is supported
 */
export function isCurrencySupported(currency: string): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(currency.toUpperCase() as SupportedCurrency);
}
