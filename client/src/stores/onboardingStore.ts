/**
 * Onboarding Store
 * 
 * Manages first-time user detection and onboarding completion state
 * Persists to localStorage to remember returning users
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  onboardingVersion: number; // Increment to show onboarding again after major updates
  completedAt: string | null;
  
  // Actions
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  shouldShowOnboarding: () => boolean;
}

// Current onboarding version - increment this to show onboarding again
const CURRENT_ONBOARDING_VERSION = 1;

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      onboardingVersion: 0,
      completedAt: null,

      completeOnboarding: () => {
        set({
          hasCompletedOnboarding: true,
          onboardingVersion: CURRENT_ONBOARDING_VERSION,
          completedAt: new Date().toISOString()
        });
      },

      resetOnboarding: () => {
        set({
          hasCompletedOnboarding: false,
          onboardingVersion: 0,
          completedAt: null
        });
      },

      shouldShowOnboarding: () => {
        const state = get();
        // Show onboarding if:
        // 1. User hasn't completed it yet
        // 2. Or if there's a new version of onboarding
        return !state.hasCompletedOnboarding || 
               state.onboardingVersion < CURRENT_ONBOARDING_VERSION;
      }
    }),
    {
      name: 'vendhub-onboarding',
      version: 1
    }
  )
);
