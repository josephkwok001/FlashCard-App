import { createContext, useState, useEffect, useContext, useMemo } from 'react';

// Step 1: Create the context (the "bulletin board")
const CardContext = createContext();

// Step 2: Create a Provider component that holds all the card data and logic
function CardProvider({ children }) {

  // children refers to everything that you put inside <CardProvider> in App.jsx renders here
  const [cards, setCards] = useState(() => {
    const savedCards = localStorage.getItem('flashcards');

    if (savedCards) {
      try {
        const parsed = JSON.parse(savedCards);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // ignore corrupt or legacy data
      }
    }

    return [
      {
        id: "1",
        front: "Hello",
        back: "A greeting",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: new Date().toISOString()
      },
      {
        id: "2",
        front: "Thank you",
        back: "Expression of gratitude",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: new Date().toISOString()
      },
      {
        id: "3",
        front: "Yes",
        back: "Affirmative response",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: new Date().toISOString()
      },
      {
        id: "4",
        front: "No",
        back: "Negative response",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: new Date().toISOString()
      }
    ];
  });

  const [studyAllMode, setStudyAllMode] = useState(false);

  useEffect(() => {
    localStorage.setItem('flashcards', JSON.stringify(cards));
  }, [cards]);

  function addCard(front, back) {
    // randomUUID avoids id collisions from rapid clicks and keeps ids
    // as strings, matching the seed cards above.
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8);

    const newCard = {
      id: newId,
      front,
      back,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: new Date().toISOString()
    };
    setCards(prev => [...prev, newCard]);
  }

  function deleteCard(id) {
    setCards(prev => prev.filter(card => card.id !== id));
  }

  function editCard(id, newFront, newBack) {
    setCards(prev => prev.map(card =>
      card.id === id
        ? { ...card, front: newFront, back: newBack }
        : card
    ));
  }

  function updateCardReview(cardId, quality) {
    setCards(prevCards => prevCards.map(card => {
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
