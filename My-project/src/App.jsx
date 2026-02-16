import { useState, useEffect } from 'react';
import CardList from './components/CardList';
import AddCardFrom from './components/AddCardFrom';
import StudyCard from './components/StudyCard';

function App() {

  const [cards, setCards] = useState(() => {
    const savedCards = localStorage.getItem('flashcards');

    if (savedCards) {
      return JSON.parse(savedCards);
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

  useEffect(() => {
    // Save cards to localStorage whenever cards change
    localStorage.setItem('flashcards', JSON.stringify(cards));
  }, [cards]);  // This means "run this whenever cards changes"


  function addCard(front, back) {
    const newCard = {
      id: Date.now(),
      front,
      back,
      easeFactor: 2.5,      // Add this
      interval: 0,          // Add this
      repetitions: 0,       // Add this
      nextReview: new Date().toISOString()  // Add this
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
      // Only update the card that matches the ID
      if (card.id !== cardId) return card;

      // Get current values
      let { easeFactor, interval, repetitions } = card;

      // Calculate new ease factor
      easeFactor = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
      if (easeFactor < 1.3) {
        easeFactor = 1.3;
      }

      // Calculate new repetitions and interval
      if (quality < 2) {
        // Wrong answer - reset
        repetitions = 0;
        interval = 1;
      } else {
        // Correct answer
        repetitions = repetitions + 1;

        if (repetitions === 1) {
          interval = 1;
        } else if (repetitions === 2) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }
      }

      // Calculate next review date: for "Again" keep it due today so the card stays in the list
      const nextReview = new Date();
      if (quality >= 2) {
        nextReview.setDate(nextReview.getDate() + interval);
      }
      // else: nextReview stays "now" so the card remains due and will show again

      // Return updated card
      return {
        ...card,
        easeFactor: easeFactor,
        interval: interval,
        repetitions: repetitions,
        nextReview: nextReview.toISOString()
      };
    }));
  }

  const dueCards = cards.filter(
    card => new Date(card.nextReview) <= new Date()
  );

  const [studyAllMode, setStudyAllMode] = useState(false);
  const cardsToStudy = studyAllMode ? cards : dueCards;

  return (
    <div className="app-container">
      <h1>Flashcards</h1>
      <AddCardFrom addCard={addCard} />
      <CardList cards={cards} deleteCard={deleteCard} editCard={editCard} />
      <div className="study-section">
        <div className="study-mode-toggle">
          <button
            type="button"
            onClick={() => setStudyAllMode(false)}
            className={!studyAllMode ? 'active' : ''}
          >
            Due today
          </button>
          <button
            type="button"
            onClick={() => setStudyAllMode(true)}
            className={studyAllMode ? 'active' : ''}
          >
            Study all
          </button>
        </div>
        <StudyCard
          cards={cardsToStudy}
          updateCardReview={updateCardReview}
          studyAllMode={studyAllMode}
        />
      </div>
    </div>
  );
}

export default App;