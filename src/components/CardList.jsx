import { useState, useRef, useEffect } from 'react';
import { useCards } from '../context/CardContext';

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

  function filterCards(frontName) {
    const trimmed = frontName.trim().toLowerCase();
    if (trimmed === '') {
      return cards;
    }
    return cards.filter((card) =>
      card.front.toLowerCase().includes(trimmed)
    );
  }

  if (loading) {
    return (
      <div className="card-list-container">
        <h2>My Flashcards</h2>
        <p>Loading cards...</p>
      </div>
    );
  }

  const visibleCards = filterCards(filterText);

  return (
    <div className="card-list-container">
      <h2>My Flashcards <span>({cards.length})</span></h2>

      <div className="card-list-filter-row">
        <label className="card-list-filter-label" htmlFor="card-front-filter">Filter card by front</label>
        <input
          className="card-list-filter-input"
          id="card-front-filter"
          type="text"
          value={filterText}
          placeholder="Type to filter…"
          onChange={(e) => setFilterText(e.target.value)}
        />
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
