import React, { useState, useMemo } from 'react';
import { QrCode, Search, Printer, Download, UserCheck, CheckSquare, Square, BadgeInfo, CreditCard, Sparkles, User, GraduationCap, ChevronLeft, ArrowRight } from 'lucide-react';
import { Student, Teacher } from '../types';
import { getStudents, getTeachers } from '../utils/db';

export default function QRCodeView() {
  const [activeType, setActiveType] = useState<'siswa' | 'guru'>('siswa');
  const [searchQuery, setSearchQuery] = useState('');
  
  // List selection for batch card printing
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Load active students & teachers
  const students = useMemo(() => getStudents().filter(s => s.active), []);
  const teachers = useMemo(() => getTeachers(), []);

  const listItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (activeType === 'siswa') {
      return students.filter(s => s.nama.toLowerCase().includes(q) || s.nisn.includes(s) || s.kelas.toLowerCase().includes(q));
    } else {
      return teachers.filter(t => t.nama.toLowerCase().includes(q) || t.nip.includes(q) || t.mapel.toLowerCase().includes(q));
    }
  }, [activeType, searchQuery, students, teachers]);

  // Selected single card view
  const [activeDetailItem, setActiveDetailItem] = useState<{
    id: string;
    nama: string;
    identifier: string;
    subinfo: string; // Kelas or Mapel
    jk?: string;
    level: 'Siswa' | 'Guru';
  } | null>(null);

  // Auto-set the first item as default detail view if none selected
  useMemo(() => {
    if (listItems.length > 0 && !activeDetailItem) {
      const first = listItems[0];
      setActiveDetailItem({
        id: first.id,
        nama: first.nama,
        identifier: 'nisn' in first ? first.nisn : first.nip,
        subinfo: 'kelas' in first ? first.kelas : first.mapel,
        jk: 'jk' in first ? first.jk : undefined,
        level: activeType === 'siswa' ? 'Siswa' : 'Guru'
      });
    }
  }, [listItems]);

  const handleSelectItem = (item: any) => {
    setActiveDetailItem({
      id: item.id,
      nama: item.nama,
      identifier: 'nisn' in item ? item.nisn : item.nip,
      subinfo: 'kelas' in item ? item.kelas : item.mapel,
      jk: 'jk' in item ? item.jk : undefined,
      level: activeType === 'siswa' ? 'Siswa' : 'Guru'
    });
  };

  // Toggle selection for bulk print
  const handleToggleSelectAll = () => {
    if (selectedIds.length === listItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(listItems.map(item => item.id));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Generate QR Code URL using public secure Google Charts API / QRServer API
  const getQrUrl = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data)}`;
  };

  // Trigger print logic
  const handlePrintSingle = () => {
    window.print();
  };

  const handlePrintBatch = () => {
    if (selectedIds.length === 0) {
      alert('Pilih minimal satu kartu untuk dicetak massal!');
      return;
    }
    
    // Open a beautifully styled print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up terblokir oleh browser! Mohon izinkan pop-up untuk mencetak kartu.');
      return;
    }

    // Get selected details
    const selectedItems = activeType === 'siswa' 
      ? students.filter(s => selectedIds.includes(s.id)).map(s => ({ nama: s.nama, id: s.nisn, sub: s.kelas, level: 'Siswa' }))
      : teachers.filter(t => selectedIds.includes(t.id)).map(t => ({ nama: t.nama, id: t.nip, sub: t.mapel, level: 'Guru' }));

    let cardsHtml = '';
    selectedItems.forEach(item => {
      cardsHtml += `
        <div class="card-container">
          <div class="card-header">
            <div class="header-logo">📖</div>
            <div class="header-text">
              <h3>KARTU ANGGOTA PERPUSTAKAAN</h3>
              <p>SMAN 1 BANJARSARI</p>
            </div>
          </div>
          <div class="card-body">
            <div class="card-info">
              <table>
                <tr><td>Nama</td><td>: <b>${item.nama}</b></td></tr>
                <tr><td>Status</td><td>: ${item.level}</td></tr>
                <tr><td>ID Anggota</td><td>: <span class="font-mono">${item.id}</span></td></tr>
                <tr><td>${item.level === 'Siswa' ? 'Kelas' : 'Mapel'}</td><td>: ${item.sub}</td></tr>
                <tr><td>Berlaku</td><td>: Selama Aktif</td></tr>
              </table>
            </div>
            <div class="card-qr">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${item.id}" />
              <p>${item.id}</p>
            </div>
          </div>
          <div class="card-footer">
            Harap kartu ini dibawa setiap kali berkunjung ke perpustakaan
          </div>
        </div>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Kartu Anggota Perpustakaan SMAN 1 Banjarsari</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              margin: 20px;
              background: #fff;
              color: #333;
            }
            .grid-print {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .card-container {
              width: 350px;
              height: 220px;
              border: 1.5px solid #2563eb;
              border-radius: 12px;
              padding: 12px;
              background: linear-gradient(135deg, #ffffff 60%, #eff6ff 100%);
              position: relative;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .card-header {
              display: flex;
              align-items: center;
              border-bottom: 1.5px solid #2563eb;
              padding-bottom: 6px;
              margin-bottom: 8px;
            }
            .header-logo {
              font-size: 24px;
              margin-right: 8px;
            }
            .header-text h3 {
              margin: 0;
              font-size: 11px;
              color: #1e3a8a;
              letter-spacing: 0.5px;
            }
            .header-text p {
              margin: 1px 0 0 0;
              font-size: 13px;
              font-weight: bold;
              color: #2563eb;
            }
            .card-body {
              display: flex;
              align-items: center;
              justify-content: space-between;
              flex: 1;
            }
            .card-info {
              flex: 1;
              font-size: 10px;
              color: #4b5563;
            }
            .card-info table {
              width: 100%;
              border-collapse: collapse;
            }
            .card-info td {
              padding: 1.5px 0;
              vertical-align: top;
            }
            .font-mono {
              font-family: monospace;
              font-weight: bold;
            }
            .card-qr {
              text-align: center;
              margin-left: 8px;
            }
            .card-qr img {
              width: 70px;
              height: 70px;
              border: 1px solid #e5e7eb;
              padding: 2px;
              background: #fff;
              border-radius: 4px;
            }
            .card-qr p {
              margin: 2px 0 0 0;
              font-size: 8px;
              font-family: monospace;
              color: #1e3a8a;
              font-weight: bold;
            }
            .card-footer {
              font-size: 8px;
              color: #9ca3af;
              text-align: center;
              border-top: 1px dashed #e5e7eb;
              padding-top: 4px;
              margin-top: 4px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; padding: 10px; background: #f3f4f6; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; font-weight: bold;">Tampilan Siap Cetak (Klik tombol cetak untuk mengirim ke printer)</span>
            <button onclick="window.print();" style="padding: 6px 12px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Cetak Sekarang</button>
          </div>
          <div class="grid-print">
            ${cardsHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4" id="qr-generator-view">
      
      {/* View Title */}
      <div className="space-y-0.5">
        <h2 className="text-base font-bold font-display text-slate-800">Pembuat QR Code & Kartu Anggota</h2>
        <p className="text-xs text-slate-500 font-sans">
          Secara otomatis membuat QR Code unik untuk setiap siswa dan guru terdaftar, mengunduh file, atau mencetak Kartu Anggota perpustakaan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Side: Directory Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-3">
            
            {/* Category selection */}
            <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => { setActiveType('siswa'); setSelectedIds([]); }}
                className={`flex-1 py-1.5 rounded text-xs transition-all cursor-pointer ${
                  activeType === 'siswa' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Siswa ({students.length})
              </button>
              <button
                onClick={() => { setActiveType('guru'); setSelectedIds([]); }}
                className={`flex-1 py-1.5 rounded text-xs transition-all cursor-pointer ${
                  activeType === 'guru' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Guru ({teachers.length})
              </button>
            </div>

            {/* Search filter input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder={`Cari nama ${activeType === 'siswa' ? 'siswa' : 'guru'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-7.5 pr-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded text-xs text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Selection Options (Select All) */}
            <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-1.5 flex-wrap gap-2">
              <button
                onClick={handleToggleSelectAll}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                {selectedIds.length === listItems.length ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    <span>Batalkan Semua ({selectedIds.length})</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    <span>Pilih Semua ({listItems.length})</span>
                  </>
                )}
              </button>
              
              {selectedIds.length > 0 && (
                <button
                  onClick={handlePrintBatch}
                  className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold border border-blue-200 hover:bg-blue-100 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Massal ({selectedIds.length})</span>
                </button>
              )}
            </div>

            {/* Listbox Grid of members */}
            <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
              {listItems.length > 0 ? (
                listItems.map((item) => {
                  const id = item.id;
                  const isSelected = selectedIds.includes(id);
                  const isDetailActive = activeDetailItem?.id === id;
                  const itemCode = 'nisn' in item ? item.nisn : item.nip;
                  const subtext = 'kelas' in item ? item.kelas : item.mapel;

                  return (
                    <div
                      key={id}
                      className={`flex items-center justify-between p-2 rounded border transition-all ${
                        isDetailActive ? 'bg-blue-50/70 border-blue-200' : 'bg-white border-slate-200/60 hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox selector */}
                      <button
                        onClick={() => handleToggleSelectItem(id)}
                        className="p-1 text-slate-400 hover:text-blue-600 mr-1 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      {/* Display Info */}
                      <button
                        onClick={() => handleSelectItem(item)}
                        className="flex-1 text-left cursor-pointer truncate mr-2"
                      >
                        <p className="text-xs font-bold text-slate-800 truncate">{item.nama}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          {itemCode} | {subtext}
                        </p>
                      </button>

                      {/* Detail arrow link indicator */}
                      <button
                        onClick={() => handleSelectItem(item)}
                        className={`p-1 rounded transition-colors ${
                          isDetailActive ? 'bg-blue-100 text-blue-700' : 'text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 italic bg-slate-50 rounded">
                  Tidak ada anggota yang cocok dengan pencarian.
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Side: Library card mockup & actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeDetailItem ? (
            <div className="bg-white p-4 rounded-lg border border-slate-200/60 shadow-sm space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1 font-display">
                  <CreditCard className="w-4 h-4 text-blue-600" /> Pratinjau Kartu Anggota
                </span>
                
                {/* Print/Download button */}
                <div className="flex gap-2">
                  <a
                    href={getQrUrl(activeDetailItem.identifier)}
                    target="_blank"
                    rel="noreferrer"
                    download={`QR_${activeDetailItem.identifier}.png`}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded text-xs font-bold transition-all"
                    title="Unduh file gambar QR Code saja"
                  >
                    <Download className="w-3 h-3" /> QR Code
                  </a>
                  <button
                    onClick={handlePrintSingle}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition-all cursor-pointer"
                    title="Cetak kartu ini saja"
                  >
                    <Printer className="w-3 h-3" /> Cetak Kartu
                  </button>
                </div>
              </div>

              {/* CARD CONTAINER MOCKUP (Beautiful UI Representation!) */}
              <div className="max-w-md mx-auto aspect-[1.58/1] w-full border-2 border-blue-600 rounded-2xl p-4 bg-gradient-to-br from-white via-white to-blue-50/50 shadow-md relative overflow-hidden flex flex-col justify-between" id="library-member-card-mockup">
                
                {/* Embedded style specifically to handle browser layout print scope */}
                <style dangerouslySetInnerHTML={{__html: `
                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    #library-member-card-mockup, #library-member-card-mockup * {
                      visibility: visible;
                    }
                    #library-member-card-mockup {
                      position: absolute;
                      left: 50px;
                      top: 50px;
                      width: 420px;
                      border: 1px solid #2563eb !important;
                      print-color-adjust: exact;
                      -webkit-print-color-adjust: exact;
                    }
                  }
                `}} />

                {/* Decorative background overlay */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-xl pointer-events-none"></div>

                {/* Card Header logo and SMAN 1 name */}
                <div className="flex items-center space-x-2.5 border-b-2 border-blue-600 pb-2.5">
                  <div className="bg-blue-600 text-white p-1.5 rounded-full flex items-center justify-center shadow-inner">
                    <span className="text-sm font-bold leading-none">📖</span>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-blue-900 tracking-wider uppercase leading-none">KARTU ANGGOTA PERPUSTAKAAN</h3>
                    <h2 className="text-sm font-black text-blue-600 mt-0.5 leading-none">SMAN 1 BANJARSARI</h2>
                  </div>
                </div>

                {/* Card Body - Photo placeholder, details, QR Code */}
                <div className="flex items-center justify-between gap-4 flex-1 py-3">
                  
                  {/* Photo & Details column */}
                  <div className="flex items-start gap-3 flex-1">
                    
                    {/* Dummy avatar photo box */}
                    <div className="w-14 h-18 bg-slate-100 rounded-lg border border-slate-200/80 flex flex-col items-center justify-center shrink-0 relative overflow-hidden text-slate-300">
                      <User className="w-8 h-8" />
                      <div className="absolute bottom-0 w-full bg-slate-800/60 text-white text-[7px] text-center uppercase tracking-wide">FOTO</div>
                    </div>

                    {/* Meta info list */}
                    <div className="space-y-1 text-slate-700 flex-1 min-w-0">
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest leading-none">Nama Lengkap</p>
                      <h4 className="text-xs font-extrabold text-slate-800 leading-tight truncate">{activeDetailItem.nama}</h4>
                      
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1.5 text-[10px]">
                        <div>
                          <span className="text-[8px] text-slate-400 block uppercase leading-none">ID Anggota</span>
                          <span className="font-mono font-bold text-slate-800 text-[9px]">{activeDetailItem.identifier}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 block uppercase leading-none">{activeDetailItem.level === 'Siswa' ? 'Kelas' : 'Mapel'}</span>
                          <span className="font-bold text-slate-800 text-[9px]">{activeDetailItem.subinfo}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* QR Code column */}
                  <div className="text-center shrink-0">
                    <div className="bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-center">
                      <img
                        src={getQrUrl(activeDetailItem.identifier)}
                        alt="QR Code"
                        className="w-16 h-16 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="font-mono text-[8px] text-blue-800 font-bold tracking-wider mt-1 block">
                      {activeDetailItem.identifier}
                    </span>
                  </div>

                </div>

                {/* Card Footer notes */}
                <div className="text-[8px] text-slate-400 text-center border-t border-slate-100 pt-1.5 flex items-center justify-between">
                  <span>Berlaku Selama Menjadi Anggota Aktif</span>
                  <span className="font-bold text-blue-600">SMAN 1 Banjarsari</span>
                </div>

              </div>

              {/* Instructions banner */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded flex items-start gap-2.5 text-xs text-amber-900 font-sans leading-relaxed">
                <BadgeInfo className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Panduan Pencetakan:</p>
                  <p>
                    Tekan tombol <b>Cetak Kartu</b> untuk mencetak satu kartu ini saja. Pastikan pengaturan ukuran kertas pada dialog cetak disesuaikan dengan kebutuhan Anda (misal: A4 atau ukuran ID Card khusus).
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white p-8 text-center rounded-lg border border-slate-200/60 shadow-sm">
              <QrCode className="w-12 h-12 text-slate-200 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Pilih salah satu anggota</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Silakan pilih nama siswa atau guru dari daftar sebelah kiri untuk menampilkan pratinjau kartu anggota perpustakaan mereka.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
