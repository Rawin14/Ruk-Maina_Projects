"use client";

import React, { useState, useRef } from "react";
import { QuizResponses } from "@/types/surprise";

interface InteractiveQuizProps {
  nickname: string;
  initialResponses: QuizResponses;
  onPlaySound?: (type: "pop" | "boing" | "sparkle") => void;
  onShowToast?: (msg: string) => void;
  onBackToWelcome: () => void;
  onComplete: (responses: QuizResponses) => void;
}

const MOMENTS_LIST = [
  { id: "m1", label: "ปิกนิกสวนสาธารณะ นั่งคุยเล่น + ถ่ายรูป 🍰", icon: "🍓" },
  {
    id: "m2",
    label: "ตะลุยคาเฟ่เค้กโฮมเมดน่ารักๆ กินของอร่อยๆ 🧸",
    icon: "🤍",
  },
  {
    id: "m3",
    label: "ดูหนังซุกผ้าห่มในห้องแอร์ฉ่ำๆ + สั่งของโปรดมากิน 😆",
    icon: "✨",
  },
];

const DODGE_MESSAGES = [
  "ไม่ชอบหรอก 😝",
  "แน่ใจหรอออ? 🥺",
  "กดไม่โดนหรอก! 💨",
  "ปุ่มนี้เสีย กดสีชมพูเถอะ 💕",
  "ฮั่นแน่ นิ้วลั่นใช่มั้ยย 😘",
  "ยอมรับว่าชอบ มาซะดีๆ ฮี่ๆ 🌸",
];

