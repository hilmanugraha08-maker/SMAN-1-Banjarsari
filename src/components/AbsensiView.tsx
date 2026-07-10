import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QrCode, Search, FileText, Keyboard, CheckCircle2, AlertCircle, Volume2, Camera, CameraOff, RefreshCw, Sparkles, User, GraduationCap, MapPin, PhoneCall } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Attendance, Student, Teacher, Admin } from '../types';
import { getStudents, getTeachers, logAttendance, playSuccessSound, playErrorSound } from '../utils/db';

interface AbsensiViewProps {
  currentSession: Admin | null;
  onAttendanceSuccess: (record: Attendance) => void;
}

export default function AbsensiView({ currentSession, onAttendanceSuccess }: AbsensiViewProps) {
  // Tabs: 'scan' | 'search' | 'manual' | 'tamu'
  const [activeTab, setActiveTab] = useState<'scan' | 'search' | 'manual' | 'tamu'>('scan');

  // Load students & teachers for search and validation
  const students = useMemo(() => getStudents().filter(s => s.active), []);
  const teachers = useMemo(() => getTeachers(), []);

  // Common input state: Keperluan (visit purpose)
  const [keperluan, setKeperluan] = useState('Membaca Buku');
  const [customKeperluan, setCustomKeperluan] = useState('');

  const finalKeperluan = useMemo(() => {
    return keperluan === 'Lainnya' ? customKeperluan.trim() : keperluan;
  }, [keperluan, customKeperluan]);

  // Tab 1: Scanner States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Tab 2: Search Name States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<{
    id: string;
    nama: string;
    identifier: string;
    kelasOrMapel: string;
    kategori: 'Siswa' | 'Guru';
  } | null>(null);

  // Filtered search lists
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || selectedEntity) return [];
    const q = searchQuery.toLowerCase().trim();
    
    const matchedStudents = students
      .filter(s => s.nama.toLowerCase().includes(q) || s.nisn.includes(q))
      .map(s => ({
        id: s.id,
        nama: s.nama,
        identifier: s.nisn,
        kelasOrMapel: s.kelas,
        kategori: 'Siswa' as const
      }));

    const matchedTeachers = teachers
      .filter(t => t.nama.toLowerCase().includes(q) || t.nip.includes(q))
      .map(t => ({
        id: t.id,
        nama: t.nama,
        identifier: t.nip,
        kelasOrMapel: t.mapel,
        kategori: 'Guru' as const
      }));

    return [...matchedStudents, ...matchedTeachers].slice(0, 5);
  }, [searchQuery, students, teachers, selectedEntity]);

  // Tab 3: Manual input
  const [manualId, setManualId] = useState('');

  // Tab 4: Buku Tamu inputs
  const [tamuNama, setTamuNama] = useState('');
  const [tamuInstansi, setTamuInstansi] = useState('');
  const [tamuHp, setTamuHp] = useState('');
  const [tamuKeperluan, setTamuKeperluan] = useState('Kunjungan');

  // Success Confirmation State (Notification Card)
  const [successRecord, setSuccessRecord] = useState<Attendance | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-clear success message timer
  useEffect(() => {
    if (successRecord) {
      const timer = setTimeout(() => {
        setSuccessRecord(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [successRecord]);

  // Initialize html5-qrcode scanner
  useEffect(() => {
    if (activeTab === 'scan' && isCameraActive) {
      setScannerError(null);
      // Wait for DOM
      setTimeout(() => {
        try {
          const scanner = new Html5QrcodeScanner(
            'qr-reader-element',
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.EAN_13
              ]
            },
            /* verbose= */ false
          );

          scanner.render(
            (decodedText) => {
              // On success
              setScanResult(decodedText);
              handleProcessScannedCode(decodedText);
              // Stop camera automatically after successful scan to free resources
              scanner.clear().then(() => {
                setIsCameraActive(false);
              }).catch(err => console.error(err));
            },
            (err) => {
              // Avoid spamming state for minor search frame errors
            }
          );
          scannerRef.current = scanner;
        } catch (e: any) {
          setScannerError(`Gagal mengakses kamera: ${e.message || e}`);
          setIsCameraActive(false);
        }
      }, 300);
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error(err));
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error(err));
        scannerRef.current = null;
      }
    };
  }, [activeTab, isCameraActive]);

  // CORE: Process checked identity
  const handleProcessScannedCode = (code: string) => {
    setErrorMessage(null);
    setScanResult(null);

    // Look for matching student
    const studentMatch = students.find((s) => s.nisn === code || s.id === code);
    if (studentMatch) {
      performAbsensi(
        studentMatch.nama,
        'Siswa',
        studentMatch.kelas,
        studentMatch.nisn
      );
      return;
    }

    // Look for matching teacher
    const teacherMatch = teachers.find((t) => t.nip === code || t.id === code);
    if (teacherMatch) {
      performAbsensi(
        teacherMatch.nama,
        'Guru',
        teacherMatch.mapel,
        teacherMatch.nip
      );
      return;
    }

    // No match found
    playErrorSound();
    setErrorMessage(`ID / QR Code "${code}" tidak terdaftar dalam basis data master siswa maupun guru.`);
  };

  const performAbsensi = (nama: string, kategori: 'Siswa' | 'Guru' | 'Tamu', kelasOrMapel: string, identifier: string) => {
    const petugasName = currentSession ? currentSession.nama : 'Sistem Otomatis';
    
    const record = logAttendance(
      nama,
      kategori,
      kelasOrMapel,
      finalKeperluan,
      identifier,
      petugasName
    );

    setSuccessRecord(record);
    onAttendanceSuccess(record);

    // Reset forms
    setSelectedEntity(null);
    setSearchQuery('');
    setManualId('');
    setTamuNama('');
    setTamuInstansi('');
    setTamuHp('');
  };

  // Tab 2 submit
  const handleSearchAbsenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity) {
      setErrorMessage('Silakan pilih salah satu nama dari daftar pencarian.');
      return;
    }

    performAbsensi(
      selectedEntity.nama,
      selectedEntity.kategori,
      selectedEntity.kelasOrMapel,
      selectedEntity.identifier
    );
  };

  // Tab 3 submit
  const handleManualAbsenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    handleProcessScannedCode(manualId.trim());
  };

  // Tab 4: Buku Tamu Submit
  const handleTamuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tamuNama.trim() || !tamuInstansi.trim() || !tamuHp.trim()) {
      setErrorMessage('Semua kolom data tamu wajib diisi!');
      return;
    }

    const petugasName = currentSession ? currentSession.nama : 'Sistem Otomatis';
    const record = logAttendance(
      tamuNama.trim(),
      'Tamu',
      tamuInstansi.trim(),
      tamuKeperluan.trim() + ' (Tamu)',
      tamuHp.trim(),
      petugasName
    );

    setSuccessRecord(record);
    onAttendanceSuccess(record);

    // Reset tamu form
    setTamuNama('');
    setTamuInstansi('');
    setTamuHp('');
    setTamuKeperluan('Kunjungan');
  };

  // Quick Simulation Scans (Extremely helpful for preview/reviews inside sandboxed frames!)
  const handleSimulateScan = (id: string) => {
    handleProcessScannedCode(id);
  };

  return (
    <div className="space-y-4" id="absensi-view">
      
      {/* Title */}
      <div className="space-y-0.5">
        <h2 className="text-base font-bold font-display text-slate-800">Pencatatan Presensi Kehadiran</h2>
        <p className="text-xs text-slate-500 font-sans">
          Silakan pilih metode presensi di bawah ini untuk mencatat kehadiran pengunjung dengan cepat.
        </p>
      </div>

      {/* Success Notification Banner */}
      {successRecord && (
        <div 
          className="bg-emerald-50 border border-emerald-500 p-3.5 rounded-lg shadow-sm flex items-start gap-3 relative overflow-hidden" 
          id="success-absen-banner"
        >
          {/* Progress bar to represent duration */}
          <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 w-full animate-[pulse_1.5s_infinite]"></div>
          <div className="bg-emerald-500 text-white p-1.5 rounded shrink-0 mt-0.5 shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-0.5">
            <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1">
              Absensi Berhasil Tercatat! <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 mt-1 text-xs text-emerald-800">
              <p>Nama: <span className="font-bold text-emerald-950">{successRecord.nama}</span></p>
              <p>Peran: <span className="font-bold text-emerald-950">{successRecord.kategori}</span></p>
              <p>NISN/NIP: <span className="font-mono font-bold text-emerald-950">{successRecord.identifier}</span></p>
              <p>Kelas/Instansi: <span className="font-bold text-emerald-950">{successRecord.kelas}</span></p>
              <p className="sm:col-span-2 text-[11px] text-emerald-700 mt-0.5 italic">
                Waktu masuk: {successRecord.jam} WIB | Keperluan: {successRecord.keperluan}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSuccessRecord(null)}
            className="text-emerald-500 hover:text-emerald-950 font-bold px-1.5 cursor-pointer text-xs"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 p-3 rounded-lg flex items-start gap-2.5" id="error-absen-banner">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-rose-800">Kendala Presensi</p>
            <p className="text-[11px] text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-rose-400 hover:text-rose-900 text-xs font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Grid: Tabs left, configuration right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left column: Actions Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
            
            {/* Tabs Header */}
            <div className="flex border-b border-slate-100 bg-slate-50 p-1 gap-1">
              <button
                onClick={() => { setActiveTab('scan'); setErrorMessage(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'scan' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Kamera Scan</span>
              </button>
              <button
                onClick={() => { setActiveTab('search'); setErrorMessage(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'search' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Cari Nama</span>
              </button>
              <button
                onClick={() => { setActiveTab('manual'); setErrorMessage(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'manual' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Ketik ID</span>
              </button>
              <button
                onClick={() => { setActiveTab('tamu'); setErrorMessage(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'tamu' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Buku Tamu</span>
              </button>
            </div>

            {/* Tabs Content */}
            <div className="p-4">
              
              {/* TAB 1: CAMERA SCAN */}
              {activeTab === 'scan' && (
                <div className="space-y-4 text-center" id="panel-scan-qr">
                  <div className="max-w-md mx-auto space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 font-display uppercase tracking-wide">Pindai QR Code Kartu Anggota</h3>
                    <p className="text-[11px] text-slate-400 font-sans leading-normal">
                      Arahkan QR Code siswa atau guru ke arah kamera. Sistem akan memindai secara otomatis.
                    </p>

                    {/* Scanner Stage */}
                    <div className="border border-dashed border-slate-300 rounded p-3 bg-slate-50 relative min-h-[160px] flex flex-col items-center justify-center">
                      {isCameraActive ? (
                        <div className="w-full overflow-hidden rounded bg-black" id="qr-reader-element" style={{ maxWidth: '300px' }}></div>
                      ) : (
                        <div className="space-y-2 py-4">
                          <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
                          <p className="text-[10px] text-slate-500">Kamera dinonaktifkan</p>
                        </div>
                      )}
                    </div>

                    {/* Camera Control Buttons */}
                    <div className="flex gap-2 justify-center">
                      {isCameraActive ? (
                        <button
                          onClick={() => setIsCameraActive(false)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded transition-colors cursor-pointer"
                        >
                          <CameraOff className="w-3 h-3" /> Matikan Kamera
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsCameraActive(true)}
                          className="flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm cursor-pointer"
                        >
                          <Camera className="w-3 h-3" /> Aktifkan Scanner
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Simulator Area for sandboxed preview iframe testing (VERY IMPORTANT!) */}
                  <div className="pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-700 flex items-center gap-1 font-display">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Simulator Scan QR (Solusi Pengujian Instan)
                      </span>
                      <span className="text-[9px] bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
                        KLIK UNTUK SCAN
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-sans mb-2">
                      Gunakan tombol demo berikut untuk mensimulasikan pemindaian QR Code anggota secara instan:
                    </p>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Siswa:</p>
                        <div className="flex flex-wrap gap-1">
                          {students.slice(0, 4).map((s) => (
                            <button
                              key={s.id}
                              onClick={() => handleSimulateScan(s.nisn)}
                              className="text-[10px] bg-white border border-slate-200 hover:border-blue-400 px-2 py-1 rounded hover:bg-blue-50 transition-all font-sans cursor-pointer text-slate-700 flex items-center gap-1"
                            >
                              <GraduationCap className="w-3 h-3 text-slate-400" />
                              <span>{s.nama} ({s.kelas})</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/50">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Guru:</p>
                        <div className="flex flex-wrap gap-1">
                          {teachers.slice(0, 2).map((t) => (
                            <button
                              key={t.id}
                              onClick={() => handleSimulateScan(t.nip)}
                              className="text-[10px] bg-white border border-slate-200 hover:border-amber-400 px-2 py-1 rounded hover:bg-amber-50 transition-all font-sans cursor-pointer text-slate-700 flex items-center gap-1"
                            >
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{t.nama}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: SEARCH NAME */}
              {activeTab === 'search' && (
                <form onSubmit={handleSearchAbsenSubmit} className="space-y-4" id="panel-search-name">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">Cari Nama Siswa / Guru</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Search className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (selectedEntity) setSelectedEntity(null);
                        }}
                        placeholder="Ketik NISN, NIP, atau nama..."
                        className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs text-slate-800 bg-slate-50/50"
                      />
                    </div>

                    {/* Autocomplete Suggestions */}
                    {searchResults.length > 0 && (
                      <div className="border border-slate-100 bg-white shadow-lg rounded overflow-hidden divide-y divide-slate-50 max-h-48 overflow-y-auto">
                        {searchResults.map((entity) => (
                          <button
                            key={entity.id}
                            type="button"
                            onClick={() => {
                              setSelectedEntity(entity);
                              setSearchQuery(`${entity.nama} (${entity.kelasOrMapel})`);
                            }}
                            className="w-full flex items-center justify-between p-2 hover:bg-slate-50 text-left transition-colors cursor-pointer text-xs"
                          >
                            <div>
                              <p className="font-bold text-slate-800">{entity.nama}</p>
                              <p className="text-[10px] text-slate-400 font-mono">ID: {entity.identifier}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                              entity.kategori === 'Siswa' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {entity.kategori} - {entity.kelasOrMapel}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No Suggestion State */}
                    {searchQuery && searchResults.length === 0 && !selectedEntity && (
                      <p className="text-[11px] text-slate-400 italic px-1">Nama tidak ditemukan.</p>
                    )}
                  </div>

                  {/* Selected entity card indicator */}
                  {selectedEntity && (
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded flex items-center justify-between animate-fadeIn">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-blue-800 uppercase tracking-wide">{selectedEntity.kategori} Terpilih</span>
                        <h4 className="text-xs font-bold text-slate-800">{selectedEntity.nama}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">NISN/NIP: {selectedEntity.identifier} | Kelas/Mapel: {selectedEntity.kelasOrMapel}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedEntity(null)}
                        className="text-[11px] text-red-600 hover:underline font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedEntity}
                    className={`w-full py-2 px-3 rounded font-bold text-white text-xs transition-all cursor-pointer shadow-sm ${
                      selectedEntity ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-200 cursor-not-allowed'
                    }`}
                  >
                    Kirim Data Presensi
                  </button>
                </form>
              )}

              {/* TAB 3: KEYBOARD MANUAL ID */}
              {activeTab === 'manual' && (
                <form onSubmit={handleManualAbsenSubmit} className="space-y-4" id="panel-manual-id">
                  <div className="space-y-2">
                    <label htmlFor="manual-id-input" className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">Input NISN / NIP Manual</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Keyboard className="h-4 w-4" />
                      </span>
                      <input
                        id="manual-id-input"
                        type="text"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        placeholder="Ketik nomor induk NISN atau NIP..."
                        className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs text-slate-800 bg-slate-50/50"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-normal">
                      Isi dengan NISN (siswa) atau NIP (guru) kemudian tekan Kirim untuk validasi kecocokan data.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs transition-all shadow-sm cursor-pointer"
                  >
                    Verifikasi dan Absen
                  </button>
                </form>
              )}

              {/* TAB 4: BUKU TAMU */}
              {activeTab === 'tamu' && (
                <form onSubmit={handleTamuSubmit} className="space-y-3" id="panel-guest-book">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">Nama Lengkap Tamu</label>
                      <input
                        type="text"
                        value={tamuNama}
                        onChange={(e) => setTamuNama(e.target.value)}
                        placeholder="Contoh: Bpk. Hermawan"
                        className="block w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-slate-50/50"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">Asal Instansi / Alamat</label>
                      <input
                        type="text"
                        value={tamuInstansi}
                        onChange={(e) => setTamuInstansi(e.target.value)}
                        placeholder="Contoh: Pengawas Dinas / Umum"
                        className="block w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-slate-50/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">Nomor HP / WhatsApp</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                          <PhoneCall className="w-3 h-3" />
                        </span>
                        <input
                          type="tel"
                          value={tamuHp}
                          onChange={(e) => setTamuHp(e.target.value)}
                          placeholder="Contoh: 08123456789"
                          className="block w-full pl-8 pr-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-slate-50/50"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">Tujuan Keperluan</label>
                      <select
                        value={tamuKeperluan}
                        onChange={(e) => setTamuKeperluan(e.target.value)}
                        className="block w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-slate-50"
                      >
                        <option value="Kunjungan">Kunjungan Kerja</option>
                        <option value="Mencari Buku">Membaca & Referensi</option>
                        <option value="Studi Banding">Studi Banding</option>
                        <option value="Donatur Buku">Penyerahan Hibah Buku</option>
                        <option value="Lainnya">Lain-lain</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs transition-all shadow-sm cursor-pointer"
                  >
                    Simpan Data Tamu
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>

        {/* Right column: Attendance configuration */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-4">
            
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-700">Pengaturan Keperluan</h3>
              <p className="text-[10px] text-slate-400 font-sans">
                Tentukan keperluan utama kunjungan sebelum melakukan absensi (Siswa & Guru).
              </p>
            </div>

            {/* Quick selectors for purpose */}
            <div className="space-y-2" id="purpose-settings">
              {[
                'Membaca Buku',
                'Meminjam Buku Literatur',
                'Mengembalikan Buku Pinjaman',
                'Mengerjakan Tugas Kelompok',
                'Akses Internet / Komputer',
                'Lainnya'
              ].map((pOption) => (
                <label
                  key={pOption}
                  className={`flex items-center justify-between p-2 rounded border text-xs font-medium cursor-pointer transition-all ${
                    keperluan === pOption
                      ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm font-bold'
                      : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="capitalize">{pOption}</span>
                  <input
                    type="radio"
                    name="keperluan-selector"
                    value={pOption}
                    checked={keperluan === pOption}
                    onChange={() => setKeperluan(pOption)}
                    className="sr-only"
                  />
                  {keperluan === pOption && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  )}
                </label>
              ))}

              {/* Custom purpose field */}
              {keperluan === 'Lainnya' && (
                <textarea
                  value={customKeperluan}
                  onChange={(e) => setCustomKeperluan(e.target.value)}
                  placeholder="Ketikkan keperluan kunjungan Anda di sini..."
                  rows={2}
                  maxLength={100}
                  className="block w-full p-2 border border-blue-200 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  required
                />
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <div className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded">
                <Volume2 className="w-3 h-3 text-blue-500" />
                <span>Konfirmasi suara aktif</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
