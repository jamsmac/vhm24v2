import cron from 'node-cron';
import * as db from './db';

// Timezone for Uzbekistan (UTC+5)
const TIMEZONE = 'Asia/Tashkent';

/**
 * Reset daily quest progress for all users at midnight
 */
async function resetDailyQuestProgress(): Promise<void> {
  console.log('[Scheduler] Starting daily quest reset...');
  
  try {
    const database = await db.getDb();
    if (!database) {
      console.warn('[Scheduler] Database not available, skipping quest reset');
      return;
    }

    // Reset all user daily quest progress (not weekly)
    const { userDailyQuestProgress, dailyQuests } = await import('../drizzle/schema');
    const { eq, and, inArray } = await import('drizzle-orm');
    
    // Get all daily (non-weekly) quest IDs
    const dailyQuestsList = await database.select({ id: dailyQuests.id })
      .from(dailyQuests)
      .where(and(eq(dailyQuests.isActive, true), eq(dailyQuests.isWeekly, false)));
    
    const dailyQuestIds = dailyQuestsList.map(q => q.id);
    
    if (dailyQuestIds.length > 0) {
      // Reset progress for daily quests only
      await database.update(userDailyQuestProgress)
        .set({ 
          currentValue: 0, 
          isCompleted: false, 
          rewardClaimed: false
        })
        .where(inArray(userDailyQuestProgress.questId, dailyQuestIds));
      
      console.log(`[Scheduler] Reset progress for ${dailyQuestIds.length} daily quests`);
    }

    // Send notifications to all active users
    await db.notifyAllUsersAboutNewQuests();
    console.log('[Scheduler] Sent new quest notifications to all active users');
    
  } catch (error) {
    console.error('[Scheduler] Error during daily quest reset:', error);
  }
}

/**
 * Reset weekly quest progress on Monday at midnight
 */
async function resetWeeklyQuestProgress(): Promise<void> {
  console.log('[Scheduler] Starting weekly quest reset...');
  
  try {
    const database = await db.getDb();
    if (!database) {
      console.warn('[Scheduler] Database not available, skipping weekly quest reset');
      return;
    }

    const { userDailyQuestProgress, dailyQuests } = await import('../drizzle/schema');
    const { eq, and, inArray } = await import('drizzle-orm');
    
    // Get all weekly quest IDs
    const weeklyQuestsList = await database.select({ id: dailyQuests.id })
      .from(dailyQuests)
      .where(and(eq(dailyQuests.isActive, true), eq(dailyQuests.isWeekly, true)));
    
    const weeklyQuestIds = weeklyQuestsList.map(q => q.id);
    
    if (weeklyQuestIds.length > 0) {
      // Reset progress for weekly quests
      await database.update(userDailyQuestProgress)
        .set({ 
          currentValue: 0, 
          isCompleted: false, 
          rewardClaimed: false
        })
        .where(inArray(userDailyQuestProgress.questId, weeklyQuestIds));
      
      console.log(`[Scheduler] Reset progress for ${weeklyQuestIds.length} weekly quests`);
    }
    
  } catch (error) {
    console.error('[Scheduler] Error during weekly quest reset:', error);
  }
}

/**
 * Initialize all scheduled tasks
 */
export function initScheduledTasks(): void {
  console.log('[Scheduler] Initializing scheduled tasks...');
  
  // Daily quest reset at midnight (00:00) Tashkent time
  // Cron format: second minute hour day-of-month month day-of-week
  cron.schedule('0 0 0 * * *', async () => {
    console.log('[Scheduler] Midnight trigger - resetting daily quests');
    await resetDailyQuestProgress();
  }, {
    timezone: TIMEZONE
  });
  
  // Weekly quest reset on Monday at midnight (00:00) Tashkent time
  // day-of-week: 1 = Monday
  cron.schedule('0 0 0 * * 1', async () => {
    console.log('[Scheduler] Monday midnight trigger - resetting weekly quests');
    await resetWeeklyQuestProgress();
  }, {
    timezone: TIMEZONE
  });
  
  console.log('[Scheduler] Scheduled tasks initialized:');
  console.log('  - Daily quest reset: Every day at 00:00 (Asia/Tashkent)');
  console.log('  - Weekly quest reset: Every Monday at 00:00 (Asia/Tashkent)');
}

/**
 * Manually trigger daily quest reset (for testing/admin use)
 */
export async function triggerDailyReset(): Promise<void> {
  await resetDailyQuestProgress();
}

/**
 * Manually trigger weekly quest reset (for testing/admin use)
 */
export async function triggerWeeklyReset(): Promise<void> {
  await resetWeeklyQuestProgress();
}
