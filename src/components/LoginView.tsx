import React, { useState } from 'react';
import { Lock, User, ShieldCheck, KeyRound, AlertCircle, BookOpen } from 'lucide-react';
import { Admin } from '../types';
import { getAdmins, playErrorSound, playSuccessSound } from '../utils/db';

interface LoginViewProps {
  onLoginSuccess: (admin: Admin) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate verification delay
    setTimeout(() => {
      const admins = getAdmins();
      const match = admins.find(
        (a) => a.username.toLowerCase() === username.trim().toLowerCase() && a.passwordHash === password
      );

      if (match) {
        playSuccessSound();
        onLoginSuccess(match);
      } else {
        playErrorSound();
        setError('Username atau Password salah! Periksa kembali.');
        setLoading(false);
      }
    }, 450);
  };

  // Quick fill helper for review ease
  const handleQuickFill = (userType: 'admin' | 'petugas') => {
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('petugas');
      setPassword('petugas123');
    }
    setError('');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50" id="login-container">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 relative overflow-hidden">
        
        {/* Visual accents */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-100 rounded-full opacity-30 blur-xl"></div>
        
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Presensi SMAN 1 Banjarsari
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-sans">
            Gunakan hak akses Admin atau Petugas untuk mengelola perpustakaan
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 mt-4" id="login-error-alert">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Gagal Masuk</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} id="login-form">
          <div className="space-y-4">
            {/* Username Input */}
            <div>
              <label htmlFor="username-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="username-input"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800 placeholder-slate-400 transition-all bg-slate-50/50"
                  placeholder="Masukkan username petugas..."
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password-input"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800 placeholder-slate-400 transition-all bg-slate-50/50"
                  placeholder="Masukkan password..."
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all cursor-pointer shadow-md shadow-blue-500/20 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              id="btn-submit-login"
            >
              {loading ? 'Menghubungkan...' : 'Masuk ke Sistem'}
            </button>
          </div>
        </form>

        {/* Quick evaluation credentials */}
        <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50/70 p-4 rounded-xl">
          <p className="text-xs font-semibold text-slate-600 text-center mb-3 tracking-wider uppercase">
            Akses Cepat Pengujian (Demo)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickFill('admin')}
              className="flex flex-col items-center bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 p-2.5 rounded-lg transition-all text-left cursor-pointer"
              type="button"
            >
              <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-mono">admin / admin123</span>
            </button>
            <button
              onClick={() => handleQuickFill('petugas')}
              className="flex flex-col items-center bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 p-2.5 rounded-lg transition-all text-left cursor-pointer"
              type="button"
            >
              <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" /> Petugas
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-mono">petugas / petugas123</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
