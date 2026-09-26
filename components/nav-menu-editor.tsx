'use client'

import { useState, useEffect } from 'react'
import {
  DEFAULT_NAV_MENU,
  MAX_NAV_ITEMS,
  MAX_NAV_CHILDREN,
  type NavItem,
  type NavChild,
} from '@/lib/nav'

type Opt = { label: string; url: string; group: string }

// Opsi cepat: halaman + section beranda. Admin tetap bisa ketik URL manual.
const URL_OPTIONS: Opt[] = [
  // Halaman
  { group: 'Halaman', label: 'Beranda', url: '/' },
  { group: 'Halaman', label: 'Database Anggota', url: '/anggota' },
  { group: 'Halaman', label: 'Struktur Organisasi', url: '/struktur' },
  { group: 'Halaman', label: 'Berita (halaman penuh)', url: '/berita' },
  // Section beranda (anchor)
  { group: 'Section Beranda', label: 'Beranda (atas)', url: '/#beranda' },
  { group: 'Section Beranda', label: 'Tentang Kami', url: '/#tentang' },
  { group: 'Section Beranda', label: 'Visi Misi', url: '/#visimisi' },
  { group: 'Section Beranda', label: 'Galeri', url: '/#galeri' },
  { group: 'Section Beranda', label: 'Berita (section)', url: '/#berita' },
  { group: 'Section Beranda', label: 'Struktur (section)', url: '/#struktur' },
  { group: 'Section Beranda', label: 'Legalitas', url: '/#legalitas' },
  { group: 'Section Beranda', label: 'Kontak', url: '/#kontak' },
]

// Baris editor (children selalu array agar mudah diolah).
type Row = { label: string; url: string; enabled: boolean; children: NavChild[] }

const emptyRow = (): Row => ({ label: '', url: '', enabled: false, children: [] })

