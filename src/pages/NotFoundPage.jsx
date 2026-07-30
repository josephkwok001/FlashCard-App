import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="not-found">
      <h2>404</h2>
      <p>This page doesn't exist.</p>
      <Link to="/">Go back to Study</Link>
    </div>
  );
}

export default NotFoundPage;
