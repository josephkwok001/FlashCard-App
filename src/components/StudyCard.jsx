import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCards } from '../context/CardContext';

function StudyCard() {
  const { cardsToStudy: cards, updateCardReview, studyAllMode, loading } = useCards();

  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] = useState(null);

  const displayCards = shuffledCards || cards;

  useEffect(() => {
    setShuffledCards(null);
    setIndex(0);
    setIsFlipped(false);
  }, [cards]);

  const handlersRef = useRef({});

  useEffect(() => {
    function handleKeyDown(event) {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }

      const h = handlersRef.current;

      switch (event.key) {
        case ' ':
          event.preventDefault();
          h.flipCard();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          h.prevCard();
          break;
        case 'ArrowRight':
          event.preventDefault();
          h.nextCard();
          break;
        case '1':
          event.preventDefault();
          if (!h.studyAllMode) h.handleQuality(1);
          break;
        case '2':
          event.preventDefault();
          if (!h.studyAllMode) h.handleQuality(2);
          break;
        case '3':
          event.preventDefault();
          if (!h.studyAllMode) h.handleQuality(3);
          break;
        case '4':
          event.preventDefault();
          if (!h.studyAllMode) h.handleQuality(4);
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function flipCard() {
    setIsFlipped(!isFlipped);
  }

  function nextCard() {
    const nextId = index + 1;

    if (nextId >= displayCards.length) {
      setIndex(0);
    } else {
      setIndex(nextId);
    }

    setIsFlipped(false);
  }

  function prevCard() {
    const nextId = index - 1;

    if (nextId < 0) {
      setIndex(displayCards.length - 1);
    } else {
      setIndex(nextId);
    }

    setIsFlipped(false);
  }

  function shuffleCards() {
    const copy = [...cards];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setShuffledCards(copy);
    setIndex(0);
    setIsFlipped(false);
  }

  function unshuffleCards() {
    setShuffledCards(null);
    setIndex(0);
    setIsFlipped(false);
  }

  const safeIndex = Math.min(index, Math.max(displayCards.length - 1, 0));
  const currentCard = displayCards[safeIndex];
  const progress = displayCards.length
    ? ((safeIndex + 1) / displayCards.length) * 100
    : 0;

  function handleQuality(quality) {
    const cardId = currentCard?.id;
    if (cardId == null) return;
    if (!studyAllMode) {
      updateCardReview(cardId, quality);
    }
    setIndex((i) => {
      if (displayCards.length === 0) return 0;
      const next = i + 1;
      return next >= displayCards.length ? 0 : next;
    });
    setIsFlipped(false);
  }

  useEffect(() => {
    handlersRef.current = { flipCard, prevCard, nextCard, handleQuality, studyAllMode };
  });

  if (loading) {
    return (
      <div className="study-card-container study-empty">
        <p className="study-empty-title">Loading your cards…</p>
      </div>
    );
  }

  if (displayCards.length === 0) {
    return (
      <div className="study-card-container study-empty">
        <p className="study-empty-title">
          {studyAllMode ? 'Your deck is empty' : "You're all caught up"}
        </p>
        <p className="study-empty-copy">
          {studyAllMode
            ? 'Add a few cards, then come back to practice.'
            : 'Nothing due today. Switch to Study all, or add new cards.'}
        </p>
        <Link className="study-empty-cta" to="/cards">
          Go to My Cards
        </Link>
      </div>
    );
  }

  return (
    <div className="study-card-container">
      <div className="study-progress" aria-hidden="true">
        <div className="study-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div
        className="card-flip-wrapper"
        onClick={flipCard}
        onKeyDown={(e) => {
          if (e.key === 'Enter') flipCard();
        }}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? 'Show front of card' : 'Show back of card'}
      >
        <div className={`card-flip-inner ${isFlipped ? 'flipped' : ''}`}>
          <div className="card-flip-front">
            <span className="card-flip-label">Front</span>
            <p>{currentCard.front}</p>
            <span className="card-flip-hint">Click or press Space to flip</span>
          </div>
          <div className="card-flip-back">
            <span className="card-flip-label">Back</span>
            <p>{currentCard.back}</p>
            <span className="card-flip-hint">Rate below to schedule the next review</span>
          </div>
        </div>
      </div>

      <p className="card-counter">
        Card {safeIndex + 1} of {displayCards.length}
        {shuffledCards ? ' · shuffled' : ''}
      </p>

      {!studyAllMode && (
        <div className="quality-buttons" aria-label="How well did you remember?">
          <button type="button" className="quality-again" onClick={() => handleQuality(1)}>
            <span className="quality-key">1</span>
            Again
          </button>
          <button type="button" className="quality-hard" onClick={() => handleQuality(2)}>
            <span className="quality-key">2</span>
            Hard
          </button>
          <button type="button" className="quality-good" onClick={() => handleQuality(3)}>
            <span className="quality-key">3</span>
            Good
          </button>
          <button type="button" className="quality-easy" onClick={() => handleQuality(4)}>
            <span className="quality-key">4</span>
            Easy
          </button>
        </div>
      )}

      <div className="study-nav-buttons">
        <button type="button" onClick={flipCard}>Flip</button>
        <button type="button" onClick={prevCard}>Prev</button>
        <button type="button" onClick={nextCard}>Next</button>
        <button type="button" onClick={shuffledCards ? unshuffleCards : shuffleCards}>
          {shuffledCards ? 'Unshuffle' : 'Shuffle'}
        </button>
      </div>

      <p className="study-shortcuts">
        Shortcuts: Space flip · ← → navigate
        {!studyAllMode ? ' · 1–4 rate' : ''}
      </p>
    </div>
  );
}

export default StudyCard;
