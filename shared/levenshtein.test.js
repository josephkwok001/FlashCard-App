import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levenshtein, gradeAnswer } from './levenshtein.js';

test('identical strings have distance 0', () => {
  assert.equal(levenshtein('paris', 'paris'), 0);
});

test('single substitution is distance 1', () => {
  assert.equal(levenshtein('kitten', 'sitten'), 1);
});

test('classic kitten → sitting is distance 3', () => {
  assert.equal(levenshtein('kitten', 'sitting'), 3);
});

test('exact match (ignoring case/trim) grades Easy', () => {
  const result = gradeAnswer('  Paris ', 'paris');
  assert.equal(result.distance, 0);
  assert.equal(result.quality, 4);
  assert.equal(result.label, 'Easy');
});

test('small typo grades Good', () => {
  const result = gradeAnswer('pariss', 'paris');
  assert.equal(result.quality, 3);
});

test('unrelated answer grades Again', () => {
  const result = gradeAnswer('london', 'photosynthesis');
  assert.equal(result.quality, 1);
});
