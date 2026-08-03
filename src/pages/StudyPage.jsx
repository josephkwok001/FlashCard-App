import StudyCard from '../components/StudyCard';
import { useCards } from '../context/CardContext';

function StudyPage() {
  const { studyAllMode, setStudyAllMode, cards } = useCards();
  const dueCount = cards.filter((card) => new Date(card.nextReview) <= new Date()).length;

  return (
    <div className="study-page">
      <header className="study-page-header">
        <h2>Study</h2>
        <p>
          {studyAllMode
            ? `${cards.length} card${cards.length === 1 ? '' : 's'} in your deck`
            : `${dueCount} due today`}
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
