import { createContext, useState, useEffect, useContext, useMemo } from 'react';
import api, { getToken } from '../services/api.js';

// Step 1: Create the context (the "bulletin board")
const CardContext = createContext();

// Step 2: Create a Provider component that holds all the card data and logic
function CardProvider({ children }) {

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studyAllMode, setStudyAllMode] = useState(false);

  useEffect(() => {
    initCards();
  }, []);

  async function initCards() {
    // No token yet → stay logged out; LoginPage will load cards after login
    if (!getToken()) {
      setCards([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.getCards();
      setCards(data);
    } catch (err) {
      console.error('Failed to load cards:', err);
      setError(err.message || 'Failed to load cards');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCards() {
    if (!getToken()) {
      setCards([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.getCards();
      setCards(data);
    } catch (err) {
      console.error('Failed to load cards:', err);
      setError(err.message || 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }

  function clearCards() {
    setCards([]);
    setError(null);
  }

  // Helper to update cards locally (optimistic updates)
  const updateCardsLocally = (updater) => {
    setCards(prev => updater(prev));
  };

  function addCard(front, back) {
    // Optimistic update
    const newId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8);

    const newCard = {
      id: newId,
      front,
      back,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: new Date().toISOString()
    };

    updateCardsLocally(prev => [...prev, newCard]);

    // Sync with backend
    api.createCard(front, back)
      .then(createdCard => {
        // Update with server response (includes _id)
        setCards(prev => prev.map(c => c.id === newId ? createdCard : c));
      })
      .catch(err => {
        console.error('Failed to create card:', err);
        setError(err.message);
      });
  }

  function deleteCard(id) {
    // Optimistic update
    updateCardsLocally(prev => prev.filter(card => card.id !== id));

    // Sync with backend
    api.deleteCard(id)
      .catch(err => {
        console.error('Failed to delete card:', err);
        setError(err.message);
        // Could implement rollback here
      });
  }

  function editCard(id, newFront, newBack) {
    // Optimistic update
    updateCardsLocally(prev => prev.map(card =>
      card.id === id
        ? { ...card, front: newFront, back: newBack }
        : card
    ));

    // Sync with backend
    api.updateCard(id, newFront, newBack)
      .catch(err => {
        console.error('Failed to edit card:', err);
        setError(err.message);
      });
  }

  async function updateCardReview(cardId, quality) {
    // Optimistic update
    updateCardsLocally(prevCards => prevCards.map(card => {
      if (card.id !== cardId) return card;

      let { easeFactor, interval, repetitions } = card;

      easeFactor = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
      if (easeFactor < 1.3) {
        easeFactor = 1.3;
      }

      if (quality < 2) {
        repetitions = 0;
        interval = 1;
      } else {
        repetitions = repetitions + 1;

        if (repetitions === 1) {
          interval = 1;
        } else if (repetitions === 2) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }
      }

      const nextReview = new Date();
      if (quality >= 2) {
        nextReview.setDate(nextReview.getDate() + interval);
      }

      return {
        ...card,
        easeFactor,
        interval,
        repetitions,
        nextReview: nextReview.toISOString()
      };
    }));

    // Sync with backend
    api.rateCard(cardId, quality)
      .catch(err => {
        console.error('Failed to rate card:', err);
        setError(err.message);
      });
  }

  const dueCards = useMemo(() => {
    return cards.filter(card => new Date(card.nextReview) <= new Date());
  }, [cards]);

  const cardsToStudy = studyAllMode ? cards : dueCards;

  // Everything inside "value" is what any child component can access
  // this is the component react's context system recognizes
  return (
    <CardContext.Provider value={{
      cards,
      cardsToStudy,
      studyAllMode,
      setStudyAllMode,
      addCard,
      deleteCard,
      editCard,
      updateCardReview,
      loading,
      error,
      reloadCards: loadCards,
      clearCards
    }}>
      {children}
    </CardContext.Provider>
  );
}

function useCards() {
  return useContext(CardContext);
}
// Step 3: Custom hook -- a shortcut so components don't have to import both CardContext and useContext
// this is instead of prop handling, where you pass multiple props from the parent to the child

export { CardProvider, useCards };