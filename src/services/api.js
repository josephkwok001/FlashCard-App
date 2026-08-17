import { demoStore, isBrowserDemo, isDemoToken } from './demoStore.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const USER_KEY = 'desk-session-user';

const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');
const getSessionUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
};
function setSessionUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}
function notifyAuth() {
  window.dispatchEvent(new Event('desk-auth'));
}

if (typeof window !== 'undefined' && isBrowserDemo()) {
  const existing = getToken();
  if (existing && !isDemoToken(existing)) {
    removeToken();
  }
}

function normalizeCard(card) {
  if (!card) return card;
  const id = card.id ?? card._id?.toString?.() ?? String(card._id);
  return { ...card, id };
}

function normalizeCards(cards) {
  return Array.isArray(cards) ? cards.map(normalizeCard) : [];
}

function getAuthHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function readErrorMessage(response, fallback) {
  const error = await response.json().catch(() => null);
  return error?.message || fallback;
}

function wrapNetwork(err, fallback) {
  const msg = String(err?.message ?? err);
  if (msg === 'Failed to fetch' || err?.name === 'TypeError') {
    return new Error(
      fallback || 'Cannot reach the API. Run npm run dev:server for local use.'
    );
  }
  return err instanceof Error ? err : new Error(msg);
}

const api = {
  startDemo: async () => {
    const data = demoStore.start();
    setToken(data.token);
    setSessionUser(data.user);
    notifyAuth();
    return data;
  },

  guestLogin: async () => {
    if (isBrowserDemo()) return api.startDemo();
    const response = await fetch(`${API_BASE_URL}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to start guest session');
    const data = await response.json();
    if (data.token) setToken(data.token);
    return data;
  },

  ensureAuth: async () => {
    if (getToken()) return;
    throw new Error('Please log in');
  },

  register: async (email, password, name) => {
    if (isBrowserDemo()) {
      const data = demoStore.register(email, password, name);
      setToken(data.token);
      setSessionUser(data.user);
      notifyAuth();
      return data;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to register'));
      }
      const data = await response.json();
      if (data.token) setToken(data.token);
      setSessionUser(data.user);
      notifyAuth();
      return data;
    } catch (err) {
      throw wrapNetwork(err);
    }
  },

  login: async (email, password) => {
    if (isBrowserDemo()) {
      const data = demoStore.login(email, password);
      setToken(data.token);
      setSessionUser(data.user);
      notifyAuth();
      return data;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to log in'));
      }
      const data = await response.json();
      if (data.token) setToken(data.token);
      setSessionUser(data.user);
      notifyAuth();
      return data;
    } catch (err) {
      throw wrapNetwork(err);
    }
  },

  logout: () => {
    removeToken();
    setSessionUser(null);
    notifyAuth();
  },

  getCards: async () => {
    if (isBrowserDemo()) return demoStore.getCards();
    try {
      const response = await fetch(`${API_BASE_URL}/cards`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch cards');
      return normalizeCards(await response.json());
    } catch (err) {
      throw wrapNetwork(err, 'Failed to fetch cards');
    }
  },

  getDueCards: async () => {
    if (isBrowserDemo()) {
      const now = Date.now();
      return demoStore.getCards().filter((c) => new Date(c.nextReview).getTime() <= now);
    }
    const response = await fetch(`${API_BASE_URL}/cards/due`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch due cards');
    return normalizeCards(await response.json());
  },

  createCard: async (front, back) => {
    if (isBrowserDemo()) return demoStore.createCard(front, back);
    const response = await fetch(`${API_BASE_URL}/cards`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ front, back })
    });
    if (!response.ok) throw new Error('Failed to create card');
    return normalizeCard(await response.json());
  },

  updateCard: async (id, front, back) => {
    if (isBrowserDemo()) return demoStore.updateCard(id, front, back);
    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ front, back })
    });
    if (!response.ok) throw new Error('Failed to update card');
    return normalizeCard(await response.json());
  },

  deleteCard: async (id) => {
    if (isBrowserDemo()) return demoStore.deleteCard(id);
    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete card');
    return response.json();
  },

  rateCard: async (id, quality) => {
    if (isBrowserDemo()) return demoStore.rateCard(id, Number(quality));
    const response = await fetch(`${API_BASE_URL}/cards/${id}/rate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quality })
    });
    if (!response.ok) throw new Error('Failed to rate card');
    return normalizeCard(await response.json());
  },

  getReviewStats: async (days = 7) => {
    if (isBrowserDemo()) return demoStore.getReviewStats(days);
    const response = await fetch(`${API_BASE_URL}/reviews/stats?days=${days}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch review stats');
    return response.json();
  },

  getSuggestion: async (front) => {
    if (isBrowserDemo()) {
      throw new Error('AI Suggest needs the Express API — not available in this browser demo.');
    }
    const response = await fetch(`${API_BASE_URL}/ai/suggest`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ front })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.message || 'Failed to get suggestion');
    }
    return response.json();
  },

  healthCheck: async () => {
    if (isBrowserDemo()) return { message: 'Browser demo' };
    const base = API_BASE_URL.replace(/\/api\/?$/, '');
    const response = await fetch(`${base}/`);
    if (!response.ok) throw new Error('Backend not reachable');
    return response.json();
  }
};

export default api;
export { getToken, setToken, removeToken, getSessionUser };
export { isBrowserDemo } from './demoStore.js';
