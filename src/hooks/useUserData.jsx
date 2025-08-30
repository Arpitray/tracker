// Custom hooks for user data management
import { useState, useEffect, useCallback } from 'react';
import { onAuthChange } from '../lib/firebaseClient';
import * as fb from '../lib/firebaseClient_Enhanced';

// Auth hook
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
}

// User preferences hook
export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    const unsubscribe = fb.listenUserPreferences(user.uid, (prefs) => {
      setPreferences(prefs);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const updatePreferences = useCallback(async (newPrefs) => {
    if (!user) return;
    await fb.saveUserPreferences(user.uid, newPrefs);
  }, [user]);

  return { preferences, updatePreferences, loading };
}

// User profile hook
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile({});
      setLoading(false);
      return;
    }

    const unsubscribe = fb.listenUserProfile(user.uid, (profileData) => {
      setProfile(profileData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const updateProfile = useCallback(async (profileData) => {
    if (!user) return;
    await fb.saveUserProfile(user.uid, profileData);
  }, [user]);

  return { profile, updateProfile, loading };
}

// User goals hook
export function useUserGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    const unsubscribe = fb.listenUserGoals(user.uid, (goalsData) => {
      setGoals(goalsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addGoal = useCallback(async (goal) => {
    if (!user) return;
    return await fb.saveUserGoal(user.uid, goal);
  }, [user]);

  const updateGoalProgress = useCallback(async (goalId, progress) => {
    if (!user) return;
    await fb.updateGoalProgress(user.uid, goalId, progress);
  }, [user]);

  return { goals, addGoal, updateGoalProgress, loading };
}

// User stats hook
export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(async () => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      const userStats = await fb.getUserStats(user.uid);
      setStats(userStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return { stats, refreshStats, loading };
}

// Activity tracking hook
export function useActivityTracking() {
  const { user } = useAuth();

  const trackAction = useCallback(async (action, data = {}) => {
    if (!user) return;
    try {
      await fb.trackUserAction(user.uid, action, data);
    } catch (error) {
      console.error('Error tracking action:', error);
    }
  }, [user]);

  return { trackAction };
}

// Data management hook
export function useDataManagement() {
  const { user } = useAuth();

  const exportData = useCallback(async () => {
    if (!user) return null;
    return await fb.exportUserData(user.uid);
  }, [user]);

  const createBackup = useCallback(async () => {
    if (!user) return null;
    return await fb.createUserBackup(user.uid);
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!user) return false;
    return await fb.deleteUserData(user.uid);
  }, [user]);

  return { exportData, createBackup, deleteAccount };
}

// Combined user data hook (convenience)
export function useUserData() {
  const auth = useAuth();
  const preferences = useUserPreferences();
  const profile = useUserProfile();
  const goals = useUserGoals();
  const stats = useUserStats();
  const activity = useActivityTracking();
  const dataManagement = useDataManagement();

  return {
    auth,
    preferences,
    profile,
    goals,
    stats,
    activity,
    dataManagement
  };
}