export default function InteractiveQuiz({
  nickname,
  initialResponses,
  onPlaySound,
  onShowToast,
  onBackToWelcome,
  onComplete,
}: InteractiveQuizProps) {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<QuizResponses>(initialResponses);
  const [noBtnStyle, setNoBtnStyle] = useState<React.CSSProperties>({
    position: "absolute",
    right: "24px",
    bottom: "24px",
  });
  const arenaRef = useRef<HTMLDivElement>(null);

  const totalSteps = 5;

  const moveRunawayNoButton = () => {
    onPlaySound?.("boing");
    const arena = arenaRef.current;
    const maxLeft = arena ? Math.max(16, arena.clientWidth - 130) : 200;
    const maxTop = arena ? Math.max(16, arena.clientHeight - 50) : 120;
    const nextLeft = Math.floor(12 + Math.random() * maxLeft);
    const nextTop = Math.floor(12 + Math.random() * maxTop);

    setNoBtnStyle({
      position: "absolute",
      left: `${nextLeft}px`,
      top: `${nextTop}px`,
      transition: "all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
    });
    setResponses((prev) => ({ ...prev, dodgeCount: prev.dodgeCount + 1 }));
  };

  const getLoveMood = (val: number) => {
    if (val < 25) return { emoji: "😑", text: "เฉยๆไม่ได้จริงจังอะไร " };
    if (val < 50) return { emoji: "🤔", text: "ครั้งๆกลางๆยังไม่แน่ใจ 🌸" };
    if (val < 75) return { emoji: "🥰", text: "คุยๆไปก่อนค่อยตัดสินใจ 💖" };
    if (val < 99) return { emoji: "🥰", text: "จริงจังในระดับหนึ่ง! 💖" };
    return {
      emoji: "😍💖",
      text: "เต็มร้อยกับความสัมพันธ์ครั้งๆนี้ 🚀🎉",
    };
  };

  const mood = getLoveMood(responses.loveLevel);
  const yesScale = Math.min(1.28, 1 + responses.dodgeCount * 0.04);
  // 1. เพิ่มฟังก์ชันเช็กเงื่อนไขการไปต่อ ไว้ด้านบนก่อน return (...)
  const canGoNext = () => {
    if (step === 0) {
      // ข้อ 1: ต้องเลือกสถานที่จากรายการ หรือพิมพ์เอง
      return responses.firstdate && responses.firstdate.trim() !== "";
    }
    if (step === 1) {
      // ข้อ 2: ปุ่ม "ชอบเค้ามั้ย?" จะเป็นตัวพาไปหน้าถัดไปเอง ดังนั้นคืนค่า false ไว้ก่อน
      // (ถึงจะซ่อนปุ่มไว้แล้ว แต่ใส่ logic ไว้ป้องกันเผื่อในอนาคต)
      return false;
    }
    if (step === 2) {
      // ข้อ 3: Love Meter อนุญาตให้ไปต่อได้เลยเพราะมีค่าเริ่มต้น (หรือจะบังคับขยับก็ได้)
      return true;
    }
    if (step === 3) {
      // ข้อ 4: ต้องกรอกวันเกิด (ตัวอย่าง: บังคับกรอก แต่ไม่ได้เช็กว่าถูกไหม ถ้าจะเช็กถูกด้วยต้องแก้ตรงนี้)
      return (
        responses.partnerBirthday && responses.partnerBirthday.trim() !== " "
      );
    }
    if (step === 4) {
      // ข้อ 5: ข้อความในใจ จะให้บังคับพิมพ์ หรือไม่พิมพ์ก็ได้ ถ้าจะบังคับให้เปลี่ยนเป็น
      // return responses.secretMessage && responses.secretMessage.trim() !== "";
      return true; // ตอนนี้อนุญาตให้ข้ามได้
    }
    return true;
  };
  return (
    <section className="w-full max-w-xl mx-auto">
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-500">
              คำถามสำหรับ {nickname} (ข้อที่ {step + 1} / {totalSteps})
            </span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={`text-sm transition-transform duration-300 ${
                    i <= step ? "scale-110" : "opacity-30 grayscale"
                  }`}
                >
                  💖
                </span>
              ))}
            </div>
          </div>
          <div className="w-full h-2.5 bg-pink-100/80 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 transition-all duration-500"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1 */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
              ✨ Warm Memories
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-800">
              1. เดตแรก <span className="text-rose-500">คุณ{nickname}</span>{" "}
              อยากไปที่ไหน?
            </h2>
            <p className="text-xs text-stone-500">
              เลือกจากตัวเลือก หรือพิมพ์สถานที่ที่อยากไปเองได้เลยน้า
            </p>

            <div className="grid gap-2.5 pt-1">
              {MOMENTS_LIST.map((item) => {
                const active = responses.firstdate === item.label;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onPlaySound?.("pop");
                      setResponses({
                        ...responses,
                        firstdate: item.label,
                      });
                    }}
                    className={`w-full p-3.5 rounded-2xl text-left text-xs sm:text-sm font-medium border transition flex items-center gap-3 ${
                      active
                        ? "bg-rose-50/90 border-rose-400 text-rose-800 shadow-sm ring-2 ring-rose-200/60"
                        : "bg-white/80 border-stone-200/90 text-stone-700 hover:bg-pink-50/50"
                    }`}
                  >
                    <span className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-base shadow-sm border border-pink-100">
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {active && (
                      <span className="text-rose-500 font-bold">✓</span>
                    )}
                  </button>
                );
              })}

              {/* ช่องพิมพ์คำตอบเอง */}
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-base shadow-sm border border-stone-100">
                    ✍️
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="หรือพิมพ์สถานที่อื่นๆ..."
                  value={
                    // เคลียร์ช่องพิมพ์ถ้าผู้ใช้กดเลือกจากปุ่มด้านบน
                    MOMENTS_LIST.some(
                      (item) => item.label === responses.firstdate,
                    )
                      ? ""
                      : responses.firstdate || ""
                  }
                  onChange={(e) => {
                    setResponses({
                      ...responses,
                      firstdate: e.target.value,
                    });
                  }}
                  onFocus={() => onPlaySound?.("pop")}
                  className={`w-full p-3.5 pl-14 rounded-2xl text-xs sm:text-sm font-medium border transition focus:outline-none ${
                    // ถ้าระบุข้อความเอง (ไม่ตรงกับตัวเลือก) ให้ทำช่องไฮไลท์เป็นสีชมพู
                    !MOMENTS_LIST.some(
                      (item) => item.label === responses.firstdate,
                    ) && responses.firstdate
                      ? "bg-rose-50/90 border-rose-400 text-rose-800 shadow-sm ring-2 ring-rose-200/60"
                      : "bg-white/80 border-stone-200/90 text-stone-700 focus:border-rose-400 focus:ring-2 focus:ring-rose-200/60"
                  }`}
                />
                {!MOMENTS_LIST.some(
                  (item) => item.label === responses.firstdate,
                ) &&
                  responses.firstdate && (
                    <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-rose-500 font-bold">
                      ✓
                    </span>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 1 && (
          <div className="space-y-4 text-center py-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-500 text-xs font-medium border border-pink-200">
              🥺 คำถามวัดใจระดับชาติ
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-800">
              2. ถามจริงๆ นะ...{" "}
              <span className="text-rose-500">{nickname}</span>{" "}
              เธอชอบเค้ามั้ยยย? 💖
            </h2>
            <p className="text-xs text-stone-500">
              ลองกดปุ่ม &ldquo;ไม่ชอบ&rdquo; ดูสิ... ถ้ากดโดนนะ ฮี่ๆ 😜
            </p>

            <div
              ref={arenaRef}
              className="relative h-48 sm:h-52 w-full rounded-2xl bg-gradient-to-b from-rose-50/60 to-purple-50/50 border border-pink-100 flex items-center justify-center overflow-hidden p-4"
            >
              <button
                type="button"
                style={noBtnStyle}
                onMouseEnter={moveRunawayNoButton}
                onTouchStart={(e) => {
                  e.preventDefault();
                  moveRunawayNoButton();
                }}
                onClick={moveRunawayNoButton}
                className="relative z-20 px-4 py-2.5 rounded-xl bg-stone-200/90 hover:bg-stone-300 text-stone-600  text-xs font-semibold shadow-sm select-none"
              >
                {DODGE_MESSAGES[responses.dodgeCount % DODGE_MESSAGES.length]}
              </button>

              <button
                type="button"
                style={{ transform: `scale(${yesScale.toFixed(2)})` }}
                onClick={() => {
                  onPlaySound?.("sparkle");
                  onShowToast?.("เย้! รู้แล้วว่าชอบเค้า ฮี่ๆ 💖");
                  setResponses({
                    ...responses,
                    doYouLoveMe: "ชอบที่สุดในโลกเลยยย! 💖🥰",
                  });
                  setStep(2);
                }}
                className="z-10 px-6 py-4 rounded-2xl pastel-btn font-bold text-sm sm:text-base shadow-lg flex items-center gap-2 transition-transform"
              >
                <span>ชอบเค้ามั้ย? 💖🥰</span>
              </button>
            </div>

            <div className="text-[11px] text-rose-400 font-medium">
              สถิติปุ่มไม่ชอบกระโดดหนีไปแล้ว:{" "}
              <span className="font-bold">{responses.dodgeCount}</span> ครั้ง 💨
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-rose-500 text-xs font-medium border border-pink-200">
              🌡️ Love Meter
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-800">
              3. เธอคิดว่าเธอจริงจังในความสัมพันธ์ครั้งนี้มากแค่ไหน? 💗
            </h2>
            <div className="rounded-3xl bg-gradient-to-br from-rose-50/90 via-pink-50/60 to-purple-50/80 p-6 text-center border border-pink-200/70 space-y-4">
              <div className="text-5xl transition-transform duration-300 inline-block">
                {mood.emoji}
              </div>
              <div>
                <span className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent">
                  {responses.loveLevel}%
                </span>
                <p className="text-xs text-rose-500 font-medium mt-1">
                  {mood.text}
                </p>
              </div>
              <div className="px-2 pt-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={25}
                  value={responses.loveLevel}
                  onChange={(e) =>
                    setResponses({
                      ...responses,
                      loveLevel: Number(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-stone-400 mt-2 font-medium">
                  <span>0% (เฉยๆ)</span>
                  <span>100% (เต็มร้อย)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium border border-purple-200">
              🎂 Birthday Quiz
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-800">
              4. วันเกิดของเธอคือวันไหนน้า? 🍓
            </h2>
            <p className="text-xs text-stone-500">
              เลือกวัน/เดือน/ปีเกิดให้ถูกต้อง !
            </p>

            <div className="pt-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-base shadow-sm border border-stone-100">
                    📅
                  </span>
                </div>
                <input
                  type="date"
                  value={responses.partnerBirthday || ""}
                  onChange={(e) => {
                    onPlaySound?.("pop");
                    setResponses({
                      ...responses,
                      partnerBirthday: e.target.value,
                    });
                  }}
                  className={`w-full p-3.5 pl-14 pr-4 rounded-2xl text-xs sm:text-sm font-medium border transition focus:outline-none ${
                    responses.partnerBirthday
                      ? "bg-purple-50/90 border-purple-400 text-purple-900 shadow-sm ring-2 ring-purple-200/60"
                      : "bg-white/80 border-stone-200/90 text-stone-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-200/60"
                  }`}
                />
              </div>

              {/* ข้อความแจ้งเตือนเล็กๆ (ถ้ามีการใส่ข้อมูลแล้ว) */}
              {responses.partnerBirthday && (
                <p className="mt-2 text-[11px] text-purple-600 text-center font-medium">
                  เตรียมตรวจสอบคำตอบในหน้าถัดไปเลย! ✨
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 5 */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-500 text-xs font-medium border border-pink-200">
              💌 Heartfelt Note
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-800">
              5. มีข้อความอะไรจะถึงเค้ามั้ยยย?! 🌷
            </h2>
            <p className="text-xs text-stone-500">
              อยากลองให้เธอพิมพ์เยอะๆดูบ้างที่ไม่ใช่ "เคค อ่อ ช่าย ม่าย" 5555
              หรือจะพิมพ์ความในใจ หรือสิ่งที่อยากบอกเค้าตรงนี้น่ารักๆ ก็ได้เลย 💖
            </p>
            <textarea
              rows={5}
              value={responses.secretMessage}
              onChange={(e) =>
                setResponses({ ...responses, secretMessage: e.target.value })
              }
              placeholder="พิมพ์ความในใจ หรือสิ่งที่อยากบอกเค้าตรงนี้ได้เลย..."
              className="w-full p-4 rounded-2xl bg-rose-50/40 border border-pink-200 focus:border-rose-400 focus:bg-white focus:outline-none text-sm text-stone-700 leading-relaxed"
            />
            <div>
              <p className="text-xs text-stone-500 text-center">
                ข้อความนี้เค้าจะเก็บไว้อ่านเผื่อทำความเข้าใจในตัวเธอมากขึ้นนะ
                <br />
                หรือจะพิมพ์ความในใจสั้นๆ น่ารักๆ ก็ได้เลย 💖
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-7 pt-4 border-t border-pink-100">
          <button
            type="button"
            onClick={() => {
              onPlaySound?.("pop");
              if (step > 0) setStep(step - 1);
              else onBackToWelcome();
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100 transition flex items-center gap-1"
          >
            <span>←</span>
            <span>ย้อนกลับ</span>
          </button>

          {/* 2. ซ่อนปุ่ม "ข้อต่อไป" ใน Step 2 (step === 1) */}
          {step !== 1 && (
            <button
              type="button"
              onClick={() => {
                if (!canGoNext()) {
                  onShowToast?.("อย่าลืมตอบคำถามข้อนี้ก่อนน้าา 🥺");
                  return;
                }

                onPlaySound?.("pop");


                // เช็กคำตอบข้อ 4 (วันเกิด) สมมติว่าต้องตอบ "mm-dd-yyyy" เท่านั้น
                if (step === 3 && responses.partnerBirthday == "mm-dd-yyyy") {
                  onShowToast?.("ว้าาา จำวันเกิดผิดหรอเนี่ย! ลองนึกดีๆ น้า 🥺");
                  return; // หยุด ไม่ให้ขยับไปข้อถัดไป
                }

                // เช็กคำตอบข้อ 4 (ข้อความลับ) ต้องมีข้อความ
                if (step === 4 && !responses.secretMessage) {
                  onShowToast?.("อย่าลืมพิมพ์ข้อความถึงเค้าด้วยน้าา 💌");
                  return; // หยุด ไม่ให้ขยับไปข้อถัดไป
                }

                if (step < totalSteps - 1) setStep(step + 1);
                else onComplete(responses);
              }}
              // ปรับแต่งสีปุ่ม ถ้ายังตอบไม่ครบให้เป็นสีเทาๆ
              disabled={!canGoNext()}
              className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                canGoNext()
                  ? "pastel-btn" // ใช้คลาสพาสเทลเดิมเมื่อพร้อมไปต่อ
                  : "bg-stone-200 text-stone-400 cursor-not-allowed" // สีปุ่มตอนที่กดไม่ได้
              }`}
            >
              <span>
                {step === totalSteps - 1
                  ? "ไปจัดช่อดอกไม้กันเลย 🌸"
                  : "ข้อต่อไป"}
              </span>
              <span>➔</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
