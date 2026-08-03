import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { CardProvider, useCards } from './context/CardContext';
import StudyPage from './pages/StudyPage';
import CardsPage from './pages/CardsPage';
import StatsPage from './pages/StatsPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function AppShell() {
  const { loading, error, reloadCards } = useCards();

  return (
    <div className="app-container">
      <h1>Flashcards</h1>

      <nav className="nav-bar">
        <NavLink to="/">Study</NavLink>
        <NavLink to="/cards">My Cards</NavLink>
        <NavLink to="/stats">Stats</NavLink>
      </nav>

      {loading && (
        <p className="app-status" role="status">Loading your cards...</p>
      )}

      {error && (
        <div className="app-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={reloadCards}>Retry</button>
        </div>
      )}

      <Routes>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<StudyPage />} />
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/my-project">
      <CardProvider>
        <AppShell />
      </CardProvider>
    </BrowserRouter>
  );
}

export default App;
