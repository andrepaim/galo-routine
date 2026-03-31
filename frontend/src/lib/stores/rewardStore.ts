import { create } from 'zustand';
import type { Reward, Redemption, RewardFormData } from '../types';
import {
  createReward,
  updateReward,
  deleteReward,
  subscribeRewards,
  createRedemption,
  updateRedemption,
  subscribeRedemptions,
  incrementFamilyField,
} from '../api/db';

interface RewardStore {
  rewards: Reward[];
  redemptions: Redemption[];
  isLoading: boolean;
  subscribeRewards: (familyId: string) => () => void;
  subscribeRedemptions: (familyId: string) => () => void;
  addReward: (familyId: string, data: RewardFormData) => Promise<string>;
  editReward: (familyId: string, rewardId: string, data: Partial<RewardFormData>) => Promise<void>;
  removeReward: (familyId: string, rewardId: string) => Promise<void>;
  toggleReward: (familyId: string, rewardId: string, isActive: boolean) => Promise<void>;
  redeemReward: (familyId: string, reward: Reward) => Promise<void>;
  fulfillRedemption: (familyId: string, redemptionId: string) => Promise<void>;
  rejectRedemption: (familyId: string, redemptionId: string) => Promise<void>;
}

export const useRewardStore = create<RewardStore>((set, get) => ({
  rewards: [],
  redemptions: [],
  isLoading: true,

  subscribeRewards: (familyId: string) => {
    set({ isLoading: true });
    const unsubscribe = subscribeRewards(familyId, (rewards) => {
      set({ rewards, isLoading: false });
    });
    return unsubscribe;
  },

  subscribeRedemptions: (familyId: string) => {
    const unsubscribe = subscribeRedemptions(familyId, (redemptions) => {
      set({ redemptions });
    });
    return unsubscribe;
  },

  addReward: async (familyId: string, data: RewardFormData) => {
    const reward: Record<string, unknown> = {
      name: data.name,
      description: data.description || '',
      starCost: data.starCost,
      icon: data.icon,
      isActive: true,
      availability: data.availability,
      requiresApproval: data.requiresApproval,
    };
    if (data.availability === 'limited' && data.quantity != null) {
      reward.quantity = data.quantity;
    }
    return createReward(familyId, reward as Omit<Reward, 'id'>);
  },

  editReward: async (familyId: string, rewardId: string, data: Partial<RewardFormData>) => {
    const update: Partial<Reward> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.starCost !== undefined) update.starCost = data.starCost;
    if (data.icon !== undefined) update.icon = data.icon;
    if (data.availability !== undefined) {
      update.availability = data.availability;
      if (data.availability === 'limited' && data.quantity != null) {
        update.quantity = data.quantity;
      }
    }
    if (data.requiresApproval !== undefined) update.requiresApproval = data.requiresApproval;
    // Remove undefined fields
    const cleanUpdate = Object.fromEntries(
      Object.entries(update).filter(([, v]) => v !== undefined),
    );
    await updateReward(familyId, rewardId, cleanUpdate as Partial<Reward>);
  },

  removeReward: async (familyId: string, rewardId: string) => {
    await deleteReward(familyId, rewardId);
  },

  toggleReward: async (familyId: string, rewardId: string, isActive: boolean) => {
    await updateReward(familyId, rewardId, { isActive });
  },

  redeemReward: async (familyId: string, reward: Reward) => {
    const redemption: Omit<Redemption, 'id'> = {
      rewardId: reward.id!,
      rewardName: reward.name,
      starCost: reward.starCost,
      redeemedAt: new Date().toISOString(),
      status: 'pending',
    };
    await createRedemption(familyId, redemption);
  },

  fulfillRedemption: async (familyId: string, redemptionId: string) => {
    // Bug 3: Backend handles star deduction + quantity atomically in a single transaction
    await updateRedemption(familyId, redemptionId, { status: 'fulfilled' });
  },

  rejectRedemption: async (familyId: string, redemptionId: string) => {
    // Bug 11: Backend handles quantity restoration on rejection
    await updateRedemption(familyId, redemptionId, { status: 'rejected' });
  },
}));
