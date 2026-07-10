import { Student, Teacher, Attendance, Admin, Guest, ActivityLog, SyncConfig } from '../types';

// Web Audio API helper for sound effects (100% offline & local)
export function playSuccessSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Play a nice double chime (success ping)
    const now = ctx.currentTime;
    
    // First note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.1, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);
    
    // Second note
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1); // A5
    gain2.gain.setValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.35);
  } catch (error) {
    console.warn('Web Audio is not supported or was blocked by browser autoplay policy:', error);
  }
}

export function playErrorSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now); // Low buzz
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (error) {
    console.warn(error);
  }
}

// Pre-seeded Students
const INITIAL_STUDENTS: Student[] = [
  { id: 'S1', nisn: '0081234567', nama: 'Ahmad Fauzi', kelas: 'XII MIPA 1', jk: 'L', qrCode: '0081234567', active: true },
  { id: 'S2', nisn: '0079876543', nama: 'Siti Rahmawati', kelas: 'XII IPS 2', jk: 'P', qrCode: '0079876543', active: true },
  { id: 'S3', nisn: '0091122334', nama: 'Budi Hartono', kelas: 'XI MIPA 3', jk: 'L', qrCode: '0091122334', active: true },
  { id: 'S4', nisn: '0094455667', nama: 'Dewi Lestari', kelas: 'XI IPS 1', jk: 'P', qrCode: '0094455667', active: true },
  { id: 'S5', nisn: '0105566778', nama: 'Rian Hidayat', kelas: 'X-1', jk: 'L', qrCode: '0105566778', active: true },
  { id: 'S6', nisn: '0102233445', nama: 'Amelia Putri', kelas: 'X-4', jk: 'P', qrCode: '0102233445', active: true }
];

// Pre-seeded Teachers
const INITIAL_TEACHERS: Teacher[] = [
  { id: 'G1', nip: '198503122010011002', nama: 'Drs. Bambang Wijaya', mapel: 'Fisika', jabatan: 'Kepala Perpustakaan', qrCode: '198503122010011002' },
  { id: 'G2', nip: '199005242015022003', nama: 'Sri Wahyuni, S.Pd.', mapel: 'Bahasa Indonesia', jabatan: 'Guru Pamong', qrCode: '199005242015022003' },
  { id: 'G3', nip: '197811022005011001', nama: 'Hendra Saputra, M.Pd.', mapel: 'Sejarah', jabatan: 'Waka Kesiswaan', qrCode: '197811022005011001' }
];

// Pre-seeded Admins
const INITIAL_ADMINS: Admin[] = [
  { id: 'A1', nama: 'Ibu Marlina (Admin)', username: 'admin', level: 'Admin', passwordHash: 'admin123' },
  { id: 'A2', nama: 'Pak Joko (Petugas)', username: 'petugas', level: 'Petugas', passwordHash: 'petugas123' }
];

