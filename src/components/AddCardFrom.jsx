import { useState, useRef } from 'react';
import { useCards } from '../context/CardContext';
import api from '../services/api.js';

function AddCardForm() {
  const { addCard } = useCards();
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const frontInputRef = useRef(null);

    async function suggestBack() {
      if (!front.trim()) return;

      setIsLoading(true);
      setSuggestion('');
      setErrorMsg('');

      try {
        await api.ensureAuth();
        const data = await api.getSuggestion(front.trim());
        if (data.suggestion) {
          setSuggestion(data.suggestion);
        } else {
          setErrorMsg('No suggestion returned. Try a different word.');
        }
      } catch (error) {
        console.error('AI suggest error:', error);
        const msg = String(error?.message ?? error);
        setErrorMsg(
          msg.includes('Failed to fetch')
            ? 'Network error. Check your internet connection.'
            : `AI suggest failed: ${msg}`
        );
      } finally {
        setIsLoading(false);
      }
    }

    function handleSubmit() {
        const trimmedFront = front.trim();
        const trimmedBack = back.trim();
        if (!trimmedFront || !trimmedBack) {
            setErrorMsg('Both Front and Back are required.');
            return;
        }

        addCard(trimmedFront, trimmedBack);

        setFront('');
        setBack('');
        setSuggestion('');
        setErrorMsg('');

        frontInputRef.current?.focus();
    }

    return (
        <div className="add-card-form">
            <h3>Add New Card</h3>
            <input
                ref={frontInputRef}
                value={front}
                onChange={(e) => setFront(e.target.value)}
                type="text"
                placeholder="Front"
            />
            {suggestion && (
              <div className="ai-suggestion">
                <p>💡 {suggestion}</p>
                <button
                  type="button"
                  onClick={() => {
                    setBack(suggestion);
                    setSuggestion('');
                  }}
                >
                  Use this
                </button>
                <button type="button" onClick={() => setSuggestion('')}>
                  Discard
                </button>
              </div>
            )}
            <div className="back-input-row">
              <input
                value={back}
                onChange={(e) => {
                  setBack(e.target.value);
                  setSuggestion('');
                }}
                type="text"
                placeholder="Back"
              />
              <button
                type="button"
                onClick={suggestBack}
                disabled={isLoading || !front.trim()}
              >
                {isLoading ? 'Loading…' : 'AI Suggest'}
              </button>
            </div>
            <button onClick={handleSubmit}>Add flashcard</button>
            {errorMsg && (
              <p className="form-error" role="alert">{errorMsg}</p>
            )}
        </div>
    );

}

export default AddCardForm;