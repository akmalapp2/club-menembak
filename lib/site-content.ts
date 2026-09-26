// ============================================================
//  KONTEN HALAMAN PUBLIK
//  - defaultContent: nilai bawaan (dipakai jika DB kosong)
//  - getSiteContent(): baca dari database, fallback ke default
//  - Tipe SiteContent dipakai bersama oleh halaman publik & form edit
// ============================================================

import { createClient } from './supabase/server'
import { DEFAULT_NAV_MENU, type NavItem } from './nav'

// Tipe menu kini didefinisikan di lib/nav.ts (aman untuk client).
// Di-export ulang agar import lama `from '@/lib/site-content'` tetap berfungsi.
export type { NavItem, NavChild } from './nav'

export type Federation = { abbr: string; name: string }
export type Legal = { label: string; value: string }
export type Partner = { label: string; url: string }
export type NavLink = { label: string; href: string }

export type SiteContent = {
  clubName: string
  clubShort: string
  tagline: string
  location: string
  logoUrl: string // URL logo club (kosong = pakai ikon bawaan)
  copyrightText: string // teks hak cipta footer (kosong = default otomatis)
  footerTagline: string // teks deskripsi singkat di footer (kosong = pakai default)
  theme: { primary: string; accent: string } // warna tema (hex)
  navMenu: NavItem[] // menu navbar publik (kosong = pakai default)
  structureDark: boolean // latar halaman /struktur gelap (navy ikut tema) bila true, putih bila false
  positionOptions: string[] // daftar jabatan (urutan = prioritas tampil anggota)
  categoryOptions: string[] // daftar kategori anggota
  identityText: { label: string; body: string } // teks bebas identitas (tampil di beranda via blok)
  hero: {
    welcome: string
    title: string
    highlight: string
    subtitle: string
  }
  about: {
    heading: string
    body: string
    legal: Legal[]
    chairman: string
  }
  vision: {
    visi: string
    misi: string
    nilai: string
  }
  federations: Federation[]
  contact: {
    address: string
    email: string
    phone: string[]
  }
  partners: Partner[]
}

// Teks default untuk deskripsi footer (dipakai bila footerTagline kosong).
export const DEFAULT_FOOTER_TAGLINE =
  'Perkumpulan terbuka bagi semua orang yang ingin menyalurkan bakat, hobi, maupun kreativitas di bidang olahraga menembak.'

