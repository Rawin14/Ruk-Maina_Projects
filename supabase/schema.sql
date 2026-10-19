-- ============================================================
-- SUPABASE SQL SCHEMA: Surprise Partner Quiz & 3D Flower Bouquet
-- รันคำสั่งนี้ใน Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================

-- 1. เปิดใช้งาน Extension สำหรับสร้าง UUID
create extension if not exists "pgcrypto";

-- 2. สร้างตาราง partner_submissions สำหรับเก็บคำตอบและข้อมูลช่อดอกไม้
create table if not exists public.partner_submissions (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  secret_code text,
  responses jsonb not null default '{}'::jsonb,
  flower_config jsonb not null default '{}'::jsonb,
  love_score integer not null default 100,
  secret_message text not null default '',
  address_info text not null default '',
  bouquet_preview_data_url text,
  device_info text,
  created_at timestamptz not null default now()
);

-- 3. สร้าง Index เพื่อให้หน้า Admin ค้นหาและเรียงตามเวลาได้รวดเร็ว
create index if not exists idx_partner_submissions_created_at
  on public.partner_submissions (created_at desc);

-- 4. ตั้งค่า Row Level Security (RLS)
alter table public.partner_submissions enable row level security;

-- อนุญาตให้ทุกคน (แฟนของเรา) กดส่งแบบสอบถาม (INSERT) ได้โดยไม่ต้องล็อกอินซับซ้อน
create policy "Allow public insert on partner_submissions"
  on public.partner_submissions
  for insert
  to anon, authenticated
  with check (true);

-- อนุญาตให้ดึงข้อมูล (SELECT) ผ่าน API Route หรือ Service Role
create policy "Allow select on partner_submissions"
  on public.partner_submissions
  for select
  to anon, authenticated
  using (true);
