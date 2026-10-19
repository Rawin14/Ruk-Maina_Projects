# 🌸 Surprise Partner Quiz & 3D Flower Bouquet (Next.js + Three.js + Supabase)

เว็บแอปพลิเคชันเซอร์ไพรส์แฟนสไตล์ Interactive Storytelling โทน Pastel Cute / Cozy Aesthetic พร้อมระบบจัดช่อดอกไม้ 3D แบบ Realtime และหน้า Admin Dashboard ลับ

## 📁 โครงสร้างโปรเจกต์ (Folder Structure)
```text
surprise-bouquet-nextjs/
├── supabase/
│   └── schema.sql                  # คำสั่งสร้างตารางและ RLS Policy บน Supabase
├── src/
│   ├── types/
│   │   └── surprise.ts             # TypeScript Interfaces สำหรับคำตอบและช่อดอกไม้
│   ├── lib/
│   │   └── supabase.ts             # ตัวเชื่อมต่อ Supabase Client & Service Role
│   ├── components/
│   │   ├── WelcomeScreen.tsx       # หน้าแรกกรอกชื่อเล่น + รหัสผ่านลับ
│   │   ├── InteractiveQuiz.tsx     # แบบสอบถามทีละข้อ + ปุ่ม "ไม่รัก" วิ่งหนี + Slider
│   │   ├── FlowerBouquet3D.tsx     # จัดช่อดอกไม้ 3D (Three.js) + 2.5D Fallback
│   │   └── SummarySurprise.tsx     # หน้าสรุป จุดพลุ Confetti และบันทึกลง Database
│   └── app/
│       ├── page.tsx                # หน้าหลักรวม Flow ทั้งหมด
│       ├── admin-lover/
│       │   └── page.tsx            # หน้า Admin ลับสำหรับดูคำตอบและ Export JSON
│       └── api/
│           └── submissions/
│               └── route.ts        # API Route (GET / POST) เชื่อมต่อฐานข้อมูล
├── .env.example                    # ตัวอย่างการตั้งค่า Environment Variables
└── package.json
```

## 🚀 วิธีติดตั้งและรันในเครื่อง (Local Setup)
1. แตกไฟล์ซิปและติดตั้งแพ็กเกจ:
   ```bash
   npm install
   ```
2. สร้างโปรเจกต์ฟรีที่ [Supabase](https://supabase.com) แล้วเปิดเมนู **SQL Editor** นำโค้ดจาก `supabase/schema.sql` ไปวางและกด **Run**
3. คัดลอกไฟล์ `.env.example` เป็น `.env.local` แล้วนำค่า `Project URL` และ `API Keys` จาก Supabase (`Project Settings -> API`) มาใส่
4. รันเซิร์ฟเวอร์สำหรับพัฒนา:
   ```bash
   npm run dev
   ```
5. เปิดเบราว์เซอร์ที่ `http://localhost:3000` (และเข้าหน้าหลังบ้านได้ที่ `http://localhost:3000/admin-lover`)

## ☁️ วิธี Deploy ขึ้น Vercel แบบฟรี
1. อัปโหลดโค้ดขึ้น GitHub Repository ของคุณ
2. เข้าเว็บ [Vercel](https://vercel.com) กด **Add New -> Project** แล้วเลือก Repository นี้
3. ในหัวข้อ **Environment Variables** ให้เพิ่มตัวแปรทั้งหมดตามไฟล์ `.env.example`
4. กด **Deploy** รอประมาณ 1 นาที จะได้ลิงก์เว็บพร้อมส่งให้แฟนเล่นได้ทันที!
