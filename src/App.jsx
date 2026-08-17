import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { CardProvider, useCards } from './context/CardContext';
import StudyPage from './pages/StudyPage';
import CardsPage from './pages/CardsPage';
import StatsPage from './pages/StatsPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import api, { getToken, isBrowserDemo } from './services/api.js';

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
    <>
      <header className="app-topbar">
        <Link to={isLoggedIn ? '/' : '/login'} className="app-topbar-brand">
          <span className="app-topbar-name">Desk</span>
          <span className="app-topbar-tag">Spaced repetition</span>
        </Link>
        <div className="app-account">
          {isLoggedIn ? (
            <button type="button" className="app-account-logout" onClick={handleLogout}>
              Log out
            </button>
          ) : (
            <>
              {location.pathname !== '/login' && (
                <NavLink to="/login" className="app-account-link">Log in</NavLink>
              )}
              {location.pathname !== '/register' && (
                <NavLink to="/register" className="app-account-register">Register</NavLink>
              )}
            </>
          )}
        </div>
      </header>

      <div className={`app-container${isAuthPage ? ' app-container--auth' : ''}`}>
        {!isAuthPage && isLoggedIn && (
          <nav className="nav-bar">
            <NavLink to="/">Study</NavLink>
            <NavLink to="/cards">My Cards</NavLink>
            <NavLink to="/stats">Stats</NavLink>
          </nav>
        )}

        {!isAuthPage && isLoggedIn && loading && (
          <p className="app-status" role="status">Preparing your desk…</p>
        )}

        {isBrowserDemo() && (
          <p className="app-demo-banner" role="note">
            Browser demo — SM-2 and your deck stay in this browser. There is no remote API on GitHub Pages.
          </p>
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
    </>
  );
}

function App() {
  const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';

  return (
    <BrowserRouter basename={basename}>
      <CardProvider>
        <AppShell />
      </CardProvider>
    </BrowserRouter>
  );
}

export default App;
