import { CONTACT_LINKS } from '../data/site'
import { Reveal } from './Reveal'

function ContactIcon({ label }: { label: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (label === '邮箱') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

export function Contact() {
  return (
    <section id="contact" className="section section--alt">
      <div className="container">
        <Reveal>
          <div className="section__heading">
            <span className="section__eyebrow">Contact</span>
            <h2 className="section__title">联系我</h2>
            <p className="section__sub">欢迎交流技术、机会与作品合作</p>
          </div>
        </Reveal>

        <div className="contact">
          {CONTACT_LINKS.map((item, index) => (
            <Reveal key={item.label} delay={index * 100} className="contact__reveal">
              <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="contact-card">
                <span className="contact-card__icon">
                  <ContactIcon label={item.label} />
                </span>
                <span className="contact-card__body">
                  <span className="contact-card__label">{item.label}</span>
                  <span className="contact-card__value">{item.value}</span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
