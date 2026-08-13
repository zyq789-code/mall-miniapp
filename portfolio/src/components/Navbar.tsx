import { useEffect, useState } from 'react'
import { NAV_LINKS, PROFILE } from '../data/site'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => setOpen(false)

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <a href="#top" className="navbar__brand" onClick={closeMenu}>
          {PROFILE.name}
        </a>

        <nav className={`navbar__menu${open ? ' navbar__menu--open' : ''}`} aria-label="主导航">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="navbar__link" onClick={closeMenu}>
              {link.label}
            </a>
          ))}
          <a href="#contact" className="navbar__cta" onClick={closeMenu}>
            联系我
          </a>
        </nav>

        <button
          type="button"
          className={`navbar__toggle${open ? ' navbar__toggle--open' : ''}`}
          aria-label={open ? '关闭菜单' : '打开菜单'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
