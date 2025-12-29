import confetti from 'canvas-confetti';
import { useCallback } from 'react';

export type ConfettiType = 'bonus' | 'levelUp' | 'achievement' | 'firstOrder' | 'welcome';

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  duration?: number;
}

const defaultColors = {
  bonus: ['#FFD700', '#FFA500', '#FF8C00', '#DAA520'], // Gold tones
  levelUp: ['#9333EA', '#A855F7', '#C084FC', '#E879F9'], // Purple tones
  achievement: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'], // Green tones
  firstOrder: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'], // Blue tones
  welcome: ['#D4A574', '#8B6914', '#FFD700', '#FFA500'], // Coffee/gold tones
};

export function useConfetti() {
  const fireConfetti = useCallback((type: ConfettiType, options?: ConfettiOptions) => {
    const colors = options?.colors || defaultColors[type] || defaultColors.bonus;
    
    const defaults: confetti.Options = {
      particleCount: options?.particleCount || 100,
      spread: options?.spread || 70,
      origin: options?.origin || { y: 0.6, x: 0.5 },
      colors,
      disableForReducedMotion: true,
    };

    // Different animations for different types
    switch (type) {
      case 'levelUp':
        // Spectacular burst from both sides
        confetti({
          ...defaults,
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          ...defaults,
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
        // Center burst after delay
        setTimeout(() => {
          confetti({
            ...defaults,
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5, x: 0.5 },
            scalar: 1.2,
          });
        }, 200);
        break;

      case 'achievement':
        // Stars falling from top
        confetti({
          ...defaults,
          particleCount: 80,
          spread: 180,
          origin: { y: 0, x: 0.5 },
          gravity: 0.8,
          shapes: ['star'],
          scalar: 1.5,
        });
        break;

      case 'firstOrder':
        // Celebration burst
        const duration = options?.duration || 2000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors,
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors,
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
        break;

      case 'welcome':
        // Coffee-themed celebration
        confetti({
          ...defaults,
          particleCount: 120,
          spread: 90,
          origin: { y: 0.7, x: 0.5 },
          scalar: 1.1,
        });
        setTimeout(() => {
          confetti({
            ...defaults,
            particleCount: 60,
            spread: 60,
            origin: { y: 0.5, x: 0.3 },
          });
          confetti({
            ...defaults,
            particleCount: 60,
            spread: 60,
            origin: { y: 0.5, x: 0.7 },
          });
        }, 150);
        break;

      case 'bonus':
      default:
        // Standard gold confetti burst
        confetti({
          ...defaults,
          particleCount: 100,
          spread: 70,
        });
        break;
    }
  }, []);

  const fireEmoji = useCallback((emoji: string, count: number = 30) => {
    const scalar = 2;
    const emojiShape = confetti.shapeFromText({ text: emoji, scalar });

    confetti({
      shapes: [emojiShape],
      scalar,
      particleCount: count,
      spread: 100,
      origin: { y: 0.6 },
      disableForReducedMotion: true,
    });
  }, []);

  return { fireConfetti, fireEmoji };
}

export default useConfetti;
