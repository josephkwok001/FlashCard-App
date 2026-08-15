import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCards } from '../context/CardContext';
import { gradeAnswer } from '../../shared/levenshtein.js';

function StudyCard() {
  const { cardsToStudy: cards, updateCardReview, studyAllMode, loading } = useCards();

  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] = useState(null);
  const [answerMode, setAnswerMode] = useState('rate');
  const [typed, setTyped] = useState('');
  const [grade, setGrade] = useState(null);

  const displayCards = shuffledCards || cards;

  useEffect(() => {
    setShuffledCards(null);
    setIndex(0);
    setIsFlipped(false);
    setTyped('');
    setGrade(null);
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
          if (!h.studyAllMode && h.answerMode === 'rate') h.handleQuality(1);
          break;
        case '2':
          event.preventDefault();
          if (!h.studyAllMode && h.answerMode === 'rate') h.handleQuality(2);
          break;
        case '3':
          event.preventDefault();
          if (!h.studyAllMode && h.answerMode === 'rate') h.handleQuality(3);
          break;
        case '4':
          event.preventDefault();
          if (!h.studyAllMode && h.answerMode === 'rate') h.handleQuality(4);
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

  function resetPrompt() {
    setIsFlipped(false);
    setTyped('');
    setGrade(null);
  }

  function flipCard() {
    if (answerMode === 'type' && !studyAllMode) return;
    setIsFlipped(!isFlipped);
  }

  function nextCard() {
    const nextId = index + 1;

    if (nextId >= displayCards.length) {
      setIndex(0);
    } else {
      setIndex(nextId);
    }

    resetPrompt();
  }

  function prevCard() {
    const nextId = index - 1;

    if (nextId < 0) {
      setIndex(displayCards.length - 1);
    } else {
      setIndex(nextId);
    }

    resetPrompt();
  }

  function shuffleCards() {
    const copy = [...cards];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setShuffledCards(copy);
    setIndex(0);
    resetPrompt();
  }

  function unshuffleCards() {
    setShuffledCards(null);
    setIndex(0);
    resetPrompt();
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
    resetPrompt();
  }

  function submitTyped(event) {
    event.preventDefault();
    if (!currentCard || grade) return;
    const result = gradeAnswer(typed, currentCard.back);
    setGrade(result);
    setIsFlipped(true);
  }

  function continueAfterGrade() {
    if (!grade) return;
    handleQuality(grade.quality);
  }

  useEffect(() => {
    handlersRef.current = { flipCard, prevCard, nextCard, handleQuality, studyAllMode, answerMode };
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

  const typeMode = !studyAllMode && answerMode === 'type';
  const showBack = isFlipped || Boolean(grade);

  return (
    <div className="study-card-container">
      <div className="study-progress" aria-hidden="true">
        <div className="study-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      {!studyAllMode && (
        <div className="study-answer-toggle" role="tablist" aria-label="Answer mode">
          <button
            type="button"
            className={answerMode === 'rate' ? 'active' : ''}
            onClick={() => { setAnswerMode('rate'); setGrade(null); setTyped(''); }}
          >
            Rate
          </button>
          <button
            type="button"
            className={answerMode === 'type' ? 'active' : ''}
            onClick={() => { setAnswerMode('type'); setIsFlipped(false); setGrade(null); setTyped(''); }}
          >
            Type
          </button>
        </div>
      )}

      <div
        className="card-flip-wrapper"
        onClick={typeMode ? undefined : flipCard}
        onKeyDown={(e) => {
          if (!typeMode && e.key === 'Enter') flipCard();
        }}
        role="button"
        tabIndex={typeMode ? -1 : 0}
        aria-label={showBack ? 'Show front of card' : 'Show back of card'}
      >
        <div className={`card-flip-inner ${showBack ? 'flipped' : ''}`}>
          <div className="card-flip-front">
            <span className="card-flip-label">Front</span>
            <p>{currentCard.front}</p>
            <span className="card-flip-hint">
              {typeMode ? 'Type the back below' : 'Click or press Space to flip'}
            </span>
          </div>
          <div className="card-flip-back">
            <span className="card-flip-label">Back</span>
            <p>{currentCard.back}</p>
            <span className="card-flip-hint">
              {typeMode ? 'Compared with what you typed' : 'Rate below to schedule the next review'}
            </span>
          </div>
        </div>
      </div>

      <p className="card-counter">
        Card {safeIndex + 1} of {displayCards.length}
        {shuffledCards ? ' · shuffled' : ''}
      </p>

      {!studyAllMode && answerMode === 'rate' && (
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

      {typeMode && !grade && (
        <form className="typed-answer-form" onSubmit={submitTyped}>
          <label htmlFor="typed-answer">Your answer</label>
          <input
            id="typed-answer"
            type="text"
            value={typed}
            autoComplete="off"
            placeholder="Type the back of the card"
            onChange={(e) => setTyped(e.target.value)}
          />
          <button type="submit">Check</button>
        </form>
      )}

      {typeMode && grade && (
        <div className="typed-grade">
          <p>
            Distance {grade.distance} → <strong>{grade.label}</strong> (quality {grade.quality})
          </p>
          <button type="button" onClick={continueAfterGrade}>Continue</button>
        </div>
      )}

      <div className="study-nav-buttons">
        {!typeMode && <button type="button" onClick={flipCard}>Flip</button>}
        <button type="button" onClick={prevCard}>Prev</button>
        <button type="button" onClick={nextCard}>Next</button>
        <button type="button" onClick={shuffledCards ? unshuffleCards : shuffleCards}>
          {shuffledCards ? 'Unshuffle' : 'Shuffle'}
        </button>
      </div>

      <p className="study-shortcuts">
        {typeMode
          ? 'Type mode: Enter checks (when the field is focused) · ← → navigate'
          : `Shortcuts: Space flip · ← → navigate${!studyAllMode ? ' · 1–4 rate' : ''}`}
      </p>
    </div>
  );
}

export default StudyCard;
