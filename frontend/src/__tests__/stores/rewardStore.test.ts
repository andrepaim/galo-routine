import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/api/db');

import { useRewardStore } from '../../lib/stores/rewardStore';
import {
  createReward,
  updateReward,
  deleteReward,
  subscribeRewards,
  createRedemption,
  updateRedemption,
  subscribeRedemptions,
  incrementFamilyField,
} from '../../lib/api/db';
import type { Reward, RewardFormData } from '../../lib/types';

const mockedCreateReward = vi.mocked(createReward);
const mockedUpdateReward = vi.mocked(updateReward);
const mockedDeleteReward = vi.mocked(deleteReward);
const mockedCreateRedemption = vi.mocked(createRedemption);
const mockedUpdateRedemption = vi.mocked(updateRedemption);
const mockedIncrementFamilyField = vi.mocked(incrementFamilyField);

const FAMILY_ID = 'test-family';

beforeEach(() => {
  vi.clearAllMocks();
  useRewardStore.setState({ rewards: [], redemptions: [], isLoading: false });
});

describe('rewardStore', () => {
  describe('addReward', () => {
    it('creates unlimited reward without quantity', async () => {
      mockedCreateReward.mockResolvedValue('new-reward-id');
      const data: RewardFormData = {
        name: 'Game Time',
        description: '30 min video game',
        starCost: 10,
        icon: '🎮',
        availability: 'unlimited',
        requiresApproval: true,
      };
      const id = await useRewardStore.getState().addReward(FAMILY_ID, data);
      expect(id).toBe('new-reward-id');
      expect(mockedCreateReward).toHaveBeenCalledWith(FAMILY_ID, expect.objectContaining({
        name: 'Game Time',
        availability: 'unlimited',
        isActive: true,
      }));
      // Should NOT have quantity field for unlimited
      const callArgs = mockedCreateReward.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('quantity');
    });

    it('creates limited reward with quantity', async () => {
      mockedCreateReward.mockResolvedValue('limited-reward-id');
      const data: RewardFormData = {
        name: 'Ice Cream',
        description: 'One ice cream',
        starCost: 8,
        icon: '🍦',
        availability: 'limited',
        quantity: 3,
        requiresApproval: false,
      };
      const id = await useRewardStore.getState().addReward(FAMILY_ID, data);
      expect(id).toBe('limited-reward-id');
      const callArgs = mockedCreateReward.mock.calls[0][1];
      expect(callArgs).toHaveProperty('quantity', 3);
    });

    it('does not include quantity when unlimited even if quantity provided', async () => {
      mockedCreateReward.mockResolvedValue('id');
      const data: RewardFormData = {
        name: 'Movie',
        description: '',
        starCost: 15,
        icon: '🎬',
        availability: 'unlimited',
        quantity: 5,
        requiresApproval: true,
      };
      await useRewardStore.getState().addReward(FAMILY_ID, data);
      const callArgs = mockedCreateReward.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('quantity');
    });
  });

  describe('editReward', () => {
    it('updates specified fields only', async () => {
      await useRewardStore.getState().editReward(FAMILY_ID, 'reward-1', { name: 'New Name', starCost: 20 });
      expect(mockedUpdateReward).toHaveBeenCalledWith(FAMILY_ID, 'reward-1', expect.objectContaining({
        name: 'New Name',
        starCost: 20,
      }));
    });

    it('strips undefined fields before Firestore update', async () => {
      await useRewardStore.getState().editReward(FAMILY_ID, 'reward-1', { name: 'Updated' });
      const callArgs = mockedUpdateReward.mock.calls[0][2];
      for (const value of Object.values(callArgs as Record<string, unknown>)) {
        expect(value).not.toBeUndefined();
      }
    });

    it('includes quantity when changing to limited', async () => {
      await useRewardStore.getState().editReward(FAMILY_ID, 'r1', {
        availability: 'limited',
        quantity: 5,
      });
      const callArgs = mockedUpdateReward.mock.calls[0][2];
      expect(callArgs).toHaveProperty('quantity', 5);
    });

    it('does not include quantity when changing to unlimited', async () => {
      await useRewardStore.getState().editReward(FAMILY_ID, 'r1', {
        availability: 'unlimited',
      });
      const callArgs = mockedUpdateReward.mock.calls[0][2];
      expect(callArgs).not.toHaveProperty('quantity');
    });
  });

  describe('removeReward', () => {
    it('calls deleteReward', async () => {
      await useRewardStore.getState().removeReward(FAMILY_ID, 'reward-1');
      expect(mockedDeleteReward).toHaveBeenCalledWith(FAMILY_ID, 'reward-1');
    });
  });

  describe('toggleReward', () => {
    it('toggles isActive', async () => {
      await useRewardStore.getState().toggleReward(FAMILY_ID, 'reward-1', false);
      expect(mockedUpdateReward).toHaveBeenCalledWith(FAMILY_ID, 'reward-1', { isActive: false });
    });
  });

  describe('redeemReward', () => {
    it('creates a pending redemption (stars deducted on fulfillment)', async () => {
      const reward: Reward = {
        id: 'r1',
        name: 'Game Time',
        description: '',
        starCost: 10,
        icon: '🎮',
        isActive: true,
        availability: 'unlimited',
        requiresApproval: false,
      };
      await useRewardStore.getState().redeemReward(FAMILY_ID, reward);
      expect(mockedCreateRedemption).toHaveBeenCalledWith(FAMILY_ID, expect.objectContaining({
        rewardId: 'r1',
        rewardName: 'Game Time',
        starCost: 10,
        status: 'pending',
      }));
      // Stars are NOT deducted on redeem — only on fulfillRedemption
      expect(mockedIncrementFamilyField).not.toHaveBeenCalled();
    });

    it('sets status to pending regardless of requiresApproval', async () => {
      const reward: Reward = {
        id: 'r2',
        name: 'Movie',
        description: '',
        starCost: 15,
        icon: '🎬',
        isActive: true,
        availability: 'unlimited',
        requiresApproval: true,
      };
      await useRewardStore.getState().redeemReward(FAMILY_ID, reward);
      expect(mockedCreateRedemption).toHaveBeenCalledWith(FAMILY_ID, expect.objectContaining({
        status: 'pending',
      }));
    });

    it('does not decrement quantity on redeem (quantity decremented on fulfill)', async () => {
      const reward: Reward = {
        id: 'r3',
        name: 'Ice Cream',
        description: '',
        starCost: 8,
        icon: '🍦',
        isActive: true,
        availability: 'limited',
        quantity: 3,
        requiresApproval: false,
      };
      await useRewardStore.getState().redeemReward(FAMILY_ID, reward);
      // updateReward is NOT called during redeem — only during fulfill
      expect(mockedUpdateReward).not.toHaveBeenCalled();
    });
  });

  describe('fulfillRedemption', () => {
    it('marks redemption as fulfilled and deducts stars', async () => {
      useRewardStore.setState({
        redemptions: [
          { id: 'red-1', rewardId: 'r1', rewardName: 'Game Time', starCost: 10, redeemedAt: new Date().toISOString(), status: 'pending' },
        ],
        rewards: [],
      });
      await useRewardStore.getState().fulfillRedemption(FAMILY_ID, 'red-1');
      expect(mockedUpdateRedemption).toHaveBeenCalledWith(FAMILY_ID, 'red-1', expect.objectContaining({
        status: 'fulfilled',
      }));
      expect(mockedIncrementFamilyField).toHaveBeenCalledWith(FAMILY_ID, 'starBalance', -10);
    });

    it('decrements limited quantity on fulfill', async () => {
      useRewardStore.setState({
        redemptions: [
          { id: 'red-2', rewardId: 'r3', rewardName: 'Ice Cream', starCost: 8, redeemedAt: new Date().toISOString(), status: 'pending' },
        ],
        rewards: [
          { id: 'r3', name: 'Ice Cream', description: '', starCost: 8, icon: '🍦', isActive: true, availability: 'limited', quantity: 3, requiresApproval: false },
        ],
      });
      await useRewardStore.getState().fulfillRedemption(FAMILY_ID, 'red-2');
      expect(mockedUpdateReward).toHaveBeenCalledWith(FAMILY_ID, 'r3', { quantity: 2 });
    });
  });

  describe('rejectRedemption', () => {
    it('marks as rejected without refunding stars (stars not yet deducted)', async () => {
      useRewardStore.setState({
        redemptions: [
          { id: 'red-1', rewardId: 'r1', rewardName: 'Test', starCost: 10, redeemedAt: new Date().toISOString(), status: 'pending' },
        ],
      });
      await useRewardStore.getState().rejectRedemption(FAMILY_ID, 'red-1');
      // No refund since stars were never deducted (deduction happens on fulfillment)
      expect(mockedIncrementFamilyField).not.toHaveBeenCalled();
      expect(mockedUpdateRedemption).toHaveBeenCalledWith(FAMILY_ID, 'red-1', { status: 'rejected' });
    });

    it('does not throw if redemption not found', async () => {
      useRewardStore.setState({ redemptions: [] });
      await expect(useRewardStore.getState().rejectRedemption(FAMILY_ID, 'nonexistent')).resolves.not.toThrow();
      expect(mockedIncrementFamilyField).not.toHaveBeenCalled();
    });
  });

  describe('subscribeRewards', () => {
    it('sets loading true then false on callback', () => {
      vi.mocked(subscribeRewards).mockImplementation((fid: string, cb: Function) => {
        cb([{ id: 'r1', name: 'Test' }]);
        return vi.fn();
      });
      const unsub = useRewardStore.getState().subscribeRewards(FAMILY_ID);
      expect(useRewardStore.getState().rewards).toHaveLength(1);
      expect(useRewardStore.getState().isLoading).toBe(false);
      expect(typeof unsub).toBe('function');
    });
  });
});
