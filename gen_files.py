import os

BASE = r"D:\Company-Knowledge-Assistant\frontend\src"

# ── Login.jsx ─────────────────────────────────────────────────────────────────

LOGIN = """\
import { useState } from 'react';

function LockIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function MailIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function BotIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <line x1="12" y1="3" x2="12" y2="7" />
      <circle cx="9" cy="16" r="1" fill="currentColor" />
      <circle cx="15" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * Login
 *
 * Props:
 *  - onLoginSuccess {(token: string) => void} - called with the JWT on success
 */
export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        let msg = 'Invalid email or password. Please try again.';
        try {
          const body = await res.json();
          if (body?.message) msg = body.message;
        } catch (_) {}
        setError(msg);
        return;
      }
      const data = await res.json();
      localStorage.setItem('token', data.token);
      onLoginSuccess(data.token);
    } catch (err) {
      setError('Unable to reach the server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="login-root"
      className="min-h-screen flex flex-col items-center justify-center bg-[#0f1117] px-4"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Ambient glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '520px',
            height: '520px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg mb-4">
            <BotIcon className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-100 tracking-tight">
            Company Knowledge Assistant
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to continue</p>
        </div>

        {/* Form card */}
        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl px-6 py-7 shadow-2xl backdrop-blur-sm">
          <form id="login-form" onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="mb-4">
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider"
              >
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  <MailIcon className="w-4 h-4" />
                </span>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@company.com"
                  disabled={isLoading}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-600 text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  <LockIcon className="w-4 h-4" />
                </span>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  disabled={isLoading}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-600 text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                id="login-error"
                role="alert"
                className="mb-4 flex items-start gap-2.5 bg-red-950/60 border border-red-800/70 text-red-300 text-xs rounded-xl px-3.5 py-3 leading-relaxed msg-animate"
              >
                <svg
                  className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading || !email.trim() || !password}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl py-2.5 transition-all duration-150 active:scale-[0.98] shadow-md hover:shadow-indigo-500/25"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-5">
          Internal use only &middot; Powered by RAG
        </p>
      </div>
    </div>
  );
}
"""

# ── App.jsx ───────────────────────────────────────────────────────────────────

APP = """\
import { useState } from 'react';
import Login from './components/Login';
import RagChat from './components/RagChat';

function LogoutIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/**
 * App
 *
 * Root component that handles auth state and conditional rendering:
 *  - No token  -> <Login />
 *  - Has token -> <RagChat /> + Logout button overlay
 */
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="app-root" className="relative flex flex-col h-screen bg-[#0f1117]">
      {/* Logout button overlay - top-right corner of the header */}
      <div className="absolute top-3.5 right-4 z-50">
        <button
          id="logout-btn"
          onClick={handleLogout}
          title="Sign out"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700/60 text-gray-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-950/30 text-xs font-medium transition-all duration-150 backdrop-blur-sm active:scale-95"
        >
          <LogoutIcon className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>

      {/* Pass token getter so RagChat always has the latest token */}
      <RagChat getToken={() => localStorage.getItem('token')} />
    </div>
  );
}
"""

# ── main.jsx ──────────────────────────────────────────────────────────────────

MAIN = """\
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"""

# Write files
files = {
    os.path.join(BASE, "components", "Login.jsx"): LOGIN,
    os.path.join(BASE, "App.jsx"): APP,
    os.path.join(BASE, "main.jsx"): MAIN,
}

for path, content in files.items():
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print(f"Written: {path} ({len(content.encode('utf-8'))} bytes)")

print("All files written successfully.")

