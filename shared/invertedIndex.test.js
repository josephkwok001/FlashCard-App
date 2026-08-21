import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIndex, search } from './invertedIndex.js';

const cards = [
  { id: '1', front: 'photosynthesis', back: 'plants make glucose from light' },
  { id: '2', front: 'mitosis', back: 'cell division that makes two identical cells' }
];

test('empty query returns all cards', () => {
  const index = buildIndex(cards);
  assert.equal(search(index, '  ', cards).length, 2);
});

test('front token matches one card', () => {
  const index = buildIndex(cards);
  const hits = search(index, 'photosynthesis', cards);
  assert.deepEqual(hits.map((c) => c.id), ['1']);
});


test('back token matches (front-only includes would miss this)', () => {
  const index = buildIndex(cards);
  const hits = search(index, 'glucose', cards);
  assert.deepEqual(hits.map((c) => c.id), ['1']);
});

test('AND query matches a card that has both terms', () => {
  const index = buildIndex(cards);
  const hits = search(index, 'cell division', cards);
  assert.deepEqual(hits.map((c) => c.id), ['2']);
});

test('unrelated query matches none', () => {
  const index = buildIndex(cards);
  assert.equal(search(index, 'volcano', cards).length, 0);
});
