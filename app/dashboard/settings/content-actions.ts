'use server'

import { createClient } from '@/lib/supabase/server'
import {
  defaultContent,
  SITE_CONTENT_KEY,
  type SiteContent,
} from '@/lib/site-content'
import { MAX_NAV_ITEMS, MAX_NAV_CHILDREN, type NavChild } from '@/lib/nav'
import { revalidatePath } from 'next/cache'

export type ContentState =
  | { error: string }
  | { success: string }
  | null

// Ambil string dari FormData dengan aman
function s(formData: FormData, key: string): string {
  const v = formData.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

export async function updateSiteContent(
  _prev: ContentState,
  formData: FormData
): Promise<ContentState> {
  const supabase = await createClient()

  // Hanya superadmin
  const { data: isSuper } = await supabase.rpc('is_superadmin')
  if (!isSuper) return { error: 'Hanya Super Admin yang boleh mengubah konten.' }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Ambil konten lama agar field yang tak ada di form ini tidak terhapus
  // (hero, visi-misi, federasi kini dikelola sebagai blok, bukan di sini)
  const { data: existing } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', SITE_CONTENT_KEY)
    .single()
  const prev = (existing?.value ?? {}) as Partial<SiteContent>

  // ----- Upload logo (opsional) -----
  // Logo lama dari hidden input; dipakai bila tidak ada file baru.
  let logoUrl = s(formData, 'logo_existing') || prev.logoUrl || ''

  // Jika ditandai hapus, kosongkan URL logo.
  if (s(formData, 'logo_remove') === '1') {
    logoUrl = ''
  }

  const logoFile = formData.get('logo')
  if (logoFile instanceof File && logoFile.size > 0) {
    const ext = (logoFile.name.split('.').pop() || 'png').toLowerCase()
    // Path tetap agar rapi; cache-busting via query saat dipakai
    const path = `identity/logo-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('blocks')
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type })
    if (upErr) return { error: 'Gagal mengunggah logo: ' + upErr.message }

    const { data: pub } = supabase.storage.from('blocks').getPublicUrl(path)
    logoUrl = pub.publicUrl
  }

  // ----- Susun ulang objek konten dari form -----

  // Legalitas
  const legal: SiteContent['about']['legal'] = []
  for (let i = 0; i < 6; i++) {
    const label = s(formData, `legal_label_${i}`)
    const value = s(formData, `legal_value_${i}`)
    if (label || value) legal.push({ label, value })
  }

  // Partner
  const partners: SiteContent['partners'] = []
  for (let i = 0; i < 8; i++) {
    const label = s(formData, `partner_label_${i}`)
    const url = s(formData, `partner_url_${i}`)
    if (label || url) partners.push({ label, url })
  }

  // Telepon (dipisah baris)
  const phone = s(formData, 'contact_phone')
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean)

  // Menu navbar (maks MAX_NAV_ITEMS menu utama, masing-masing maks
  // MAX_NAV_CHILDREN sub-menu). Menu utama sah bila berlabel DAN
  // (punya URL ATAU punya sub-menu -> tampil sebagai dropdown).
  const navMenu: SiteContent['navMenu'] = []
  for (let i = 0; i < MAX_NAV_ITEMS; i++) {
    const label = s(formData, `nav_label_${i}`)
    const url = s(formData, `nav_url_${i}`)
    const enabled = formData.get(`nav_enabled_${i}`) === 'on'

    const children: NavChild[] = []
    for (let j = 0; j < MAX_NAV_CHILDREN; j++) {
      const cl = s(formData, `nav_child_label_${i}_${j}`)
      const cu = s(formData, `nav_child_url_${i}_${j}`)
      if (cl && cu) children.push({ label: cl, url: cu })
    }

    if (label && (url || children.length)) {
      navMenu.push({
        label,
        url,
        enabled,
        ...(children.length ? { children } : {}),
      })
    }
  }

  // Daftar jabatan & kategori (dari ListEditor, dikirim sebagai name[]).
  const positionOptions = formData
    .getAll('positionOptions[]')
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
  const categoryOptions = formData
    .getAll('categoryOptions[]')
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)

  const content: SiteContent = {
    clubName: s(formData, 'clubName') || defaultContent.clubName,
    clubShort: s(formData, 'clubShort') || defaultContent.clubShort,
    tagline: s(formData, 'tagline'),
    location: s(formData, 'location'),
    logoUrl,
    copyrightText: s(formData, 'copyright_text'),
    footerTagline: s(formData, 'footer_tagline'),
    theme: {
      primary: s(formData, 'theme_primary') || defaultContent.theme.primary,
      accent: s(formData, 'theme_accent') || defaultContent.theme.accent,
    },
    navMenu: navMenu.length ? navMenu : defaultContent.navMenu,
    structureDark: formData.get('structure_dark') === 'on',
    positionOptions: positionOptions.length
      ? positionOptions
      : defaultContent.positionOptions,
    categoryOptions: categoryOptions.length
      ? categoryOptions
      : defaultContent.categoryOptions,
    identityText: {
      label: s(formData, 'identity_label'),
      body: s(formData, 'identity_body'),
    },
    // Hero & vision & federations: pertahankan nilai lama (dikelola via blok)
    hero: prev.hero ?? defaultContent.hero,
    vision: prev.vision ?? defaultContent.vision,
    federations: prev.federations ?? defaultContent.federations,
    about: {
      heading: prev.about?.heading ?? defaultContent.about.heading,
      body: prev.about?.body ?? defaultContent.about.body,
      legal: legal.length ? legal : defaultContent.about.legal,
      chairman: s(formData, 'about_chairman'),
    },
    contact: {
      address: s(formData, 'contact_address'),
      email: s(formData, 'contact_email'),
      phone: phone.length ? phone : defaultContent.contact.phone,
    },
    partners: partners.length ? partners : defaultContent.partners,
  }

  // Simpan (upsert) ke database
  const { error } = await supabase.from('site_settings').upsert(
    {
      key: SITE_CONTENT_KEY,
      value: content,
      updated_at: new Date().toISOString(),
      updated_by: user?.id,
    },
    { onConflict: 'key' }
  )

  if (error) return { error: error.message }

  // Segarkan halaman publik & pengaturan
  revalidatePath('/')
  revalidatePath('/anggota')
  revalidatePath('/struktur')
  revalidatePath('/dashboard/members')
  revalidatePath('/dashboard/settings/konten')

  return { success: 'Konten beranda berhasil diperbarui.' }
}
