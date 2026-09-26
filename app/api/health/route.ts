// ============================================================
//  HEALTH CHECK / KEEPALIVE
//  Dipanggil oleh GitHub Actions (.github/workflows/keepalive.yml)
//  secara berkala. Menjalankan 1 query ringan ke database agar
//  project Supabase (versi gratis) tidak di-pause karena tidak aktif.
//
//  Respons sengaja minimal (tidak membocorkan data apa pun).
// ============================================================

import { NextResponse, connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  // Pastikan selalu dijalankan saat diminta (tidak pernah di-cache).
  await connection()

  const headers = { 'Cache-Control': 'no-store, max-age=0' }

  try {
    const supabase = await createClient()

    // Query ringan: ambil 1 baris kunci dari site_settings
    // (tabel ini memang sudah dibaca publik oleh halaman beranda).
    const { error } = await supabase.from('site_settings').select('key').limit(1)

    if (error) {
      return NextResponse.json(
        { ok: false, message: 'Database tidak merespons dengan benar.' },
        { status: 500, headers }
      )
    }

    return NextResponse.json(
      { ok: true, time: new Date().toISOString() },
      { status: 200, headers }
    )
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Gagal terhubung ke database.' },
      { status: 500, headers }
    )
  }
}
