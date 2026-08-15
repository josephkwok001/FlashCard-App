import StudyCard from '../components/StudyCard';
import { useCards } from '../context/CardContext';

function StudyPage() {
  const { studyAllMode, setStudyAllMode, cards, cardsToStudy } = useCards();
  const dueCount = studyAllMode
    ? cards.filter((card) => new Date(card.nextReview).getTime() <= Date.now()).length
    : cardsToStudy.length;

  return (
    <div className="study-page">
      <header className="study-page-header">
        <h2>Today’s session</h2>
        <p>
          {studyAllMode
            ? `Study all · ${cards.length} card${cards.length === 1 ? '' : 's'}`
            : `Due today · ${dueCount} card${dueCount === 1 ? '' : 's'}`}
        </p>
      </header>

      <div className="study-mode-toggle" role="tablist" aria-label="Study mode">
        <button
          type="button"
          role="tab"
          aria-selected={!studyAllMode}
          onClick={() => setStudyAllMode(false)}
          className={!studyAllMode ? 'active' : ''}
        >
          Due today
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={studyAllMode}
          onClick={() => setStudyAllMode(true)}
          className={studyAllMode ? 'active' : ''}
        >
          Study all
        </button>
      </div>

      <StudyCard />
    </div>
  );
}

export default StudyPage;
