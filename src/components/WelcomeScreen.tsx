'use client';

import React, { useState } from 'react';

interface WelcomeScreenProps {
  defaultNickname?: string;
  defaultCode?: string;
  onPlaySound?: (type: 'pop' | 'boing' | 'sparkle') => void;
  onShowToast?: (msg: string) => void;
  onUnlock: (nickname: string, secretCode: string) => void;
}

export default function WelcomeScreen({
  defaultNickname = ' ',
  defaultCode = ' ',
  onPlaySound,
  onShowToast,
  onUnlock,
}: WelcomeScreenProps) {
  const [nickname, setNickname] = useState(defaultNickname);
  const [secretCode, setSecretCode] = useState(defaultCode);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('บอกชื่อเล่นน่ารักๆ ให้เค้าชื่นใจก่อนน้า 🥺');
      return;
    }
    setError('');
    onUnlock(nickname.trim(), secretCode.trim() || '3009');
  };

  return (
    <section className="w-full max-w-md mx-auto">
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-pink-200/35 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-purple-200/35 blur-2xl pointer-events-none" />

        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-200 via-pink-100 to-purple-100 flex items-center justify-center shadow-inner border border-white pulse-cute">
            <span className="text-4xl">❤️</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-500 border border-pink-200 mb-2.5">
            ✨ อยากรู้ความในใจของเธอ ✨
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 tracking-tight mb-2">
            สำหรับคนน่ารักของเค้า 🌸
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            เค้าตั้งใจทำเว็บนี้ให้เธอเลยนะ มีคำถามที่อยากรู้และก็อยากรู้ความในใจเธอ มีมุมจัดช่อดอกไม้เล่นๆ ที่เธอออกแบบเองได้ด้วย หวังว่าเธอจะสนุกนะ!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              ชื่อเล่นของคนน่ารัก 💕
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="เช่น บี๋, ตัวเล็ก, เหมียว, ที่รัก..."
              className="w-full px-4 py-3 rounded-2xl bg-rose-50/50 border border-pink-200 focus:border-rose-400 focus:bg-white focus:outline-none text-stone-800 text-sm transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                🔒 รหัสผ่านลับระหว่างเรา
              </label>
              <button
                type="button"
                onClick={() => {
                  setSecretCode('3009');
                  onPlaySound?.('pop');
                  onShowToast?.('✨ ใส่รหัสลับ 3009 ให้แล้วน้า');
                }}
                className="text-[11px] text-rose-500 hover:underline font-medium"
              >
                ✨ ใส่รหัส 3009 อัตโนมัติ
              </button>
            </div>
            <input
              type="text"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              placeholder="พิมพ์ 3009 หรือคำว่า love"
              className="w-full px-4 py-3 rounded-2xl bg-purple-50/40 border border-purple-200 focus:border-purple-400 focus:bg-white focus:outline-none text-stone-800 text-sm transition"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 px-3.5 py-2.5 rounded-xl border border-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl pastel-btn font-semibold text-sm flex items-center justify-center gap-2"
          >
            <span>เปิดประตูสู่เซอร์ไพรส์</span>
            <span>➔</span>
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-pink-100/80 flex items-center justify-between text-[11px] text-stone-400">
          {/* <span>💡 รองรับทั้งมือถือและคอมพิวเตอร์</span> */}
          <span>แตะมุมขวาล่าง 5 ครั้งเพื่อเข้า Admin</span>
        </div>
      </div>
    </section>
  );
}