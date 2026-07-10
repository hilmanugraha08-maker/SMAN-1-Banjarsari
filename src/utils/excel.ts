import * as XLSX from 'xlsx';
import { Student, Teacher, Attendance } from '../types';

export interface ImportResult<T> {
  successCount: number;
  duplicateCount: number;
  invalidCount: number;
  errors: string[];
  importedData: T[];
}

/**
 * Parsers for importing student files
 */
export function parseStudentsFile(
  file: File,
  existingStudents: Student[]
): Promise<ImportResult<Student>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('File data is empty');
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON array
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);
        
        const result: ImportResult<Student> = {
          successCount: 0,
          duplicateCount: 0,
          invalidCount: 0,
          errors: [],
          importedData: []
        };
        
        const existingNisns = new Set(existingStudents.map(s => s.nisn.trim()));
        const seenNisnsInFile = new Set<string>();

        rawRows.forEach((row, index) => {
          const rowNum = index + 2; // Row number in sheet (header is 1)
          
          // Try to map columns regardless of case
          const nisn = String(row.NISN || row.nisn || row['No Induk'] || '').trim();
          const nama = String(row.Nama || row.nama || row['Nama Lengkap'] || '').trim();
          const kelas = String(row.Kelas || row.kelas || row['Tingkat'] || '').trim();
          const jkRaw = String(row['Jenis Kelamin'] || row.jk || row.JK || '').trim().toUpperCase();
          const activeStr = String(row['Status Aktif'] || row.Status || row.status || 'Aktif').trim().toLowerCase();

          // Validation
          if (!nisn || !nama || !kelas) {
            result.invalidCount++;
            result.errors.push(`Baris ${rowNum}: Kolom NISN, Nama, atau Kelas kosong.`);
            return;
          }

          if (nisn.length < 5) {
            result.invalidCount++;
            result.errors.push(`Baris ${rowNum}: NISN "${nisn}" terlalu pendek.`);
            return;
          }

          // Duplicate checks
          if (seenNisnsInFile.has(nisn)) {
            result.duplicateCount++;
            result.errors.push(`Baris ${rowNum}: NISN "${nisn}" duplikat dalam file.`);
            return;
          }
          
          if (existingNisns.has(nisn)) {
            result.duplicateCount++;
            result.errors.push(`Baris ${rowNum}: NISN "${nisn}" sudah terdaftar di database.`);
            return;
          }

          const jk: 'L' | 'P' = (jkRaw.startsWith('P') || jkRaw === 'PEREMPUAN') ? 'P' : 'L';
          const active = activeStr.includes('tidak') || activeStr.includes('non') || activeStr === 'false' ? false : true;

          seenNisnsInFile.add(nisn);

          const newStudent: Student = {
            id: 'S-' + Math.random().toString(36).substr(2, 9),
            nisn,
            nama,
            kelas,
            jk,
            qrCode: nisn, // Use NISN directly as QR Code
            active
          };

          result.importedData.push(newStudent);
          result.successCount++;
        });

        resolve(result);
      } catch (error: any) {
        reject(new Error(`Gagal membaca file Excel/CSV: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Parsers for importing teacher files
 */
export function parseTeachersFile(
  file: File,
  existingTeachers: Teacher[]
): Promise<ImportResult<Teacher>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('File data is empty');
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);
        
        const result: ImportResult<Teacher> = {
          successCount: 0,
          duplicateCount: 0,
          invalidCount: 0,
          errors: [],
          importedData: []
        };
        
        const existingNips = new Set(existingTeachers.map(t => t.nip.trim()));
        const seenNipsInFile = new Set<string>();

        rawRows.forEach((row, index) => {
          const rowNum = index + 2;
          
          const nip = String(row.NIP || row.nip || row.Nip || '').trim();
          const nama = String(row.Nama || row.nama || row['Nama Lengkap'] || '').trim();
          const mapel = String(row['Mata Pelajaran'] || row.mapel || row.Mapel || 'Lainnya').trim();
          const jabatan = String(row.Jabatan || row.jabatan || 'Guru').trim();

          // Validation
          if (!nip || !nama) {
            result.invalidCount++;
            result.errors.push(`Baris ${rowNum}: Kolom NIP atau Nama kosong.`);
            return;
          }

          if (nip.length < 5) {
            result.invalidCount++;
            result.errors.push(`Baris ${rowNum}: NIP "${nip}" terlalu pendek.`);
            return;
          }

          // Duplicate checks
          if (seenNipsInFile.has(nip)) {
            result.duplicateCount++;
            result.errors.push(`Baris ${rowNum}: NIP "${nip}" duplikat dalam file.`);
            return;
          }

          if (existingNips.has(nip)) {
            result.duplicateCount++;
            result.errors.push(`Baris ${rowNum}: NIP "${nip}" sudah terdaftar di database.`);
            return;
          }

          seenNipsInFile.add(nip);

          const newTeacher: Teacher = {
            id: 'T-' + Math.random().toString(36).substr(2, 9),
            nip,
            nama,
            mapel,
            jabatan,
            qrCode: nip // Use NIP as QR code
          };

          result.importedData.push(newTeacher);
          result.successCount++;
        });

        resolve(result);
      } catch (error: any) {
        reject(new Error(`Gagal membaca file Excel/CSV: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Export attendance records to Excel matching requested Spreadsheet format:
 * - Nomor, Tanggal, Jam Masuk, Nama, Status (Siswa/Guru/Tamu), NISN/NIP, Kelas, Keperluan, Petugas
 */
export function exportAttendanceToExcel(attendance: Attendance[], filename = 'Laporan_Presensi_SMAN_1_Banjarsari.xlsx') {
  // Map our data to rows
  const rows = attendance.map((item, index) => ({
    'Nomor': index + 1,
    'Tanggal': item.tanggal,
    'Jam Masuk': item.jam,
    'Nama': item.nama,
    'Status (Siswa/Guru/Tamu)': item.kategori,
    'NISN/NIP/HP': item.identifier,
    'Kelas/Mapel': item.kelas,
    'Keperluan': item.keperluan,
    'Petugas': item.petugas
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Absensi Presensi');

  // Set column widths dynamically
  const wscols = [
    { wch: 8 },  // Nomor
    { wch: 15 }, // Tanggal
    { wch: 12 }, // Jam Masuk
    { wch: 30 }, // Nama
    { wch: 15 }, // Status
    { wch: 25 }, // ID
    { wch: 20 }, // Kelas
    { wch: 35 }, // Keperluan
    { wch: 25 }  // Petugas
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, filename);
}

/**
 * Export student data master
 */
export function exportStudentsToExcel(students: Student[], filename = 'Data_Master_Siswa_SMAN_1_Banjarsari.xlsx') {
  const rows = students.map((item, index) => ({
    'No': index + 1,
    'NISN': item.nisn,
    'Nama Lengkap': item.nama,
    'Kelas': item.kelas,
    'Jenis Kelamin': item.jk === 'L' ? 'Laki-laki' : 'Perempuan',
    'Status Aktif': item.active ? 'Aktif' : 'Non-aktif'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export teacher data master
 */
export function exportTeachersToExcel(teachers: Teacher[], filename = 'Data_Master_Guru_SMAN_1_Banjarsari.xlsx') {
  const rows = teachers.map((item, index) => ({
    'No': index + 1,
    'NIP': item.nip,
    'Nama': item.nama,
    'Mata Pelajaran': item.mapel,
    'Jabatan': item.jabatan
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Guru');
  XLSX.writeFile(workbook, filename);
}
