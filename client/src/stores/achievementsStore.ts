/**
 * Achievements Store
 * Tracks unlocked achievements and manages achievement unlock modal
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Badge definition for the store
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon name as string for storage
  category: 'orders' | 'social' | 'loyalty' | 'special';
  color: string;
  bgColor: string;
}

interface AchievementsState {
  // Set of unlocked achievement IDs that user has seen
  seenAchievements: string[];
  
  // Queue of newly unlocked achievements to show
  pendingAchievements: BadgeDefinition[];
  
  // Currently showing achievement
  currentAchievement: BadgeDefinition | null;
  
  // Actions
  markAsSeen: (achievementId: string) => void;
  addPendingAchievement: (achievement: BadgeDefinition) => void;
  showNextAchievement: () => void;
  dismissCurrentAchievement: () => void;
  hasSeenAchievement: (achievementId: string) => boolean;
  checkAndQueueNewAchievements: (unlockedIds: string[], allBadges: BadgeDefinition[]) => BadgeDefinition[];
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      seenAchievements: [],
      pendingAchievements: [],
      currentAchievement: null,

      markAsSeen: (achievementId) => {
        set((state) => ({
          seenAchievements: Array.from(new Set([...state.seenAchievements, achievementId])),
        }));
      },

      addPendingAchievement: (achievement) => {
        set((state) => ({
          pendingAchievements: [...state.pendingAchievements, achievement],
        }));
      },

      showNextAchievement: () => {
        const { pendingAchievements } = get();
        if (pendingAchievements.length > 0) {
          const [next, ...rest] = pendingAchievements;
          set({
            currentAchievement: next,
            pendingAchievements: rest,
          });
        }
      },

      dismissCurrentAchievement: () => {
        const { currentAchievement, pendingAchievements } = get();
        
        if (currentAchievement) {
          // Mark as seen
          set((state) => ({
            seenAchievements: Array.from(new Set([...state.seenAchievements, currentAchievement.id])),
            currentAchievement: null,
          }));
          
          // Show next if available
          setTimeout(() => {
            if (pendingAchievements.length > 0) {
              get().showNextAchievement();
            }
          }, 300);
        }
      },

      hasSeenAchievement: (achievementId) => {
        return get().seenAchievements.includes(achievementId);
      },

      checkAndQueueNewAchievements: (unlockedIds, allBadges) => {
        const { seenAchievements, pendingAchievements, currentAchievement } = get();
        
        // Find newly unlocked achievements that haven't been seen
        const newAchievements = allBadges.filter(
          (badge) => 
            unlockedIds.includes(badge.id) && 
            !seenAchievements.includes(badge.id) &&
            !pendingAchievements.some(p => p.id === badge.id) &&
            currentAchievement?.id !== badge.id
        );
        
        if (newAchievements.length > 0) {
          set((state) => ({
            pendingAchievements: [...state.pendingAchievements, ...newAchievements],
          }));
          
          // If no achievement is currently showing, show the first one
          if (!currentAchievement) {
            setTimeout(() => {
              get().showNextAchievement();
            }, 500);
          }
        }
        
        return newAchievements;
      },
    }),
    {
      name: 'vendhub-achievements',
      partialize: (state) => ({
        seenAchievements: state.seenAchievements,
      }),
    }
  )
);
