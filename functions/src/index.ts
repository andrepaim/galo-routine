import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

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
          const budget = period.starBudget || 1;
          const earnedPercent = (period.starsEarned / budget) * 100;
          let outcome: string;

          if (earnedPercent >= period.thresholds.rewardPercent) {
            outcome = 'reward';
          } else if (earnedPercent < period.thresholds.penaltyPercent) {
            outcome = 'penalty';
          } else {
            outcome = 'neutral';
          }

          // Complete the period
          await periodDoc.ref.update({
            status: 'completed',
            outcome,
          });

          // Get active tasks to calculate new star budget
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
            case 'biweekly':
              newEnd = new Date(newStart);
              newEnd.setDate(newEnd.getDate() + 13);
              break;
            case 'monthly':
              newEnd = new Date(newStart);
              newEnd.setMonth(newEnd.getMonth() + 1);
              newEnd.setDate(newEnd.getDate() - 1);
              break;
            case 'custom':
              newEnd = new Date(newStart);
              newEnd.setDate(newEnd.getDate() + (settings.customPeriodDays || 7) - 1);
              break;
            default: // weekly
              newEnd = new Date(newStart);
              newEnd.setDate(newEnd.getDate() + 6);
          }
          newEnd.setHours(23, 59, 59, 999);

          // Simple budget calculation for cloud function
          let starBudget = 0;
          const daysInPeriod = Math.ceil(
            (newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24),
          ) + 1;

          for (const taskDoc of tasksSnap.docs) {
            const task = taskDoc.data();
            if (task.recurrence.type === 'daily') {
              starBudget += task.starValue * daysInPeriod;
            } else if (task.recurrence.type === 'once') {
              starBudget += task.starValue;
            } else if (task.recurrence.type === 'specific_days' && task.recurrence.days) {
              // Count matching days in the period
              for (let d = new Date(newStart); d <= newEnd; d.setDate(d.getDate() + 1)) {
                if (task.recurrence.days.includes(d.getDay())) {
                  starBudget += task.starValue;
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
              starBudget,
              starsEarned: 0,
              starsPending: 0,
              thresholds: {
                rewardPercent: settings.rewardThresholdPercent,
                penaltyPercent: settings.penaltyThresholdPercent,
                rewardDescription: settings.rewardDescription,
                penaltyDescription: settings.penaltyDescription,
              },
            });

          functions.logger.info(`Auto-rolled period for family ${familyId}`, {
            outcome,
            newStarBudget: starBudget,
          });
        }
      }
    }
  });

/**
 * When a completion is updated (approved/rejected), recalculate the period's
 * star counts from the source of truth (all completions).
 */
export const onCompletionWrite = functions.firestore
  .document('families/{familyId}/periods/{periodId}/completions/{completionId}')
  .onWrite(async (change, context) => {
    const { familyId, periodId } = context.params;

    // Get all completions for this period
    const completionsSnap = await db
      .collection('families')
      .doc(familyId)
      .collection('periods')
      .doc(periodId)
      .collection('completions')
      .get();

    let starsEarned = 0;
    let starsPending = 0;

    for (const doc of completionsSnap.docs) {
      const completion = doc.data();
      if (completion.status === 'approved') {
        starsEarned += completion.taskStarValue;
      } else if (completion.status === 'pending') {
        starsPending += completion.taskStarValue;
      }
    }

    // Update the period with accurate counts
    await db
      .collection('families')
      .doc(familyId)
      .collection('periods')
      .doc(periodId)
      .update({ starsEarned, starsPending });
  });
