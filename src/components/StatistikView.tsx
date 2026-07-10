import React, { useMemo } from 'react';
import { Award, Users, BookOpen, Clock, BarChart3, TrendingUp, Sparkles, GraduationCap, Calendar, PieChart } from 'lucide-react';
import { Attendance } from '../types';

interface StatistikViewProps {
  attendanceList: Attendance[];
}

export default function StatistikView({ attendanceList }: StatistikViewProps) {
  
  // 1. Top individual visitors (leaderboard)
  const topIndividualVisitors = useMemo(() => {
    const counts: Record<string, { name: string; category: string; count: number; sub: string }> = {};
    attendanceList.forEach(item => {
      const key = `${item.identifier}-${item.nama}`;
      if (!counts[key]) {
        counts[key] = {
          name: item.nama,
          category: item.kategori,
          count: 0,
          sub: item.kelas
        };
      }
      counts[key].count++;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [attendanceList]);

  // 2. Class participation chart
  const classParticipation = useMemo(() => {
    const classCounts: Record<string, number> = {};
    attendanceList
      .filter(r => r.kategori === 'Siswa' && r.kelas)
      .forEach(r => {
        classCounts[r.kelas] = (classCounts[r.kelas] || 0) + 1;
      });

    const sortedClasses = Object.entries(classCounts)
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count);

    const totalStudentVisits = sortedClasses.reduce((sum, item) => sum + item.count, 0);

    return sortedClasses.map(item => ({
      ...item,
      percentage: totalStudentVisits > 0 ? Math.round((item.count / totalStudentVisits) * 100) : 0
    })).slice(0, 6);
  }, [attendanceList]);

  // 3. Visit purposes distribution
  const visitPurposes = useMemo(() => {
    const counts: Record<string, number> = {};
    attendanceList.forEach(item => {
      // Clean purpose
      let purpose = item.keperluan;
      if (purpose.endsWith(' (Tamu)')) {
        purpose = purpose.replace(' (Tamu)', '');
      }
      counts[purpose] = (counts[purpose] || 0) + 1;
    });

    const total = attendanceList.length;

    return Object.entries(counts)
      .map(([purpose, count]) => ({
        purpose,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [attendanceList]);

  // 4. Monthly visits comparison (for current year)
  const monthlyComparison = useMemo(() => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const monthCounts = Array(12).fill(0);
    const currentYear = new Date().getFullYear();

    attendanceList.forEach(item => {
      const date = new Date(item.tanggal);
      if (date.getFullYear() === currentYear) {
        const m = date.getMonth(); // 0-11
        monthCounts[m]++;
      }
    });

    const maxMonthValue = Math.max(...monthCounts, 5);

    return months.map((monthName, idx) => ({
      name: monthName,
      count: monthCounts[idx],
      percentage: Math.round((monthCounts[idx] / maxMonthValue) * 100)
    }));
  }, [attendanceList]);

  // 5. Category Ratios
  const categoryRatios = useMemo(() => {
    const total = attendanceList.length;
    const siswa = attendanceList.filter(r => r.kategori === 'Siswa').length;
    const guru = attendanceList.filter(r => r.kategori === 'Guru').length;
    const tamu = attendanceList.filter(r => r.kategori === 'Tamu').length;

    return {
      siswaPct: total > 0 ? Math.round((siswa / total) * 100) : 0,
      guruPct: total > 0 ? Math.round((guru / total) * 100) : 0,
      tamuPct: total > 0 ? Math.round((tamu / total) * 100) : 0,
      siswa,
      guru,
      tamu
    };
  }, [attendanceList]);

  return (
    <div className="space-y-4" id="statistics-view">
      
      {/* Title */}
      <div className="space-y-0.5">
        <h2 className="text-base font-bold font-display text-slate-800">Statistik Mendalam Perpustakaan</h2>
        <p className="text-xs text-slate-500 font-sans">
          Analisis komprehensif mengenai pola kunjungan siswa, peran guru, keterlibatan kelas, serta tujuan keperluan utama anggota.
        </p>
      </div>

      {/* Ratios Metrics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Category Ratio Doughnut Simulation */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-700 font-display uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-blue-600" /> Rasio Anggota Berkunjung
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">Distribusi persentase kehadiran berdasarkan peranan</p>
          </div>

          <div className="py-2 flex items-center justify-center relative">
            
            {/* Custom Pie Representation */}
            <div className="w-20 h-20 rounded-full border-4 border-slate-100 flex items-center justify-center relative">
              <div className="text-center">
                <span className="text-lg font-bold font-display text-slate-800">{attendanceList.length}</span>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">Masuk</p>
              </div>
            </div>

          </div>

          {/* Ratios distribution lists */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded">
              <span className="flex items-center gap-1 font-sans text-slate-600">
                <span className="w-2 h-2 bg-blue-500 rounded-sm"></span> Siswa ({categoryRatios.siswa})
              </span>
              <span className="font-mono font-bold text-blue-700">{categoryRatios.siswaPct}%</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded">
              <span className="flex items-center gap-1 font-sans text-slate-600">
                <span className="w-2 h-2 bg-amber-400 rounded-sm"></span> Guru ({categoryRatios.guru})
              </span>
              <span className="font-mono font-bold text-amber-700">{categoryRatios.guruPct}%</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded">
              <span className="flex items-center gap-1 font-sans text-slate-600">
                <span className="w-2 h-2 bg-purple-400 rounded-sm"></span> Tamu ({categoryRatios.tamu})
              </span>
              <span className="font-mono font-bold text-purple-700">{categoryRatios.tamuPct}%</span>
            </div>
          </div>
        </div>

        {/* Top Classes progress bars */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-700 font-display uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" /> Partisipasi Kelas Tertinggi
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">Keterlibatan total kelas teraktif di perpustakaan</p>
          </div>

          {classParticipation.length > 0 ? (
            <div className="space-y-2 pt-1">
              {classParticipation.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-slate-700 font-bold">{item.className}</span>
                    <span className="text-slate-500 font-mono">{item.count} check-in ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-[11px] text-slate-400 italic">
              Data absensi belum mencukupi untuk memetakan grafik kelas.
            </div>
          )}
        </div>

        {/* Most common visit purposes */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-700 font-display uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Analisis Tujuan Kunjungan
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">Keperluan utama yang paling sering diajukan</p>
          </div>

          {visitPurposes.length > 0 ? (
            <div className="space-y-2 pt-1">
              {visitPurposes.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-slate-700 truncate max-w-[70%]" title={item.purpose}>{item.purpose}</span>
                    <span className="text-slate-500 font-mono shrink-0">{item.count}x ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-[11px] text-slate-400 italic">
              Data absensi belum mencukupi untuk memetakan alasan keperluan.
            </div>
          )}
        </div>

      </div>

      {/* Monthly chart & Top visitor Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Monthly visits (8 cols) */}
        <div className="lg:col-span-8 bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-700 font-display uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> Grafik Kunjungan Bulanan ({new Date().getFullYear()})
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">Kalkulasi akumulasi jumlah kunjungan sepanjang tahun berjalan</p>
          </div>

          {/* Monthly grid vertical bars simulation */}
          <div className="h-40 flex items-end justify-between gap-1.5 pt-4 px-2 border-b border-slate-100">
            {monthlyComparison.map((month, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-mono whitespace-nowrap">
                  {month.count} kunjungan
                </div>

                {/* Vertical Bar */}
                <div 
                  className="w-full bg-blue-500/80 hover:bg-blue-600 rounded-t-sm transition-all ease-out duration-700"
                  style={{ height: `${Math.max(month.percentage, 3)}%` }} // At least 3% height
                />

                {/* Bottom Abbreviated Month Label */}
                <span className="text-[9px] text-slate-400 font-mono mt-1 transform rotate-90 sm:rotate-0 pt-0.5">
                  {month.name.substring(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Visitors Leaderboard (4 cols) */}
        <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-700 font-display uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" /> Pengunjung Teraktif
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">Buku rekor pengunjung paling sering check-in</p>
          </div>

          {topIndividualVisitors.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {topIndividualVisitors.map((v, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center space-x-2 truncate max-w-[70%]">
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      idx === 0 ? 'bg-amber-100 text-amber-800' :
                      idx === 1 ? 'bg-slate-200 text-slate-800' :
                      idx === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="truncate text-left">
                      <p className="text-xs font-bold text-slate-800 truncate" title={v.name}>{v.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">{v.category} - {v.sub}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                    {v.count}x
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-[11px] text-slate-400 italic">
              Belum ada data kunjungan terdaftar.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