export default function NavMenuEditor({ initial }: { initial?: NavItem[] }) {
  // Selalu tampilkan MAX_NAV_ITEMS baris (isi dari data, sisanya kosong).
  const [rows, setRows] = useState<Row[]>(() => {
    const start = initial && initial.length ? initial : DEFAULT_NAV_MENU
    const r: Row[] = start.slice(0, MAX_NAV_ITEMS).map((it) => ({
      label: it.label ?? '',
      url: it.url ?? '',
      enabled: !!it.enabled,
      children: (it.children ?? []).slice(0, MAX_NAV_CHILDREN).map((c) => ({ ...c })),
    }))
    while (r.length < MAX_NAV_ITEMS) r.push(emptyRow())
    return r
  })

  // Halaman dinamis (dari tabel pages) untuk pilihan tujuan.
  const [dynamicPages, setDynamicPages] = useState<Opt[]>([])
  useEffect(() => {
    fetch('/api/pages-list')
      .then((r) => (r.ok ? r.json() : { pages: [] }))
      .then((d: { pages?: { slug: string; title: string }[] }) => {
        setDynamicPages(
          (d.pages ?? []).map((p) => ({
            group: 'Halaman Dinamis',
            label: p.title,
            url: `/halaman/${p.slug}`,
          }))
        )
      })
      .catch(() => setDynamicPages([]))
  }, [])

  const ALL_OPTIONS = [...URL_OPTIONS, ...dynamicPages]
  const groups = Array.from(new Set(ALL_OPTIONS.map((o) => o.group)))
  const labelFor = (url: string) => {
    const opt = ALL_OPTIONS.find((o) => o.url === url)
    return opt ? opt.label.replace(/ \(.*\)$/, '') : ''
  }

  // ----- Operasi menu utama -----
  const updateRow = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const moveRow = (i: number, dir: -1 | 1) =>
    setRows((prev) => {
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  const pickRow = (i: number, url: string) => {
    if (!url) return
    setRows((prev) =>
      prev.map((r, idx) =>
        idx === i ? { ...r, url, label: r.label || labelFor(url), enabled: true } : r
      )
    )
  }

  // ----- Operasi sub-menu -----
  const setChildren = (i: number, fn: (c: NavChild[]) => NavChild[]) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, children: fn(r.children) } : r)))

  const addChild = (i: number) =>
    setChildren(i, (c) => (c.length >= MAX_NAV_CHILDREN ? c : [...c, { label: '', url: '' }]))

  const updateChild = (i: number, j: number, patch: Partial<NavChild>) =>
    setChildren(i, (c) => c.map((x, k) => (k === j ? { ...x, ...patch } : x)))

  const removeChild = (i: number, j: number) =>
    setChildren(i, (c) => c.filter((_, k) => k !== j))

  const moveChild = (i: number, j: number, dir: -1 | 1) =>
    setChildren(i, (c) => {
      const k = j + dir
      if (k < 0 || k >= c.length) return c
      const next = [...c]
      ;[next[j], next[k]] = [next[k], next[j]]
      return next
    })

  const pickChild = (i: number, j: number, url: string) => {
    if (!url) return
    setChildren(i, (c) =>
      c.map((x, k) => (k === j ? { ...x, url, label: x.label || labelFor(url) } : x))
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-[#8890b5] space-y-1">
        <p>
          Atur menu navbar. Urutan mengikuti baris (pakai ↑ ↓). Pilih tujuan dari daftar
          atau ketik URL sendiri. Kosongkan Label &amp; URL untuk menghapus menu.
        </p>
        <p>
          <b>Dropdown:</b> klik <b>+ Tambah sub-menu</b> pada sebuah menu. Menu yang punya
          sub-menu akan tampil sebagai tombol dropdown (URL utamanya tidak dipakai).
          Maks {MAX_NAV_ITEMS} menu utama, {MAX_NAV_CHILDREN} sub-menu per menu.
        </p>
      </div>

      {rows.map((row, i) => {
        const isGroup = row.children.length > 0
        return (
          <div key={i} className="border rounded-lg p-3 space-y-3 bg-white">
            {/* Kepala baris */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#0a0e27]">Menu {i + 1}</span>
                {isGroup && (
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-accent"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--brand-accent) 10%, transparent)',
                    }}
                  >
                    Dropdown · {row.children.length}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <SmallBtn onClick={() => moveRow(i, -1)} disabled={i === 0} title="Naik">
                  ↑
                </SmallBtn>
                <SmallBtn
                  onClick={() => moveRow(i, 1)}
                  disabled={i === rows.length - 1}
                  title="Turun"
                >
                  ↓
                </SmallBtn>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Label */}
              <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                <input
                  type="text"
                  name={`nav_label_${i}`}
                  value={row.label}
                  onChange={(e) => updateRow(i, { label: e.target.value })}
                  placeholder={isGroup ? 'mis. Tentang' : 'mis. Tentang Kami'}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* URL (disembunyikan bila jadi dropdown) */}
              <div>
                <label className="block text-sm font-medium mb-1">Tujuan / URL</label>
                {isGroup ? (
                  <>
                    <p className="text-xs text-[#8890b5] border border-dashed rounded-lg px-3 py-2.5">
                      Menu ini menjadi tombol dropdown — URL utama tidak dipakai.
                    </p>
                    {/* Tetap dikirim agar URL lama tidak hilang bila sub-menu dihapus lagi */}
                    <input type="hidden" name={`nav_url_${i}`} value={row.url} />
                  </>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name={`nav_url_${i}`}
                      value={row.url}
                      onChange={(e) => updateRow(i, { url: e.target.value })}
                      placeholder="/anggota atau /#tentang"
                      className="flex-1 min-w-0 border rounded-lg px-3 py-2 font-mono text-sm"
                    />
                    <UrlPicker options={ALL_OPTIONS} groups={groups} onPick={(u) => pickRow(i, u)} />
                  </div>
                )}
              </div>
            </div>

            {/* Sub-menu */}
            {isGroup && (
              <div
                className="ml-1 md:ml-3 pl-3 border-l-2 space-y-2"
                style={{
                  borderColor: 'color-mix(in srgb, var(--brand-accent) 35%, transparent)',
                }}
              >
                <p className="text-xs font-medium text-[#8890b5]">Sub-menu</p>
                {row.children.map((ch, j) => (
                  <div key={j} className="flex flex-col md:flex-row gap-2 md:items-center">
                    <input
                      type="text"
                      name={`nav_child_label_${i}_${j}`}
                      value={ch.label}
                      onChange={(e) => updateChild(i, j, { label: e.target.value })}
                      placeholder="Label sub-menu"
                      className="md:w-1/3 border rounded-lg px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2 flex-1 min-w-0">
                      <input
                        type="text"
                        name={`nav_child_url_${i}_${j}`}
                        value={ch.url}
                        onChange={(e) => updateChild(i, j, { url: e.target.value })}
                        placeholder="/struktur atau /#visimisi"
                        className="flex-1 min-w-0 border rounded-lg px-3 py-2 font-mono text-sm"
                      />
                      <UrlPicker
                        options={ALL_OPTIONS}
                        groups={groups}
                        onPick={(u) => pickChild(i, j, u)}
                      />
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <SmallBtn onClick={() => moveChild(i, j, -1)} disabled={j === 0} title="Naik">
                        ↑
                      </SmallBtn>
                      <SmallBtn
                        onClick={() => moveChild(i, j, 1)}
                        disabled={j === row.children.length - 1}
                        title="Turun"
                      >
                        ↓
                      </SmallBtn>
                      <SmallBtn onClick={() => removeChild(i, j)} title="Hapus sub-menu" danger>
                        ✕
                      </SmallBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Kaki baris */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name={`nav_enabled_${i}`}
                  checked={row.enabled}
                  onChange={(e) => updateRow(i, { enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#ff5e3a]"
                />
                <span className="text-sm">Tampilkan di navbar</span>
              </label>
              <button
                type="button"
                onClick={() => addChild(i)}
                disabled={row.children.length >= MAX_NAV_CHILDREN}
                className="text-sm text-accent hover:underline font-medium disabled:opacity-40 disabled:no-underline"
              >
                + Tambah sub-menu
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Dropdown bantu pemilihan URL
function UrlPicker({
  options,
  groups,
  onPick,
}: {
  options: Opt[]
  groups: string[]
  onPick: (url: string) => void
}) {
  return (
    <select
      value=""
      onChange={(e) => onPick(e.target.value)}
      className="border rounded-lg px-2 py-2 bg-white text-sm max-w-[42%]"
      title="Pilih tujuan yang tersedia"
    >
      <option value="">Pilih…</option>
      {groups.map((g) => (
        <optgroup key={g} label={g}>
          {options
            .filter((o) => o.group === g)
            .map((o) => (
              <option key={`${g}-${o.url}`} value={o.url}>
                {o.label}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  )
}

// Tombol kecil (↑ ↓ ✕)
function SmallBtn({
  children,
  onClick,
  disabled,
  title,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  title: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={
        'px-2 py-1.5 border rounded text-xs disabled:opacity-30 ' +
        (danger ? 'text-red-600 hover:bg-red-50' : 'hover:bg-gray-50')
      }
    >
      {children}
    </button>
  )
}
