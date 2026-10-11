import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import './AdminLogin.css';

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'jubelan2026';
const SESSION_KEY = 'desa_jubelan_admin_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 jam

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

export function isAdminSessionValid(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { expires } = JSON.parse(raw);
    return Date.now() < expires;
  } catch {
    return false;
  }
}

export function createAdminSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    loggedIn: true,
    expires: Date.now() + SESSION_DURATION_MS
  }));
}

export function destroyAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setError(null);
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockedUntil && Date.now() < lockedUntil) return;

    setLoading(true);
    setError(null);
    await new Promise(r => setTimeout(r, 500));

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      createAdminSession();
      setLoading(false);
      onLoginSuccess();
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 500);

      if (next >= 5) {
        setLockedUntil(Date.now() + 5 * 60 * 1000);
        setError('Terlalu banyak percobaan. Coba lagi dalam 5 menit.');
      } else {
        setError('Username atau password salah.');
      }
    }
  };

  const isLocked = !!(lockedUntil && Date.now() < lockedUntil);

  return (
    <div className="al-page">
      {/* Back */}
      <button className="al-back" onClick={onBack}>
        <ArrowLeft size={15} strokeWidth={2} />
        Kembali ke website
      </button>

      {/* Card */}
      <div className={'al-card' + (shake ? ' al-shake' : '')}>

        {/* Wordmark */}
        <div className="al-brand">
          <img
            src="/Logo_Kabupaten_Semarang.svg"
            alt="Logo Kabupaten Semarang"
            className="al-logo"
          />
          <div>
            <div className="al-brand-name">Desa Jubelan</div>
            <div className="al-brand-sub">Portal Perangkat Desa</div>
          </div>
        </div>

        <div className="al-divider" />

        {/* Form */}
        <form className="al-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="al-field">
            <label className="al-label" htmlFor="al-username">Username</label>
            <input
              id="al-username"
              type="text"
              className="al-input"
              placeholder="Masukkan username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading || isLocked}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="al-field">
            <label className="al-label" htmlFor="al-password">Password</label>
            <input
              id="al-password"
              type="password"
              className="al-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading || isLocked}
              autoComplete="new-password"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="al-error">
              {error}
              {isLocked && timeLeft > 0 && (
                <> ({Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')})</>
              )}
            </p>
          )}

          <button
            type="submit"
            className="al-submit"
            disabled={loading || isLocked || !username || !password}
          >
            {loading ? <span className="al-spinner" /> : 'Masuk'}
          </button>
        </form>

        <p className="al-note">
          Akses terbatas untuk perangkat desa yang berwenang.
        </p>
      </div>
    </div>
  );
};
