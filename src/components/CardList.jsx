import { useState, useRef, useEffect, useMemo } from 'react';
import { useCards } from '../context/CardContext';
import { buildIndex, search } from '../../shared/invertedIndex.js';

function CardList() {
  const { cards, deleteCard, editCard, loading } = useCards();

  const [editingId, setEditingId] = useState(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [filterText, setFilterText] = useState('');

  const editFrontRef = useRef(null);

  useEffect(() => {
    if (editingId !== null && editFrontRef.current) {
      editFrontRef.current.focus();
    }
  }, [editingId]);

  function startEdit(card) {
    setPendingDeleteId(null);
    setEditingId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  }

  function saveEdit(id) {
    const trimmedFront = editFront.trim();
    const trimmedBack = editBack.trim();
    if (!trimmedFront || !trimmedBack) return;
    editCard(id, trimmedFront, trimmedBack);
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  const index = useMemo(() => buildIndex(cards), [cards]);
  const visibleCards = useMemo(
    () => search(index, filterText, cards),
    [index, filterText, cards]
  );

  if (loading) {
    return (
      <div className="card-list-container">
        <h2>My Flashcards</h2>
        <p>Preparing your desk…</p>
      </div>
    );
  }

  return (
    <div className="card-list-container">
      <h2>My Flashcards <span>({cards.length})</span></h2>

      <div className="card-list-filter-row">
        <label className="card-list-filter-label" htmlFor="card-front-filter">Word search</label>
        <input
          className="card-list-filter-input"
          id="card-front-filter"
          type="text"
          value={filterText}
          placeholder="Search front and back (e.g. glucose)"
          onChange={(e) => setFilterText(e.target.value)}
        />
        <p className="card-list-filter-hint">
          Inverted index over front and back. Multiple words use AND.
        </p>
      </div>

      <ul>
        {visibleCards.map(card => (
          <li key={card.id}>
            {editingId === card.id ? (
              <>
                <div className="card-edit-inputs">
                  <input
                    ref={editFrontRef}
                    value={editFront}
                    onChange={(e) => setEditFront(e.target.value)}
                    placeholder="Front"
                  />
                  <input
                    value={editBack}
                    onChange={(e) => setEditBack(e.target.value)}
                    placeholder="Back"
                  />
                </div>
                <div className="card-actions">
                  <button onClick={() => saveEdit(card.id)}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <span className="card-content">
                  <span className="card-front">{card.front}</span>
                  <span className="card-separator">/</span>
                  <span className="card-back">{card.back}</span>
                </span>
                <div className="card-actions">
                  <button type="button" onClick={() => startEdit(card)}>Edit</button>
                  {pendingDeleteId === card.id ? (
                    <span className="delete-confirm-inline">
                      <span className="delete-confirm-label">Delete this card?</span>
                      <button
                        type="button"
                        className="btn-delete-confirm"
                        onClick={() => {
                          deleteCard(card.id);
                          setPendingDeleteId(null);
                        }}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className="btn-delete-cancel"
                        onClick={() => setPendingDeleteId(null)}
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => setPendingDeleteId(card.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CardList;
