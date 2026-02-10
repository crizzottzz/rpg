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
    <div className="flex items-center justify-center h-dvh bg-gray-950 px-4 overflow-hidden">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-gray-900 rounded-xl p-6 sm:p-8 border border-gray-800"
      >
        <h1 className="text-2xl font-bold text-amber-400 mb-6 text-center">
          RPG Manager
        </h1>
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-amber-400"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-lg transition-colors"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}
