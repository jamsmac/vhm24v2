/**
 * VendHub TWA - Telegram Invoice Hook
 * 
 * Hook for handling Telegram Payments via Invoice API
 * 
 * Usage:
 * const { openInvoice, isAvailable, isProcessing } = useTelegramInvoice();
 * 
 * // Open invoice for payment
 * const status = await openInvoice('https://t.me/$invoiceSlug');
 * if (status === 'paid') {
 *   // Handle successful payment
 * }
 */

import { useState, useCallback } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';

type InvoiceStatus = 'paid' | 'cancelled' | 'failed' | 'pending';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface InvoiceData {
  items: OrderItem[];
  total: number;
  currency?: string;
  description?: string;
  machineId?: string;
  machineName?: string;
  promoCode?: string;
  discount?: number;
}

interface UseTelegramInvoiceReturn {
  /**
   * Whether Telegram Invoice is available (only in Telegram WebApp)
   */
  isAvailable: boolean;
  
  /**
   * Whether an invoice is currently being processed
   */
  isProcessing: boolean;
  
  /**
   * Open a Telegram Invoice for payment
   * @param invoiceUrl - The invoice URL from Bot API
   * @returns Promise with payment status
   */
  openInvoice: (invoiceUrl: string) => Promise<InvoiceStatus>;
  
  /**
   * Create and open an invoice (requires backend integration)
   * This is a placeholder that simulates invoice creation
   * In production, this should call your backend to create an invoice via Bot API
   * @param data - Order data for the invoice
   * @returns Promise with payment status
   */
  createAndOpenInvoice: (data: InvoiceData) => Promise<InvoiceStatus>;
  
  /**
   * Last payment status
   */
  lastStatus: InvoiceStatus | null;
}

export function useTelegramInvoice(): UseTelegramInvoiceReturn {
  const { invoice, haptic, isTelegram } = useTelegram();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastStatus, setLastStatus] = useState<InvoiceStatus | null>(null);

  /**
   * Open a Telegram Invoice for payment
   */
  const openInvoice = useCallback(async (invoiceUrl: string): Promise<InvoiceStatus> => {
    setIsProcessing(true);
    haptic.impact('medium');
    
    try {
      const status = await invoice.openInvoice(invoiceUrl);
      setLastStatus(status);
      
      // Provide haptic feedback based on status
      if (status === 'paid') {
        haptic.notification('success');
      } else if (status === 'failed') {
        haptic.notification('error');
      } else {
        haptic.selection();
      }
      
      return status;
    } finally {
      setIsProcessing(false);
    }
  }, [invoice, haptic]);

  /**
   * Create and open an invoice
   * 
   * NOTE: This is a simulation for demo purposes.
   * In production, you need to:
   * 1. Set up a payment provider in BotFather (@BotFather -> /mybots -> your bot -> Payments)
   * 2. Create a backend endpoint that uses Bot API to create invoice:
   *    - POST https://api.telegram.org/bot<token>/createInvoiceLink
   *    - With parameters: title, description, payload, provider_token, currency, prices
   * 3. Return the invoice URL to the frontend
   * 4. Call openInvoice with the URL
   */
  const createAndOpenInvoice = useCallback(async (data: InvoiceData): Promise<InvoiceStatus> => {
    setIsProcessing(true);
    haptic.impact('medium');
    
    try {
      // In production, this would be an API call to your backend:
      // const response = await fetch('/api/create-invoice', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      // const { invoiceUrl } = await response.json();
      
      // For demo purposes, we'll simulate the invoice creation
      // and show a placeholder message
      if (!isTelegram) {
        // Fallback for non-Telegram environment
        console.log('Invoice data:', data);
        setLastStatus('pending');
        return 'pending';
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real implementation, you would get the invoice URL from your backend
      // For now, we'll return a demo status
      // const status = await invoice.openInvoice(invoiceUrl);
      
      // Demo: Show alert about missing backend integration
      // In production, remove this and use the actual invoice URL
      const demoInvoiceUrl = `https://t.me/$DEMO_INVOICE_${Date.now()}`;
      
      // Try to open the invoice (will fail with demo URL, but shows the flow)
      const status = await invoice.openInvoice(demoInvoiceUrl);
      setLastStatus(status);
      
      return status;
    } catch (error) {
      console.error('Invoice error:', error);
      setLastStatus('failed');
      haptic.notification('error');
      return 'failed';
    } finally {
      setIsProcessing(false);
    }
  }, [invoice, haptic, isTelegram]);

  return {
    isAvailable: invoice.isAvailable,
    isProcessing,
    openInvoice,
    createAndOpenInvoice,
    lastStatus,
  };
}

/**
 * Example backend implementation (Node.js/Express):
 * 
 * ```javascript
 * const TelegramBot = require('node-telegram-bot-api');
 * const bot = new TelegramBot(process.env.BOT_TOKEN);
 * 
 * app.post('/api/create-invoice', async (req, res) => {
 *   const { items, total, currency = 'UZS', description } = req.body;
 *   
 *   const prices = items.map(item => ({
 *     label: `${item.name} x${item.quantity}`,
 *     amount: item.price * item.quantity * 100, // Amount in smallest currency unit
 *   }));
 *   
 *   try {
 *     const invoiceLink = await bot.createInvoiceLink(
 *       'VendHub Coffee Order',           // title
 *       description || 'Coffee order',    // description
 *       JSON.stringify({ items, total }), // payload (will be sent to your bot on payment)
 *       process.env.PAYMENT_PROVIDER_TOKEN, // from BotFather
 *       currency,                         // currency code
 *       prices,                           // array of LabeledPrice
 *     );
 *     
 *     res.json({ invoiceUrl: invoiceLink });
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 * ```
 */
