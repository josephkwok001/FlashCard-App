import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCards } from '../context/CardContext';
import { gradeAnswer } from '../../shared/levenshtein.js';
import { scheduleReview, formatReviewDelay } from '../../shared/sm2.js';

function StudyCard() {
  const { cardsToStudy: cards, updateCardReview, studyAllMode, loading } = useCards();

  const [currentId, setCurrentId] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answerMode, setAnswerMode] = useState('rate');
  const [typed, setTyped] = useState('');
  const [grade, setGrade] = useState(null);
  const [ratedIds, setRatedIds] = useState(() => new Set());

  const displayCards = useMemo(() => {
    if (!studyAllMode) return cards;
    return cards.filter((card) => !ratedIds.has(card.id));
  }, [cards, ratedIds, studyAllMode]);

  useEffect(() => {
    setIsFlipped(false);
    setTyped('');
    setGrade(null);
    setRatedIds(new Set());
  }, [studyAllMode]);

  useEffect(() => {
    if (displayCards.length === 0) {
      setCurrentId(null);
      return;
    }
    if (!displayCards.some((card) => card.id === currentId)) {
      setCurrentId(displayCards[0].id);
    }
  }, [displayCards, currentId]);

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
        case '1':
        case '2':
        case '3':
        case '4':
          event.preventDefault();
          if (h.answerMode === 'rate' && h.isFlipped) {
            h.handleQuality(Number(event.key));
          }
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
    if (isFlipped) return;
    setIsFlipped(true);
  }

  const safeIndex = Math.max(0, displayCards.findIndex((card) => card.id === currentId));
  const currentCard = displayCards.find((card) => card.id === currentId) ?? displayCards[0];
  const progress = displayCards.length
    ? ((safeIndex + 1) / displayCards.length) * 100
    : 0;

  const returnPreview = useMemo(() => {
    if (!currentCard) return null;
    const state = {
      easeFactor: currentCard.easeFactor,
      interval: currentCard.interval,
      repetitions: currentCard.repetitions
    };
    return {
      1: formatReviewDelay(scheduleReview(state, 1).nextReview),
      2: formatReviewDelay(scheduleReview(state, 2).nextReview),
      3: formatReviewDelay(scheduleReview(state, 3).nextReview),
      4: formatReviewDelay(scheduleReview(state, 4).nextReview)
    };
  }, [currentCard]);

  function handleQuality(quality) {
    const cardId = currentCard?.id;
    if (cardId == null) return;
    if (answerMode === 'rate' && !isFlipped) return;

    const i = Math.max(0, displayCards.findIndex((card) => card.id === cardId));
    const next = displayCards[i + 1];

    updateCardReview(cardId, quality);
    if (studyAllMode) {
      setRatedIds((prev) => {
        const nextSet = new Set(prev);
        nextSet.add(cardId);
        return nextSet;
      });
    }
    setCurrentId(next?.id ?? null);
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
    handlersRef.current = { flipCard, handleQuality, studyAllMode, answerMode, isFlipped };
  });

  if (loading) {
    return (
      <div className="study-card-container study-empty">
        <p className="study-empty-title">Preparing your desk…</p>
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
            : 'Nothing due right now. Failed cards return in a minute, or switch to Study all.'}
        </p>
        <Link className="study-empty-cta" to="/cards">
          Go to My Cards
        </Link>
      </div>
    );
  }

  const typeMode = !studyAllMode && answerMode === 'type';
  const showBack = isFlipped || Boolean(grade);
  const canRate = answerMode === 'rate' && isFlipped && returnPreview;

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
            onClick={() => { setAnswerMode('rate'); setIsFlipped(false); setGrade(null); setTyped(''); }}
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
        aria-label={showBack ? 'Card back' : 'Show back of card'}
      >
        <div className={`card-flip-inner ${showBack ? 'flipped' : ''}`}>
          <div className="card-flip-front">
            <span className="card-flip-label">Front</span>
            <p>{currentCard.front}</p>
            <span className="card-flip-hint">
              {typeMode ? 'Type the back below' : 'Flip to reveal the back, then rate'}
            </span>
          </div>
          <div className="card-flip-back">
            <span className="card-flip-label">Back</span>
            <p>{currentCard.back}</p>
            <span className="card-flip-hint">
              {typeMode ? 'Compared with what you typed' : 'How well did you remember it?'}
            </span>
          </div>
        </div>
      </div>

      <p className="card-counter">
        Card {safeIndex + 1} of {displayCards.length}
      </p>

      {!isFlipped && !typeMode && (
        <div className="study-nav-buttons">
          <button type="button" onClick={flipCard}>Flip</button>
        </div>
      )}

      {canRate && (
        <div className="quality-buttons" aria-label="How well did you remember?">
          <button type="button" className="quality-again" onClick={() => handleQuality(1)}>
            <span className="quality-key">1</span>
            Again
            <span className="quality-when">{returnPreview[1]}</span>
          </button>
          <button type="button" className="quality-hard" onClick={() => handleQuality(2)}>
            <span className="quality-key">2</span>
            Hard
            <span className="quality-when">{returnPreview[2]}</span>
          </button>
          <button type="button" className="quality-good" onClick={() => handleQuality(3)}>
            <span className="quality-key">3</span>
            Good
            <span className="quality-when">{returnPreview[3]}</span>
          </button>
          <button type="button" className="quality-easy" onClick={() => handleQuality(4)}>
            <span className="quality-key">4</span>
            Easy
            <span className="quality-when">{returnPreview[4]}</span>
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

      <p className="study-shortcuts">
        {typeMode
          ? 'Type mode: Enter checks (when the field is focused)'
            : 'Shortcuts: Space or Flip, then 1–4 to rate'}
      </p>
    </div>
  );
}

export default StudyCard;
