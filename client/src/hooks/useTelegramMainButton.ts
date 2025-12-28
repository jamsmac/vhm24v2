import { useEffect, useCallback, useRef } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';

interface MainButtonOptions {
  text: string;
  color?: string;
  textColor?: string;
  isActive?: boolean;
  isVisible?: boolean;
}

/**
 * Hook to manage Telegram MainButton
 * 
 * Usage:
 * const { show, hide, setText, showProgress, hideProgress, setParams } = useTelegramMainButton({
 *   text: 'Оформить заказ',
 *   onClick: () => handleCheckout()
 * });
 */
export function useTelegramMainButton(
  options: MainButtonOptions & { onClick?: () => void }
) {
  const { webApp, isTelegram } = useTelegram();
  const callbackRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef(false);

  // Store the callback in a ref to avoid re-registering on every render
  useEffect(() => {
    callbackRef.current = options.onClick || null;
  }, [options.onClick]);

  // Initialize MainButton
  useEffect(() => {
    if (!isTelegram || !webApp?.MainButton) return;

    const mainButton = webApp.MainButton;

    // Set initial text
    if (options.text) {
      mainButton.setText(options.text);
    }

    // Set colors if provided
    if (options.color) {
      mainButton.color = options.color;
    }
    if (options.textColor) {
      mainButton.textColor = options.textColor;
    }

    // Set active state
    if (options.isActive !== undefined) {
      if (options.isActive) {
        mainButton.enable();
      } else {
        mainButton.disable();
      }
    }

    // Register click handler
    const handleClick = () => {
      if (callbackRef.current) {
        callbackRef.current();
      }
    };

    mainButton.onClick(handleClick);

    // Show button if specified
    if (options.isVisible !== false) {
      mainButton.show();
    }

    isInitializedRef.current = true;

    // Cleanup on unmount
    return () => {
      mainButton.offClick(handleClick);
      mainButton.hide();
      isInitializedRef.current = false;
    };
  }, [isTelegram, webApp]);

  // Update text when it changes
  useEffect(() => {
    if (!isTelegram || !webApp?.MainButton || !isInitializedRef.current) return;
    webApp.MainButton.setText(options.text);
  }, [options.text, isTelegram, webApp]);

  // Show the button
  const show = useCallback(() => {
    if (isTelegram && webApp?.MainButton) {
      webApp.MainButton.show();
    }
  }, [isTelegram, webApp]);

  // Hide the button
  const hide = useCallback(() => {
    if (isTelegram && webApp?.MainButton) {
      webApp.MainButton.hide();
    }
  }, [isTelegram, webApp]);

  // Set button text
  const setText = useCallback((text: string) => {
    if (isTelegram && webApp?.MainButton) {
      webApp.MainButton.setText(text);
    }
  }, [isTelegram, webApp]);

  // Enable the button
  const enable = useCallback(() => {
    if (isTelegram && webApp?.MainButton) {
      webApp.MainButton.enable();
    }
  }, [isTelegram, webApp]);

  // Disable the button
  const disable = useCallback(() => {
    if (isTelegram && webApp?.MainButton) {
      webApp.MainButton.disable();
    }
  }, [isTelegram, webApp]);

  // Show loading progress
  const showProgress = useCallback((leaveActive = false) => {
    if (isTelegram && webApp?.MainButton) {
      webApp.MainButton.showProgress(leaveActive);
    }
  }, [isTelegram, webApp]);

  // Hide loading progress
  const hideProgress = useCallback(() => {
    if (isTelegram && webApp?.MainButton) {
      webApp.MainButton.hideProgress();
    }
  }, [isTelegram, webApp]);

  // Set multiple parameters at once
  const setParams = useCallback((params: Partial<MainButtonOptions>) => {
    if (!isTelegram || !webApp?.MainButton) return;

    const mainButton = webApp.MainButton;

    if (params.text) {
      mainButton.setText(params.text);
    }
    if (params.color) {
      mainButton.color = params.color;
    }
    if (params.textColor) {
      mainButton.textColor = params.textColor;
    }
    if (params.isActive !== undefined) {
      if (params.isActive) {
        mainButton.enable();
      } else {
        mainButton.disable();
      }
    }
    if (params.isVisible !== undefined) {
      if (params.isVisible) {
        mainButton.show();
      } else {
        mainButton.hide();
      }
    }
  }, [isTelegram, webApp]);

  return {
    show,
    hide,
    setText,
    enable,
    disable,
    showProgress,
    hideProgress,
    setParams,
    isAvailable: isTelegram && !!webApp?.MainButton,
  };
}

export default useTelegramMainButton;
