import React, { useState, useMemo } from 'react';
import { Upload, Plus, Trash2, Search, GraduationCap, User, Users, AlertCircle, CheckCircle, FileSpreadsheet, Download, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { Student, Teacher, Admin } from '../types';
import { getStudents, getTeachers, saveStudents, saveTeachers, addActivityLog } from '../utils/db';
import { parseStudentsFile, parseTeachersFile, exportStudentsToExcel, exportTeachersToExcel, ImportResult } from '../utils/excel';

interface DataMasterViewProps {
  currentSession: Admin | null;
  onDataChange: () => void;
}

export default function DataMasterView({ currentSession, onDataChange }: DataMasterViewProps) {
  // Tabs: 'siswa' | 'guru' | 'import'
  const [activeTab, setActiveTab] = useState<'siswa' | 'guru' | 'import'>('siswa');

  // Load lists from DB
  const [students, setStudents] = useState<Student[]>(() => getStudents());
  const [teachers, setTeachers] = useState<Teacher[]>(() => getTeachers());

  const handleRefresh = () => {
    setStudents(getStudents());
    setTeachers(getTeachers());
    onDataChange();
  };

  // Search queries
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');

  // Manual Student Form states
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studNisn, setStudNisn] = useState('');
  const [studNama, setStudNama] = useState('');
  const [studKelas, setStudKelas] = useState('');
  const [studJk, setStudJk] = useState<'L' | 'P'>('L');

  // Manual Teacher Form states
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [teachNip, setTeachNip] = useState('');
  const [teachNama, setTeachNama] = useState('');
  const [teachMapel, setTeachMapel] = useState('');
  const [teachJabatan, setTeachJabatan] = useState('');

  // Import states
  const [importType, setImportType] = useState<'siswa' | 'guru'>('siswa');
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    duplicateCount: number;
    invalidCount: number;
    errors: string[];
    importType: 'siswa' | 'guru';
  } | null>(null);
  const [importing, setImporting] = useState(false);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return students;
    return students.filter(s => s.nama.toLowerCase().includes(q) || s.nisn.includes(q) || s.kelas.toLowerCase().includes(q));
  }, [students, studentSearch]);

  // Filter teachers based on search
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.toLowerCase().trim();
    if (!q) return teachers;
    return teachers.filter(t => t.nama.toLowerCase().includes(q) || t.nip.includes(q) || t.mapel.toLowerCase().includes(q));
  }, [teachers, teacherSearch]);

  // Handle adding new student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const nisn = studNisn.trim();
    const nama = studNama.trim();
    const kelas = studKelas.trim();

    if (!nisn || !nama || !kelas) return;

    // Check duplicate
    if (students.some((s) => s.nisn === nisn)) {
      alert(`NISN "${nisn}" sudah terdaftar sebelumnya!`);
      return;
    }

    const newStudent: Student = {
      id: 'S-' + Math.random().toString(36).substr(2, 9),
      nisn,
      nama,
      kelas,
      jk: studJk,
      qrCode: nisn,
      active: true
    };

    const updated = [newStudent, ...students];
    saveStudents(updated);
    setStudents(updated);
    
    // Log Activity
    const petugasName = currentSession ? currentSession.nama : 'Admin';
    addActivityLog(petugasName, 'Tambah Siswa', `Menambahkan siswa baru: ${nama} (NISN: ${nisn})`);

    // Reset Form
    setStudNisn('');
    setStudNama('');
    setStudKelas('');
    setStudJk('L');
    setShowStudentForm(false);
    onDataChange();
  };

  // Handle adding new teacher
  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const nip = teachNip.trim();
    const nama = teachNama.trim();
    const mapel = teachMapel.trim();
    const jabatan = teachJabatan.trim();

    if (!nip || !nama) return;

    // Check duplicate
    if (teachers.some((t) => t.nip === nip)) {
      alert(`NIP "${nip}" sudah terdaftar sebelumnya!`);
      return;
    }

    const newTeacher: Teacher = {
      id: 'T-' + Math.random().toString(36).substr(2, 9),
      nip,
      nama,
      mapel,
      jabatan,
      qrCode: nip
    };

    const updated = [newTeacher, ...teachers];
    saveTeachers(updated);
    setTeachers(updated);

    // Log Activity
    const petugasName = currentSession ? currentSession.nama : 'Admin';
    addActivityLog(petugasName, 'Tambah Guru', `Menambahkan guru baru: ${nama} (NIP: ${nip})`);

    // Reset Form
    setTeachNip('');
    setTeachNama('');
    setTeachMapel('');
    setTeachJabatan('');
    setShowTeacherForm(false);
    onDataChange();
  };

  // Toggle active status for students
  const handleToggleStudentStatus = (id: string) => {
    const updated = students.map(s => {
      if (s.id === id) {
        const nextActive = !s.active;
        const petugasName = currentSession ? currentSession.nama : 'Admin';
        addActivityLog(petugasName, 'Ubah Status Siswa', `Mengubah status keaktifan ${s.nama} menjadi ${nextActive ? 'Aktif' : 'Non-aktif'}`);
        return { ...s, active: nextActive };
      }
      return s;
    });
    saveStudents(updated);
    setStudents(updated);
    onDataChange();
  };

  // Deletion logic
  const handleDeleteStudent = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data Siswa: "${name}"?`)) {
      const updated = students.filter(s => s.id !== id);
      saveStudents(updated);
      setStudents(updated);
      const petugasName = currentSession ? currentSession.nama : 'Admin';
      addActivityLog(petugasName, 'Hapus Siswa', `Menghapus data siswa: ${name}`);
      onDataChange();
    }
  };

  const handleDeleteTeacher = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data Guru: "${name}"?`)) {
      const updated = teachers.filter(t => t.id !== id);
      saveTeachers(updated);
      setTeachers(updated);
      const petugasName = currentSession ? currentSession.nama : 'Admin';
      addActivityLog(petugasName, 'Hapus Guru', `Menghapus data guru: ${name}`);
      onDataChange();
    }
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImportFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImportFile(e.target.files[0]);
    }
  };

  const processImportFile = async (file: File) => {
    setImporting(true);
    setImportResult(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
      alert('Tipe file salah! Harap unggah file Excel (.xlsx, .xls) atau CSV.');
      setImporting(false);
      return;
    }

    try {
      if (importType === 'siswa') {
        const result = await parseStudentsFile(file, students);
        if (result.importedData.length > 0) {
          const updated = [...result.importedData, ...students];
          saveStudents(updated);
          setStudents(updated);
          const petugasName = currentSession ? currentSession.nama : 'Admin';
          addActivityLog(petugasName, 'Import Siswa', `Berhasil mengimpor ${result.successCount} data siswa dari file.`);
        }
        setImportResult({
          successCount: result.successCount,
          duplicateCount: result.duplicateCount,
          invalidCount: result.invalidCount,
          errors: result.errors,
          importType: 'siswa'
        });
      } else {
        const result = await parseTeachersFile(file, teachers);
        if (result.importedData.length > 0) {
          const updated = [...result.importedData, ...teachers];
          saveTeachers(updated);
          setTeachers(updated);
          const petugasName = currentSession ? currentSession.nama : 'Admin';
          addActivityLog(petugasName, 'Import Guru', `Berhasil mengimpor ${result.successCount} data guru dari file.`);
        }
        setImportResult({
          successCount: result.successCount,
          duplicateCount: result.duplicateCount,
          invalidCount: result.invalidCount,
          errors: result.errors,
          importType: 'guru'
        });
      }
      onDataChange();
    } catch (err: any) {
      alert(err.message || 'Gagal mengimpor file.');
    } finally {
      setImporting(false);
    }
  };

  // Download excel templates helper representation
  const handleDownloadTemplate = () => {
    if (importType === 'siswa') {
      const dummyStudents = [
        { NISN: '0101122334', Nama: 'Asep Saepudin', Kelas: 'X MIPA 1', 'Jenis Kelamin': 'L', 'Status Aktif': 'Aktif' },
        { NISN: '0102233445', Nama: 'Isyana Saraswati', Kelas: 'XI IPS 2', 'Jenis Kelamin': 'P', 'Status Aktif': 'Aktif' }
      ];
      exportStudentsToExcel(dummyStudents as any, 'Template_Import_Siswa_SMAN_1_Banjarsari.xlsx');
    } else {
      const dummyTeachers = [
        { NIP: '198705122015021003', Nama: 'Ahmad Subardjo, S.Pd.', 'Mata Pelajaran': 'Matematika', Jabatan: 'Guru Ahli Pertama' }
      ];
      exportTeachersToExcel(dummyTeachers as any, 'Template_Import_Guru_SMAN_1_Banjarsari.xlsx');
    }
  };

  return (
    <div className="space-y-4" id="data-master-view">
      
      {/* View Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-0.5">
          <h2 className="text-base font-bold font-display text-slate-800">Manajemen Data Master Anggota</h2>
          <p className="text-xs text-slate-500 font-sans">
            Tambahkan, hapus, kelola status aktif siswa dan guru perpustakaan, atau lakukan impor berkas massal.
          </p>
        </div>
        
        {/* Actions header buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 cursor-pointer transition-all flex items-center gap-1 text-xs font-semibold"
            title="Muat ulang tabel"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Segarkan
          </button>
          
          {activeTab === 'siswa' && (
            <button
              onClick={() => setShowStudentForm(!showStudentForm)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Siswa Baru
            </button>
          )}

          {activeTab === 'guru' && (
            <button
              onClick={() => setShowTeacherForm(!showTeacherForm)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Guru Baru
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Selection */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-lg border gap-1">
        <button
          onClick={() => setActiveTab('siswa')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs sm:text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'siswa' ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Daftar Siswa ({students.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('guru')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs sm:text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'guru' ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Daftar Guru ({teachers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs sm:text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'import' ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Impor Data Massal (Excel)</span>
        </button>
      </div>

      {/* TAB CONTENT 1: SISWA */}
      {activeTab === 'siswa' && (
        <div className="space-y-4" id="panel-roster-students">
          
          {/* Manual student add collapsible form */}
          {showStudentForm && (
            <form onSubmit={handleAddStudent} className="bg-slate-50 p-4 rounded-lg border border-slate-200/60 shadow-inner grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fadeIn">
              <div className="sm:col-span-4 flex items-center justify-between border-b border-slate-200 pb-1.5 mb-0.5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Form Tambah Siswa Baru</h3>
                <button type="button" onClick={() => setShowStudentForm(false)} className="text-xs text-rose-600 hover:underline cursor-pointer">Tutup</button>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">NISN (10 Digit)</label>
                <input
                  type="text"
                  maxLength={10}
                  pattern="\d{10}"
                  required
                  placeholder="Contoh: 0081234567"
                  value={studNisn}
                  onChange={(e) => setStudNisn(e.target.value.replace(/\D/g, ''))}
                  className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Fauzi"
                  value={studNama}
                  onChange={(e) => setStudNama(e.target.value)}
                  className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">Kelas / Tingkat</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: XII MIPA 1"
                  value={studKelas}
                  onChange={(e) => setStudKelas(e.target.value)}
                  className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">Jenis Kelamin</label>
                <select
                  value={studJk}
                  onChange={(e) => setStudJk(e.target.value as 'L' | 'P')}
                  className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors cursor-pointer"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          )}

          {/* Search bar & list info */}
          <div className="bg-white p-3 rounded-lg border border-slate-200/60 shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div className="relative w-full max-w-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Cari siswa berdasarkan NISN, Nama, atau Kelas..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="block w-full pl-8 pr-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded text-xs text-slate-800 placeholder-slate-400"
              />
            </div>
            
            <div className="text-[11px] text-slate-400">
              Menampilkan <span className="font-bold text-slate-700 font-mono">{filteredStudents.length}</span> dari <span className="font-bold text-slate-700 font-mono">{students.length}</span> siswa.
            </div>
          </div>

          {/* Students table */}
          {filteredStudents.length > 0 ? (
            <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse" id="tbl-data-siswa">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100">
                    <th className="py-2 px-3 w-12 text-center">No</th>
                    <th className="py-2 px-3">NISN</th>
                    <th className="py-2 px-3">Nama Lengkap</th>
                    <th className="py-2 px-3">Kelas</th>
                    <th className="py-2 px-3 text-center">JK</th>
                    <th className="py-2 px-3 text-center">Keaktifan</th>
                    <th className="py-2 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredStudents.map((s, idx) => (
                    <tr key={s.id} className={`hover:bg-slate-50/40 transition-colors ${!s.active ? 'opacity-55 bg-slate-50/30' : ''}`}>
                      <td className="py-2 px-3 text-center text-xs text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono text-xs font-bold text-slate-700">{s.nisn}</td>
                      <td className="py-2 px-3 font-bold text-slate-800">{s.nama}</td>
                      <td className="py-2 px-3 text-slate-600 font-medium">{s.kelas}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] rounded font-bold ${
                          s.jk === 'L' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-pink-50 text-pink-700 border border-pink-100'
                        }`}>
                          {s.jk}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                           onClick={() => handleToggleStudentStatus(s.id)}
                           className="inline-flex items-center gap-1 cursor-pointer"
                           title="Klik untuk mengubah status keaktifan"
                        >
                          {s.active ? (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> Aktif
                            </span>
                          ) : (
                            <span className="text-rose-700 bg-rose-50 border border-rose-100 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <span className="w-1 h-1 bg-rose-500 rounded-full"></span> Nonaktif
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.nama)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Hapus data siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg border border-slate-200/60 shadow-sm">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">Siswa Tidak Ditemukan</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          )}

        </div>
      )}

      {/* TAB CONTENT 2: GURU */}
      {activeTab === 'guru' && (
        <div className="space-y-4" id="panel-roster-teachers">
          
          {/* Manual teacher add collapsible form */}
          {showTeacherForm && (
            <form onSubmit={handleAddTeacher} className="bg-slate-50 p-4 rounded-lg border border-slate-200/60 shadow-inner grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fadeIn">
              <div className="sm:col-span-4 flex items-center justify-between border-b border-slate-200 pb-1.5 mb-0.5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Form Tambah Guru Baru</h3>
                <button type="button" onClick={() => setShowTeacherForm(false)} className="text-xs text-rose-600 hover:underline cursor-pointer">Tutup</button>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">NIP (Nomor Induk Pegawai)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 198510252010..."
                  value={teachNip}
                  onChange={(e) => setTeachNip(e.target.value.replace(/\s/g, ''))}
                  className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sri Wahyuni, S.Pd."
                  value={teachNama}
                  onChange={(e) => setTeachNama(e.target.value)}
                  className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">Mata Pelajaran Diampu</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bahasa Indonesia"
                  value={teachMapel}
                  onChange={(e) => setTeachMapel(e.target.value)}
                  className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide">Jabatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Contoh: Kepala Lab / Guru Pamong"
                  value={teachJabatan}
                  onChange={(e) => setTeachJabatan(e.target.value)}
                  className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                />
              </div>
              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors cursor-pointer"
                >
                  Simpan Guru
                </button>
              </div>
            </form>
          )}

          {/* Search bar & list info */}
          <div className="bg-white p-3 rounded-lg border border-slate-200/60 shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div className="relative w-full max-w-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Cari guru berdasarkan NIP, Nama, atau Mapel..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="block w-full pl-8 pr-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded text-xs text-slate-800 placeholder-slate-400"
              />
            </div>
            
            <div className="text-[11px] text-slate-400">
              Menampilkan <span className="font-bold text-slate-700 font-mono">{filteredTeachers.length}</span> dari <span className="font-bold text-slate-700 font-mono">{teachers.length}</span> guru.
            </div>
          </div>

          {/* Teachers table */}
          {filteredTeachers.length > 0 ? (
            <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse" id="tbl-data-guru">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100">
                    <th className="py-2 px-3 w-12 text-center">No</th>
                    <th className="py-2 px-3">NIP</th>
                    <th className="py-2 px-3">Nama Lengkap</th>
                    <th className="py-2 px-3">Mata Pelajaran</th>
                    <th className="py-2 px-3">Jabatan Tambahan</th>
                    <th className="py-2 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTeachers.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-2 px-3 text-center text-xs text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono text-xs font-bold text-slate-700">{t.nip}</td>
                      <td className="py-2 px-3 font-bold text-slate-800">{t.nama}</td>
                      <td className="py-2 px-3 text-slate-600 font-medium">{t.mapel}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] italic">{t.jabatan || 'Guru'}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleDeleteTeacher(t.id, t.nama)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Hapus data guru"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg border border-slate-200/60 shadow-sm">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">Guru Tidak Ditemukan</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          )}

        </div>
      )}

      {/* TAB CONTENT 3: EXCEL MASS IMPORTER */}
      {activeTab === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="panel-importer-excel">
          
          {/* File Upload Left area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-800">Unggah File Data Excel / CSV</h3>
                  <p className="text-xs text-slate-400">Pilih kategori data sebelum menyeret berkas</p>
                </div>
                
                {/* Importer target selector */}
                <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => { setImportType('siswa'); setImportResult(null); }}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                      importType === 'siswa' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Target: Siswa
                  </button>
                  <button
                    onClick={() => { setImportType('guru'); setImportResult(null); }}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                      importType === 'guru' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Target: Guru
                  </button>
                </div>
              </div>

              {/* Drag and drop panel */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all relative ${
                  dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  id="excel-file-importer"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  disabled={importing}
                />
                
                <div className="max-w-xs mx-auto space-y-3">
                  <div className="mx-auto w-10 h-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700">
                      Seketika seret & jatuhkan berkas di sini
                    </p>
                    <p className="text-[11px] text-slate-400 font-sans">
                      atau <label htmlFor="excel-file-importer" className="text-blue-600 hover:underline cursor-pointer font-bold">telusuri berkas dari perangkat</label>
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Format yang didukung: .XLSX, .XLS, .CSV
                  </p>
                </div>
              </div>

              {/* Template downloader banner */}
              <div className="bg-slate-50 p-2.5 rounded flex items-center justify-between border border-slate-100 flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-slate-600 font-semibold">
                    Butuh kerangka kolom impor? Unduh template ini:
                  </span>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1 bg-white border border-slate-200 hover:border-blue-300 text-blue-700 px-2.5 py-1 rounded font-bold transition-colors cursor-pointer text-xs"
                >
                  Template {importType === 'siswa' ? 'Siswa' : 'Guru'}
                </button>
              </div>

            </div>
          </div>

          {/* Import results summary area */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-3 min-h-[300px]">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hasil Impor Terakhir</h3>
              
              {importing ? (
                <div className="text-center py-10 space-y-2">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-600 font-sans">Menelaah berkas, memvalidasi NISN/NIP...</p>
                </div>
              ) : importResult ? (
                <div className="space-y-3 animate-fadeIn">
                  
                  {/* Cards metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="bg-emerald-50 border border-emerald-100 p-2 rounded text-emerald-800">
                      <p className="font-bold text-base font-mono leading-none mb-1">{importResult.successCount}</p>
                      <p className="font-sans text-slate-500 uppercase font-semibold">Sukses</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-2 rounded text-amber-800">
                      <p className="font-bold text-base font-mono leading-none mb-1">{importResult.duplicateCount}</p>
                      <p className="font-sans text-slate-500 uppercase font-semibold">Duplikat</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 p-2 rounded text-rose-800">
                      <p className="font-bold text-base font-mono leading-none mb-1">{importResult.invalidCount}</p>
                      <p className="font-sans text-slate-500 uppercase font-semibold">Gagal</p>
                    </div>
                  </div>

                  {/* Summary indicator */}
                  {importResult.successCount > 0 ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-2 rounded flex items-center gap-2 text-xs text-emerald-800">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>Berhasil mengimpor {importResult.successCount} data {importResult.importType} baru!</span>
                    </div>
                  ) : null}

                  {/* Warnings or Errors listed */}
                  {importResult.errors.length > 0 ? (
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Daftar Catatan Impor ({importResult.errors.length}):
                      </p>
                      <div className="bg-slate-50 border border-slate-100 rounded p-2 max-h-36 overflow-y-auto text-[11px] text-slate-600 font-mono divide-y divide-slate-100 space-y-1">
                        {importResult.errors.map((err, i) => (
                          <div key={i} className="pt-1 text-slate-500 leading-normal">{err}</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400 italic font-sans bg-slate-50 rounded">
                      Semua data dalam file lolos verifikasi dengan sempurna.
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-12 text-slate-300">
                  <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                  <p className="text-xs font-semibold text-slate-400">Belum ada file diunggah</p>
                  <p className="text-[10px] text-slate-400 font-sans mt-1">Laporan validasi akan langsung muncul di panel ini setelah berkas Excel selesai dipindai.</p>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
