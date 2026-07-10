import React, { useState, useMemo } from 'react';
import { Calendar, Search, Filter, FileSpreadsheet, Download, Printer, Users, RefreshCw, FileText, ChevronDown } from 'lucide-react';
import { Attendance } from '../types';
import { exportAttendanceToExcel } from '../utils/excel';

interface LaporanViewProps {
  attendanceList: Attendance[];
}

export default function LaporanView({ attendanceList }: LaporanViewProps) {
  // General filters
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | 'Siswa' | 'Guru' | 'Tamu'>('Semua');
  
  // Date Presets
  const [datePreset, setDatePreset] = useState<'hari' | 'minggu' | 'bulan' | 'tahun' | 'kustom'>('hari');
  
  // Custom Date range
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Text search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Class specific filter
  const [classFilter, setClassFilter] = useState('Semua');

  // Extract unique classes dynamically for the class dropdown
  const availableClasses = useMemo(() => {
    const classes = attendanceList
      .filter(r => r.kategori === 'Siswa' && r.kelas)
      .map(r => r.kelas);
    return ['Semua', ...Array.from(new Set(classes))];
  }, [attendanceList]);

  // CORE FILTER LOGIC
  const filteredRecords = useMemo(() => {
    let result = [...attendanceList];

    // 1. Kategori filter
    if (categoryFilter !== 'Semua') {
      result = result.filter(r => r.kategori === categoryFilter);
    }

    // 2. Class filter (only applies to siswa or if selected)
    if (classFilter !== 'Semua') {
      result = result.filter(r => r.kelas === classFilter);
    }

    // 3. Search query (matches name, ID, purpose, or petugas)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(r => 
        r.nama.toLowerCase().includes(q) || 
        r.identifier.includes(q) || 
        r.keperluan.toLowerCase().includes(q) ||
        r.petugas.toLowerCase().includes(q)
      );
    }

    // 4. Date filter
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (datePreset === 'hari') {
      result = result.filter(r => r.tanggal === todayStr);
    } else if (datePreset === 'minggu') {
      // Last 7 days
      const limit = new Date();
      limit.setDate(limit.getDate() - 7);
      result = result.filter(r => new Date(r.tanggal) >= limit);
    } else if (datePreset === 'bulan') {
      // Current month
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-11
      result = result.filter(r => {
        const itemDate = new Date(r.tanggal);
        return itemDate.getFullYear() === currentYear && itemDate.getMonth() === currentMonth;
      });
    } else if (datePreset === 'tahun') {
      // Current year
      const currentYear = now.getFullYear();
      result = result.filter(r => new Date(r.tanggal).getFullYear() === currentYear);
    } else if (datePreset === 'kustom') {
      result = result.filter(r => {
        const d = r.tanggal;
        return d >= startDate && d <= endDate;
      });
    }

    return result;
  }, [attendanceList, categoryFilter, classFilter, searchQuery, datePreset, startDate, endDate]);

  // Export handlers
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data laporan yang cocok untuk diekspor!');
      return;
    }
    exportAttendanceToExcel(filteredRecords, `Laporan_Absensi_SMAN1Banjarsari_${datePreset}.xlsx`);
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data laporan untuk diekspor!');
      return;
    }

    // Headers exactly as requested: Nomor, Tanggal, Jam Masuk, Nama, Status, NISN/NIP/HP, Kelas, Keperluan, Petugas
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Nomor,Tanggal,Jam Masuk,Nama,Status,NISN/NIP/HP,Kelas/Mapel,Keperluan,Petugas\n';

    filteredRecords.forEach((item, index) => {
      const row = [
        index + 1,
        item.tanggal,
        item.jam,
        `"${item.nama.replace(/"/g, '""')}"`,
        item.kategori,
        `"${item.identifier}"`,
        `"${item.kelas}"`,
        `"${item.keperluan.replace(/"/g, '""')}"`,
        `"${item.petugas.replace(/"/g, '""')}"`
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Presensi_SMAN1_Banjarsari_${datePreset}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-4" id="reports-view">
      
      {/* Printable page layout adjustments */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area-reports, #print-area-reports * {
            visibility: visible;
          }
          #print-area-reports {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print-element {
            display: none !important;
          }
        }
      `}} />

      {/* Title */}
      <div className="space-y-0.5 no-print-element">
        <h2 className="text-base font-bold font-display text-slate-800">Laporan Absensi Kunjungan</h2>
        <p className="text-xs text-slate-500 font-sans">
          Saring rekaman kehadiran berdasarkan kategori, status, kelas, dan rentang waktu. Ekspor laporan Anda dalam format Excel, PDF, atau Spreadsheet.
        </p>
      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-4 no-print-element" id="filters-panel">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          Filter Laporan Kunjungan Perpustakaan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Preset Date selector */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Rentang Waktu</label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as any)}
              className="block w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 text-slate-700"
            >
              <option value="hari">Hari Ini</option>
              <option value="minggu">Minggu Ini (7 Hari Terakhir)</option>
              <option value="bulan">Bulan Ini</option>
              <option value="tahun">Tahun Ini</option>
              <option value="kustom">Rentang Tanggal Kustom</option>
            </select>
          </div>

          {/* Category Selector */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Kategori Anggota</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as any);
                setClassFilter('Semua'); // reset class if not student
              }}
              className="block w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 text-slate-700"
            >
              <option value="Semua">Semua Pengunjung</option>
              <option value="Siswa">Siswa</option>
              <option value="Guru">Guru</option>
              <option value="Tamu">Tamu</option>
            </select>
          </div>

          {/* Class Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Kelas (Siswa)</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              disabled={categoryFilter !== 'Semua' && categoryFilter !== 'Siswa'}
              className={`block w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-700 ${
                categoryFilter !== 'Semua' && categoryFilter !== 'Siswa' ? 'bg-slate-100 cursor-not-allowed text-slate-400' : 'bg-slate-50'
              }`}
            >
              {availableClasses.map((cl, i) => (
                <option key={i} value={cl}>{cl}</option>
              ))}
            </select>
          </div>

          {/* Text Search filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Kata Kunci Cari</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                <Search className="w-3 h-3" />
              </span>
              <input
                type="text"
                placeholder="Cari nama, ID, keperluan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-7 pr-2.5 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 text-slate-700"
              />
            </div>
          </div>

        </div>

        {/* Custom date row inputs (Show only if 'kustom' preset selected) */}
        {datePreset === 'kustom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded border border-slate-200/50 animate-fadeIn">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600">Mulai Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full px-2.5 py-1 border border-slate-200 rounded text-xs text-slate-700 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600">Hingga Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full px-2.5 py-1 border border-slate-200 rounded text-xs text-slate-700 bg-white"
              />
            </div>
          </div>
        )}

      </div>

      {/* Printable Area - Table of results */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-3" id="print-area-reports">
        
        {/* Reports Header (Visible when printed) */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold font-display text-slate-800">
              Laporan Presensi Perpustakaan SMAN 1 Banjarsari
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Periode Laporan: <span className="font-semibold text-slate-600 capitalize">{datePreset === 'kustom' ? `${startDate} s.d ${endDate}` : datePreset}</span> | 
              Kategori: <span className="font-semibold text-slate-600">{categoryFilter}</span> | 
              Kelas: <span className="font-semibold text-slate-600">{classFilter}</span>
            </p>
          </div>

          {/* Export / Print Buttons (Hidden during printing) */}
          <div className="flex gap-1.5 no-print-element">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-xs font-bold border border-slate-200 transition-all cursor-pointer"
              title="Unduh format CSV/Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Spreadsheet</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-xs font-bold border border-slate-200 transition-all cursor-pointer"
              title="Unduh file Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Unduh Excel</span>
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Cetak Laporan / Cetak PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Records list table */}
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto rounded border border-slate-200/60">
            <table className="w-full text-left border-collapse" id="tbl-laporan-presensi">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                  <th className="py-1.5 px-3 w-10 text-center">No</th>
                  <th className="py-1.5 px-3">Tanggal</th>
                  <th className="py-1.5 px-3">Jam Masuk</th>
                  <th className="py-1.5 px-3">Nama</th>
                  <th className="py-1.5 px-3">Status</th>
                  <th className="py-1.5 px-3">NISN / NIP / HP</th>
                  <th className="py-1.5 px-3">Kelas / Mapel</th>
                  <th className="py-1.5 px-3">Keperluan</th>
                  <th className="py-1.5 px-3">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-1.5 px-3 text-center font-mono text-[11px] text-slate-400">{index + 1}</td>
                    <td className="py-1.5 px-3 font-mono text-[11px] text-slate-600">{item.tanggal}</td>
                    <td className="py-1.5 px-3 font-mono text-[11px] text-slate-600">{item.jam}</td>
                    <td className="py-1.5 px-3 font-bold text-slate-800">{item.nama}</td>
                    <td className="py-1.5 px-3">
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        item.kategori === 'Siswa' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        item.kategori === 'Guru' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-purple-50 text-purple-700 border border-purple-100'
                      }`}>
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 font-mono text-[11px] text-slate-500">{item.identifier}</td>
                    <td className="py-1.5 px-3 text-slate-600 font-medium">{item.kelas || '-'}</td>
                    <td className="py-1.5 px-3 text-slate-500 text-[11px] italic max-w-[180px] truncate" title={item.keperluan}>
                      {item.keperluan}
                    </td>
                    <td className="py-1.5 px-3 text-slate-400 text-[11px]">{item.petugas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded border border-dashed border-slate-200">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">Tidak ada data presensi cocok</p>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto font-sans">
              Tidak ada rekaman absensi yang sesuai dengan kriteria penyaringan filter di atas. Harap ubah kriteria tanggal atau kata kunci Anda.
            </p>
          </div>
        )}

        {/* Counter footer indicator */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-500 font-sans">
          <div>
            Total data tersaring: <span className="font-bold text-slate-800">{filteredRecords.length}</span> baris absensi.
          </div>
          <div className="italic">
            Perpustakaan SMAN 1 Banjarsari @ {new Date().getFullYear()}
          </div>
        </div>

      </div>

    </div>
  );
}
