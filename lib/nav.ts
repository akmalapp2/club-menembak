// ============================================================
//  MENU NAVBAR PUBLIK (dipakai bersama server & client)
//  File ini SENGAJA tanpa import server (supabase), agar aman
//  di-import oleh komponen client (editor menu & navbar).
// ============================================================

// Satu item sub-menu (di dalam dropdown).
export type NavChild = { label: string; url: string }

// Satu menu utama. Jika `children` berisi item, menu ini tampil sebagai
// tombol dropdown (URL utama diabaikan). Jika kosong, tampil sebagai tautan biasa.
export type NavItem = {
  label: string
  url: string
  enabled: boolean
  children?: NavChild[]
}

// Batas jumlah menu. Ubah angka di sini bila perlu (editor & penyimpanan ikut).
export const MAX_NAV_ITEMS = 8 // jumlah menu utama
export const MAX_NAV_CHILDREN = 6 // jumlah sub-menu per menu utama

// Menu default bila belum ada pengaturan di database.
export const DEFAULT_NAV_MENU: NavItem[] = [
  { label: 'Beranda', url: '/#beranda', enabled: true },
  { label: 'Tentang Kami', url: '/#tentang', enabled: true },
  { label: 'Visi Misi', url: '/#visimisi', enabled: true },
  { label: 'Galeri', url: '/#galeri', enabled: true },
  { label: 'Berita', url: '/#berita', enabled: true },
  { label: 'Database Anggota', url: '/anggota', enabled: true },
  { label: 'Kontak', url: '/#kontak', enabled: true },
]

// Ambil menu yang layak tampil:
// - aktif & berlabel
// - sub-menu dibersihkan (harus punya label & URL)
// - menu tanpa URL hanya tampil bila punya sub-menu (jadi dropdown)
export function visibleNavItems(items: NavItem[]): NavItem[] {
  return items
    .filter((it) => it.enabled && it.label?.trim())
    .map((it) => ({
      ...it,
      children: (it.children ?? []).filter((c) => c.label?.trim() && c.url?.trim()),
    }))
    .filter((it) => it.url?.trim() || (it.children && it.children.length > 0))
}
