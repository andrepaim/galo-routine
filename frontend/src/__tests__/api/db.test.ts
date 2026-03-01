import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SSE to prevent real EventSource connections
vi.mock('../../lib/api/sse', () => ({
  getSSE: vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
}));

// Stub global fetch before importing the module under test
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import {
  createTask,
  updateTask,
  deleteTask,
  createPeriod,
  updatePeriod,
  createCompletion,
  updateCompletion,
  createReward,
  updateReward,
  deleteReward,
  createRedemption,
  updateRedemption,
  updateFamily,
  incrementFamilyField,
  stripUndefined,
} from '../../lib/api/db';

const FAMILY_ID = 'test-family';

/** Build a minimal successful fetch response */
function jsonResponse(data: unknown, ok = true): Promise<Response> {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(data),
  } as Response);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── stripUndefined ────────────────────────────────────────────────────────────

describe('stripUndefined', () => {
  it('removes undefined values', () => {
    const result = stripUndefined({ a: 1, b: undefined, c: 'hello' });
    expect(result).toEqual({ a: 1, c: 'hello' });
    expect(result).not.toHaveProperty('b');
  });

  it('keeps null values', () => {
    const result = stripUndefined({ a: null, b: 'value' });
    expect(result).toEqual({ a: null, b: 'value' });
  });

  it('keeps falsy values (0, empty string, false)', () => {
    const result = stripUndefined({ a: 0, b: '', c: false });
    expect(result).toEqual({ a: 0, b: '', c: false });
  });

  it('returns empty object if all undefined', () => {
    const result = stripUndefined({ a: undefined, b: undefined });
    expect(result).toEqual({});
  });

  it('returns same shape if no undefined', () => {
    const original = { a: 1, b: 'two' };
    const result = stripUndefined(original);
    expect(result).toEqual(original);
  });
});

// ── Task CRUD ─────────────────────────────────────────────────────────────────

describe('Task CRUD', () => {
  it('createTask POSTs to /api/tasks and returns id', async () => {
    mockFetch.mockReturnValue(
      jsonResponse({ id: 'new-id', name: 'Test', starValue: 2, isActive: true, recurrence: { type: 'daily' }, description: '' }),
    );
    const id = await createTask(FAMILY_ID, {
      name: 'Test',
      description: '',
      starValue: 2,
      isActive: true,
      recurrence: { type: 'daily' },
    });
    expect(id).toBe('new-id');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tasks'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('updateTask PUTs to /api/tasks/:id', async () => {
    mockFetch.mockReturnValue(jsonResponse({}));
    await updateTask(FAMILY_ID, 'task-1', { name: 'Updated' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tasks/task-1'),
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('deleteTask DELETEs /api/tasks/:id', async () => {
    mockFetch.mockReturnValue(jsonResponse({}));
    await deleteTask(FAMILY_ID, 'task-1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tasks/task-1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

// ── Period CRUD ───────────────────────────────────────────────────────────────

describe('Period CRUD', () => {
  it('createPeriod POSTs to /api/periods and returns id', async () => {
    mockFetch.mockReturnValue(
      jsonResponse({
        id: 'period-id',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        status: 'active',
        starBudget: 100,
        starsEarned: 0,
        starsPending: 0,
        thresholds: {},
      }),
    );
    const period = {
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      status: 'active' as const,
      starBudget: 100,
      starsEarned: 0,
      starsPending: 0,
      thresholds: { rewardPercent: 80, penaltyPercent: 30, rewardDescription: '', penaltyDescription: '' },
    };
    const id = await createPeriod(FAMILY_ID, period);
    expect(id).toBe('period-id');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/periods'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('updatePeriod PUTs to /api/periods/:id', async () => {
    mockFetch.mockReturnValue(jsonResponse({}));
    await updatePeriod(FAMILY_ID, 'p1', { status: 'completed' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/periods/p1'),
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});

// ── Completion CRUD ───────────────────────────────────────────────────────────

describe('Completion CRUD', () => {
  it('createCompletion POSTs to /api/completions/:periodId', async () => {
    mockFetch.mockReturnValue(jsonResponse({}));
    const completion = {
      taskId: 't1',
      taskName: 'Test',
      taskStarValue: 2,
      date: new Date().toISOString(),
      status: 'pending' as const,
      completedAt: new Date().toISOString(),
    };
    await createCompletion(FAMILY_ID, 'p1', completion, 'comp-id');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/completions/p1'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('updateCompletion PUTs to /api/completions/:periodId/:completionId', async () => {
    mockFetch.mockReturnValue(jsonResponse({}));
    await updateCompletion(FAMILY_ID, 'p1', 'comp-1', { status: 'approved' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/completions/p1/comp-1'),
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});

// ── Reward CRUD ───────────────────────────────────────────────────────────────

describe('Reward CRUD', () => {
  it('createReward POSTs to /api/rewards and returns id', async () => {
    mockFetch.mockReturnValue(
      jsonResponse({
        id: 'reward-id',
        name: 'Game Time',
        description: '',
        starCost: 10,
        icon: '🎮',
        isActive: true,
        availability: 'unlimited',
        requiresApproval: true,
      }),
    );
    const reward = {
      name: 'Game Time',
      description: '',
      starCost: 10,
      icon: '🎮',
      isActive: true,
      availability: 'unlimited' as const,
      requiresApproval: true,
    };
    const id = await createReward(FAMILY_ID, reward);
    expect(id).toBe('reward-id');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/rewards'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('updateReward PUTs to /api/rewards/:id', async () => {
    mockFetch.mockReturnValue(jsonResponse({}));
    await updateReward(FAMILY_ID, 'r1', { name: 'Updated' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/rewards/r1'),
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('deleteReward DELETEs /api/rewards/:id', async () => {
    mockFetch.mockReturnValue(jsonResponse({}));
    await deleteReward(FAMILY_ID, 'r1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/rewards/r1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

// ── Redemption CRUD ───────────────────────────────────────────────────────────

describe('Redemption CRUD', () => {
  it('createRedemption POSTs to /api/redemptions and returns id', async () => {
    mockFetch.mockReturnValue(
      jsonResponse({
        id: 'redemption-id',
        rewardId: 'r1',
        rewardName: 'Test',
        starCost: 10,
        redeemedAt: new Date().toISOString(),
        status: 'pending',
      }),
    );
    const redemption = {
      rewardId: 'r1',
      rewardName: 'Test',
      starCost: 10,
      redeemedAt: new Date().toISOString(),
      status: 'pending' as const,
    };
    const id = await createRedemption(FAMILY_ID, redemption);
    expect(id).toBe('redemption-id');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/redemptions'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('updateRedemption PUTs to /api/redemptions/:id', async () => {
    mockFetch.mockReturnValue(jsonResponse({}));
    await updateRedemption(FAMILY_ID, 'red-1', { status: 'fulfilled' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/redemptions/red-1'),
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});

// ── Family operations ─────────────────────────────────────────────────────────

describe('Family operations', () => {
  it('updateFamily PUTs to /api/family', async () => {
    mockFetch.mockReturnValue(jsonResponse({}));
    await updateFamily(FAMILY_ID, { childName: 'New Name' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/family'),
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('incrementFamilyField PUTs to /api/family/increment', async () => {
    mockFetch.mockReturnValue(jsonResponse({}));
    await incrementFamilyField(FAMILY_ID, 'starBalance', 5);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/family/increment'),
      expect.objectContaining({ method: 'PUT' }),
    );
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({ field: 'starBalance', amount: 5 });
  });
});
