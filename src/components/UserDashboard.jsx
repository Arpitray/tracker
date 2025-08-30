import React, { useEffect } from 'react';
import { useUserData } from '../hooks/useUserData';

const UserDashboard = () => {
  const { auth, stats, activity } = useUserData();
  const { user } = auth;
  const { stats: userStats, loading: statsLoading, refreshStats } = stats;
  const { trackAction } = activity;

  useEffect(() => {
    if (user) {
      trackAction('dashboard_view');
    }
  }, [user, trackAction]);

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Please sign in to view your dashboard</h2>
        </div>
      </div>
    );
  }

  const getMotivationalMessage = () => {
    if (!userStats) return "Welcome back!";
    
    const { completionRate, totalCompletions, longestStreak } = userStats;
    
    if (completionRate >= 80) return "🔥 You're on fire! Keep up the amazing work!";
    if (completionRate >= 60) return "💪 Great progress! You're building strong habits!";
    if (completionRate >= 40) return "📈 Good momentum! Keep pushing forward!";
    if (totalCompletions > 0) return "🌱 Every step counts! You're growing!";
    return "🚀 Ready to start your habit journey?";
  };

  const getStreakStatus = () => {
    if (!userStats) return null;
    
    const { longestStreak } = userStats;
    
    if (longestStreak >= 30) return { color: 'text-purple-600', icon: '👑', message: 'Legend Status!' };
    if (longestStreak >= 21) return { color: 'text-blue-600', icon: '🏆', message: 'Master Level!' };
    if (longestStreak >= 14) return { color: 'text-green-600', icon: '⭐', message: 'Expert Level!' };
    if (longestStreak >= 7) return { color: 'text-yellow-600', icon: '🎯', message: 'Pro Level!' };
    if (longestStreak >= 3) return { color: 'text-orange-600', icon: '📊', message: 'Building Momentum!' };
    return { color: 'text-gray-600', icon: '🌱', message: 'Getting Started!' };
  };

  const streakStatus = getStreakStatus();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {user.displayName || 'Habit Builder'}! 👋
        </h1>
        <p className="text-lg text-gray-600">{getMotivationalMessage()}</p>
      </div>

      {/* Quick Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : userStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Habits</p>
                <p className="text-3xl font-bold text-blue-600">{userStats.totalCards}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {userStats.activeCards} active, {userStats.completedCards} completed
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-green-600">{userStats.completionRate}%</p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${userStats.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Completions</p>
                <p className="text-3xl font-bold text-purple-600">{userStats.totalCompletions}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              All-time habit completions
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Longest Streak</p>
                <p className="text-3xl font-bold text-orange-600">{userStats.longestStreak}</p>
              </div>
              <div className="text-3xl">🔥</div>
            </div>
            {streakStatus && (
              <p className={`text-sm mt-2 ${streakStatus.color} font-medium`}>
                {streakStatus.icon} {streakStatus.message}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center mb-8">
          <p className="text-gray-500">Create your first habit to see statistics!</p>
        </div>
      )}

      {/* Progress Insights */}
      {userStats && userStats.totalCards > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Achievement Badges */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 Achievements</h3>
            <div className="space-y-3">
              {userStats.totalCards >= 1 && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl">🚀</span>
                  <div>
                    <p className="font-medium text-blue-800">Habit Pioneer</p>
                    <p className="text-sm text-blue-600">Created your first habit</p>
                  </div>
                </div>
              )}
              
              {userStats.longestStreak >= 7 && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="font-medium text-green-800">Week Warrior</p>
                    <p className="text-sm text-green-600">Maintained a 7-day streak</p>
                  </div>
                </div>
              )}
              
              {userStats.completionRate >= 50 && (
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="font-medium text-yellow-800">Consistency Champion</p>
                    <p className="text-sm text-yellow-600">50%+ completion rate</p>
                  </div>
                </div>
              )}
              
              {userStats.totalCompletions >= 50 && (
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <span className="text-2xl">💎</span>
                  <div>
                    <p className="font-medium text-purple-800">Century Club</p>
                    <p className="text-sm text-purple-600">50+ total completions</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">➕</span>
                <div className="text-left">
                  <p className="font-medium text-blue-800">Add New Habit</p>
                  <p className="text-sm text-blue-600">Start tracking something new</p>
                </div>
              </button>
              
              <button 
                onClick={refreshStats}
                className="w-full flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">🔄</span>
                <div className="text-left">
                  <p className="font-medium text-green-800">Refresh Stats</p>
                  <p className="text-sm text-green-600">Update your statistics</p>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/settings'}
                className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">⚙️</span>
                <div className="text-left">
                  <p className="font-medium text-gray-800">Settings</p>
                  <p className="text-sm text-gray-600">Customize your experience</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Motivational Quote */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg shadow text-center text-white">
        <h3 className="text-xl font-semibold mb-2">💡 Daily Inspiration</h3>
        <p className="text-lg italic">
          "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
        </p>
        <p className="text-sm mt-2 opacity-90">— Aristotle</p>
      </div>
    </div>
  );
};

export default UserDashboard;
