import React, { useState, useEffect, useRef } from 'react';
import { Settings, Shield, RefreshCw, Download, Upload, ShieldAlert, FileText, CheckCircle, HelpCircle, HardDrive, AlertTriangle } from 'lucide-react';
import { SyncConfig, ActivityLog, Admin } from '../types';
import { getSyncConfig, saveSyncConfig, exportDatabaseBackup, importDatabaseBackup, resetDatabase, getActivityLogs } from '../utils/db';

interface SettingsViewProps {
  currentSession: Admin | null;
  syncConfig: SyncConfig;
  onSyncConfigChange: (config: SyncConfig) => void;
  onDatabaseRestored: () => void;
}

export default function SettingsView({ currentSession, syncConfig, onSyncConfigChange, onDatabaseRestored }: SettingsViewProps) {
  // Local Sync Settings
  const [sheetUrl, setSheetUrl] = useState(syncConfig.sheetUrl);
  const [isSyncEnabled, setIsSyncEnabled] = useState(syncConfig.enabled);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Database activity audit logs
  const [logs, setLogs] = useState<ActivityLog[]>(() => getActivityLogs());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRefreshLogs = () => {
    setLogs(getActivityLogs());
  };

  // Save sync config
  const handleSaveSync = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    const nextConfig: SyncConfig = {
      ...syncConfig,
      sheetUrl: sheetUrl.trim(),
      enabled: isSyncEnabled
    };

    saveSyncConfig(nextConfig);
    onSyncConfigChange(nextConfig);
    setSaveSuccess(true);

    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  // Download DB Snapshot
  const handleDownloadBackup = () => {
    const dataStr = exportDatabaseBackup();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_Database_Perpus_SMAN1_Banjarsari_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Restore DB Snapshot
  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;

        const success = importDatabaseBackup(text);
        if (success) {
          alert('Basis data berhasil dipulihkan dari file cadangan Anda!');
          onDatabaseRestored();
          handleRefreshLogs();
        } else {
          alert('Berkas gagal dipulihkan! Pastikan format file cadangan JSON yang Anda pilih valid.');
        }
      };

      reader.readAsText(file);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('⚠️ PERINGATAN: Anda akan menghapus seluruh data masukan baru dan menyetel ulang database ke kondisi bawaan awal sekolah. Apakah Anda yakin?')) {
      resetDatabase();
      alert('Basis data berhasil dikembalikan ke kondisi bawaan.');
      onDatabaseRestored();
      handleRefreshLogs();
    }
  };

  return (
    <div className="space-y-4" id="settings-view">
      
      {/* Title */}
      <div className="space-y-0.5">
        <h2 className="text-base font-bold font-display text-slate-800">Pengaturan Sistem & Database</h2>
        <p className="text-xs text-slate-500 font-sans">
          Kelola sinkronisasi Google Spreadsheet, buat berkas cadangan offline, atau tinjau log riwayat aktivitas keamanan sistem.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left column: Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Google Sheets Live Sync Mock configuration */}
          <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 font-display uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-[spin_4s_linear_infinite]" />
              Integrasi Google Spreadsheet Live Sync
            </h3>

            <form onSubmit={handleSaveSync} className="space-y-3">
              
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-100">
                <div className="space-y-0.5 max-w-[80%] text-left">
                  <p className="text-xs font-bold text-slate-700 font-sans">Aktifkan Sinkronisasi Otomatis</p>
                  <p className="text-[10px] text-slate-400 font-sans leading-normal">
                    Kirim data absensi secara real-time ke lembar Google Spreadsheet yang terpasang di bawah.
                  </p>
                </div>
                
                {/* Switch toggle layout */}
                <button
                  type="button"
                  onClick={() => setIsSyncEnabled(!isSyncEnabled)}
                  className="p-1 cursor-pointer"
                >
                  {isSyncEnabled ? (
                    <span className="text-emerald-600 text-[10px] font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">AKTIF</span>
                  ) : (
                    <span className="text-slate-500 text-[10px] font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">MATI</span>
                  )}
                </button>
              </div>

              {/* Sheet URL input field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">Tautan Kolaborasi Google Spreadsheet</label>
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="block w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-slate-50/50 text-slate-700 font-mono"
                  disabled={!isSyncEnabled}
                  required={isSyncEnabled}
                />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 pt-1.5">
                {saveSuccess ? (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded flex items-center gap-1.5 animate-fadeIn">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Konfigurasi Spreadsheet disimpan!</span>
                  </div>
                ) : <div />}

                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm cursor-pointer transition-colors"
                >
                  Simpan Tautan Sync
                </button>
              </div>

            </form>
          </div>

          {/* Database Backup & Maintenance Actions */}
          <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 font-display uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" /> Pemeliharaan & Ekspor Database Lokal
            </h3>

            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Semua transaksi dan data master siswa serta guru tersimpan aman di browser Anda secara offline. Lakukan backup berkala untuk mencegah kehilangan data akibat pembersihan cache browser.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Backup Card Button */}
              <button
                onClick={handleDownloadBackup}
                className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 hover:border-blue-400 rounded hover:bg-blue-50/50 text-left cursor-pointer transition-all"
              >
                <div className="bg-blue-100 text-blue-700 p-1.5 rounded">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Unduh Backup JSON</h4>
                  <p className="text-[9px] text-slate-400 font-mono">Database Snapshot</p>
                </div>
              </button>

              {/* Restore Card Button */}
              <label
                className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 hover:border-indigo-400 rounded hover:bg-indigo-50/50 text-left cursor-pointer transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadBackup}
                  className="hidden"
                  accept=".json"
                />
                <div className="bg-indigo-100 text-indigo-700 p-1.5 rounded">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Pulihkan Database</h4>
                  <p className="text-[9px] text-slate-400 font-mono">Pilih berkas JSON</p>
                </div>
              </label>

            </div>

            {/* Danger Zone: Database reset */}
            {currentSession?.level === 'Admin' && (
              <div className="pt-3 border-t border-slate-200/60 space-y-2.5">
                <div className="flex items-start gap-2 text-rose-800 bg-rose-50/50 border border-rose-100 p-2.5 rounded text-xs font-sans">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Zona Bahaya (Admin Only)</span>
                    <span className="text-[11px] text-rose-700 mt-0.5 block leading-relaxed">
                      Tombol reset akan menghapus seluruh data siswa, guru, buku tamu, dan riwayat presensi, lalu memuat data bawaan sistem.
                    </span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleResetToDefault}
                    className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded text-xs font-bold transition-colors cursor-pointer"
                  >
                    Setel Ulang Ke Bawaan
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Right column: Audit activity trail logs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-3">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-700 font-display uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-700 animate-pulse" />
                Log Aktivitas Keamanan (Audit)
              </h3>
              <button
                onClick={handleRefreshLogs}
                className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                title="Refresh log"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {/* Render audit log records listbox */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {logs.length > 0 ? (
                logs.map((log) => {
                  const isSuccess = log.action.includes('Berhasil') || log.action.includes('Pencatatan') || log.action.includes('Login');
                  const logTimeStr = new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <div key={log.id} className="p-2 bg-slate-50 rounded border border-slate-100 text-xs space-y-0.5 text-left relative overflow-hidden group hover:bg-white hover:border-slate-200 transition-all">
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="font-bold text-slate-500">{log.user}</span>
                        <span className="text-slate-400">{logTimeStr}</span>
                      </div>
                      <p className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                        {log.action}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-normal font-sans">{log.details}</p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-xs text-slate-400 italic">
                  Belum ada rekaman audit log.
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
