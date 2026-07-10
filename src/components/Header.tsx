import React, { useState, useEffect } from 'react';
import { BookOpen, User, LogOut, Clock, Wifi, CloudLightning, ShieldAlert } from 'lucide-react';
import { Admin, SyncConfig } from '../types';

interface HeaderProps {
  currentSession: Admin | null;
  onLogout: () => void;
  syncConfig: SyncConfig;
}

export default function Header({ currentSession, onLogout, syncConfig }: HeaderProps) {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
      setDateStr(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-950 text-white border-b border-slate-800" id="header-library">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-2.5">
            <div className="bg-white/10 p-1.5 rounded-lg flex items-center justify-center border border-white/10">
              <BookOpen className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-400/20 px-1.5 py-0.5 rounded font-mono tracking-wider">
                  V1.0 LIVE
                </span>
                <span className="flex items-center gap-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 px-1.5 py-0.5 rounded font-mono">
                  <Wifi className="w-2.5 h-2.5" /> OFFLINE READY
                </span>
              </div>
              <h1 className="text-base font-bold font-display tracking-tight text-white md:text-lg">
                Perpustakaan SMAN 1 Banjarsari
              </h1>
              <p className="text-[10px] text-slate-400 font-sans">
                Sistem Presensi & Kartu Anggota Digital Terintegrasi
              </p>
            </div>
          </div>

          {/* Time, Sync and Session info */}
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            
            {/* Real-time Clock */}
            <div className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-end gap-1 text-[10px] text-slate-400">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{dateStr}</span>
              </div>
              <div className="text-xs font-semibold tracking-wider font-mono text-slate-200 mt-0.5">
                {time}
              </div>
            </div>

            {/* Google Spreadsheet Sync Status Panel */}
            <div className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded flex items-center gap-2">
              <div className="relative">
                <span className="absolute flex h-2 w-2 top-0 right-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <div className="w-4 h-4 rounded bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <span className="text-emerald-400 font-bold text-[8px]">田</span>
                </div>
              </div>
              <div className="text-left">
                <div className="text-[8px] text-slate-400 uppercase font-mono tracking-wider">Spreadsheet Sync</div>
                <div className="text-[10px] font-semibold text-emerald-400 truncate max-w-[120px]" title={syncConfig.sheetUrl}>
                  {syncConfig.enabled ? 'SINKRON OTOMATIS' : 'NON-AKTIF'}
                </div>
              </div>
            </div>

            {/* User Session */}
            {currentSession && (
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
                <div className="flex items-center px-2 py-0.5 space-x-1.5">
                  <div className="bg-blue-600 text-white rounded w-5.5 h-5.5 flex items-center justify-center font-bold text-[10px]">
                    {currentSession.level === 'Admin' ? 'A' : 'P'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-[10px] font-semibold text-slate-200 leading-none">{currentSession.nama}</p>
                    <p className="text-[8px] text-slate-400 leading-none mt-0.5 capitalize">{currentSession.level}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                  title="Keluar dari sistem"
                  id="btn-logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
          </div>

        </div>
      </div>
    </header>
  );
}
