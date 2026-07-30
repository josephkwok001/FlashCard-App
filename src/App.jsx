import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { CardProvider } from './context/CardContext';
import StudyPage from './pages/StudyPage';
import CardsPage from './pages/CardsPage';
import StatsPage from './pages/StatsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter basename="/my-project">
      <CardProvider>
        <div className="app-container">
          <h1>Flashcards</h1>

          <nav className="nav-bar">
            <NavLink to="/">Study</NavLink>
            <NavLink to="/cards">My Cards</NavLink>
            <NavLink to="/stats">Stats</NavLink>
          </nav>

          
          <Routes>
            <Route path="/" element={<StudyPage />} />
            <Route path="/cards" element={<CardsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </CardProvider>
    </BrowserRouter>
  );
}

export default App;
