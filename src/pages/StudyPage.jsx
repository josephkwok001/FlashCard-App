import StudyCard from '../components/StudyCard';
import { useCards } from '../context/CardContext';

function StudyPage() {
  const { studyAllMode, setStudyAllMode } = useCards();

  return (
    <div>
      <div className="study-mode-toggle">
        <button
          type="button"
          onClick={() => setStudyAllMode(false)}
          className={!studyAllMode ? 'active' : ''}
        >
          Due today
        </button>
        <button
          type="button"
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
