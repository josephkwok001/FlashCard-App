import { useState, useEffect, useRef } from "react";
import { useCards } from '../context/CardContext';

function StudyCard() {
  const { cardsToStudy: cards, updateCardReview, studyAllMode } = useCards();

    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [shuffledCards, setShuffledCards] = useState(null);

    const displayCards = shuffledCards || cards;

    // When the source cards change (mode switch, card rated, etc.),
    // clear the shuffle and reset position.
    useEffect(() => {
        setShuffledCards(null);
        setIndex(0);
        setIsFlipped(false);
    }, [cards]);

    // Hold the latest handlers in a ref so the keydown listener
    // can be installed exactly once without going stale.
    const handlersRef = useRef({});
    handlersRef.current = { flipCard, prevCard, nextCard, handleQuality, studyAllMode };

    useEffect(() => {
        function handleKeyDown(event) {
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
                return;
            }

            const h = handlersRef.current;

            switch(event.key) {
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

    function handleQuality(quality) {
        const cardId = currentCard?.id;
        if (cardId == null) return;
        if (!studyAllMode) {
            updateCardReview(cardId, quality);
        }
        setIndex(i => {
            if (displayCards.length === 0) return 0;
            const next = i + 1;
            return next >= displayCards.length ? 0 : next;
        });
        setIsFlipped(false);
    }
    
    if (displayCards.length === 0) {
        return (
            <div className="study-card-container">
                <p>
                    {studyAllMode
                        ? 'No cards in deck. Add some cards to study.'
                        : "No cards due today. You're all caught up!"}
                </p>
            </div>
        );
    }

    return (
        <div className="study-card-container">
            <div className="card-flip-wrapper" onClick={flipCard}>
                <div className={`card-flip-inner ${isFlipped ? 'flipped' : ''}`}>
                    <div className="card-flip-front">
                        <span className="card-flip-label">Front</span>
                        <p>{currentCard.front}</p>
                        <span className="card-flip-hint">Click to flip</span>
                    </div>
                    <div className="card-flip-back">
                        <span className="card-flip-label">Back</span>
                        <p>{currentCard.back}</p>
                        <span className="card-flip-hint">Click to flip</span>
                    </div>
                </div>
            </div>
            <p className="card-counter">
                Card {safeIndex + 1} of {displayCards.length}
                {shuffledCards && ' (shuffled)'}
            </p>
            {!studyAllMode && (
                <div className="quality-buttons">
                    <button type="button" className="quality-again" onClick={() => handleQuality(1)}>Again</button>
                    <button type="button" className="quality-hard" onClick={() => handleQuality(2)}>Hard</button>
                    <button type="button" className="quality-good" onClick={() => handleQuality(3)}>Good</button>
                    <button type="button" className="quality-easy" onClick={() => handleQuality(4)}>Easy</button>
                </div>
            )}
            <div className="study-nav-buttons">
                <button onClick={flipCard}>Flip</button>
                <button onClick={prevCard}>Prev</button>
                <button onClick={nextCard}>Next</button>
                <button onClick={shuffledCards ? unshuffleCards : shuffleCards}>
                    {shuffledCards ? 'Unshuffle' : 'Shuffle'}
                </button>
            </div>
        </div>
    );


}

export default StudyCard;