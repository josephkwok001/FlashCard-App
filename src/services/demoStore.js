import { scheduleReview } from '../../shared/sm2.js';

export const DEMO_TOKEN_PREFIX = 'desk-demo:';

const KEYS = {
  users: 'desk-demo-users'
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

export function isDemoToken(token) {
  return Boolean(token) && token.startsWith(DEMO_TOKEN_PREFIX);
}

function tokenFor(userId) {
  return `${DEMO_TOKEN_PREFIX}${userId}`;
}

function sessionUserId() {
  const token = localStorage.getItem('token') || '';
  if (!isDemoToken(token)) return null;
  return token.slice(DEMO_TOKEN_PREFIX.length);
}

function cardsKey(userId) {
  return `desk-demo-cards:${userId}`;
}

function reviewsKey(userId) {
  return `desk-demo-reviews:${userId}`;
}

function requireUserId() {
  const userId = sessionUserId();
  if (!userId) throw new Error('Please log in');
  return userId;
}

function loadUsers() {
  const users = readJson(KEYS.users, []);
  let changed = false;
  const migrated = users.map((user) => {
    if (user.id) return user;
    changed = true;
    return { ...user, id: newId() };
  });
  if (changed) writeJson(KEYS.users, migrated);
  return migrated;
}

function seedForUser(userId) {
  if (readJson(cardsKey(userId), []).length > 0) return;
  writeJson(cardsKey(userId), SEED_CARDS.map((c) => makeCard(c.front, c.back)));
  if (!readJson(reviewsKey(userId), null)) writeJson(reviewsKey(userId), []);
}

export const demoStore = {
  start() {
    const userId = 'guest';
    seedForUser(userId);
    return { token: tokenFor(userId), user: { id: userId, name: 'Demo' } };
  },

  register(email, password, name) {
    const users = loadUsers();
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

    const user = {
      id: newId(),
      email: normalized,
      password,
      name: name || 'Learner'
    };
    users.push(user);
    writeJson(KEYS.users, users);
    seedForUser(user.id);
    return {
      token: tokenFor(user.id),
      user: { id: user.id, name: user.name, email: user.email }
    };
  },

  login(email, password) {
    const users = loadUsers();
    const normalized = String(email || '').trim().toLowerCase();
    const user = users.find((u) => u.email === normalized && u.password === password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    if (readJson(cardsKey(user.id), []).length === 0) {
      seedForUser(user.id);
    }
    return {
      token: tokenFor(user.id),
      user: { id: user.id, name: user.name, email: user.email }
    };
  },

  getCards() {
    return readJson(cardsKey(requireUserId()), []);
  },

  createCard(front, back) {
    const userId = requireUserId();
    const cards = readJson(cardsKey(userId), []);
    const card = makeCard(front, back);
    cards.unshift(card);
    writeJson(cardsKey(userId), cards);
    return card;
  },

  updateCard(id, front, back) {
    const userId = requireUserId();
    const cards = readJson(cardsKey(userId), []);
    const next = cards.map((c) => (c.id === id ? { ...c, front, back } : c));
    writeJson(cardsKey(userId), next);
    return next.find((c) => c.id === id);
  },

  deleteCard(id) {
    const userId = requireUserId();
    writeJson(
      cardsKey(userId),
      readJson(cardsKey(userId), []).filter((c) => c.id !== id)
    );
    return { message: 'Card deleted successfully' };
  },

  rateCard(id, quality) {
    const userId = requireUserId();
    const cards = readJson(cardsKey(userId), []);
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
    writeJson(cardsKey(userId), cards);

    const reviews = readJson(reviewsKey(userId), []);
    reviews.push({ cardId: id, quality, createdAt: nowIso() });
    writeJson(reviewsKey(userId), reviews);
    return updated;
  },

  getReviewStats(days = 7) {
    const userId = requireUserId();
    const span = Math.min(Math.max(Number(days) || 7, 1), 90);
    const reviews = readJson(reviewsKey(userId), []);
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
