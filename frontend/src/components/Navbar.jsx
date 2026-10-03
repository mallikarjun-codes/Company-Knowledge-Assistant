import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const linkClass = (path) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      location.pathname === path
        ? 'bg-indigo-600 text-white'
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`;

  return (
    <nav className="bg-[#161825] border-b border-gray-800 px-6 py-3 flex items-center justify-between">
      {/* Left — brand + links */}
      <div className="flex items-center gap-6">
        <span className="text-lg font-bold text-white tracking-tight">
          📚 Knowledge&nbsp;Assistant
        </span>

        <div className="flex items-center gap-2">
          <Link to="/chat" className={linkClass('/chat')}>
            Chat
          </Link>
          {user?.role === 'admin' && (
            <Link to="/documents" className={linkClass('/documents')}>
              Documents
            </Link>
          )}
        </div>
      </div>

      {/* Right — user info + logout */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white border border-gray-700 rounded-md px-3 py-1.5 transition-colors hover:border-gray-500"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
