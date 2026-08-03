import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { CardProvider, useCards } from './context/CardContext';
import StudyPage from './pages/StudyPage';
import CardsPage from './pages/CardsPage';
import StatsPage from './pages/StatsPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import api, { getToken } from './services/api.js';

function ProtectedRoute({ children }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppShell() {
  const { loading, error, reloadCards, clearCards } = useCards();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isLoggedIn = Boolean(getToken());

  function handleLogout() {
    api.logout();
    clearCards();
    navigate('/login');
  }

  return (
    <div className={`app-container${isAuthPage ? ' app-container--auth' : ''}`}>
      {!isAuthPage && <h1>Flashcards</h1>}

      {!isAuthPage && isLoggedIn && (
        <nav className="nav-bar">
          <NavLink to="/">Study</NavLink>
          <NavLink to="/cards">My Cards</NavLink>
          <NavLink to="/stats">Stats</NavLink>
          <button type="button" className="nav-logout" onClick={handleLogout}>
            Log out
          </button>
        </nav>
      )}

      {!isAuthPage && loading && (
        <p className="app-status" role="status">Loading your cards...</p>
      )}

      {!isAuthPage && error && (
        <div className="app-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={reloadCards}>Retry</button>
        </div>
      )}

      <Routes>
        <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={isLoggedIn ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><StudyPage /></ProtectedRoute>} />
        <Route path="/cards" element={<ProtectedRoute><CardsPage /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
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
