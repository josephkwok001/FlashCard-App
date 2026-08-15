/**
 * SuperMemo SM-2 spaced-repetition scheduler.
 * Quality: 1 Again, 2 Hard, 3 Good, 4 Easy.
 */
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
  if (quality >= 2) {
    nextReview.setDate(nextReview.getDate() + nextInterval);
  }

  return {
    easeFactor: nextEase,
    interval: nextInterval,
    repetitions: nextRepetitions,
    nextReview
  };
}
