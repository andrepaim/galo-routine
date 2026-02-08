import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// ── Streak Milestones (must match client-side STREAK_MILESTONES) ────
const STREAK_MILESTONES = [
  { days: 3, bonusGoals: 2 },
  { days: 7, bonusGoals: 5 },
  { days: 14, bonusGoals: 10 },
  { days: 30, bonusGoals: 25 },
];

/**
 * Scheduled function that runs daily to check for periods that need to be
 * auto-rolled (completed and a new one started).
 *
 * Runs every day at midnight UTC.
 */
export const autoRollPeriods = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    // Find all families with autoRollPeriods enabled
    const familiesSnap = await db
      .collection('families')
      .where('settings.autoRollPeriods', '==', true)
      .get();

    for (const familyDoc of familiesSnap.docs) {
      const familyId = familyDoc.id;
      const family = familyDoc.data();

      // Find active periods that have ended
      const periodsSnap = await db
        .collection('families')
        .doc(familyId)
        .collection('periods')
        .where('status', '==', 'active')
        .get();

      for (const periodDoc of periodsSnap.docs) {
        const period = periodDoc.data();

        if (period.endDate.toMillis() < now.toMillis()) {
          // Calculate outcome
          let outcome: string;
          if (period.goalBudget === 0) {
            outcome = 'neutral';
          } else {
            const earnedPercent = (period.goalsEarned / period.goalBudget) * 100;
            if (earnedPercent >= period.thresholds.rewardPercent) {
              outcome = 'reward';
            } else if (earnedPercent < period.thresholds.penaltyPercent) {
              outcome = 'penalty';
            } else {
              outcome = 'neutral';
            }
          }

          // Complete the period
          await periodDoc.ref.update({
            status: 'completed',
            outcome,
          });

          // Get active tasks to calculate new goal budget
          const tasksSnap = await db
            .collection('families')
            .doc(familyId)
            .collection('tasks')
            .where('isActive', '==', true)
            .get();

          // Create a new period
          const settings = family.settings;
          const newStart = new Date();
          newStart.setHours(0, 0, 0, 0);

          let newEnd: Date;
          switch (settings.periodType) {
            case 'biweekly': {
              // Align to configured start day
              const dayOfWeek = newStart.getDay();
              const startDay = settings.periodStartDay ?? 1;
              const diff = (dayOfWeek - startDay + 7) % 7;
              const alignedStart = new Date(newStart);
              alignedStart.setDate(alignedStart.getDate() - diff);
              newStart.setTime(alignedStart.getTime());
              newEnd = new Date(newStart);
              newEnd.setDate(newEnd.getDate() + 13);
              break;
            }
            case 'monthly': {
              // Use first/last of month to avoid overflow
              newStart.setDate(1);
              newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 0);
              break;
            }
            case 'custom':
              newEnd = new Date(newStart);
              newEnd.setDate(newEnd.getDate() + (settings.customPeriodDays || 7) - 1);
              break;
            default: { // weekly
              // Align to configured start day
              const dayOfWeek = newStart.getDay();
              const startDay = settings.periodStartDay ?? 1;
              const diff = (dayOfWeek - startDay + 7) % 7;
              const alignedStart = new Date(newStart);
              alignedStart.setDate(alignedStart.getDate() - diff);
              newStart.setTime(alignedStart.getTime());
              newEnd = new Date(newStart);
              newEnd.setDate(newEnd.getDate() + 6);
            }
          }
          newEnd.setHours(23, 59, 59, 999);

          // Calculate days by counting each day in the interval (inclusive)
          let goalBudget = 0;
          const msPerDay = 1000 * 60 * 60 * 24;
          const startMs = newStart.getTime();
          const endMs = new Date(newEnd.getFullYear(), newEnd.getMonth(), newEnd.getDate()).getTime();
          const daysInPeriod = Math.round((endMs - startMs) / msPerDay) + 1;

          for (const taskDoc of tasksSnap.docs) {
            const task = taskDoc.data();
            if (task.recurrence.type === 'daily') {
              goalBudget += task.goals * daysInPeriod;
            } else if (task.recurrence.type === 'once') {
              goalBudget += task.goals;
            } else if (task.recurrence.type === 'specific_days' && task.recurrence.days) {
              // Count matching days in the period
              for (let d = new Date(newStart); d <= newEnd; d.setDate(d.getDate() + 1)) {
                if (task.recurrence.days.includes(d.getDay())) {
                  goalBudget += task.goals;
                }
              }
            }
          }

          await db
            .collection('families')
            .doc(familyId)
            .collection('periods')
            .add({
              startDate: admin.firestore.Timestamp.fromDate(newStart),
              endDate: admin.firestore.Timestamp.fromDate(newEnd),
              status: 'active',
              goalBudget,
              goalsEarned: 0,
              goalsPending: 0,
              thresholds: {
                rewardPercent: settings.rewardThresholdPercent,
                penaltyPercent: settings.penaltyThresholdPercent,
                rewardDescription: settings.rewardDescription,
                penaltyDescription: settings.penaltyDescription,
              },
            });

          functions.logger.info(`Auto-rolled period for family ${familyId}`, {
            outcome,
            newGoalBudget: goalBudget,
          });
        }
      }
    }
  });

