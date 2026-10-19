'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { SubmissionPayload } from '@/types/surprise';

const STORAGE_KEY = 'bloom_love_submissions_v1';

interface SummarySurpriseProps {
  payload: SubmissionPayload;
  onPlaySound?: (type: 'pop' | 'boing' | 'sparkle') => void;
  onShowToast?: (msg: string) => void;
  onEditBouquet: () => void;
}

export default function SummarySurprise({
  payload,
  onPlaySound,
  onShowToast,
  onEditBouquet,
}: SummarySurpriseProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fireConfetti = () => {
    confetti({ particleCount: 95, spread: 80, origin: { y: 0.55 } });
  };

  useEffect(() => {
    fireConfetti();
  }, []);

  const handleSaveToDatabase = async () => {
    setSaving(true);
    onPlaySound?.('pop');

    const newEntry = {
      ...payload,
      id: `sub-${Date.now()}`,
      created_at: new Date().toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(newEntry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore storage error
    }

    try {
      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Keep local storage copy safe
    }

    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      onPlaySound?.('sparkle');
      fireConfetti();
      onShowToast?.('💌 ส่งคำตอบและช่อดอกไม้สำเร็จ!');
    }, 800);
  };

  const downloadPolaroidCard = () => {
    onPlaySound?.('pop');
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 800, 1000);
    grad.addColorStop(0, '#FFFDF9');
    grad.addColorStop(0.5, '#FFF0F5');
    grad.addColorStop(1, '#F3E8FF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 1000);

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFD1DC';
    ctx.lineWidth = 4;
    ctx.fillRect(45, 45, 710, 910);
    ctx.strokeRect(45, 45, 710, 910);

    ctx.fillStyle = '#FF7597';
    ctx.font = 'bold 28px Anuphan, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌸 Bloom & Love — Special Bouquet Card 🌸', 400, 105);

    ctx.fillStyle = '#44383B';
    ctx.font = 'bold 34px Anuphan, sans-serif';
    ctx.fillText(`ช่อดอกไม้ของ ${payload.nickname} (ความรัก ${payload.love_score}%)`, 400, 155);

    const c = payload.flower_config.counts;
    ctx.fillStyle = '#78686C';
    ctx.font = '22px Anuphan, sans-serif';
    ctx.fillText(
      `🌹 กุหลาบ ${c.rose}   🌻 ทานตะวัน ${c.sunflower}   🌷 ทิวลิป ${c.tulip}   🌼 เดซี่ ${c.daisy}`,
      400,
      205
    );

    const finishCard = () => {
      ctx.fillStyle = '#FFF5F8';
      ctx.strokeStyle = '#FFC2D1';
      ctx.lineWidth = 2;
      ctx.fillRect(85, 640, 630, 150);
      ctx.strokeRect(85, 640, 630, 150);

      ctx.fillStyle = '#44383B';
      ctx.font = 'italic 23px Anuphan, sans-serif';
      const msg = `"${payload.secret_message || ''}"`;
      ctx.fillText(msg.slice(0, 58), 400, 705);
      if (msg.length > 58) ctx.fillText(msg.slice(58, 116), 400, 742);

      ctx.fillStyle = '#9D858D';
      ctx.font = '19px Anuphan, sans-serif';
      ctx.fillText(`เดทครั้งหน้าที่อยากไป: ${payload.responses.partnerBirthday}`, 400, 845);

      ctx.fillStyle = '#FF7597';
      ctx.font = 'bold 18px Anuphan, sans-serif';
      ctx.fillText('Saved with Love • Bloom & Love Interactive Studio', 400, 905);

      const link = document.createElement('a');
      link.download = `bouquet-card-${payload.nickname}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      onShowToast?.('📸 ดาวน์โหลดรูปการ์ดช่อดอกไม้สำเร็จแล้ว!');
    };

    if (payload.bouquet_preview_data_url) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 210, 230, 380, 380);
        finishCard();
      };
      img.onerror = finishCard;
      img.src = payload.bouquet_preview_data_url;
    } else {
      ctx.font = '80px sans-serif';
      ctx.fillText('💐🌸🌻🌷', 400, 430);
      finishCard();
    }
  };

  const c = payload.flower_config.counts;

  return (
    <section className="w-full max-w-2xl mx-auto">
      <div className="glass-card rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-50 text-rose-500 text-xs font-semibold border border-pink-200">
          🎊 Bouquet &amp; Story Complete
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-1">
            ช่อดอกไม้ของ <span className="text-rose-500">{payload.nickname}</span> พร้อมส่งแล้ว! 💐
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            เค้าเก็บทุกคำตอบและช่อดอกไม้สวยๆ ช่อนี้ไว้ในความทรงจำของเราเรียบร้อยแล้วนะ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-left bg-gradient-to-br from-[#FFF9FB] via-white to-[#F7F2FF] p-4 sm:p-5 rounded-3xl border border-pink-200/80 shadow-inner">
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-pink-50/50 rounded-2xl p-3 border border-pink-100">
            {payload.bouquet_preview_data_url ? (
              <img
                src={payload.bouquet_preview_data_url}
                alt="ภาพช่อดอกไม้ที่จัด"
                className="w-44 h-44 object-contain rounded-xl drop-shadow-sm"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-5xl">💐</div>
            )}
            <span className="mt-2 text-[11px] font-semibold text-rose-500 bg-white px-3 py-1 rounded-full border border-pink-100">
              {payload.flower_config.holderStyle === 'wrap' ? '🎀 กระดาษห่อสี ' : '🏺 แจกันเซรามิกสี '}
              {payload.flower_config.wrapperName}
            </span>
          </div>

          <div className="md:col-span-7 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-600">ผู้จัดช่อดอกไม้:</span>
                <span className="text-sm font-bold text-rose-600">{payload.nickname}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-600">ระดับความจริงจังในความสัมพันธ์:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-600 text-xs font-extrabold">
                  {payload.love_score}% 💖
                </span>
              </div>
              <div className="text-sm text-stone-600">
                <strong className="text-stone-700">เดตแรกที่อยากไป:</strong> {payload.responses.firstdate}
              </div>
              <div className="text-sm text-stone-600">
                <strong className="text-stone-700">วันเกิด:</strong> {payload.responses.partnerBirthday}
              </div>
              <div className="text-sm text-stone-600">
                <strong className="text-stone-700">ที่อยู่:</strong> {payload.address_info}
              </div>
              <div className="text-sm text-stone-600">
                <strong className="text-stone-700">ดอกไม้ในช่อ:</strong> 🌹 กุหลาบ {c.rose} • 🌻 ทานตะวัน{' '}
                {c.sunflower} • 🌷 ทิวลิป {c.tulip} • 🌼 เดซี่ {c.daisy}
              </div>
            </div>

            <blockquote className="p-3 rounded-2xl bg-rose-50/70 border border-pink-200/70 text-xs text-stone-700 italic leading-relaxed">
              &ldquo;{payload.secret_message}&rdquo;
            </blockquote>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <button
            type="button"
            disabled={saving || saved}
            onClick={handleSaveToDatabase}
            className="w-full py-4 px-6 rounded-2xl pastel-btn font-bold text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <span>{saving ? '🎀' : saved ? '💖' : '💌'}</span>
            <span>
              {saving
                ? 'กำลังผูกโบว์และส่งช่อดอกไม้...'
                : saved
                ? 'บันทึกคำตอบและช่อดอกไม้เรียบร้อยแล้ว!'
                : 'กดส่งคำตอบและช่อดอกไม้'}
            </span>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={downloadPolaroidCard}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-pink-50 text-rose-600 text-xs font-semibold border border-pink-200 shadow-sm transition flex items-center gap-1.5"
            >
              <span>📸</span>
              <span>ดาวน์โหลดรูปการ์ดช่อดอกไม้ (PNG)</span>
            </button>
            <button
              type="button"
              onClick={onEditBouquet}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold transition"
            >
              🌸 กลับไปแต่งช่อดอกไม้เพิ่ม
            </button>
            <button
              type="button"
              onClick={() => {
                onPlaySound?.('sparkle');
                fireConfetti();
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 text-xs font-semibold border border-purple-200 transition"
            >
              🎉 จุดพลุฉลองอีกครั้ง
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}