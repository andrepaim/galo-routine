import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
import type { EarnedBadge } from '../types';
import {
  createEarnedBadge,
  subscribeEarnedBadges,
} from '../firebase/firestore';

interface BadgeStore {
  earnedBadges: EarnedBadge[];
  isLoading: boolean;
  subscribe: (familyId: string) => () => void;
  hasBadge: (badgeId: string) => boolean;
  awardBadge: (familyId: string, badgeId: string) => Promise<void>;
}

export const useBadgeStore = create<BadgeStore>((set, get) => ({
  earnedBadges: [],
  isLoading: true,

  subscribe: (familyId: string) => {
    set({ isLoading: true });
    const unsubscribe = subscribeEarnedBadges(familyId, (earnedBadges) => {
      set({ earnedBadges, isLoading: false });
    });
    return unsubscribe;
  },

  hasBadge: (badgeId: string) => {
    return get().earnedBadges.some((b) => b.badgeId === badgeId);
  },

  awardBadge: async (familyId: string, badgeId: string) => {
    if (get().hasBadge(badgeId)) return;
    await createEarnedBadge(familyId, {
      badgeId,
      earnedAt: Timestamp.fromDate(new Date()),
    });
  },
}));
