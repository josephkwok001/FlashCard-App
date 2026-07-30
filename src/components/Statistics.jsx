import { useMemo } from 'react';
import { useCards } from '../context/CardContext';

function Statistics() {
  const { cards } = useCards();
    const { totalCards, dueCards, newCards, mastered } = useMemo(() => {
        return {
            totalCards: cards.length,
            dueCards: cards.filter(card => new Date(card.nextReview) <= new Date()).length,
            newCards: cards.filter(card => card.repetitions === 0).length,
            mastered: cards.filter(card => card.repetitions >= 3).length,
        };
    }, [cards]);

    return (
        <div className="stats-container">
            <h2>Statistics</h2>
            <div className="stats-grid">
                <div className="stats-card">
                    <span>Total Cards</span>
                    <span className="stat-value">{totalCards}</span>
                </div>
                <div className="stats-card">
                    <span>Due Today</span>
                    <span className="stat-value">{dueCards}</span>
                </div>
                <div className="stats-card">
                    <span>New Cards</span>
                    <span className="stat-value">{newCards}</span>
                </div>
                <div className="stats-card">
                    <span>Mastered</span>
                    <span className="stat-value">{mastered}</span>
                </div>
            </div>
        </div>
    );
}


/*
    User flips a card (cards didn't change)
    → Statistics re-renders
    → useMemo checks: did "cards" change? No.
    → Reuses cached result. Filters don't run.
    User adds a new card (cards changed)
  → Statistics re-renders
  → useMemo checks: did "cards" change? Yes!
  → Re-runs the filters. Caches the new result.
    */

export default Statistics;