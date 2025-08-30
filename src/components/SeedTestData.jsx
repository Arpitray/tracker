import React, { useState } from 'react';
import { useUserData } from '../hooks/useUserData';

import * as fb from '../lib/firebaseClient_Enhanced';

export default function SeedTestData() {
  const { auth } = useUserData();
  const { user } = auth;
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    if (!user) return alert('Please sign in first');
    setLoading(true);
    try {
      // create a sample card
      const card = {
        title: 'Sample: Morning Walk',
        details: 'Walk for 20 minutes every morning',
        completions: 0,
        progress: 0,
        streak: 0,
        manualProgress: false
      };
      const saved = await fb.saveCard(user.uid, card);

      // record a sample completion event for analytics
      await fb.recordCompletion(user.uid, saved.id, { note: 'Seeded run', mood: 4, timeSpent: 20, streakDay: 1 });

      alert('Seed data created');
    } catch (err) {
      console.error('Seed failed', err);
      alert('Seed failed - check console');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleSeed}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Seeding...' : 'Create sample card & completion'}
      </button>
    </div>
  );
}