/**
 * When a completion is written (created or updated), recalculate the period's
 * goal counts and handle goal balance, streaks, and badges.
 */
export const onCompletionWrite = functions.firestore
  .document('families/{familyId}/periods/{periodId}/completions/{completionId}')
  .onWrite(async (change, context) => {
    const { familyId, periodId } = context.params;

    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    // Get all completions for this period to recalculate totals
    const completionsSnap = await db
      .collection('families')
      .doc(familyId)
      .collection('periods')
      .doc(periodId)
      .collection('completions')
      .get();

    let goalsEarned = 0;
    let goalsPending = 0;

    for (const doc of completionsSnap.docs) {
      const completion = doc.data();
      if (completion.status === 'approved') {
        goalsEarned += completion.taskGoalValue;
      } else if (completion.status === 'pending') {
        goalsPending += completion.taskGoalValue;
      }
    }

    // Update the period with accurate counts
    await db
      .collection('families')
      .doc(familyId)
      .collection('periods')
      .doc(periodId)
      .update({ goalsEarned, goalsPending });

    // Handle status transitions
    const wasApproved = before?.status !== 'approved' && after?.status === 'approved';
    const wasRejectedAfterApproval = before?.status === 'approved' && after?.status === 'rejected';

    if (wasApproved && after) {
      // Get family settings for bonus mechanics
      const familyDoc = await db.collection('families').doc(familyId).get();
      const family = familyDoc.data();
      if (!family) return;

      const settings = family.settings;
      let bonusGoals = 0;

      // On-time bonus
      if (settings?.onTimeBonusEnabled && after.onTimeBonus) {
        bonusGoals += settings.onTimeBonusGoals || 1;
      }

      // Award bonus goals if any
      if (bonusGoals > 0) {
        await db.collection('families').doc(familyId).update({
          goalBalance: admin.firestore.FieldValue.increment(bonusGoals),
          lifetimeGoalsEarned: admin.firestore.FieldValue.increment(bonusGoals),
        });
      }

      // Check for perfect day bonus
      if (settings?.perfectDayBonusEnabled) {
        await checkPerfectDayBonus(familyId, periodId, after, settings);
      }

      // Check for streak updates
      await updateStreak(familyId, periodId, family);

      // Check for badge awards
      await checkBadges(familyId, family);
    }

    // If an approval is reversed, deduct goals
    if (wasRejectedAfterApproval && before) {
      await db.collection('families').doc(familyId).update({
        goalBalance: admin.firestore.FieldValue.increment(-before.taskGoalValue),
        lifetimeGoalsEarned: admin.firestore.FieldValue.increment(-before.taskGoalValue),
      });
    }
  });

/**
 * Check if all tasks for today are completed and award perfect day bonus.
 */
async function checkPerfectDayBonus(
  familyId: string,
  periodId: string,
  _completion: FirebaseFirestore.DocumentData,
  settings: FirebaseFirestore.DocumentData,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);

  // Get all tasks
  const tasksSnap = await db
    .collection('families')
    .doc(familyId)
    .collection('tasks')
    .where('isActive', '==', true)
    .get();

  // Get today's applicable tasks
  const dayOfWeek = today.getDay();
  const todayTasks = tasksSnap.docs.filter((doc) => {
    const task = doc.data();
    if (task.recurrence.type === 'daily') return true;
    if (task.recurrence.type === 'specific_days' && task.recurrence.days?.includes(dayOfWeek)) return true;
    return false;
  });

  if (todayTasks.length === 0) return;

  // Get all completions for today
  const completionsSnap = await db
    .collection('families')
    .doc(familyId)
    .collection('periods')
    .doc(periodId)
    .collection('completions')
    .get();

  const todayApproved = new Set<string>();
  for (const doc of completionsSnap.docs) {
    const c = doc.data();
    if (c.status === 'approved') {
      // Check if this completion is for today using the ID format: taskId_yyyy-MM-dd
      const parts = doc.id.split('_');
      const dateStr = parts[parts.length - 1];
      if (dateStr === todayStr) {
        todayApproved.add(c.taskId);
      }
    }
  }

  // Check if all today's tasks are approved
  const allComplete = todayTasks.every((doc) => todayApproved.has(doc.id));

  if (allComplete) {
    const bonus = settings.perfectDayBonusGoals || 3;
    await db.collection('families').doc(familyId).update({
      goalBalance: admin.firestore.FieldValue.increment(bonus),
      lifetimeGoalsEarned: admin.firestore.FieldValue.increment(bonus),
    });

    functions.logger.info(`Perfect day bonus awarded for family ${familyId}`, { bonus });
  }
}

