import { scheduleReview } from '../../shared/sm2.js';

export const DEMO_TOKEN = 'desk-demo';

const KEYS = {
  cards: 'desk-demo-cards',
  reviews: 'desk-demo-reviews',
  users: 'desk-demo-users',
  seeded: 'desk-demo-seeded'
};

const SEED_CARDS = [
  {
    front: 'What is REST?',
    back: 'An architectural style for networked apps: stateless client–server communication over HTTP.'
  },
  {
    front: 'RESTful API',
    back: 'An API that follows REST principles, using HTTP requests to access and manipulate resources.'
  },
  {
    front: 'Time complexity of checking whether x is in a Python list?',
    back: 'O(n) — a linear scan of the list.'
  },
  {
    front: 'Which data structure is FIFO?',
    back: 'A queue — first in, first out.'
  },
  {
    front: 'Which data structure is LIFO?',
    back: 'A stack — last in, first out.'
  }
];

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function makeCard(front, back, extra = {}) {
  return {
    id: extra.id || newId(),
    front,
    back,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: nowIso(),
    ...extra
  };
}

export function isBrowserDemo() {
  if (import.meta.env.VITE_API_URL === 'demo') return true;
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return false;
  const configured = import.meta.env.VITE_API_URL;
  const noRemoteApi = !configured || String(configured).includes('localhost');
  return noRemoteApi && /\.github\.io$/i.test(host);
}

function ensureSeed() {
  if (localStorage.getItem(KEYS.seeded) === '1' && readJson(KEYS.cards, []).length > 0) {
    return;
  }
  const cards = SEED_CARDS.map((c) => makeCard(c.front, c.back));
  writeJson(KEYS.cards, cards);
  if (!readJson(KEYS.reviews, null)) writeJson(KEYS.reviews, []);
  localStorage.setItem(KEYS.seeded, '1');
}

export const demoStore = {
  start() {
    ensureSeed();
    return { token: DEMO_TOKEN, user: { id: 'demo', name: 'Demo' } };
  },

  register(email, password, name) {
    const users = readJson(KEYS.users, []);
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized || !password) {
      throw new Error('Email and password are required');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    if (users.some((u) => u.email === normalized)) {
      throw new Error('An account with that email already exists');
    }
    users.push({ email: normalized, password, name: name || 'Learner' });
    writeJson(KEYS.users, users);
    ensureSeed();
    return { token: DEMO_TOKEN, user: { id: 'demo', name: name || 'Learner', email: normalized } };
  },

  login(email, password) {
    const users = readJson(KEYS.users, []);
    const normalized = String(email || '').trim().toLowerCase();
    const user = users.find((u) => u.email === normalized && u.password === password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    ensureSeed();
    return { token: DEMO_TOKEN, user: { id: 'demo', name: user.name, email: user.email } };
  },

  getCards() {
    ensureSeed();
    return readJson(KEYS.cards, []);
  },

  createCard(front, back) {
    const cards = readJson(KEYS.cards, []);
    const card = makeCard(front, back);
    cards.unshift(card);
    writeJson(KEYS.cards, cards);
    return card;
  },

  updateCard(id, front, back) {
    const cards = readJson(KEYS.cards, []);
    const next = cards.map((c) => (c.id === id ? { ...c, front, back } : c));
    writeJson(KEYS.cards, next);
    return next.find((c) => c.id === id);
  },

  deleteCard(id) {
    writeJson(KEYS.cards, readJson(KEYS.cards, []).filter((c) => c.id !== id));
    return { message: 'Card deleted successfully' };
  },

  rateCard(id, quality) {
    const cards = readJson(KEYS.cards, []);
    const index = cards.findIndex((c) => c.id === id);
    if (index < 0) throw new Error('Card not found');
    const card = cards[index];
    const schedule = scheduleReview(
      {
        easeFactor: card.easeFactor,
        interval: card.interval,
        repetitions: card.repetitions
      },
      quality
    );
    const updated = {
      ...card,
      ...schedule,
      nextReview: schedule.nextReview.toISOString()
    };
    cards[index] = updated;
    writeJson(KEYS.cards, cards);

    const reviews = readJson(KEYS.reviews, []);
    reviews.push({ cardId: id, quality, createdAt: nowIso() });
    writeJson(KEYS.reviews, reviews);
    return updated;
  },

  getReviewStats(days = 7) {
    const span = Math.min(Math.max(Number(days) || 7, 1), 90);
    const reviews = readJson(KEYS.reviews, []);
    const now = new Date();
    const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    since.setUTCDate(since.getUTCDate() - (span - 1));

    function dayKey(date) {
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
        .toISOString()
        .slice(0, 10);
    }

    const qualityCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const byDayMap = new Map();
    for (let i = 0; i < span; i++) {
      const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
      byDayMap.set(dayKey(d), 0);
    }

    const inWindow = reviews.filter((r) => new Date(r.createdAt) >= since);
    for (const review of inWindow) {
      if (qualityCounts[review.quality] != null) qualityCounts[review.quality] += 1;
      const key = dayKey(new Date(review.createdAt));
      if (byDayMap.has(key)) byDayMap.set(key, byDayMap.get(key) + 1);
    }

    const total = inWindow.length;
    const remembered = qualityCounts[3] + qualityCounts[4];
    return {
      days: span,
      total,
      rememberedRate: total === 0 ? 0 : remembered / total,
      qualityCounts,
      byDay: [...byDayMap.entries()].map(([date, count]) => ({ date, count }))
    };
  }
};
