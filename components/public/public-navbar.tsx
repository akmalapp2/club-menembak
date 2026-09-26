'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'
import { DEFAULT_NAV_MENU, visibleNavItems, type NavItem } from '@/lib/nav'

export default function PublicNavbar({
  clubName,
  logoUrl,
  navMenu,
}: {
  clubName: string
  logoUrl?: string
  navMenu?: NavItem[]
}) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false) // menu mobile
  const [dropIdx, setDropIdx] = useState<number | null>(null) // dropdown desktop yang terbuka
  const [mobileIdx, setMobileIdx] = useState<number | null>(null) // accordion mobile yang terbuka
  const desktopRef = useRef<HTMLElement>(null)

  // Pakai menu dari pengaturan (yang aktif & valid); fallback ke default.
  const LINKS = visibleNavItems(navMenu && navMenu.length ? navMenu : DEFAULT_NAV_MENU)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Tutup dropdown desktop saat klik di luar navbar atau tekan Esc.
  useEffect(() => {
    if (dropIdx === null) return
    const onDown = (e: PointerEvent) => {
      if (desktopRef.current && !desktopRef.current.contains(e.target as Node)) {
        setDropIdx(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropIdx(null)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [dropIdx])

  const closeMobile = () => {
    setOpen(false)
    setMobileIdx(null)
  }

  const linkCls =
    'px-2.5 py-2 rounded-lg text-sm font-display font-semibold uppercase tracking-wide transition-colors whitespace-nowrap '

  return (
    <header
      className={'fixed top-0 left-0 right-0 z-50 transition-all ' + (scrolled ? 'shadow-lg py-3' : 'py-4')}
      style={{ backgroundColor: 'var(--brand-primary)' }}
    >
      <div className="max-w-7xl mx-auto px-5 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/#beranda" className="flex items-center gap-2.5">
          {logoUrl ? (
            <span className="relative w-9 h-9 rounded-lg overflow-hidden bg-white grid place-items-center">
              <Image src={logoUrl} alt={clubName} fill sizes="36px" className="object-contain" />
            </span>
          ) : (
            <span className="w-9 h-9 rounded-lg grid place-items-center text-white font-bold text-lg grad-accent">
              ◎
            </span>
          )}
          <span className="font-display text-lg font-bold text-white uppercase tracking-wide hidden sm:block shrink-0">
            {clubName}
          </span>
        </Link>

        {/* ===== Menu desktop ===== */}
        <nav ref={desktopRef} className="hidden lg:flex items-center gap-0.5">
          {LINKS.map((l, i) => {
            const kids = l.children ?? []
            const key = `${i}-${l.label}`

            // Tautan biasa
            if (kids.length === 0) {
              return (
                <Link
                  key={key}
                  href={l.url}
                  className={linkCls + 'text-[#8890b5] hover:text-white hover:bg-[#151b3d]'}
                >
                  {l.label}
                </Link>
              )
            }

            // Dropdown (klik untuk buka/tutup)
            const isOpen = dropIdx === i
            const panelId = `nav-drop-${i}`
            // Dua menu terakhir: panel rata kanan agar tidak keluar layar.
            const alignRight = i >= LINKS.length - 2
            return (
              <div key={key} className="relative">
                <button
                  type="button"
                  onClick={() => setDropIdx(isOpen ? null : i)}
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className={
                    linkCls +
                    'inline-flex items-center gap-1 ' +
                    (isOpen
                      ? 'text-white bg-[#151b3d]'
                      : 'text-[#8890b5] hover:text-white hover:bg-[#151b3d]')
                  }
                >
                  {l.label}
                  <ChevronDown
                    className={'w-3.5 h-3.5 transition-transform ' + (isOpen ? 'rotate-180' : '')}
                  />
                </button>
                {isOpen && (
                  <div
                    id={panelId}
                    className={
                      'absolute top-full mt-2 min-w-[210px] rounded-xl p-1.5 flex flex-col gap-0.5 bg-brand-soft shadow-[0_12px_30px_rgba(10,14,39,0.4)] ' +
                      (alignRight ? 'right-0' : 'left-0')
                    }
                  >
                    {kids.map((k, j) => (
                      <Link
                        key={`${j}-${k.url}`}
                        href={k.url}
                        onClick={() => setDropIdx(null)}
                        className="px-3 py-2.5 rounded-lg text-sm text-[#cdd2e8] hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
                      >
                        {k.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          <Link
            href="/login"
            className="ml-2 px-4 py-2 rounded-lg text-sm font-display font-semibold uppercase tracking-wide text-white grad-accent hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            Masuk
          </Link>
        </nav>

        {/* Tombol menu mobile */}
        <button
          onClick={() => (open ? closeMobile() : setOpen(true))}
          className="lg:hidden text-white p-1"
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* ===== Menu mobile (accordion untuk grup) ===== */}
      {open && (
        <nav
          className="lg:hidden border-t border-[#1e2547] px-5 py-3 space-y-1 max-h-[calc(100vh-4.5rem)] overflow-y-auto"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          {LINKS.map((l, i) => {
            const kids = l.children ?? []
            const key = `${i}-${l.label}`

            if (kids.length === 0) {
              return (
                <Link
                  key={key}
                  href={l.url}
                  onClick={closeMobile}
                  className="block px-3 py-2.5 rounded-lg text-sm font-display font-semibold uppercase tracking-wide text-[#8890b5] hover:text-white hover:bg-[#151b3d]"
                >
                  {l.label}
                </Link>
              )
            }

            const isOpen = mobileIdx === i
            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() => setMobileIdx(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className={
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-display font-semibold uppercase tracking-wide hover:text-white hover:bg-[#151b3d] ' +
                    (isOpen ? 'text-white' : 'text-[#8890b5]')
                  }
                >
                  {l.label}
                  <ChevronDown
                    className={'w-4 h-4 transition-transform ' + (isOpen ? 'rotate-180' : '')}
                  />
                </button>
                {isOpen && (
                  <div className="ml-3 pl-3 mt-1 mb-1 border-l-2 border-[#1e2547] space-y-0.5">
                    {kids.map((k, j) => (
                      <Link
                        key={`${j}-${k.url}`}
                        href={k.url}
                        onClick={closeMobile}
                        className="block px-3 py-2 rounded-lg text-sm text-[#9aa1c4] hover:text-white hover:bg-[#151b3d]"
                      >
                        {k.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          <Link
            href="/login"
            onClick={closeMobile}
            className="block px-3 py-2.5 rounded-lg text-sm font-display font-semibold uppercase tracking-wide text-white grad-accent text-center"
          >
            Masuk
          </Link>
        </nav>
      )}
    </header>
  )
}
