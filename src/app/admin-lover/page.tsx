'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubmissionPayload } from '@/types/surprise';

export default function AdminLoverPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionPayload[]>([]);

  // ดึงข้อมูลจาก API (Supabase) เท่านั้น
  const loadAllSubmissions = async (currentPin: string) => {
    try {
      const res = await fetch('/api/submissions', {
        headers: { 'x-admin-pin': currentPin },
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.submissions)) {
          setSubmissions(json.submissions);
          return;
        }
      }
      setSubmissions([]); // ถ้าไม่มีข้อมูลให้เป็น Array ว่าง
    } catch {
      setSubmissions([]); // กรณี API ล่ม หรือต่อ Database ไม่ติด
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '1403' || pin.trim().toLowerCase() === 'love') {
      setError('');
      setUnlocked(true);
      await loadAllSubmissions(pin.trim());
    } else {
      setError('รหัสผ่านไม่ถูกต้อง (ใส่ 1403 หรือ love)');
    }
  };

  const handleDelete = async (idx: number, id: string) => {
    // ลบออกจากหน้าจอก่อนเพื่อให้ UI ตอบสนองทันที
    const updated = submissions.filter((_, i) => i !== idx);
    setSubmissions(updated);
    
    // TODO: สร้าง API สำหรับลบข้อมูลใน Supabase จริงๆ แล้วเปิดใช้โค้ดด้านล่างนี้
    /*
    try {
      await fetch(`/api/submissions/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': pin },
      });
    } catch (err) {
      console.error('Failed to delete from Supabase', err);
    }
    */
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(submissions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'partner-bouquet-submissions.json';
    a.click();
  };

  useEffect(() => {
    if (unlocked) loadAllSubmissions(pin);
  }, [unlocked, pin]);

  const avgLove = submissions.length
    ? Math.round(submissions.reduce((acc, s) => acc + Number(s.love_score || 100), 0) / submissions.length)
    : 0;
  const totalDodges = submissions.reduce(
    (acc, s) => acc + Number(s.responses?.dodgeCount || 0),
    0
  );

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 py-10 flex items-center justify-center">
      <div className="glass-card rounded-3xl p-5 sm:p-8 w-full space-y-6">
        {!unlocked ? (
          <div className="max-w-sm mx-auto py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-stone-800 text-white flex items-center justify-center text-2xl mx-auto shadow-md">
              🔐
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-800">Hidden Lover Admin Dashboard</h1>
              <p className="text-xs text-stone-500 mt-1">
                พื้นที่ลับสำหรับดูคำตอบช่อดอกไม้และข้อความความในใจที่กรอกไว้
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="รหัสผ่าน Admin"
                className="w-full px-4 py-3 rounded-xl bg-white border border-stone-200 text-center text-sm font-semibold tracking-widest focus:border-rose-400 focus:outline-none"
              />
              {error && <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{error}</div>}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs sm:text-sm transition"
              >
                ปลดล็อกหน้าหลังบ้าน 🔓
              </button>
            </form>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-xs text-stone-400 hover:text-stone-600 underline"
            >
              ← กลับสู่หน้าเว็บเซอร์ไพรส์แฟน
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-pink-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 block">
                  /admin-lover • Secret Backoffice
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-stone-800">
                  💌 ตารางสรุปคำตอบ &amp; ช่อดอกไม้จากคนพิเศษ
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={exportJson}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold transition"
                >
                  📥 Export JSON
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition"
                >
                  ← กลับหน้าหลัก
                </button>
              </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-pink-100">
                <div className="text-[11px] text-stone-500 font-medium">จำนวนครั้งที่ส่งคำตอบ</div>
                <div className="text-2xl font-extrabold text-rose-600 mt-1">
                  {submissions.length} รายการ
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
                <div className="text-[11px] text-stone-500 font-medium">ค่าเฉลี่ยระดับความจริงจังในความสัมพันธ์</div>
                <div className="text-2xl font-extrabold text-purple-600 mt-1">{avgLove}%</div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
                <div className="text-[11px] text-stone-500 font-medium">ดอกไม้ยอดฮิตที่เลือก</div>
                <div className="text-lg font-extrabold text-amber-700 mt-1">🌹 กุหลาบ</div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="text-[11px] text-stone-500 font-medium">พยายามกดปุ่ม &ldquo;ไม่ชอบ&rdquo;</div>
                <div className="text-2xl font-extrabold text-emerald-700 mt-1">{totalDodges} ครั้ง</div>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-pink-100 overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-pink-50/70 text-stone-600 text-[11px] uppercase tracking-wider border-b border-pink-100">
                      <th className="p-3.5">ชื่อเล่น &amp; เวลา</th>
                      <th className="p-3.5">คำตอบแบบสอบถาม</th>
                      <th className="p-3.5">รูปแบบช่อดอกไม้ที่เลือก</th>
                      <th className="p-3.5">ที่อยู่</th>
                      <th className="p-3.5">ความในใจ</th>
                      <th className="p-3.5 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-50 text-xs">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-stone-400">
                          ยังไม่มีข้อมูลในระบบ หรือกำลังโหลดข้อมูลจากฐานข้อมูล...
                        </td>
                      </tr>
                    ) : (
                      submissions.map((item, idx) => {
                        const c = item.flower_config?.counts || { rose: 0, sunflower: 0, tulip: 0, daisy: 0 };
                        return (
                          <tr key={item.id || idx} className="hover:bg-pink-50/30 transition align-top">
                            <td className="p-3.5">
                              <div className="font-bold text-rose-600 text-sm">{item.nickname}</div>
                              <div className="text-[11px] text-stone-400 mt-0.5">{item.created_at}</div>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-500 text-[10px] font-semibold border border-pink-100">
                                รหัส: {item.secret_code || '1402'}
                              </span>
                            </td>
                            <td className="p-3.5 space-y-1 text-stone-600">
                              <div>
                                <strong className="text-stone-700">เดทแรก:</strong>{' '}
                                {item.responses?.firstdate}
                              </div>
                              <div>
                                <strong className="text-stone-700">ระดับความจริงจังในความสัมพันธ์:</strong>{' '}
                                <span className="text-rose-500 font-bold">{item.love_score}%</span> (หลบปุ่มไม่ชอบ{' '}
                                {item.responses?.dodgeCount || 0} ครั้ง)
                              </div>
                              <div>
                                <strong className="text-stone-700">วันเกิด:</strong>{' '}
                                {item.responses?.partnerBirthday}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-semibold">
                                  🌹 {c.rose}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
                                  🌻 {c.sunflower}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold">
                                  🌷 {c.tulip}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold">
                                  🌼 {c.daisy}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-stone-300 inline-block"
                                  style={{ backgroundColor: item.flower_config?.wrapperColor || '#FFD1DC' }}
                                />
                                <span>{item.flower_config?.wrapperName || 'Peach Pink'}</span>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="text-[11px] text-stone-500 font-medium">
                                {item.responses?.address || 'ไม่มีข้อมูลที่อยู่'}
                              </div>
                            </td>
                            <td className="p-3.5 max-w-xs">
                              <blockquote className="p-2.5 rounded-xl bg-rose-50/50 border border-pink-100 text-stone-700 italic">
                                &ldquo;{item.secret_message}&rdquo;
                              </blockquote>
                            </td>
                            <td className="p-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDelete(idx, item.id || '')}
                                className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-600"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}