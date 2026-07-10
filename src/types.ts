export interface Student {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  jk: 'L' | 'P';
  qrCode: string;
  active: boolean;
}

export interface Teacher {
  id: string;
  nip: string;
  nama: string;
  mapel: string;
  jabatan: string;
  qrCode: string;
}

export interface Guest {
  id: string;
  nama: string;
  instansi: string;
  hp: string;
  keperluan: string;
  jamMasuk: string;
  tanggal: string;
}

export interface Attendance {
  id: string;
  tanggal: string; // YYYY-MM-DD
  jam: string; // HH:mm:ss
  nama: string;
  kategori: 'Siswa' | 'Guru' | 'Tamu';
  kelas: string; // "Guru" or Instansi if Tamu
  keperluan: string;
  petugas: string;
  identifier: string; // NISN or NIP or Guest HP
}

export interface Admin {
  id: string;
  nama: string;
  username: string;
  level: 'Admin' | 'Petugas';
  passwordHash: string; // Local storage simulation
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface SyncConfig {
  sheetUrl: string;
  enabled: boolean;
  status: 'online' | 'offline';
  pendingCount: number;
}
