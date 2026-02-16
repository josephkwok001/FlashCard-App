import { useState } from 'react';

function AddCardForm({ addCard }) {
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');

    function handleSubmit() {
        addCard(front, back);

        // Clear the inputs after submitting
        setFront('');
        setBack('');
    }

    return (
        <div className="add-card-form">
            <h3>Add New Card</h3>
            <input
                value={front}
                onChange={(e) => setFront(e.target.value)}
                type="text"
                placeholder="Front"
            />
            <input
                value={back}
                onChange={(e) => setBack(e.target.value)}
                type="text"
                placeholder="Back"
            />
            <button onClick={handleSubmit}>Add flashcard</button>
        </div>
    );

}

export default AddCardForm;