/**
 * Update streak tracking when a completion is approved.
 */
async function updateStreak(
  familyId: string,
  periodId: string,
  family: FirebaseFirestore.DocumentData,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);

  // If already updated for today, skip
  if (family.lastStreakDate === todayStr) return;

  // Get all tasks active today
  const dayOfWeek = today.getDay();
  const tasksSnap = await db
    .collection('families')
    .doc(familyId)
    .collection('tasks')
    .where('isActive', '==', true)
    .get();

  const todayTasks = tasksSnap.docs.filter((doc) => {
    const task = doc.data();
    if (task.recurrence.type === 'daily') return true;
    if (task.recurrence.type === 'specific_days' && task.recurrence.days?.includes(dayOfWeek)) return true;
    return false;
  });

  if (todayTasks.length === 0) return;

  // Get today's completions
  const completionsSnap = await db
    .collection('families')
    .doc(familyId)
    .collection('periods')
    .doc(periodId)
    .collection('completions')
    .get();

  const todayApproved = new Set<string>();
  for (const doc of completionsSnap.docs) {
    const c = doc.data();
    if (c.status === 'approved') {
      const parts = doc.id.split('_');
      const dateStr = parts[parts.length - 1];
      if (dateStr === todayStr) {
        todayApproved.add(c.taskId);
      }
    }
  }

  const allComplete = todayTasks.every((doc) => todayApproved.has(doc.id));
  if (!allComplete) return;

  // All tasks for today are approved - update streak
  const currentStreak = (family.currentStreak || 0) + 1;

  // Check if yesterday was a streak day (for continuity)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  let newStreak = currentStreak;
  if (family.lastStreakDate && family.lastStreakDate !== yesterdayStr) {
    // Streak was broken - check for freeze
    const freezeSnap = await db
      .collection('families')
      .doc(familyId)
      .collection('streakFreezes')
      .where('date', '==', family.lastStreakDate)
      .get();

    if (freezeSnap.empty) {
      // No freeze found, reset streak
      newStreak = 1;
    }
  }

  const update: Record<string, unknown> = {
    currentStreak: newStreak,
    bestStreak: Math.max(newStreak, family.bestStreak || 0),
    lastStreakDate: todayStr,
  };

  await db.collection('families').doc(familyId).update(update);

  // Check for streak milestone bonuses
  for (const milestone of STREAK_MILESTONES) {
    const previousStreak = family.currentStreak || 0;
    if (previousStreak < milestone.days && newStreak >= milestone.days) {
      // Crossed a milestone - award bonus goals
      await db.collection('families').doc(familyId).update({
        goalBalance: admin.firestore.FieldValue.increment(milestone.bonusGoals),
        lifetimeGoalsEarned: admin.firestore.FieldValue.increment(milestone.bonusGoals),
      });

      functions.logger.info(`Streak milestone ${milestone.days} reached for family ${familyId}`, {
        bonusGoals: milestone.bonusGoals,
        newStreak,
      });
    }
  }
}

/**
 * Check and award badges based on current family state.
 */
