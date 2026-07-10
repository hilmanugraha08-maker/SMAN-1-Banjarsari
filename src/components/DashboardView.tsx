import React, { useState, useMemo } from 'react';
import { Users, UserCheck, GraduationCap, FileText, ArrowUpRight, TrendingUp, BookOpen, Clock, Activity, Award } from 'lucide-react';
import { Attendance, Student, Teacher } from '../types';
import { getStudents, getTeachers } from '../utils/db';

interface DashboardViewProps {
  attendanceList: Attendance[];
  onNavigateToAbsensi: () => void;
}

export default function DashboardView({ attendanceList, onNavigateToAbsensi }: DashboardViewProps) {
  const [chartPeriod, setChartPeriod] = useState<'harian' | 'mingguan'>('harian');

  const students = useMemo(() => getStudents(), [attendanceList]);
  const teachers = useMemo(() => getTeachers(), [attendanceList]);

  // Today's date in string format YYYY-MM-DD
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, [attendanceList]);

  // Filters for today's data
  const todayRecords = useMemo(() => {
    return attendanceList.filter((r) => r.tanggal === todayStr);
  }, [attendanceList, todayStr]);

  // Metrics calculation
  const stats = useMemo(() => {
    const totalToday = todayRecords.length;
    const siswaToday = todayRecords.filter((r) => r.kategori === 'Siswa').length;
    const guruToday = todayRecords.filter((r) => r.kategori === 'Guru').length;
    const tamuToday = todayRecords.filter((r) => r.kategori === 'Tamu').length;
    
    // Average visits calculation over database
    const uniqueDays = Array.from(new Set(attendanceList.map((r) => r.tanggal)));
    const totalOverall = attendanceList.length;
    const avgPerDay = uniqueDays.length > 0 ? Math.round(totalOverall / uniqueDays.length) : 0;

    return {
      totalToday,
      siswaToday,
      guruToday,
      tamuToday,
      avgPerDay
    };
  }, [todayRecords, attendanceList]);

  // Last 5 Visitors
  const recentVisitors = useMemo(() => {
    return attendanceList.slice(0, 5);
  }, [attendanceList]);

  // Class / Mapel analysis for leaderboard
  const topClasses = useMemo(() => {
    const classCounts: Record<string, number> = {};
    attendanceList
      .filter((r) => r.kategori === 'Siswa' && r.kelas)
      .forEach((r) => {
        classCounts[r.kelas] = (classCounts[r.kelas] || 0) + 1;
      });

    return Object.entries(classCounts)
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [attendanceList]);

  // Most active teachers
  const topTeachers = useMemo(() => {
    const teacherCounts: Record<string, number> = {};
    attendanceList
      .filter((r) => r.kategori === 'Guru')
      .forEach((r) => {
        teacherCounts[r.nama] = (teacherCounts[r.nama] || 0) + 1;
      });

    return Object.entries(teacherCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [attendanceList]);

  // Prepare chart data for last 7 days
  const last7DaysChartData = useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    return dates.map((dateStr) => {
      const recordsOnDate = attendanceList.filter((r) => r.tanggal === dateStr);
      const siswa = recordsOnDate.filter((r) => r.kategori === 'Siswa').length;
      const guru = recordsOnDate.filter((r) => r.kategori === 'Guru').length;
      const tamu = recordsOnDate.filter((r) => r.kategori === 'Tamu').length;
      
      const parsedDate = new Date(dateStr);
      const label = parsedDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

      return {
        dateStr,
        label,
        siswa,
        guru,
        tamu,
        total: recordsOnDate.length
      };
    });
  }, [attendanceList]);

  // Prepare hourly statistics for today
  const todayHourlyChartData = useMemo(() => {
    // 07:00 to 16:00 (library hours)
    const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    
    return hours.map((hour) => {
      const recordsInHour = todayRecords.filter((r) => {
        const itemHour = parseInt(r.jam.split(':')[0], 10);
        return itemHour === hour;
      });
      return {
        label: `${String(hour).padStart(2, '0')}:00`,
        count: recordsInHour.length
      };
    });
  }, [todayRecords]);

  const maxWeeklyCount = useMemo(() => {
    const max = Math.max(...last7DaysChartData.map((d) => d.total));
    return max > 0 ? max : 10;
  }, [last7DaysChartData]);

  const maxHourlyCount = useMemo(() => {
    const max = Math.max(...todayHourlyChartData.map((d) => d.count));
    return max > 0 ? max : 5;
  }, [todayHourlyChartData]);

  return (
    <div className="space-y-6" id="dashboard-view">
      
      {/* Banner / Welcome */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="space-y-0.5 text-center md:text-left">
          <h2 className="text-base font-bold font-display text-slate-800 flex items-center justify-center md:justify-start gap-1.5">
            Selamat Datang di Portal Presensi Perpustakaan! 👋
          </h2>
          <p className="text-xs text-slate-500 font-sans">
            Mencatat kehadiran secara instan, mengelola kartu anggota QR Code, dan sinkronisasi real-time.
          </p>
        </div>
        <button
          onClick={onNavigateToAbsensi}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition-all shadow-sm cursor-pointer w-full md:w-auto justify-center"
          id="btn-goto-absensi"
        >
          <UserCheck className="w-4 h-4" />
          <span>Buka Menu Absensi Sekarang</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" id="stats-grid">
        
        {/* Total Today */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/60 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pengunjung Hari Ini</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800">{stats.totalToday}</span>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">Rata-rata: {stats.avgPerDay}/hari</p>
          </div>
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-md group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Siswa Today */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/60 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Siswa Hadir</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800">{stats.siswaToday}</span>
              <span className="text-[10px] text-slate-400">
                {stats.totalToday > 0 ? Math.round((stats.siswaToday / stats.totalToday) * 100) : 0}% porsi
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">Terdaftar: {students.length} Siswa</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-md group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        {/* Guru Today */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/60 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-amber-200 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guru Hadir</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800">{stats.guruToday}</span>
              <span className="text-[10px] text-slate-400">
                {stats.totalToday > 0 ? Math.round((stats.guruToday / stats.totalToday) * 100) : 0}% porsi
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">Terdaftar: {teachers.length} Guru</p>
          </div>
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-md group-hover:scale-105 transition-transform">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Tamu Today */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/60 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tamu / Umum</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800">{stats.tamuToday}</span>
              <span className="text-[10px] text-slate-400">Pihak luar</span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">Buku tamu terpisah</p>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-md group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Grid: Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="charts-and-recent-grid">
        
        {/* Charts Column (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm">
            
            {/* Chart Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Grafik Kunjungan Perpustakaan
                </h3>
                <p className="text-[10px] text-slate-400 font-sans">Visualisasi dinamika statistik pengunjung aktif</p>
              </div>
              
              <div className="flex bg-slate-100 p-0.5 rounded text-[11px] font-semibold">
                <button
                  onClick={() => setChartPeriod('harian')}
                  className={`px-2 py-1 rounded transition-all cursor-pointer ${
                    chartPeriod === 'harian' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Hari Ini (Jam)
                </button>
                <button
                  onClick={() => setChartPeriod('mingguan')}
                  className={`px-2 py-1 rounded transition-all cursor-pointer ${
                    chartPeriod === 'mingguan' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  7 Hari Terakhir
                </button>
              </div>
            </div>

            {/* Simulated but beautiful pure responsive CSS Bar Charts */}
            {chartPeriod === 'harian' ? (
              <div className="space-y-4">
                {/* Today's Peak Hours Chart */}
                <div className="h-64 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-100">
                  {todayHourlyChartData.map((d, idx) => {
                    const pct = maxHourlyCount > 0 ? (d.count / maxHourlyCount) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-mono whitespace-nowrap">
                          {d.count} pengunjung
                        </div>

                        {/* Bar */}
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-t-md transition-all ease-out duration-500 group-hover:scale-x-105"
                          style={{ height: `${Math.max(pct, 4)}%` }} // At least 4% for visibility
                        >
                          {d.count > 0 && (
                            <span className="block text-center text-[10px] text-white font-bold pt-1 font-mono">
                              {d.count}
                            </span>
                          )}
                        </div>

                        {/* Label */}
                        <span className="text-[10px] text-slate-400 font-mono mt-2 transform -rotate-45 sm:rotate-0 origin-top pt-1 truncate">
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center pt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Grafik menunjukkan statistik jumlah kehadiran pengunjung per jam pelajaran hari ini.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Last 7 Days Stacked Bar Chart */}
                <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100">
                  {last7DaysChartData.map((d, idx) => {
                    const totalPct = maxWeeklyCount > 0 ? (d.total / maxWeeklyCount) * 100 : 0;
                    const siswaPct = d.total > 0 ? (d.siswa / d.total) * 100 : 0;
                    const guruPct = d.total > 0 ? (d.guru / d.total) * 100 : 0;
                    const tamuPct = d.total > 0 ? (d.tamu / d.total) * 100 : 0;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-sans text-left space-y-0.5">
                          <p className="font-bold border-b border-slate-700 pb-1 mb-1">{d.dateStr}</p>
                          <p className="flex justify-between gap-4"><span>Siswa:</span> <span className="font-mono font-bold">{d.siswa}</span></p>
                          <p className="flex justify-between gap-4"><span>Guru:</span> <span className="font-mono font-bold">{d.guru}</span></p>
                          <p className="flex justify-between gap-4"><span>Tamu:</span> <span className="font-mono font-bold">{d.tamu}</span></p>
                          <p className="flex justify-between gap-4 border-t border-slate-700 pt-1 mt-1 font-semibold text-blue-300">
                            <span>Total:</span> <span className="font-mono">{d.total}</span>
                          </p>
                        </div>

                        {/* Stacked Bar container */}
                        <div 
                          className="w-full flex flex-col justify-end rounded-t-md overflow-hidden transition-all ease-out duration-500 group-hover:scale-x-105"
                          style={{ height: `${Math.max(totalPct, 5)}%` }}
                        >
                          {/* Tamu section */}
                          {d.tamu > 0 && (
                            <div className="bg-indigo-400 hover:bg-indigo-500" style={{ height: `${tamuPct}%` }} title="Tamu" />
                          )}
                          {/* Guru section */}
                          {d.guru > 0 && (
                            <div className="bg-amber-400 hover:bg-amber-500" style={{ height: `${guruPct}%` }} title="Guru" />
                          )}
                          {/* Siswa section */}
                          {d.siswa > 0 && (
                            <div className="bg-blue-500 hover:bg-blue-600" style={{ height: `${siswaPct}%` }} title="Siswa" />
                          )}
                          {/* Fallback minimum bar if total is 0 */}
                          {d.total === 0 && <div className="bg-slate-100 h-1.5 w-full rounded-t" />}
                        </div>

                        {/* Label */}
                        <span className="text-[10px] text-slate-500 font-sans mt-2 text-center leading-tight">
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Legends */}
                <div className="flex justify-center gap-4 pt-2 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 font-sans">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> Siswa
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 font-sans">
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm"></span> Guru
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 font-sans">
                    <span className="w-2.5 h-2.5 bg-indigo-400 rounded-sm"></span> Tamu
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Leaders Column (1/3 width on desktop) */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-4">
            
            {/* Leaderboard Header */}
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <Award className="w-4 h-4 text-amber-500" />
                Statistik Teraktif
              </h3>
              <p className="text-[10px] text-slate-400 font-sans">Kelas dan guru teraktif berkunjung</p>
            </div>

            {/* Top Classes */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kelas Paling Aktif</h4>
              {topClasses.length > 0 ? (
                <div className="space-y-1.5">
                  {topClasses.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-2">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-800' : 
                          idx === 1 ? 'bg-slate-200 text-slate-800' : 
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">{item.className}</span>
                      </div>
                      <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                        {item.count} kunjungan
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-[10px] text-slate-400 italic bg-slate-50 rounded">
                  Belum ada rekaman absensi siswa
                </div>
              )}
            </div>

            {/* Top Teachers */}
            <div className="space-y-2 pt-1">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Guru Teraktif</h4>
              {topTeachers.length > 0 ? (
                <div className="space-y-1.5">
                  {topTeachers.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-2 truncate max-w-[70%]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span className="text-xs font-semibold text-slate-700 truncate" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                        {item.count}x
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-[10px] text-slate-400 italic bg-slate-50 rounded">
                  Belum ada rekaman absensi guru
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Recent Visitors Table/List */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm" id="recent-visitors-section">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <Clock className="w-4 h-4 text-blue-600" />
              Presensi Pengunjung Terakhir (Live Feed)
            </h3>
            <p className="text-[10px] text-slate-400 font-sans">Siswa, guru, dan tamu yang baru saja melakukan absensi masuk</p>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            LIVE SYNC
          </span>
        </div>

        {recentVisitors.length > 0 ? (
          <div className="overflow-x-auto rounded border border-slate-100">
            <table className="w-full text-left border-collapse" id="tbl-recent-visitors">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2 px-3">Waktu</th>
                  <th className="py-2 px-3">Nama</th>
                  <th className="py-2 px-3">Status / Peran</th>
                  <th className="py-2 px-3">NISN/NIP/HP</th>
                  <th className="py-2 px-3">Kelas / Instansi</th>
                  <th className="py-2 px-3">Keperluan</th>
                  <th className="py-2 px-3">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentVisitors.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 px-3 font-mono text-[10px] text-slate-500">
                      <div className="font-semibold text-slate-700 leading-none">{item.jam}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{item.tanggal}</div>
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-800">{item.nama}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold font-mono uppercase ${
                        item.kategori === 'Siswa' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        item.kategori === 'Guru' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-purple-50 text-purple-700 border border-purple-100'
                      }`}>
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{item.identifier}</td>
                    <td className="py-2 px-3 text-slate-600 font-medium">{item.kelas || '-'}</td>
                    <td className="py-2 px-3 text-slate-600 text-[11px] italic max-w-[150px] truncate" title={item.keperluan}>
                      {item.keperluan}
                    </td>
                    <td className="py-2 px-3 text-slate-400">{item.petugas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded border border-dashed border-slate-200">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">Belum Ada Absensi Terdaftar</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Lakukan scan QR Code atau input manual di menu absensi untuk melihat pembaruan data.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
