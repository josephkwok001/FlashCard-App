import { useState, useEffect } from "react";

function StudyCard({ cards, updateCardReview, studyAllMode = false }) {

    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // When the cards list shrinks (e.g. after rating in Due today mode), clamp index so we don't show undefined
    useEffect(() => {
        if (cards.length > 0 && index >= cards.length) {
            setIndex(0);
        }
    }, [cards.length, index]);

    function flipCard() {
        setIsFlipped(!isFlipped);
    }

    function nextCard() {
        const nextId = index + 1;

        if (nextId >= cards.length) {
            setIndex(0);
        } else {
            setIndex(nextId);
        }

        setIsFlipped(false);
    }

    function prevCard() {
        const nextId = index - 1;

        if (nextId < 0) {
            setIndex(cards.length - 1);
        } else {
            setIndex(nextId);
        }

        setIsFlipped(false);
    }

    function handleQuality(quality) {
        const cardId = cards[index]?.id;
        if (cardId == null) return;
        if (!studyAllMode) {
            updateCardReview(cardId, quality);
        }
        setIndex(i => (i + 1 >= cards.length ? 0 : i + 1));
        setIsFlipped(false);
    }
    
    if (cards.length === 0) {
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
            <div className="card-display" onClick={flipCard}>
                {isFlipped ? <p>{cards[index].back}</p> : <p>{cards[index].front}</p>}
            </div>
            <p className="card-counter">Card {index + 1} of {cards.length}</p>
            {!studyAllMode && (
                <div className="quality-buttons">
                    <button type="button" className="quality-again" onClick={() => handleQuality(1)}>Again</button>
                    <button type="button" className="quality-hard" onClick={() => handleQuality(2)}>Hard</button>
                    <button type="button" className="quality-good" onClick={() => handleQuality(3)}>Good</button>
                    <button type="button" className="quality-easy" onClick={() => handleQuality(4)}>Easy</button>
                </div>
            )}
            <div className="study-nav-buttons">
                <button onClick={flipCard}>Flip Card</button>
                <button onClick={prevCard}>Previous Card</button>
                <button onClick={nextCard}>Next Card</button>
            </div>
        </div>
    );


}

export default StudyCard;