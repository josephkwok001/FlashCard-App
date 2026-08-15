/** Classic DP edit distance (insert / delete / substitute). */
export function levenshtein(a, b) {
  const s = String(a);
  const t = String(b);
  const m = s.length;
  const n = t.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Array(n + 1);
  const curr = new Array(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }

  return prev[n];
}

const QUALITY_LABELS = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy'
};

/**
 * Normalize both sides, compute relative edit distance, map to SM-2 quality 1–4.
 */
export function gradeAnswer(typed, expected) {
  const a = String(typed ?? '').trim().toLowerCase();
  const b = String(expected ?? '').trim().toLowerCase();
  const distance = levenshtein(a, b);
  const denom = Math.max(b.length, a.length, 1);
  const ratio = distance / denom;

  let quality;
  if (distance === 0) quality = 4;
  else if (ratio <= 0.2) quality = 3;
  else if (ratio <= 0.4) quality = 2;
  else quality = 1;

  return {
    distance,
    ratio,
    quality,
    label: QUALITY_LABELS[quality]
  };
}
