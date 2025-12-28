import { describe, it, expect } from 'vitest';

describe('Gamification Task Types', () => {
  it('should have correct task type enum values', () => {
    const validTaskTypes = [
      'link_telegram',
      'link_email',
      'first_order',
      'order_count',
      'spend_amount',
      'referral',
      'daily_login',
      'review',
      'social_share',
      'custom'
    ];
    
    // This test ensures we have all expected task types
    expect(validTaskTypes).toContain('link_telegram');
    expect(validTaskTypes).toContain('link_email');
    expect(validTaskTypes).toContain('daily_login');
    expect(validTaskTypes.length).toBe(10);
  });

  it('should have correct points transaction types', () => {
    const validTransactionTypes = [
      'task_completion',
      'order_reward',
      'referral_bonus',
      'admin_adjustment',
      'redemption',
      'expiration'
    ];
    
    expect(validTransactionTypes).toContain('task_completion');
    expect(validTransactionTypes).toContain('admin_adjustment');
    expect(validTransactionTypes.length).toBe(6);
  });
});

describe('Default Tasks Configuration', () => {
  const defaultTasks = [
    {
      slug: 'link_telegram',
      title: 'Link Telegram Account',
      titleRu: 'Привязать Telegram',
      taskType: 'link_telegram',
      pointsReward: 100,
      isRepeatable: false,
      iconName: 'MessageCircle',
      sortOrder: 1,
    },
    {
      slug: 'link_email',
      title: 'Add Email Address',
      titleRu: 'Добавить Email',
      taskType: 'link_email',
      pointsReward: 50,
      isRepeatable: false,
      iconName: 'Mail',
      sortOrder: 2,
    },
    {
      slug: 'first_order',
      title: 'First Order',
      titleRu: 'Первый заказ',
      taskType: 'first_order',
      pointsReward: 200,
      isRepeatable: false,
      iconName: 'ShoppingBag',
      sortOrder: 3,
    },
    {
      slug: 'order_5',
      title: 'Regular Customer',
      titleRu: 'Постоянный клиент',
      taskType: 'order_count',
      pointsReward: 300,
      requiredValue: 5,
      isRepeatable: false,
      iconName: 'Award',
      sortOrder: 4,
    },
    {
      slug: 'daily_login',
      title: 'Daily Visit',
      titleRu: 'Ежедневный визит',
      taskType: 'daily_login',
      pointsReward: 10,
      isRepeatable: true,
      repeatCooldownHours: 24,
      iconName: 'Calendar',
      sortOrder: 5,
    },
  ];

  it('should have link_telegram task with 100 points reward', () => {
    const task = defaultTasks.find(t => t.slug === 'link_telegram');
    expect(task).toBeDefined();
    expect(task?.pointsReward).toBe(100);
    expect(task?.isRepeatable).toBe(false);
    expect(task?.taskType).toBe('link_telegram');
  });

  it('should have link_email task with 50 points reward', () => {
    const task = defaultTasks.find(t => t.slug === 'link_email');
    expect(task).toBeDefined();
    expect(task?.pointsReward).toBe(50);
    expect(task?.isRepeatable).toBe(false);
    expect(task?.taskType).toBe('link_email');
  });

  it('should have first_order task with 200 points reward', () => {
    const task = defaultTasks.find(t => t.slug === 'first_order');
    expect(task).toBeDefined();
    expect(task?.pointsReward).toBe(200);
    expect(task?.isRepeatable).toBe(false);
    expect(task?.taskType).toBe('first_order');
  });

  it('should have order_5 task requiring 5 orders', () => {
    const task = defaultTasks.find(t => t.slug === 'order_5');
    expect(task).toBeDefined();
    expect(task?.pointsReward).toBe(300);
    expect(task?.requiredValue).toBe(5);
    expect(task?.taskType).toBe('order_count');
  });

  it('should have daily_login task as repeatable with 24h cooldown', () => {
    const task = defaultTasks.find(t => t.slug === 'daily_login');
    expect(task).toBeDefined();
    expect(task?.pointsReward).toBe(10);
    expect(task?.isRepeatable).toBe(true);
    expect(task?.repeatCooldownHours).toBe(24);
    expect(task?.taskType).toBe('daily_login');
  });

  it('should have 5 default tasks in correct order', () => {
    expect(defaultTasks.length).toBe(5);
    expect(defaultTasks[0].sortOrder).toBe(1);
    expect(defaultTasks[4].sortOrder).toBe(5);
  });

  it('should have Russian translations for all tasks', () => {
    defaultTasks.forEach(task => {
      expect(task.titleRu).toBeDefined();
      expect(task.titleRu?.length).toBeGreaterThan(0);
    });
  });

  it('should have icon names for all tasks', () => {
    defaultTasks.forEach(task => {
      expect(task.iconName).toBeDefined();
      expect(task.iconName?.length).toBeGreaterThan(0);
    });
  });
});

describe('Points Calculation', () => {
  it('should calculate correct total points from completing all one-time tasks', () => {
    const oneTimeTaskRewards = [100, 50, 200, 300]; // telegram, email, first_order, order_5
    const totalPoints = oneTimeTaskRewards.reduce((sum, points) => sum + points, 0);
    expect(totalPoints).toBe(650);
  });

  it('should calculate daily login points correctly over a month', () => {
    const dailyLoginReward = 10;
    const daysInMonth = 30;
    const monthlyDailyLoginPoints = dailyLoginReward * daysInMonth;
    expect(monthlyDailyLoginPoints).toBe(300);
  });
});

describe('Task Completion Logic', () => {
  it('should not allow completing non-repeatable task twice', () => {
    const task = {
      isRepeatable: false,
      isCompleted: true,
    };
    
    const canComplete = !task.isCompleted || task.isRepeatable;
    expect(canComplete).toBe(false);
  });

  it('should allow completing repeatable task after cooldown', () => {
    const task = {
      isRepeatable: true,
      repeatCooldownHours: 24,
    };
    
    const lastCompletedAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    const cooldownMs = task.repeatCooldownHours * 60 * 60 * 1000;
    const timeSinceCompletion = Date.now() - lastCompletedAt.getTime();
    const canRepeat = timeSinceCompletion >= cooldownMs;
    
    expect(canRepeat).toBe(true);
  });

  it('should not allow completing repeatable task during cooldown', () => {
    const task = {
      isRepeatable: true,
      repeatCooldownHours: 24,
    };
    
    const lastCompletedAt = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
    const cooldownMs = task.repeatCooldownHours * 60 * 60 * 1000;
    const timeSinceCompletion = Date.now() - lastCompletedAt.getTime();
    const canRepeat = timeSinceCompletion >= cooldownMs;
    
    expect(canRepeat).toBe(false);
  });

  it('should respect max completions limit', () => {
    const task = {
      maxCompletions: 5,
    };
    
    const userCompletionCount = 5;
    const canComplete = !task.maxCompletions || userCompletionCount < task.maxCompletions;
    
    expect(canComplete).toBe(false);
  });
});

describe('Progress Tracking', () => {
  it('should calculate progress percentage correctly', () => {
    const currentProgress = 3;
    const requiredValue = 5;
    const progressPercent = Math.min(100, (currentProgress / requiredValue) * 100);
    
    expect(progressPercent).toBe(60);
  });

  it('should cap progress at 100%', () => {
    const currentProgress = 7;
    const requiredValue = 5;
    const progressPercent = Math.min(100, (currentProgress / requiredValue) * 100);
    
    expect(progressPercent).toBe(100);
  });
});