async function checkBadges(familyId: string, family: FirebaseFirestore.DocumentData) {
  const lifetimeGoals = family.lifetimeGoalsEarned || 0;
  const currentStreak = family.currentStreak || 0;

  // Get currently earned badges
  const earnedSnap = await db
    .collection('families')
    .doc(familyId)
    .collection('earnedBadges')
    .get();
  const earnedIds = new Set(earnedSnap.docs.map((d) => d.data().badgeId));

  const badgesToAward: string[] = [];

  // Milestone badges - goal counts
  if (lifetimeGoals >= 1 && !earnedIds.has('first_star')) badgesToAward.push('first_star');
  if (lifetimeGoals >= 10 && !earnedIds.has('star_collector_10')) badgesToAward.push('star_collector_10');
  if (lifetimeGoals >= 50 && !earnedIds.has('star_collector_50')) badgesToAward.push('star_collector_50');
  if (lifetimeGoals >= 100 && !earnedIds.has('star_collector_100')) badgesToAward.push('star_collector_100');
  if (lifetimeGoals >= 500 && !earnedIds.has('star_collector_500')) badgesToAward.push('star_collector_500');

  // Milestone badges - streaks
  if (currentStreak >= 3 && !earnedIds.has('streak_3')) badgesToAward.push('streak_3');
  if (currentStreak >= 7 && !earnedIds.has('streak_7')) badgesToAward.push('streak_7');
  if (currentStreak >= 14 && !earnedIds.has('streak_14')) badgesToAward.push('streak_14');
  if (currentStreak >= 30 && !earnedIds.has('streak_30')) badgesToAward.push('streak_30');

  // Check if child has redeemed a reward
  const redemptionsSnap = await db
    .collection('families')
    .doc(familyId)
    .collection('redemptions')
    .limit(1)
    .get();
  if (!redemptionsSnap.empty && !earnedIds.has('reward_shopper')) {
    badgesToAward.push('reward_shopper');
  }

  // Award badges
  const batch = db.batch();
  for (const badgeId of badgesToAward) {
    const ref = db.collection('families').doc(familyId).collection('earnedBadges').doc();
    batch.set(ref, {
      badgeId,
      earnedAt: admin.firestore.Timestamp.now(),
    });
  }

  if (badgesToAward.length > 0) {
    await batch.commit();
    functions.logger.info(`Awarded ${badgesToAward.length} badges for family ${familyId}`, {
      badges: badgesToAward,
    });
  }
}

/**
 * Daily streak check - runs at end of day to reset broken streaks.
 */
export const dailyStreakCheck = functions.pubsub
  .schedule('0 23 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    const familiesSnap = await db.collection('families').get();

    for (const familyDoc of familiesSnap.docs) {
      const family = familyDoc.data();
      const familyId = familyDoc.id;

      // Skip if no active streak or already updated today
      if (!family.currentStreak || family.currentStreak === 0) continue;
      if (family.lastStreakDate === todayStr) continue;

      // Check for a streak freeze for today
      const freezeSnap = await db
        .collection('families')
        .doc(familyId)
        .collection('streakFreezes')
        .where('date', '==', todayStr)
        .get();

      if (freezeSnap.empty) {
        // No freeze and day wasn't completed - reset streak
        await db.collection('families').doc(familyId).update({
          currentStreak: 0,
        });
        functions.logger.info(`Streak reset for family ${familyId}`);
      }
    }
  });

/**
 * Auto-close day matches - runs at midnight to close any open championship
 * matches that were not manually closed by the parent during the day.
 *
 * Runs every day at midnight UTC.
 */
export const autoCloseDayMatches = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    // Yesterday's date string (we're closing matches from the day that just ended)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayStr = formatDate(yesterday);

    const familiesSnap = await db.collection('families').get();

    for (const familyDoc of familiesSnap.docs) {
      const familyId = familyDoc.id;

      // Find the active championship for this family
      const championshipsSnap = await db
        .collection('families')
        .doc(familyId)
        .collection('championships')
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (championshipsSnap.empty) continue;

      const championshipDoc = championshipsSnap.docs[0];
      const championshipId = championshipDoc.id;

      // Find open matches for yesterday's date
      const matchesSnap = await db
        .collection('families')
        .doc(familyId)
        .collection('championships')
        .doc(championshipId)
        .collection('matches')
        .where('date', '==', yesterdayStr)
        .where('status', '==', 'open')
        .get();

      if (matchesSnap.empty) continue;

      // Close each open match
      const batch = db.batch();
      let closedCount = 0;

      for (const matchDoc of matchesSnap.docs) {
        batch.update(matchDoc.ref, {
          status: 'closed',
          closedAt: now,
        });
        closedCount++;
      }

      await batch.commit();

      functions.logger.info(
        `Auto-closed ${closedCount} match(es) for family ${familyId}, championship ${championshipId}`,
        { date: yesterdayStr, closedCount },
      );
    }
  });

/**
 * Format a date as "yyyy-MM-dd" for consistent date string comparison.
 */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
