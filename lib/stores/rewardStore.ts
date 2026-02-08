import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
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
} from '../firebase/firestore';

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
    const reward: Omit<Reward, 'id'> = {
      name: data.name,
      description: data.description,
      goalCost: data.goalCost,
      icon: data.icon,
      isActive: true,
      availability: data.availability,
      quantity: data.availability === 'limited' ? data.quantity : undefined,
      requiresApproval: data.requiresApproval,
    };
    return createReward(familyId, reward);
  },

  editReward: async (familyId: string, rewardId: string, data: Partial<RewardFormData>) => {
    const update: Partial<Reward> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.goalCost !== undefined) update.goalCost = data.goalCost;
    if (data.icon !== undefined) update.icon = data.icon;
    if (data.availability !== undefined) {
      update.availability = data.availability;
      update.quantity = data.availability === 'limited' ? data.quantity : undefined;
    }
    if (data.requiresApproval !== undefined) update.requiresApproval = data.requiresApproval;
    await updateReward(familyId, rewardId, update);
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
      goalCost: reward.goalCost,
      redeemedAt: Timestamp.fromDate(new Date()),
      status: reward.requiresApproval ? 'pending' : 'fulfilled',
      fulfilledAt: reward.requiresApproval ? undefined : Timestamp.fromDate(new Date()),
    };
    await createRedemption(familyId, redemption);
    // Deduct goals from balance
    await incrementFamilyField(familyId, 'goalBalance', -reward.goalCost);
    // Decrement limited quantity
    if (reward.availability === 'limited' && reward.quantity !== undefined && reward.quantity > 0) {
      await updateReward(familyId, reward.id!, { quantity: reward.quantity - 1 });
    }
  },

  fulfillRedemption: async (familyId: string, redemptionId: string) => {
    await updateRedemption(familyId, redemptionId, {
      status: 'fulfilled',
      fulfilledAt: Timestamp.fromDate(new Date()),
    });
  },

  rejectRedemption: async (familyId: string, redemptionId: string) => {
    // Refund goals on rejection
    const redemption = get().redemptions.find((r) => r.id === redemptionId);
    if (redemption) {
      await incrementFamilyField(familyId, 'goalBalance', redemption.goalCost);
    }
    await updateRedemption(familyId, redemptionId, { status: 'rejected' });
  },
}));