// Pre-seeded Attendance Logs for Today & Past days to populate charts
const getPastDateStr = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const INITIAL_ATTENDANCE: Attendance[] = [
  // Today's attendance
  { id: 'att-1', tanggal: getPastDateStr(0), jam: '07:32:15', nama: 'Ahmad Fauzi', kategori: 'Siswa', kelas: 'XII MIPA 1', keperluan: 'Membaca Buku Referensi', petugas: 'Pak Joko (Petugas)', identifier: '0081234567' },
  { id: 'att-2', tanggal: getPastDateStr(0), jam: '08:15:40', nama: 'Siti Rahmawati', kategori: 'Siswa', kelas: 'XII IPS 2', keperluan: 'Meminjam Novel Sastra', petugas: 'Pak Joko (Petugas)', identifier: '0079876543' },
  { id: 'att-3', tanggal: getPastDateStr(0), jam: '09:00:22', nama: 'Drs. Bambang Wijaya', kategori: 'Guru', kelas: 'Fisika', keperluan: 'Rapat Koordinasi Ruang Baca', petugas: 'Pak Joko (Petugas)', identifier: '198503122010011002' },
  { id: 'att-4', tanggal: getPastDateStr(0), jam: '10:10:05', nama: 'Irwan Setiawan', kategori: 'Tamu', kelas: 'Pengawas Sekolah', keperluan: 'Kunjungan Monitoring Perpustakaan', petugas: 'Ibu Marlina (Admin)', identifier: '081299887766' },
  { id: 'att-5', tanggal: getPastDateStr(0), jam: '11:45:12', nama: 'Rian Hidayat', kategori: 'Siswa', kelas: 'X-1', keperluan: 'Mengerjakan Tugas Kelompok', petugas: 'Ibu Marlina (Admin)', identifier: '0105566778' },
  
  // Yesterday's attendance (1 day ago)
  { id: 'att-6', tanggal: getPastDateStr(1), jam: '07:45:00', nama: 'Siti Rahmawati', kategori: 'Siswa', kelas: 'XII IPS 2', keperluan: 'Mengembalikan Buku Paket', petugas: 'Pak Joko (Petugas)', identifier: '0079876543' },
  { id: 'att-7', tanggal: getPastDateStr(1), jam: '08:50:00', nama: 'Budi Hartono', kategori: 'Siswa', kelas: 'XI MIPA 3', keperluan: 'Membaca Komik', petugas: 'Pak Joko (Petugas)', identifier: '0091122334' },
  { id: 'att-8', tanggal: getPastDateStr(1), jam: '11:20:00', nama: 'Sri Wahyuni, S.Pd.', kategori: 'Guru', kelas: 'Bahasa Indonesia', keperluan: 'Mencari Jurnal Ilmiah', petugas: 'Pak Joko (Petugas)', identifier: '199005242015022003' },
  { id: 'att-9', tanggal: getPastDateStr(1), jam: '13:10:00', nama: 'Amelia Putri', kategori: 'Siswa', kelas: 'X-4', keperluan: 'Membaca Buku Sejarah', petugas: 'Pak Joko (Petugas)', identifier: '0102233445' },

  // 2 days ago
  { id: 'att-10', tanggal: getPastDateStr(2), jam: '08:10:00', nama: 'Ahmad Fauzi', kategori: 'Siswa', kelas: 'XII MIPA 1', keperluan: 'Meminjam Buku Fisika', petugas: 'Ibu Marlina (Admin)', identifier: '0081234567' },
  { id: 'att-11', tanggal: getPastDateStr(2), jam: '09:40:00', nama: 'Budi Hartono', kategori: 'Siswa', kelas: 'XI MIPA 3', keperluan: 'Mengerjakan Tugas Fisika', petugas: 'Ibu Marlina (Admin)', identifier: '0091122334' },
  { id: 'att-12', tanggal: getPastDateStr(2), jam: '10:30:00', nama: 'Dewi Lestari', kategori: 'Siswa', kelas: 'XI IPS 1', keperluan: 'Diskusi Kelompok', petugas: 'Pak Joko (Petugas)', identifier: '0094455667' },

  // 3 days ago
  { id: 'att-13', tanggal: getPastDateStr(3), jam: '07:55:00', nama: 'Rian Hidayat', kategori: 'Siswa', kelas: 'X-1', keperluan: 'Membaca Novel', petugas: 'Ibu Marlina (Admin)', identifier: '0105566778' },
  { id: 'att-14', tanggal: getPastDateStr(3), jam: '12:05:00', nama: 'Hendra Saputra, M.Pd.', kategori: 'Guru', kelas: 'Sejarah', keperluan: 'Mencari Buku Referensi', petugas: 'Ibu Marlina (Admin)', identifier: '197811022005011001' },

  // 4 days ago
  { id: 'att-15', tanggal: getPastDateStr(4), jam: '08:30:00', nama: 'Siti Rahmawati', kategori: 'Siswa', kelas: 'XII IPS 2', keperluan: 'Diskusi Kelompok', petugas: 'Pak Joko (Petugas)', identifier: '0079876543' },
  { id: 'att-16', tanggal: getPastDateStr(4), jam: '10:00:00', nama: 'Ahmad Fauzi', kategori: 'Siswa', kelas: 'XII MIPA 1', keperluan: 'Membaca Majalah', petugas: 'Pak Joko (Petugas)', identifier: '0081234567' },

  // 5 days ago
  { id: 'att-17', tanggal: getPastDateStr(5), jam: '08:15:00', nama: 'Budi Hartono', kategori: 'Siswa', kelas: 'XI MIPA 3', keperluan: 'Membaca Majalah', petugas: 'Ibu Marlina (Admin)', identifier: '0091122334' }
];

// Initial sync setting
const INITIAL_SYNC_CONFIG: SyncConfig = {
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1Xy_SMAN1BanjarsariAbsensi_LiveSync/edit',
  enabled: true,
  status: 'online',
  pendingCount: 0
};

// Initial Activity Logs
const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'log-1', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), user: 'Ibu Marlina (Admin)', action: 'Login Berhasil', details: 'Pengguna masuk ke sistem sebagai Admin.' },
  { id: 'log-2', timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(), user: 'Ibu Marlina (Admin)', action: 'Inisialisasi Database', details: 'Database lokal dimuat secara offline.' }
];

// LocalStorage Keys
const KEYS = {
  STUDENTS: 'perpus_sman1_students',
  TEACHERS: 'perpus_sman1_teachers',
  ATTENDANCE: 'perpus_sman1_attendance',
  ADMINS: 'perpus_sman1_admins',
  SYNC: 'perpus_sman1_sync_config',
  LOGS: 'perpus_sman1_logs',
  SESSION: 'perpus_sman1_session'
};

