import { Router, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import Task, { TaskStatus, TaskPriority } from '@/models/Task';
import User from '@/models/User';
import authenticate, { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// @route   GET /api/analytics/progress
// @desc    Get user progress trends (XP over time, tasks completed over time)
// @access  Private
router.get('/progress', authenticate, [
  query('period').optional().isIn(['week', 'month', 'year']).withMessage('Invalid period'),
], async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const userId = req.user!._id;
    const period = (req.query['period'] as string) || 'week';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Get user info
    const user = await User.findById(userId).select('level xp totalTasksCompleted createdAt');

    // Get completed tasks within the period
    const completedTasks = await Task.find({
      userId,
      status: TaskStatus.COMPLETED,
      completedAt: { $gte: startDate, $lte: endDate }
    }).sort({ completedAt: 1 });

    // Generate daily/weekly/monthly data points
    const dataPoints: Array<{
      date: string;
      tasksCompleted: number;
      xpEarned: number;
    }> = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTasks = completedTasks.filter(task => {
        if (!task.completedAt) return false;
        const completedAt = new Date(task.completedAt);
        return completedAt >= dayStart && completedAt <= dayEnd;
      });

      const dateStr = currentDate.toISOString().split('T')[0];
      dataPoints.push({
        date: dateStr || '',
        tasksCompleted: dayTasks.length,
        xpEarned: dayTasks.reduce((sum, task) => sum + task.points, 0)
      });

      // Move to next day (or week/month for longer periods)
      if (period === 'year') {
        currentDate.setDate(currentDate.getDate() + 7); // Weekly for year view
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Calculate streaks
    const allCompletedTasks = await Task.find({
      userId,
      status: TaskStatus.COMPLETED,
      completedAt: { $exists: true }
    }).sort({ completedAt: -1 });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate current streak (consecutive days with completed tasks)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasksByDay = new Map<string, boolean>();
    allCompletedTasks.forEach(task => {
      if (task.completedAt) {
        const dateKey = task.completedAt.toISOString().split('T')[0];
        if (dateKey) {
          tasksByDay.set(dateKey, true);
        }
      }
    });

    // Check current streak
    const checkDate = new Date(today);
    while (true) {
      const dateKey = checkDate.toISOString().split('T')[0];
      if (dateKey && tasksByDay.has(dateKey)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    const sortedDates = Array.from(tasksByDay.keys()).sort();
    sortedDates.forEach((dateKey, index) => {
      if (index === 0) {
        tempStreak = 1;
      } else {
        const prevDateKey = sortedDates[index - 1];
        if (prevDateKey) {
          const prevDate = new Date(prevDateKey);
          const currDate = new Date(dateKey);
          const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          level: user?.level || 1,
          xp: user?.xp || 0,
          totalTasksCompleted: user?.totalTasksCompleted || 0,
          memberSince: user?.createdAt
        },
        progress: dataPoints,
        streaks: {
          current: currentStreak,
          longest: longestStreak
        },
        periodSummary: {
          totalTasksCompleted: completedTasks.length,
          totalXpEarned: completedTasks.reduce((sum, task) => sum + task.points, 0),
          averageTasksPerDay: dataPoints.length > 0
            ? Math.round((completedTasks.length / dataPoints.length) * 10) / 10
            : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/productivity
// @desc    Get productivity insights (best days, peak hours, task distribution)
// @access  Private
router.get('/productivity', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;

    // Get all completed tasks
    const completedTasks = await Task.find({
      userId,
      status: TaskStatus.COMPLETED,
      completedAt: { $exists: true }
    });

    // Analyze by day of week
    const dayOfWeekStats: Record<string, { count: number; xp: number }> = {
      'Sunday': { count: 0, xp: 0 },
      'Monday': { count: 0, xp: 0 },
      'Tuesday': { count: 0, xp: 0 },
      'Wednesday': { count: 0, xp: 0 },
      'Thursday': { count: 0, xp: 0 },
      'Friday': { count: 0, xp: 0 },
      'Saturday': { count: 0, xp: 0 }
    };

    // Analyze by hour of day
    const hourStats: Record<number, { count: number; xp: number }> = {};
    for (let i = 0; i < 24; i++) {
      hourStats[i] = { count: 0, xp: 0 };
    }

    // Analyze by priority
    const priorityStats: Record<string, { count: number; xp: number }> = {
      [TaskPriority.LOW]: { count: 0, xp: 0 },
      [TaskPriority.MEDIUM]: { count: 0, xp: 0 },
      [TaskPriority.HIGH]: { count: 0, xp: 0 },
      [TaskPriority.URGENT]: { count: 0, xp: 0 }
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    completedTasks.forEach(task => {
      if (!task.completedAt) return;
      const completedAt = new Date(task.completedAt);
      const dayName = dayNames[completedAt.getDay()];
      const hour = completedAt.getHours();

      if (dayName && dayOfWeekStats[dayName]) {
        dayOfWeekStats[dayName].count++;
        dayOfWeekStats[dayName].xp += task.points;
      }

      const hourStat = hourStats[hour];
      if (hourStat) {
        hourStat.count++;
        hourStat.xp += task.points;
      }

      const priorityStat = priorityStats[task.priority];
      if (priorityStat) {
        priorityStat.count++;
        priorityStat.xp += task.points;
      }
    });

    // Find best day and peak hour
    let bestDay = 'Monday';
    let bestDayCount = 0;
    Object.entries(dayOfWeekStats).forEach(([day, stats]) => {
      if (stats.count > bestDayCount) {
        bestDayCount = stats.count;
        bestDay = day;
      }
    });

    let peakHour = 9;
    let peakHourCount = 0;
    Object.entries(hourStats).forEach(([hour, stats]) => {
      if (stats.count > peakHourCount) {
        peakHourCount = stats.count;
        peakHour = parseInt(hour);
      }
    });

    // Get pending tasks by priority for workload analysis
    const pendingTasks = await Task.find({
      userId,
      status: { $in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] }
    });

    const pendingByPriority: Record<string, number> = {
      [TaskPriority.LOW]: 0,
      [TaskPriority.MEDIUM]: 0,
      [TaskPriority.HIGH]: 0,
      [TaskPriority.URGENT]: 0
    };

    pendingTasks.forEach(task => {
      const currentCount = pendingByPriority[task.priority];
      if (currentCount !== undefined) {
        pendingByPriority[task.priority] = currentCount + 1;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        dayOfWeekStats: Object.entries(dayOfWeekStats).map(([day, stats]) => ({
          day,
          tasksCompleted: stats.count,
          xpEarned: stats.xp
        })),
        hourlyStats: Object.entries(hourStats).map(([hour, stats]) => ({
          hour: parseInt(hour),
          tasksCompleted: stats.count,
          xpEarned: stats.xp
        })),
        priorityBreakdown: Object.entries(priorityStats).map(([priority, stats]) => ({
          priority,
          completed: stats.count,
          xpEarned: stats.xp
        })),
        insights: {
          bestDay,
          peakHour,
          peakHourFormatted: `${peakHour.toString().padStart(2, '0')}:00`,
          totalCompleted: completedTasks.length,
          pendingCount: pendingTasks.length,
          pendingByPriority
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/leaderboard
// @desc    Get leaderboard of users (friends + current user)
// @access  Private
router.get('/leaderboard', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;

    // Get current user with friends
    const currentUser = await User.findById(userId)
      .select('name email level xp totalTasksCompleted friends avatar')
      .populate('friends', 'name email level xp totalTasksCompleted avatar');

    if (!currentUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Build leaderboard from current user + friends
    const leaderboardUsers = [
      {
        _id: String(currentUser._id),
        name: currentUser.name,
        email: currentUser.email,
        level: currentUser.level,
        xp: currentUser.xp,
        totalTasksCompleted: currentUser.totalTasksCompleted,
        avatar: currentUser.avatar,
        isCurrentUser: true
      },
      ...(currentUser.friends as any[]).map(friend => ({
        _id: String(friend._id),
        name: friend.name,
        email: friend.email,
        level: friend.level,
        xp: friend.xp,
        totalTasksCompleted: friend.totalTasksCompleted,
        avatar: friend.avatar,
        isCurrentUser: false
      }))
    ];

    // Sort by XP (descending)
    leaderboardUsers.sort((a, b) => b.xp - a.xp);

    // Add rank
    const rankedLeaderboard = leaderboardUsers.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    // Get current user's rank
    const currentUserRank = rankedLeaderboard.find(u => u.isCurrentUser)?.rank || 1;

    res.status(200).json({
      success: true,
      data: {
        leaderboard: rankedLeaderboard,
        currentUserRank,
        totalParticipants: rankedLeaderboard.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/achievements
// @desc    Get user achievements and milestones
// @access  Private
router.get('/achievements', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;

    const user = await User.findById(userId).select('level xp totalTasksCompleted createdAt');
    const completedTasks = await Task.find({
      userId,
      status: TaskStatus.COMPLETED
    });

    // Calculate achievements
    const achievements = [
      {
        id: 'first_task',
        name: 'First Steps',
        description: 'Complete your first task',
        icon: '🎯',
        unlocked: completedTasks.length >= 1,
        progress: Math.min(completedTasks.length, 1),
        target: 1
      },
      {
        id: 'task_10',
        name: 'Getting Started',
        description: 'Complete 10 tasks',
        icon: '📝',
        unlocked: completedTasks.length >= 10,
        progress: Math.min(completedTasks.length, 10),
        target: 10
      },
      {
        id: 'task_50',
        name: 'Task Master',
        description: 'Complete 50 tasks',
        icon: '🏆',
        unlocked: completedTasks.length >= 50,
        progress: Math.min(completedTasks.length, 50),
        target: 50
      },
      {
        id: 'task_100',
        name: 'Centurion',
        description: 'Complete 100 tasks',
        icon: '💯',
        unlocked: completedTasks.length >= 100,
        progress: Math.min(completedTasks.length, 100),
        target: 100
      },
      {
        id: 'level_5',
        name: 'Rising Star',
        description: 'Reach level 5',
        icon: '⭐',
        unlocked: (user?.level || 1) >= 5,
        progress: Math.min(user?.level || 1, 5),
        target: 5
      },
      {
        id: 'level_10',
        name: 'Veteran',
        description: 'Reach level 10',
        icon: '🌟',
        unlocked: (user?.level || 1) >= 10,
        progress: Math.min(user?.level || 1, 10),
        target: 10
      },
      {
        id: 'xp_1000',
        name: 'XP Hunter',
        description: 'Earn 1,000 XP',
        icon: '💎',
        unlocked: (user?.xp || 0) >= 1000,
        progress: Math.min(user?.xp || 0, 1000),
        target: 1000
      },
      {
        id: 'xp_5000',
        name: 'XP Legend',
        description: 'Earn 5,000 XP',
        icon: '👑',
        unlocked: (user?.xp || 0) >= 5000,
        progress: Math.min(user?.xp || 0, 5000),
        target: 5000
      }
    ];

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    res.status(200).json({
      success: true,
      data: {
        achievements,
        summary: {
          unlocked: unlockedCount,
          total: achievements.length,
          percentage: Math.round((unlockedCount / achievements.length) * 100)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