// ===== Nilai default (dipakai jika belum ada di database) =====
export const defaultContent: SiteContent = {
  clubName: 'Perbakin Shooting Club',
  clubShort: 'PSC',
  tagline: 'Perkumpulan Menembak',
  location: 'Shooting Range Makassar, Sulawesi Selatan',
  logoUrl: '',
  copyrightText: '',
  footerTagline: '',
  theme: { primary: '#0a0e27', accent: '#ff5e3a' },
  navMenu: DEFAULT_NAV_MENU,
  structureDark: true,
  positionOptions: ['Ketua Umum', 'Ketua Harian', 'Sekretaris', 'Bendahara', 'Anggota'],
  categoryOptions: ['Pistol', 'Rifle', 'Shotgun', 'Lainnya'],
  identityText: { label: '', body: '' },
  hero: {
    welcome: 'Selamat Datang',
    title: 'Official Website',
    highlight: 'PERBAKIN SHOOTING CLUB',
    subtitle:
      'Wadah bagi semua orang yang ingin menyalurkan bakat, hobi, serta kreativitas di bidang olahraga menembak.',
  },
  about: {
    heading: 'Tentang Kami',
    body: 'Perbakin Shooting Club adalah perkumpulan terbuka bagi semua orang yang ingin menyalurkan bakat, hobi, maupun aktivitas dan kreativitas lainnya di bidang olahraga menembak. Kami berkomitmen membina atlet berprestasi sekaligus mempererat kekeluargaan antar anggota.',
    legal: [
      { label: 'SKEP PERBAKIN Kota Makassar', value: 'NO: 017/SKEP/KU/PC-KM/VIII/2022' },
      { label: 'SKEP MENKUMHAM', value: 'NO: AHU-0004407.AH.01.07' },
    ],
    chairman: 'Ketua Perbakin Shooting Club',
  },
  vision: {
    visi: 'Menjadi perkumpulan menembak yang bermanfaat dan berprestasi dalam olahraga menembak, sekaligus ikut mencerdaskan dan menyehatkan bangsa, yang dipercaya masyarakat dengan integritas tinggi.',
    misi: 'Mewujudkan kemandirian organisasi dengan menjalin kerja sama yang solid, baik antar anggota maupun dengan pemangku kepentingan lainnya.',
    nilai: 'Kerja sama tim (Teamwork), Inovasi, Integritas, dan Profesionalisme.',
  },
  federations: [
    { abbr: 'ISSF', name: 'International Shooting Sport Federation' },
    { abbr: 'IPSC', name: 'International Practical Shooting Confederation' },
    { abbr: 'WRABF', name: 'World Rimfire & Air Rifle Benchrest Federation' },
    { abbr: 'IMSSU', name: 'International Metallic Silhouette Shooting Association' },
  ],
  contact: {
    address:
      'Shooting Range Makassar\nJalan Perintis Kemerdekaan\nKota Makassar - Sulawesi Selatan',
    email: 'info@perbakinsc.example',
    phone: ['+62 811-0000-0000', '+62 822-0000-0000'],
  },
  partners: [
    { label: 'PB. PERBAKIN', url: 'http://perbakin.or.id/' },
    { label: 'PERBAKIN Makassar', url: 'https://www.perbakinmakassar.com/' },
    { label: 'ISSF', url: 'http://www.issf-sports.org/' },
    { label: 'IPSC', url: 'http://www.ipsc.org/' },
  ],
}

// Kunci baris di tabel site_settings
export const SITE_CONTENT_KEY = 'home_content'

// Preset tema dipindah ke lib/theme.ts (bebas import server).
// Re-export agar import lama `from '@/lib/site-content'` tetap berfungsi.
export { THEME_PRESETS, type ThemePreset } from './theme'

// Baca konten dari database; jika belum ada, pakai default.
// Menggabungkan agar field baru tetap terisi walau data lama belum punya.
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SITE_CONTENT_KEY)
      .single()

    if (data?.value) {
      // Gabung dangkal dengan default agar tak ada field yang hilang
      const v = data.value as Partial<SiteContent>
      return {
        ...defaultContent,
        ...v,
        logoUrl: v.logoUrl ?? defaultContent.logoUrl,
        copyrightText: v.copyrightText ?? defaultContent.copyrightText,
        footerTagline: v.footerTagline ?? defaultContent.footerTagline,
        theme: { ...defaultContent.theme, ...v.theme },
        navMenu: v.navMenu && v.navMenu.length ? v.navMenu : defaultContent.navMenu,
        structureDark: v.structureDark ?? defaultContent.structureDark,
        positionOptions:
          v.positionOptions && v.positionOptions.length
            ? v.positionOptions
            : defaultContent.positionOptions,
        categoryOptions:
          v.categoryOptions && v.categoryOptions.length
            ? v.categoryOptions
            : defaultContent.categoryOptions,
        identityText: { ...defaultContent.identityText, ...v.identityText },
        hero: { ...defaultContent.hero, ...v.hero },
        about: { ...defaultContent.about, ...v.about },
        vision: { ...defaultContent.vision, ...v.vision },
        contact: { ...defaultContent.contact, ...v.contact },
        federations: v.federations ?? defaultContent.federations,
        partners: v.partners ?? defaultContent.partners,
      }
    }
  } catch {
    // Jika tabel belum dibuat / error, pakai default
  }
  return defaultContent
}