// Initialize Storage if empty
export function initDB() {
  if (!localStorage.getItem(KEYS.STUDENTS)) {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  }
  if (!localStorage.getItem(KEYS.TEACHERS)) {
    localStorage.setItem(KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
  }
  if (!localStorage.getItem(KEYS.ATTENDANCE)) {
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
  }
  if (!localStorage.getItem(KEYS.ADMINS)) {
    localStorage.setItem(KEYS.ADMINS, JSON.stringify(INITIAL_ADMINS));
  }
  if (!localStorage.getItem(KEYS.SYNC)) {
    localStorage.setItem(KEYS.SYNC, JSON.stringify(INITIAL_SYNC_CONFIG));
  }
  if (!localStorage.getItem(KEYS.LOGS)) {
    localStorage.setItem(KEYS.LOGS, JSON.stringify(INITIAL_ACTIVITY_LOGS));
  }
}

// Read functions
export function getStudents(): Student[] {
  initDB();
  return JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]');
}

export function getTeachers(): Teacher[] {
  initDB();
  return JSON.parse(localStorage.getItem(KEYS.TEACHERS) || '[]');
}

export function getAttendance(): Attendance[] {
  initDB();
  return JSON.parse(localStorage.getItem(KEYS.ATTENDANCE) || '[]');
}

export function getAdmins(): Admin[] {
  initDB();
  return JSON.parse(localStorage.getItem(KEYS.ADMINS) || '[]');
}

export function getSyncConfig(): SyncConfig {
  initDB();
  return JSON.parse(localStorage.getItem(KEYS.SYNC) || '[]');
}

export function getActivityLogs(): ActivityLog[] {
  initDB();
  return JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
}

export function getSession(): Admin | null {
  const session = localStorage.getItem(KEYS.SESSION);
  return session ? JSON.parse(session) : null;
}

// Write functions
export function saveStudents(students: Student[]) {
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
}

export function saveTeachers(teachers: Teacher[]) {
  localStorage.setItem(KEYS.TEACHERS, JSON.stringify(teachers));
}

export function saveAttendance(attendance: Attendance[]) {
  localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(attendance));
}

export function saveSyncConfig(config: SyncConfig) {
  localStorage.setItem(KEYS.SYNC, JSON.stringify(config));
}

export function addActivityLog(user: string, action: string, details: string) {
  const logs = getActivityLogs();
  const newLog: ActivityLog = {
    id: 'log-' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    user,
    action,
    details
  };
  logs.unshift(newLog);
  localStorage.setItem(KEYS.LOGS, JSON.stringify(logs.slice(0, 100))); // Limit to latest 100 logs
}

export function setSession(admin: Admin | null) {
  if (admin) {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(admin));
    addActivityLog(admin.nama, 'Login', `Pengguna ${admin.username} berhasil login.`);
  } else {
    const current = getSession();
    if (current) {
      addActivityLog(current.nama, 'Logout', `Pengguna ${current.username} keluar dari sistem.`);
    }
    localStorage.removeItem(KEYS.SESSION);
  }
}

// Helper to log attendance
export function logAttendance(
  nama: string,
  kategori: 'Siswa' | 'Guru' | 'Tamu',
  kelas: string,
  keperluan: string,
  identifier: string,
  petugas: string
): Attendance {
  const attendance = getAttendance();
  const now = new Date();
  
  const newRecord: Attendance = {
    id: 'att-' + Math.random().toString(36).substr(2, 9),
    tanggal: now.toISOString().split('T')[0],
    jam: now.toTimeString().split(' ')[0],
    nama,
    kategori,
    kelas,
    keperluan,
    petugas,
    identifier
  };
  
  attendance.unshift(newRecord);
  saveAttendance(attendance);
  addActivityLog(petugas, 'Pencatatan Kehadiran', `Absensi Berhasil: [${kategori}] ${nama} (${identifier})`);
  playSuccessSound();
  return newRecord;
}

// Backup & Reset database
export function exportDatabaseBackup(): string {
  initDB();
  const data = {
    students: getStudents(),
    teachers: getTeachers(),
    attendance: getAttendance(),
    admins: getAdmins(),
    sync: getSyncConfig(),
    logs: getActivityLogs()
  };
  return JSON.stringify(data, null, 2);
}

export function importDatabaseBackup(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.students && parsed.teachers && parsed.attendance && parsed.admins) {
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(parsed.students));
      localStorage.setItem(KEYS.TEACHERS, JSON.stringify(parsed.teachers));
      localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(parsed.attendance));
      localStorage.setItem(KEYS.ADMINS, JSON.stringify(parsed.admins));
      if (parsed.sync) localStorage.setItem(KEYS.SYNC, JSON.stringify(parsed.sync));
      if (parsed.logs) localStorage.setItem(KEYS.LOGS, JSON.stringify(parsed.logs));
      addActivityLog('System', 'Restore Database', 'Pemulihan data cadangan berhasil dilakukan.');
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to parse database restore:', e);
    return false;
  }
}

export function resetDatabase() {
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
  localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
  localStorage.setItem(KEYS.LOGS, JSON.stringify(INITIAL_ACTIVITY_LOGS));
  addActivityLog('System', 'Reset Database', 'Basis data disetel ulang ke kondisi bawaan.');
}
