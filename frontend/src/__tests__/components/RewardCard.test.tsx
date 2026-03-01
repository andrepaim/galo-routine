import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RewardCard } from '../../components/rewards/RewardCard';
import type { Reward } from '../../lib/types';

const baseReward: Reward = {
  id: 'r1',
  name: 'Video Game',
  description: '30 min of gaming',
  starCost: 10,
  icon: '🎮',
  availability: 'unlimited',
  isActive: true,
  requiresApproval: false,
};

describe('RewardCard', () => {
  it('renders reward name', () => {
    const { getByText } = render(<RewardCard reward={baseReward} starBalance={0} />);
    expect(getByText('Video Game')).toBeTruthy();
  });

  it('renders reward description', () => {
    const { getByText } = render(<RewardCard reward={baseReward} starBalance={0} />);
    expect(getByText('30 min of gaming')).toBeTruthy();
  });

  it('renders star cost', () => {
    const { getByText } = render(<RewardCard reward={baseReward} starBalance={0} />);
    expect(getByText('10')).toBeTruthy();
  });

  it('does not show redeem button by default', () => {
    const { queryByText } = render(<RewardCard reward={baseReward} starBalance={20} />);
    expect(queryByText('Resgatar')).toBeNull();
  });

  it('shows redeem button when showRedeem is true', () => {
    const { getByText } = render(
      <RewardCard reward={baseReward} starBalance={20} showRedeem />
    );
    expect(getByText('Resgatar')).toBeTruthy();
  });

  it('shows quantity for limited rewards', () => {
    const limited: Reward = { ...baseReward, availability: 'limited', quantity: 3 };
    const { getByText } = render(<RewardCard reward={limited} starBalance={0} />);
    expect(getByText('(3 restantes)')).toBeTruthy();
  });

  it('handles inactive reward', () => {
    const inactive: Reward = { ...baseReward, isActive: false };
    const { getByText } = render(<RewardCard reward={inactive} starBalance={0} />);
    expect(getByText('Video Game')).toBeTruthy();
  });
});
