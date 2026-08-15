import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scheduleReview } from './sm2.js';

const fresh = { easeFactor: 2.5, interval: 0, repetitions: 0 };

test('quality 1 (Again) resets repetitions and sets interval to 1', () => {
  const result = scheduleReview({ easeFactor: 2.8, interval: 15, repetitions: 4 }, 1);
  assert.equal(result.repetitions, 0);
  assert.equal(result.interval, 1);
});

test('ease factor never drops below 1.3', () => {
  let state = { easeFactor: 1.3, interval: 1, repetitions: 1 };
  for (let i = 0; i < 8; i++) {
    state = scheduleReview(state, 1);
  }
  assert.ok(state.easeFactor >= 1.3);
});

test('first pass (quality >= 2) sets interval to 1 day', () => {
  const result = scheduleReview(fresh, 3);
  assert.equal(result.repetitions, 1);
  assert.equal(result.interval, 1);
});

test('second pass sets interval to 6 days', () => {
  const afterFirst = scheduleReview(fresh, 3);
  const afterSecond = scheduleReview(afterFirst, 3);
  assert.equal(afterSecond.repetitions, 2);
  assert.equal(afterSecond.interval, 6);
});

test('failed review keeps nextReview at now (due again today)', () => {
  const before = Date.now();
  const result = scheduleReview({ easeFactor: 2.5, interval: 6, repetitions: 2 }, 1);
  const after = Date.now();
  const ts = result.nextReview.getTime();
  assert.ok(ts >= before && ts <= after + 50);
});
