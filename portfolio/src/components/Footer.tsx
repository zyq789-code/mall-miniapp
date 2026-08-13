import { PROFILE } from '../data/site'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p className="footer__text">
          © {new Date().getFullYear()} {PROFILE.name} · JAVA后端工程师 · 用 React 与爱构建
        </p>
      </div>
    </footer>
  )
}
