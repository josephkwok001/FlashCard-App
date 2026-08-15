function tokenize(text) {
  return String(text ?? '')
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

/**
 * Map term → Set of card ids. Indexes front and back.
 */
export function buildIndex(cards) {
  const index = new Map();

  for (const card of cards) {
    const id = card.id ?? card._id;
    const tokens = new Set([
      ...tokenize(card.front),
      ...tokenize(card.back)
    ]);

    for (const term of tokens) {
      if (!index.has(term)) index.set(term, new Set());
      index.get(term).add(String(id));
    }
  }

  return index;
}

function intersect(a, b) {
  const out = new Set();
  for (const id of a) {
    if (b.has(id)) out.add(id);
  }
  return out;
}

/**
 * AND query over posting lists. Empty query returns all cards.
 */
export function search(index, query, cards) {
  const terms = tokenize(query);
  if (terms.length === 0) return cards;

  let ids = null;
  for (const term of terms) {
    const posting = index.get(term) ?? new Set();
    ids = ids ? intersect(ids, posting) : new Set(posting);
    if (ids.size === 0) return [];
  }

  return cards.filter((card) => ids.has(String(card.id ?? card._id)));
}

export { tokenize };
