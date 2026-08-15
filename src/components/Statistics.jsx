import { useEffect, useMemo, useState } from 'react';
import { useCards } from '../context/CardContext';
import api from '../services/api.js';

function Statistics() {
  const { cards, loading } = useCards();
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState(null);

  const { totalCards, dueCards, newCards, mastered } = useMemo(() => {
    return {
      totalCards: cards.length,
      dueCards: cards.filter(card => new Date(card.nextReview) <= new Date()).length,
      newCards: cards.filter(card => card.repetitions === 0).length,
      mastered: cards.filter(card => card.repetitions >= 3).length,
    };
  }, [cards]);

  useEffect(() => {
    let cancelled = false;
    api.getReviewStats(7)
      .then((data) => {
        if (!cancelled) {
          setHistory(data);
          setHistoryError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setHistoryError(err.message || 'Could not load review history');
      });
    return () => { cancelled = true; };
  }, [cards]);

  if (loading) {
    return (
      <div className="stats-container">
        <h2>Statistics</h2>
        <p>Loading statistics...</p>
      </div>
    );
  }

  const maxDay = history ? Math.max(1, ...history.byDay.map((d) => d.count)) : 1;
  const rememberedPct = history ? Math.round(history.rememberedRate * 100) : 0;

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

      <h3 className="stats-subtitle">Last 7 days</h3>
      {historyError && <p className="form-error">{historyError}</p>}
      {history && (
        <>
          <p className="stats-history-summary">
            {history.total} review{history.total === 1 ? '' : 's'}
            {history.total > 0
              ? ` · ${rememberedPct}% remembered (Good or Easy)`
              : ' · rate a card to start this log'}
          </p>

          <div className="stats-bars" aria-label="Reviews per day">
            {history.byDay.map((day) => (
              <div key={day.date} className="stats-bar-col">
                <div className="stats-bar-track">
                  <div
                    className="stats-bar-fill"
                    style={{ height: `${(day.count / maxDay) * 100}%` }}
                  />
                </div>
                <span className="stats-bar-count">{day.count}</span>
                <span className="stats-bar-label">{day.date.slice(5)}</span>
              </div>
            ))}
          </div>

          <div className="stats-quality-split" aria-label="Rating split">
            {[
              ['Again', history.qualityCounts[1], '#ef4444'],
              ['Hard', history.qualityCounts[2], '#f59e0b'],
              ['Good', history.qualityCounts[3], '#22c55e'],
              ['Easy', history.qualityCounts[4], '#10b981']
            ].map(([label, count, color]) => (
              <div key={label} className="stats-quality-row">
                <span>{label}</span>
                <div className="stats-quality-track">
                  <div
                    className="stats-quality-fill"
                    style={{
                      width: `${history.total ? (count / history.total) * 100 : 0}%`,
                      background: color
                    }}
                  />
                </div>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Statistics;
