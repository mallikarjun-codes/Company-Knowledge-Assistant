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

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

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
          {isAdmin && (
            <Link to="/documents" className={linkClass('/documents')}>
              Documents
            </Link>
          )}
        </div>
      </div>

      {/* Right — user info + role badge + logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300 font-medium">
            {user?.name || user?.email}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              isAdmin
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}
          >
            {user?.role || 'EMPLOYEE'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white border border-gray-700 rounded-md px-3 py-1.5 transition-colors hover:border-gray-500 cursor-pointer"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
