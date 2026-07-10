import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, UserCheck, GraduationCap, QrCode, FileText, BarChart3, Settings, 
  Menu, X, LogOut, Lock, AlertTriangle, ShieldAlert, Wifi, CheckCircle 
} from 'lucide-react';

import Header from './components/Header';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import AbsensiView from './components/AbsensiView';
import DataMasterView from './components/DataMasterView';
import QRCodeView from './components/QRCodeView';
import LaporanView from './components/LaporanView';
import StatistikView from './components/StatistikView';
import SettingsView from './components/SettingsView';

import { Admin, Attendance, SyncConfig } from './types';
import { getSession, setSession, getAttendance, getSyncConfig, initDB } from './utils/db';

export default function App() {
  // Initialize standard LocalStorage tables on load
  useEffect(() => {
    initDB();
  }, []);

  // 1. Session State
  const [session, setLocalSession] = useState<Admin | null>(() => getSession());

  // 2. Active View Tab state: 'dashboard' | 'absensi' | 'master' | 'qr' | 'laporan' | 'statistik' | 'settings'
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // 3. Mobile Navigation Menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 4. Live Attendance List (Shared state to keep everything reactive!)
  const [attendanceList, setAttendanceList] = useState<Attendance[]>(() => getAttendance());

  // 5. Live Google Spreadsheet Sync configuration
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => getSyncConfig());

  // Handle successful login
  const handleLoginSuccess = (admin: Admin) => {
    setSession(admin);
    setLocalSession(admin);
    setActiveTab('dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    setSession(null);
    setLocalSession(null);
    setIsMobileMenuOpen(false);
  };

  // Callback when a new attendance record is successfully registered
  const handleNewAttendanceRegistered = (newRecord: Attendance) => {
    // Reload full list to trigger reactive changes in graphs & feeds
    setAttendanceList(getAttendance());
  };

  // Callback when Data Master changes (e.g., students imported)
  const handleDataMasterUpdated = () => {
    setAttendanceList(getAttendance()); // Reload
  };

  // Callback when full database backup restored
  const handleDatabaseRestored = () => {
    setAttendanceList(getAttendance());
    setSyncConfig(getSyncConfig());
  };

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'absensi', label: 'Menu Absensi', icon: UserCheck },
    { id: 'master', label: 'Data Master', icon: GraduationCap, adminOnly: true },
    { id: 'qr', label: 'QR Code & Kartu', icon: QrCode },
    { id: 'laporan', label: 'Laporan Presensi', icon: FileText },
    { id: 'statistik', label: 'Analisis Statistik', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan & Log', icon: Settings },
  ];

  // Render non-logged screen
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header currentSession={null} onLogout={() => {}} syncConfig={getSyncConfig()} />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <LoginView onLoginSuccess={handleLoginSuccess} />
        </main>
        <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400 font-sans">
          Mencerdaskan Bangsa Melalui Budaya Membaca | Perpustakaan SMAN 1 Banjarsari &copy; {new Date().getFullYear()}
        </footer>
      </div>
    );
  }

  // Render the actual logged-in App Layout
  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-between font-sans">
      
      {/* Dynamic Header */}
      <Header currentSession={session} onLogout={handleLogout} syncConfig={syncConfig} />

      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col md:flex-row p-3 sm:p-4 gap-4">
        
        {/* SIDE BAR NAVIGATION (Desktop view) */}
        <aside className="hidden md:block md:w-56 bg-slate-900 border border-slate-800 rounded-lg p-3 h-fit shadow-sm shrink-0 space-y-4">
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-2">Navigasi Utama</p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                const isRestricted = item.adminOnly && session.level !== 'Admin';

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium tracking-wide transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : isRestricted
                        ? 'text-slate-600 hover:bg-slate-800/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                    id={`sidebar-nav-${item.id}`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {isRestricted && (
                      <Lock className="w-3 h-3 text-slate-600" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick info footer inside sidebar */}
          <div className="pt-3 border-t border-slate-800 p-1.5 space-y-1.5">
            <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span>DATABASE OFFLINE AKTIF</span>
            </div>
            <p className="text-[9px] text-slate-400 font-sans leading-normal">
              Akses cepat pencatatan presensi dapat dilakukan oleh {session.nama} ({session.level}).
            </p>
          </div>
        </aside>

        {/* MOBILE NAVIGATION BAR (Mobile view only) */}
        <div className="md:hidden flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 shadow-sm no-print-element text-white">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center gap-1.5 text-slate-200 font-bold text-xs bg-slate-800 px-2.5 py-1.5 rounded cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            <span>Menu Layanan</span>
          </button>
          
          <span className="text-xs font-bold text-blue-400 px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded font-mono uppercase">
            {navItems.find(n => n.id === activeTab)?.label}
          </span>
        </div>

        {/* Mobile menu modal dropdown popup list */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1 shadow-xl animate-fadeIn no-print-element z-50 text-white">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              const isRestricted = item.adminOnly && session.level !== 'Admin';

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-600 text-white font-bold' 
                      : isRestricted
                      ? 'text-slate-600'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {isRestricted && (
                    <Lock className="w-3 h-3 text-slate-600" />
                  )}
                </button>
              );
            })}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 p-2 text-rose-400 hover:bg-rose-500/10 rounded text-xs font-medium cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        )}

        {/* MAIN DISPLAY HUB */}
        <main className="flex-1 bg-white md:bg-transparent rounded-lg md:border-0 md:p-0 p-3 sm:p-4 shadow-sm md:shadow-none min-w-0">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <DashboardView 
              attendanceList={attendanceList} 
              onNavigateToAbsensi={() => setActiveTab('absensi')} 
            />
          )}

          {/* TAB 2: MENU ABSENSI */}
          {activeTab === 'absensi' && (
            <AbsensiView 
              currentSession={session} 
              onAttendanceSuccess={handleNewAttendanceRegistered} 
            />
          )}

          {/* TAB 3: DATA MASTER (Role authorized gate check!) */}
          {activeTab === 'master' && (
            session.level === 'Admin' ? (
              <DataMasterView 
                currentSession={session} 
                onDataChange={handleDataMasterUpdated} 
              />
            ) : (
              <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm text-center space-y-4 max-w-md mx-auto py-16 animate-fadeIn" id="auth-lock-view">
                <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">Hak Akses Terbatas</h3>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    Peran akun Anda saat ini adalah <span className="font-bold text-amber-700 capitalize">Petugas Perpustakaan</span>. Hak akses istimewa tingkat <b>Admin</b> diperlukan untuk melihat, memodifikasi, dan mengimpor file basis data induk siswa maupun guru.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Kembali Ke Dashboard
                  </button>
                </div>
              </div>
            )
          )}

          {/* TAB 4: QR CODE & KARTU */}
          {activeTab === 'qr' && (
            <QRCodeView />
          )}

          {/* TAB 5: LAPORAN PRESENSI */}
          {activeTab === 'laporan' && (
            <LaporanView attendanceList={attendanceList} />
          )}

          {/* TAB 6: ANALISIS STATISTIK */}
          {activeTab === 'statistik' && (
            <StatistikView attendanceList={attendanceList} />
          )}

          {/* TAB 7: PENGATURAN & LOGS */}
          {activeTab === 'settings' && (
            <SettingsView 
              currentSession={session} 
              syncConfig={syncConfig} 
              onSyncConfigChange={(cfg) => setSyncConfig(cfg)}
              onDatabaseRestored={handleDatabaseRestored}
            />
          )}

        </main>

      </div>

      {/* Footer Info */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400 font-sans no-print-element mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div>
            <b>Portal Presensi Perpustakaan SMAN 1 Banjarsari</b> - Offline-First Engine V1.0
          </div>
          <div className="text-slate-400 flex items-center gap-1">
            <span>Dikembangkan untuk kelancaran administrasi sekolah</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
