import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { subscribeGaloSchedule } from '../api/db';
import type { GaloSchedule, GaloSuggestedReward, GaloNewsItem } from '../types';

const todayStr = () => new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10);

export function useGaloSchedule() {
  const familyId = useAuthStore((s) => s.familyId);
  const [schedule, setSchedule] = useState<GaloSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId || familyId === 'dev-family-123') {
      setLoading(false);
      return;
    }
    const unsub = subscribeGaloSchedule(familyId, (s) => {
      setSchedule(s);
      setLoading(false);
    });
    return unsub;
  }, [familyId]);

  // Filter out expired rewards (past their match date)
  const today = todayStr();
  const activeSuggestions: GaloSuggestedReward[] = (schedule?.suggestedRewards ?? []).filter(
    (r) => !r.expiresAt || r.expiresAt >= today,
  );

  return { schedule, activeSuggestions, loading };
}

export function pickNextNews(news: GaloNewsItem[], shownIds: string[]): GaloNewsItem | null {
  if (!news || news.length === 0) return null;

  // Filter to last 3 days
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const recent = news.filter((n) => n.publishedAt >= threeDaysAgo);
  if (recent.length === 0) return null;

  // Prefer unshown
  const unshown = recent.filter((n) => !shownIds.includes(n.id));
  if (unshown.length > 0) {
    return unshown[Math.floor(Math.random() * unshown.length)];
  }

  // All shown: pick the oldest shown (first in shownIds that's in recent)
  for (const id of shownIds) {
    const found = recent.find((n) => n.id === id);
    if (found) return found;
  }

  return recent[0];
}
