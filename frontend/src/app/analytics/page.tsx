'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import ClientGuard from '@/components/ClientGuard';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsAPI, TimePeriod, ProgressDataPoint, LeaderboardUser, Achievement } from '@/lib/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrophyIcon,
  FireIcon,
  ChartBarIcon,
  ClockIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [progressData, setProgressData] = useState<{
    progress: ProgressDataPoint[];
    streaks: { current: number; longest: number };
    periodSummary: { totalTasksCompleted: number; totalXpEarned: number; averageTasksPerDay: number };
    user: { level: number; xp: number; totalTasksCompleted: number; memberSince: string };
  } | null>(null);

  const [productivityData, setProductivityData] = useState<{
    dayOfWeekStats: Array<{ day: string; tasksCompleted: number; xpEarned: number }>;
    priorityBreakdown: Array<{ priority: string; completed: number; xpEarned: number }>;
    insights: { bestDay: string; peakHour: number; peakHourFormatted: string; totalCompleted: number };
  } | null>(null);

  const [leaderboard, setLeaderboard] = useState<{
    leaderboard: LeaderboardUser[];
    currentUserRank: number;
  } | null>(null);

  const [achievements, setAchievements] = useState<{
    achievements: Achievement[];
    summary: { unlocked: number; total: number; percentage: number };
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [progressRes, productivityRes, leaderboardRes, achievementsRes] = await Promise.all([
        analyticsAPI.getProgress(period),
        analyticsAPI.getProductivity(),
        analyticsAPI.getLeaderboard(),
        analyticsAPI.getAchievements(),
      ]);

      if (progressRes.success) setProgressData(progressRes.data);
      if (productivityRes.success) setProductivityData(productivityRes.data);
      if (leaderboardRes.success) setLeaderboard(leaderboardRes.data);
      if (achievementsRes.success) setAchievements(achievementsRes.data);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Using demo data.');
      // Set demo data for development/testing
      setDemoData();
    } finally {
      setLoading(false);
    }
  };

  const setDemoData = () => {
    // Demo progress data
    const demoProgress: ProgressDataPoint[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      demoProgress.push({
        date: date.toISOString().split('T')[0],
        tasksCompleted: Math.floor(Math.random() * 8) + 1,
        xpEarned: Math.floor(Math.random() * 150) + 50,
      });
    }

    setProgressData({
      progress: demoProgress,
      streaks: { current: 5, longest: 12 },
      periodSummary: {
        totalTasksCompleted: 28,
        totalXpEarned: 720,
        averageTasksPerDay: 4,
      },
      user: {
        level: user?.level || 5,
        xp: user?.xp || 1250,
        totalTasksCompleted: user?.totalTasksCompleted || 89,
        memberSince: new Date().toISOString(),
      },
    });

    setProductivityData({
      dayOfWeekStats: [
        { day: 'Sunday', tasksCompleted: 3, xpEarned: 75 },
        { day: 'Monday', tasksCompleted: 8, xpEarned: 200 },
        { day: 'Tuesday', tasksCompleted: 6, xpEarned: 150 },
        { day: 'Wednesday', tasksCompleted: 7, xpEarned: 175 },
        { day: 'Thursday', tasksCompleted: 5, xpEarned: 125 },
        { day: 'Friday', tasksCompleted: 4, xpEarned: 100 },
        { day: 'Saturday', tasksCompleted: 2, xpEarned: 50 },
      ],
      priorityBreakdown: [
        { priority: 'low', completed: 15, xpEarned: 150 },
        { priority: 'medium', completed: 25, xpEarned: 375 },
        { priority: 'high', completed: 18, xpEarned: 360 },
        { priority: 'urgent', completed: 8, xpEarned: 200 },
      ],
      insights: {
        bestDay: 'Monday',
        peakHour: 10,
        peakHourFormatted: '10:00',
        totalCompleted: 66,
      },
    });

    setLeaderboard({
      leaderboard: [
        { _id: '1', name: 'Alex Champion', email: 'alex@example.com', level: 12, xp: 3500, totalTasksCompleted: 156, isCurrentUser: false, rank: 1 },
        { _id: '2', name: user?.name || 'You', email: user?.email || '', level: user?.level || 5, xp: user?.xp || 1250, totalTasksCompleted: user?.totalTasksCompleted || 89, isCurrentUser: true, rank: 2 },
        { _id: '3', name: 'Jordan Smith', email: 'jordan@example.com', level: 4, xp: 980, totalTasksCompleted: 67, isCurrentUser: false, rank: 3 },
      ],
      currentUserRank: 2,
    });

    setAchievements({
      achievements: [
        { id: 'first_task', name: 'First Steps', description: 'Complete your first task', icon: '🎯', unlocked: true, progress: 1, target: 1 },
        { id: 'task_10', name: 'Getting Started', description: 'Complete 10 tasks', icon: '📝', unlocked: true, progress: 10, target: 10 },
        { id: 'task_50', name: 'Task Master', description: 'Complete 50 tasks', icon: '🏆', unlocked: true, progress: 50, target: 50 },
        { id: 'task_100', name: 'Centurion', description: 'Complete 100 tasks', icon: '💯', unlocked: false, progress: 89, target: 100 },
        { id: 'level_5', name: 'Rising Star', description: 'Reach level 5', icon: '⭐', unlocked: true, progress: 5, target: 5 },
        { id: 'level_10', name: 'Veteran', description: 'Reach level 10', icon: '🌟', unlocked: false, progress: 5, target: 10 },
      ],
      summary: { unlocked: 4, total: 6, percentage: 67 },
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <ClientGuard>
        <Sidebar>
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-80 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Sidebar>
      </ClientGuard>
    );
  }

  return (
    <ClientGuard>
      <Sidebar>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <ChartBarIcon className="h-8 w-8 text-primary" />
                Analytics & Progress
              </h1>
              <p className="text-muted-foreground">
                Track your productivity and see how you&apos;re leveling up
              </p>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as TimePeriod[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className="capitalize"
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">{error}</p>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Level</p>
                    <p className="text-2xl font-bold text-foreground">{progressData?.user.level || 1}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-yellow-100">
                    <SparklesIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total XP</p>
                    <p className="text-2xl font-bold text-foreground">{progressData?.user.xp?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-100">
                    <TrophyIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tasks Completed</p>
                    <p className="text-2xl font-bold text-foreground">{progressData?.user.totalTasksCompleted || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-orange-100">
                    <FireIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-2xl font-bold text-foreground">{progressData?.streaks.current || 0} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Progress Over Time
              </CardTitle>
              <CardDescription>
                Tasks completed and XP earned in the last {period}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Tasks This {period.charAt(0).toUpperCase() + period.slice(1)}</p>
                  <p className="text-2xl font-bold text-blue-900">{progressData?.periodSummary.totalTasksCompleted || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">XP Earned</p>
                  <p className="text-2xl font-bold text-green-900">{progressData?.periodSummary.totalXpEarned || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Daily Average</p>
                  <p className="text-2xl font-bold text-purple-900">{progressData?.periodSummary.averageTasksPerDay || 0} tasks</p>
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData?.progress.map(p => ({ ...p, date: formatDate(p.date) })) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tasksCompleted"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      name="Tasks Completed"
                    />
                    <Line
                      type="monotone"
                      dataKey="xpEarned"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      name="XP Earned"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Productivity by Day */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Productivity by Day
                </CardTitle>
                <CardDescription>
                  Best day: <span className="font-semibold text-primary">{productivityData?.insights.bestDay}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productivityData?.dayOfWeekStats || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" stroke="#666" fontSize={12} tickFormatter={(value) => value.slice(0, 3)} />
                      <YAxis stroke="#666" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="tasksCompleted" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Tasks" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Priority Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StarIcon className="h-5 w-5" />
                  Tasks by Priority
                </CardTitle>
                <CardDescription>Distribution of completed tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productivityData?.priorityBreakdown || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="completed"
                        nameKey="priority"
                        label={({ priority, completed }) => `${priority}: ${completed}`}
                      >
                        {productivityData?.priorityBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getPriorityColor(entry.priority)} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5" />
                  Leaderboard
                </CardTitle>
                <CardDescription>
                  Your rank: #{leaderboard?.currentUserRank || '-'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard?.leaderboard.slice(0, 5).map((user) => (
                    <div
                      key={user._id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        user.isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          user.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                          user.rank === 2 ? 'bg-gray-300 text-gray-700' :
                          user.rank === 3 ? 'bg-amber-600 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {user.rank}
                        </div>
                        <div>
                          <p className={`font-medium ${user.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                            {user.name} {user.isCurrentUser && '(You)'}
                          </p>
                          <p className="text-xs text-muted-foreground">Level {user.level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{user.xp.toLocaleString()} XP</p>
                        <p className="text-xs text-muted-foreground">{user.totalTasksCompleted} tasks</p>
                      </div>
                    </div>
                  ))}

                  {(!leaderboard?.leaderboard || leaderboard.leaderboard.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserGroupIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Add friends to see the leaderboard!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrophyIcon className="h-5 w-5" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  {achievements?.summary.unlocked || 0} of {achievements?.summary.total || 0} unlocked ({achievements?.summary.percentage || 0}%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievements?.achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        achievement.unlocked ? 'bg-green-50' : 'bg-muted/50'
                      }`}
                    >
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${achievement.unlocked ? 'text-green-700' : 'text-muted-foreground'}`}>
                            {achievement.name}
                          </p>
                          {achievement.unlocked && (
                            <Badge variant="success" size="sm">Unlocked</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        {!achievement.unlocked && (
                          <div className="mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {achievement.progress} / {achievement.target}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Streak Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FireIcon className="h-5 w-5" />
                Streak Stats
              </CardTitle>
              <CardDescription>Keep your momentum going!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                  <FireIcon className="h-12 w-12 mx-auto mb-2 text-orange-500" />
                  <p className="text-4xl font-bold text-orange-600">{progressData?.streaks.current || 0}</p>
                  <p className="text-sm text-orange-700 font-medium">Current Streak</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <TrophyIcon className="h-12 w-12 mx-auto mb-2 text-purple-500" />
                  <p className="text-4xl font-bold text-purple-600">{progressData?.streaks.longest || 0}</p>
                  <p className="text-sm text-purple-700 font-medium">Longest Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Sidebar>
    </ClientGuard>
  );
}
