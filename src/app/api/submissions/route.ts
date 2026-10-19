import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const adminPin = req.headers.get('x-admin-pin');
    const expectedPin = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || '2525';

    if (adminPin !== expectedPin) {
      return NextResponse.json({ error: 'รหัสผ่าน Admin ไม่ถูกต้อง' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('partner_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ submissions: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'ดึงข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nickname,
      secret_code,
      responses,
      flower_config,
      love_score,
      secret_message,
      bouquet_preview_data_url,
    } = body;

    if (!nickname || !responses || !flower_config) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('partner_submissions')
      .insert([
        {
          nickname: nickname.trim(),
          secret_code: secret_code || '',
          responses,
          flower_config,
          love_score: Number(love_score ?? responses.loveLevel ?? 100),
          secret_message: secret_message  || '',
          address_info: responses.address || '',
          bouquet_preview_data_url: bouquet_preview_data_url || null,
          device_info: req.headers.get('user-agent') || 'unknown',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, submission: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'บันทึกข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}
