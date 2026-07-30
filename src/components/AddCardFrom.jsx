import { useState, useRef } from 'react';
import { useCards } from '../context/CardContext';

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
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are a flashcard assistant. Given a word or phrase, reply with only a short, clear definition or translation suitable for the back of a flashcard. No extra explanation.\n\nWord or phrase: ${front}`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          // surface API errors (quota, bad key, etc.) instead of silently swallowing them
          const errData = await response.json().catch(() => null);
          const apiMsg = errData?.error?.message;
          throw new Error(apiMsg || `Request failed (${response.status})`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          setSuggestion(text);
        } else {
          setErrorMsg('No suggestion returned. Try a different word.');
        }
      } catch (error) {
        console.error('Gemini error:', error);
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