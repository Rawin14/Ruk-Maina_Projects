'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import WelcomeScreen from '@/components/WelcomeScreen';
import InteractiveQuiz from '@/components/InteractiveQuiz';
import FlowerBouquet3D from '@/components/FlowerBouquet3D';
import SummarySurprise from '@/components/SummarySurprise';
import { FlowerConfig, QuizResponses } from '@/types/surprise';

export default function HomePage() {
  const router = useRouter();
  const [stage, setStage] = useState<'welcome' | 'quiz' | 'bouquet' | 'summary'>('welcome');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nickname, setNickname] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [bouquetSnapshotUrl, setBouquetSnapshotUrl] = useState('');

  const [responses, setResponses] = useState<QuizResponses>({
    firstdate: '',
    doYouLoveMe: 'รักที่สุดในโลกเลยยย! 💖🥰',
    dodgeCount: 0,
    loveLevel: 0,
    partnerBirthday: '',
    secretMessage: '',
    birthDay: '14',
    address: '',
    birthMonth: 'มิถุนายน',
  });

  const [flowerConfig, setFlowerConfig] = useState<FlowerConfig>({
    counts: { rose: 14, tulip: 0, daisy: 6, sunflower: 3 },
    wrapperColor: '#FFD1DC',
    wrapperName: 'Classic Black',
    ribbonColor: '#FF7597',
    holderStyle: 'wrap',
    address: '',
    cardTheme: 'pink',
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const secretTapCountRef = useRef(0);
  const secretTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2600);
  };

  const playChime = (type: 'pop' | 'boing' | 'sparkle') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current && Ctx) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      if (type === 'pop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.09);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'boing') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.14);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'sparkle') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.07, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.26);
        });
      }
    } catch {
      // Ignore audio errors
    }
  };

  const handleSecretCornerTap = () => {
    secretTapCountRef.current += 1;
    if (secretTapTimerRef.current) clearTimeout(secretTapTimerRef.current);
    secretTapTimerRef.current = setTimeout(() => {
      secretTapCountRef.current = 0;
    }, 2200);

    if (secretTapCountRef.current >= 5) {
      secretTapCountRef.current = 0;
      playChime('sparkle');
      showToast('🔓 เปิดเส้นทางลับ /admin-lover สำเร็จ!');
      router.push('/admin-lover');
    } else if (secretTapCountRef.current >= 3) {
      showToast(`💗 แตะอีก ${5 - secretTapCountRef.current} ครั้งเพื่อเข้าหน้า Admin ลับ`);
    }
  };

  const [hearts, setHearts] = useState<{ left: string; size: string; dur: string; delay: string; icon: string }[]>([]);
  useEffect(() => {
    const icons = ['💗', '🌸', '✨', '🌷', '💕', '🤍', '🌼'];
    setHearts(
      Array.from({ length: 16 }).map((_, i) => ({
        icon: icons[i % icons.length],
        left: `${Math.random() * 96}vw`,
        size: `${14 + Math.random() * 14}px`,
        dur: `${11 + Math.random() * 12}s`,
        delay: `${-Math.random() * 15}s`,
      }))
    );
  }, []);

  return (
    <div className="min-h-screen relative selection:bg-pink-200 selection:text-rose-900">
      {/* Background Floating Hearts */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {hearts.map((h, i) => (
          <span
            key={i}
            className="floating-heart"
            style={{
              left: h.left,
              fontSize: h.size,
              animationDuration: h.dur,
              animationDelay: h.delay,
            }}
          >
            {h.icon}
          </span>
        ))}
      </div>

      {/* Toast Notification */}
      <div
        className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 transform ${
          toastMsg ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <div className="px-4 py-2.5 rounded-2xl bg-stone-800/90 text-white text-xs font-medium shadow-xl backdrop-blur-md flex items-center gap-2">
          {toastMsg}
        </div>
      </div>

      {/* Top Navigation / Story Stepper Header */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-pink-100/80">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              playChime('pop');
              setStage('welcome');
            }}
            className="flex items-center gap-2 text-left group"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-400 to-purple-400 flex items-center justify-center text-white text-sm shadow-sm group-hover:scale-105 transition">
              🌸
            </span>
            <div>
              <span className="font-bold text-sm text-stone-800 block leading-tight">Rak Maina</span>
              <span className="text-[10px] text-rose-400 font-medium block leading-tight">
                Bouquet &amp; Story
              </span>
            </div>
          </button>

          {/* <nav className="hidden md:flex items-center gap-1.5 bg-pink-50/80 p-1 rounded-2xl border border-pink-100">
            {[
              { key: 'welcome', label: '1. ต้อนรับ' },
              { key: 'quiz', label: '2. แบบสอบถาม' },
              { key: 'bouquet', label: '3. จัดดอกไม้ ' },
              { key: 'summary', label: '4. การ์ดสรุป' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  playChime('pop');
                  setStage(item.key as typeof stage);
                }}
                className={`px-3 py-1 rounded-xl text-xs transition ${
                  stage === item.key
                    ? 'font-bold bg-white text-rose-500 shadow-sm'
                    : 'font-medium text-stone-500 hover:text-stone-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav> */}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                showToast(next ? '🔊 เปิดเสียงเอฟเฟกต์แล้ว' : '🔇 ปิดเสียงเอฟเฟกต์แล้ว');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-rose-600 text-xs font-medium border border-pink-200/70 transition flex items-center gap-1"
            >
              <span>{soundEnabled ? '🔊' : '🔇'}</span>
              <span className="hidden sm:inline">{soundEnabled ? 'เสียง' : 'ปิดเสียง'}</span>
            </button>
            {/* <button
              type="button"
              onClick={() => {
                playChime('pop');
                setShowCodeModal(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200/70 transition flex items-center gap-1"
            >
              <span>💻</span>
              <span className="hidden sm:inline">โค้ด &amp; วิธีติดตั้ง</span>
            </button> */}
            <button
              type="button"
              onClick={() => {
                playChime('pop');
                router.push('/admin-lover');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200/80 transition flex items-center gap-1"
            >
              <span>🔐</span>
              <span className="hidden sm:inline">Secret</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-6 sm:py-10 min-h-[calc(100vh-3.5rem)] flex flex-col justify-center">
        {stage === 'welcome' && (
          <WelcomeScreen
            defaultNickname={nickname}
            defaultCode={secretCode}
            onPlaySound={playChime}
            onShowToast={showToast}
            onUnlock={(name, code) => {
              setNickname(name);
              setSecretCode(code);
              playChime('sparkle');
              showToast(`ยินดีต้อนรับนะคุณ ${name} 💖`);
              setStage('quiz');
            }}
          />
        )}

        {stage === 'quiz' && (
          <InteractiveQuiz
            nickname={nickname}
            initialResponses={responses}
            onPlaySound={playChime}
            onShowToast={showToast}
            onBackToWelcome={() => setStage('welcome')}
            onComplete={(ans) => {
              setResponses(ans);
              if (ans.secretMessage) {
                setFlowerConfig((prev) => ({ ...prev, secretMessage: ans.secretMessage }));
              }
              playChime('sparkle');
              setStage('bouquet');
            }}
          />
        )}

        {stage === 'bouquet' && (
          <FlowerBouquet3D
            nickname={nickname}
            config={flowerConfig}
            onChange={(newCfg) => {
              setFlowerConfig(newCfg);
              setResponses((prev) => ({ ...prev, address: newCfg.address }));
            }}
            onPlaySound={playChime}
            onShowToast={showToast}
            onBack={() => setStage('quiz')}
            onFinish={(snapshotDataUrl) => {
              setBouquetSnapshotUrl(snapshotDataUrl);
              playChime('sparkle');
              setStage('summary');
            }}
          />
        )}

        {stage === 'summary' && (
          <SummarySurprise
            payload={{
              nickname,
              secret_code: secretCode,
              responses,
              flower_config: flowerConfig,
              love_score: responses.loveLevel,
              secret_message: responses.secretMessage,
              address_info: flowerConfig.address,
              bouquet_preview_data_url: bouquetSnapshotUrl,
            }}
            onPlaySound={playChime}
            onShowToast={showToast}
            onEditBouquet={() => setStage('bouquet')}
          />
        )}
      </main>

      {/* Secret 5-Tap Corner Heart Button */}
      <button
        type="button"
        onClick={handleSecretCornerTap}
        title="แตะ 5 ครั้งเพื่อเปิดหน้า Admin ลับ"
        className="fixed bottom-3 right-3 z-30 w-9 h-9 rounded-full bg-white/75 hover:bg-white border border-pink-200 shadow-sm flex items-center justify-center text-sm opacity-75 hover:opacity-100 transition select-none"
      >
        💗
      </button>

      {/* SQL & Setup Guide Modal */}
      {showCodeModal && (
        <div
          onClick={() => setShowCodeModal(false)}
          className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-pink-100 overflow-hidden"
          >
            <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 border-b border-pink-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-500 uppercase">Full-Stack Setup Guide</span>
                <h3 className="text-base sm:text-lg font-bold text-stone-800">
                  💻 คำสั่ง SQL สำหรับ Supabase &amp; วิธี Deploy ฟรีบน Vercel
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 text-stone-600 font-bold border border-pink-200"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-stone-700">
              <pre className="p-4 rounded-2xl bg-stone-900 text-emerald-200 font-mono text-[11px] overflow-x-auto">{`create extension if not exists "pgcrypto";

create table if not exists public.partner_submissions (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  secret_code text,
  responses jsonb not null default '{}'::jsonb,
  flower_config jsonb not null default '{}'::jsonb,
  love_score integer not null default 100,
  secret_message text not null default '',
  bouquet_preview_data_url text,
  device_info text,
  created_at timestamptz not null default now()
);`}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}