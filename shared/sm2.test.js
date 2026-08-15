import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scheduleReview, formatReviewDelay } from './sm2.js';

const fresh = { easeFactor: 2.5, interval: 0, repetitions: 0 };

test('quality 1 (Again) resets repetitions and requeues in 1 minute', () => {
  const before = Date.now();
  const result = scheduleReview({ easeFactor: 2.8, interval: 15, repetitions: 4 }, 1);
  assert.equal(result.repetitions, 0);
  assert.equal(result.interval, 1);
  const ts = result.nextReview.getTime();
  assert.ok(ts >= before + 60_000 - 50);
  assert.ok(ts <= before + 60_000 + 50);
});

test('first Hard / Good / Easy all use SM-2 interval of 1 day', () => {
  for (const quality of [2, 3, 4]) {
    const result = scheduleReview(fresh, quality);
    assert.equal(result.repetitions, 1);
    assert.equal(result.interval, 1);
  }
});

test('ease factor never drops below 1.3', () => {
  let state = { easeFactor: 1.3, interval: 1, repetitions: 1 };
  for (let i = 0; i < 8; i++) {
    state = scheduleReview(state, 1);
  }
  assert.ok(state.easeFactor >= 1.3);
});

test('Easy raises ease more than Hard', () => {
  const hard = scheduleReview(fresh, 2);
  const easy = scheduleReview(fresh, 4);
  assert.ok(easy.easeFactor > hard.easeFactor);
});

test('second pass sets interval to 6 days', () => {
  const afterFirst = scheduleReview(fresh, 3);
  const afterSecond = scheduleReview(afterFirst, 3);
  assert.equal(afterSecond.repetitions, 2);
  assert.equal(afterSecond.interval, 6);
});

test('third Good multiplies interval by ease factor', () => {
  const first = scheduleReview(fresh, 3);
  const second = scheduleReview(first, 3);
  const third = scheduleReview(second, 3);
  assert.equal(third.interval, Math.round(second.interval * third.easeFactor));
});

test('formatReviewDelay uses min / hour / day labels', () => {
  const now = Date.now();
  assert.equal(formatReviewDelay(new Date(now + 60_000), now), '1 min');
  assert.equal(formatReviewDelay(new Date(now + 3_600_000), now), '1 hour');
  assert.equal(formatReviewDelay(new Date(now + 86_400_000), now), '1 day');
  assert.equal(formatReviewDelay(new Date(now + 3 * 86_400_000), now), '3 days');
});
