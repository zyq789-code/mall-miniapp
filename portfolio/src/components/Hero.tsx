import { PROFILE } from '../data/site'

export function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero__glow hero__glow--a" aria-hidden="true" />
      <div className="hero__glow hero__glow--b" aria-hidden="true" />

      <div className="hero__inner">
        <span className="hero__badge">
          <span className="hero__badge-dot" aria-hidden="true" />
          求职中 · 前端 / 全栈方向
        </span>

        <h1 className="hero__name">{PROFILE.name}</h1>
        <p className="hero__role">{PROFILE.role}</p>
        <p className="hero__tagline">{PROFILE.tagline}</p>

        <div className="hero__actions">
          <a href="#projects" className="btn btn--primary">
            查看作品
          </a>
          <a href="#contact" className="btn btn--ghost">
            联系我
          </a>
        </div>
      </div>

      <a href="#about" className="hero__scroll" aria-label="向下滚动">
        <span />
      </a>
    </section>
  )
}
