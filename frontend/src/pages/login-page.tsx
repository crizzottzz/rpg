import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex items-center justify-center h-dvh bg-page px-4 overflow-hidden">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-surface rounded-xl p-6 sm:p-8 border border-edge"
      >
        <h1 className="text-2xl font-bold text-accent mb-6 text-center">
          RPG Manager
        </h1>
        {error && (
          <div className="mb-4 p-3 bg-danger-dark/30 border border-danger-edge rounded-lg text-danger text-sm">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-label mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-subtle border border-edge-hover rounded-lg text-heading focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-label mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-subtle border border-edge-hover rounded-lg text-heading focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-accent-bold hover:bg-accent text-accent-fg font-semibold rounded-lg transition-colors"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}
