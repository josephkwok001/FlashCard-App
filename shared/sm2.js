/**
 * SuperMemo SM-2 spaced-repetition scheduler.
 * Quality: 1 Again, 2 Hard, 3 Good, 4 Easy.
 *
 * Passing reviews (Hard / Good / Easy) use the SM-2 interval sequence:
 * 1 day, then 6 days, then previous interval × ease factor.
 * Quality only changes ease (Easy grows faster later; Hard grows slower).
 * Again is a lapse: reset the streak and requeue in 1 minute.
 */
export const AGAIN_DELAY_MS = 60_000;

export function scheduleReview({ easeFactor, interval, repetitions }, quality) {
  let nextEase = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
  if (nextEase < 1.3) {
    nextEase = 1.3;
  }

  let nextInterval = interval;
  let nextRepetitions = repetitions;

  if (quality < 2) {
    nextRepetitions = 0;
    nextInterval = 1;
  } else {
    nextRepetitions = repetitions + 1;

    if (nextRepetitions === 1) {
      nextInterval = 1;
    } else if (nextRepetitions === 2) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(interval * nextEase);
    }
  }

  const nextReview = new Date();
  if (quality < 2) {
    nextReview.setTime(nextReview.getTime() + AGAIN_DELAY_MS);
  } else {
    nextReview.setDate(nextReview.getDate() + nextInterval);
  }

  return {
    easeFactor: nextEase,
    interval: nextInterval,
    repetitions: nextRepetitions,
    nextReview
  };
}

export function formatReviewDelay(nextReview, now = Date.now()) {
  const target = nextReview instanceof Date ? nextReview.getTime() : new Date(nextReview).getTime();
  const from = typeof now === 'number' ? now : now.getTime();
  const diffMs = Math.max(0, target - from);

  if (diffMs < 2 * 60 * 1000) return '1 min';
  if (diffMs < 45 * 60 * 1000) {
    const mins = Math.max(2, Math.round(diffMs / 60_000));
    return `${mins} min`;
  }
  if (diffMs < 18 * 60 * 60 * 1000) {
    const hours = Math.max(1, Math.round(diffMs / 3_600_000));
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  const days = Math.max(1, Math.round(diffMs / 86_400_000));
  return days === 1 ? '1 day' : `${days} days`;
}
