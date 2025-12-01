/**
 * Analytics API Client
 * Frontend API client for analytics and progress tracking
 */

import { apiClient } from './client';

// ---------- TYPES ----------

export type TimePeriod = 'week' | 'month' | 'year';

export interface ProgressDataPoint {
  date: string;
  tasksCompleted: number;
  xpEarned: number;
}

export interface ProgressResponse {
  success: boolean;
  data: {
    user: {
      level: number;
      xp: number;
      totalTasksCompleted: number;
      memberSince: string;
    };
    progress: ProgressDataPoint[];
    streaks: {
      current: number;
      longest: number;
    };
    periodSummary: {
      totalTasksCompleted: number;
      totalXpEarned: number;
      averageTasksPerDay: number;
    };
  };
}

export interface DayOfWeekStat {
  day: string;
  tasksCompleted: number;
  xpEarned: number;
}

export interface HourlyStat {
  hour: number;
  tasksCompleted: number;
  xpEarned: number;
}

export interface PriorityBreakdown {
  priority: string;
  completed: number;
  xpEarned: number;
}

export interface ProductivityResponse {
  success: boolean;
  data: {
    dayOfWeekStats: DayOfWeekStat[];
    hourlyStats: HourlyStat[];
    priorityBreakdown: PriorityBreakdown[];
    insights: {
      bestDay: string;
      peakHour: number;
      peakHourFormatted: string;
      totalCompleted: number;
      pendingCount: number;
      pendingByPriority: Record<string, number>;
    };
  };
}

export interface LeaderboardUser {
  _id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  totalTasksCompleted: number;
  avatar?: string;
  isCurrentUser: boolean;
  rank: number;
}

export interface LeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: LeaderboardUser[];
    currentUserRank: number;
    totalParticipants: number;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export interface AchievementsResponse {
  success: boolean;
  data: {
    achievements: Achievement[];
    summary: {
      unlocked: number;
      total: number;
      percentage: number;
    };
  };
}

// ---------- API FUNCTIONS ----------

/**
 * Get user progress trends
 * @param period Time period for the progress data
 */
export async function getProgress(period: TimePeriod = 'week'): Promise<ProgressResponse> {
  try {
    const response = await apiClient.client.get<ProgressResponse>(`/analytics/progress?period=${period}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching progress:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch progress data');
  }
}

/**
 * Get productivity insights
 */
export async function getProductivity(): Promise<ProductivityResponse> {
  try {
    const response = await apiClient.client.get<ProductivityResponse>('/analytics/productivity');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching productivity:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch productivity data');
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(): Promise<LeaderboardResponse> {
  try {
    const response = await apiClient.client.get<LeaderboardResponse>('/analytics/leaderboard');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch leaderboard');
  }
}

/**
 * Get achievements
 */
export async function getAchievements(): Promise<AchievementsResponse> {
  try {
    const response = await apiClient.client.get<AchievementsResponse>('/analytics/achievements');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching achievements:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch achievements');
  }
}

// ---------- EXPORTS ----------

export const analyticsAPI = {
  getProgress,
  getProductivity,
  getLeaderboard,
  getAchievements,
};

export default analyticsAPI;
