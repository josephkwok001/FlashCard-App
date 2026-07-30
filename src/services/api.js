const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

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

const api = {
  guestLogin: async () => {
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
    await api.guestLogin();
  },

  getCards: async () => {
    const response = await fetch(`${API_BASE_URL}/cards`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch cards');
    return normalizeCards(await response.json());
  },

  getDueCards: async () => {
    const response = await fetch(`${API_BASE_URL}/cards/due`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch due cards');
    return normalizeCards(await response.json());
  },

  createCard: async (front, back) => {
    const response = await fetch(`${API_BASE_URL}/cards`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ front, back })
    });
    if (!response.ok) throw new Error('Failed to create card');
    return normalizeCard(await response.json());
  },

  updateCard: async (id, front, back) => {
    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ front, back })
    });
    if (!response.ok) throw new Error('Failed to update card');
    return normalizeCard(await response.json());
  },

  deleteCard: async (id) => {
    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete card');
    return response.json();
  },

  rateCard: async (id, quality) => {
    const response = await fetch(`${API_BASE_URL}/cards/${id}/rate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quality })
    });
    if (!response.ok) throw new Error('Failed to rate card');
    return normalizeCard(await response.json());
  },

  getSuggestion: async (front) => {
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
    const base = API_BASE_URL.replace(/\/api\/?$/, '');
    const response = await fetch(`${base}/`);
    if (!response.ok) throw new Error('Backend not reachable');
    return response.json();
  }
};

export default api;
export { getToken, setToken, removeToken };
