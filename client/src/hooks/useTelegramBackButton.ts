import { useEffect, useCallback, useRef } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { useLocation } from 'wouter';

/**
 * Hook to manage Telegram BackButton
 * 
 * Usage:
 * useTelegramBackButton({
 *   isVisible: true,
 *   onClick: () => navigate('/') // optional custom handler
 * });
 */
export function useTelegramBackButton(options?: {
  isVisible?: boolean;
  onClick?: () => void;
}) {
  const { webApp, isTelegram } = useTelegram();
  const [, setLocation] = useLocation();
  const callbackRef = useRef<(() => void) | null>(null);

  // Store the callback in a ref
  useEffect(() => {
    callbackRef.current = options?.onClick || null;
  }, [options?.onClick]);

  useEffect(() => {
    if (!isTelegram || !webApp?.BackButton) return;

    const backButton = webApp.BackButton;

    // Default handler - go back in history or navigate to home
    const handleClick = () => {
      if (callbackRef.current) {
        callbackRef.current();
      } else {
        // Default behavior: go back or navigate to home
        if (window.history.length > 1) {
          window.history.back();
        } else {
          setLocation('/');
        }
      }
    };

    backButton.onClick(handleClick);

    // Show/hide based on options
    if (options?.isVisible !== false) {
      backButton.show();
    } else {
      backButton.hide();
    }

    return () => {
      backButton.offClick(handleClick);
      backButton.hide();
    };
  }, [isTelegram, webApp, setLocation, options?.isVisible]);

  // Show the button
  const show = useCallback(() => {
    if (isTelegram && webApp?.BackButton) {
      webApp.BackButton.show();
    }
  }, [isTelegram, webApp]);

  // Hide the button
  const hide = useCallback(() => {
    if (isTelegram && webApp?.BackButton) {
      webApp.BackButton.hide();
    }
  }, [isTelegram, webApp]);

  return {
    show,
    hide,
    isAvailable: isTelegram && !!webApp?.BackButton,
  };
}

export default useTelegramBackButton;
