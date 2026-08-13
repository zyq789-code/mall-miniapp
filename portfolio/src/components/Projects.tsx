import { PROJECTS, type Project } from '../data/site'
import { Reveal } from './Reveal'

function ExternalIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const cardClass = project.featured ? 'project-card project-card--featured' : 'project-card'

  return (
    <article className={cardClass}>
      {project.featured && (
        <span className="project-card__badge">
          <span aria-hidden="true">★</span> 主推
        </span>
      )}

      <div className="project-card__head">
        <h3 className="project-card__title">{project.name}</h3>
        {project.featured && <span className="project-card__type">全栈 · 已上线</span>}
      </div>

      <p className="project-card__desc">{project.description}</p>

      <ul className="project-card__tags">
        {project.tags.map((tag) => (
          <li key={tag} className="project-tag">
            {tag}
          </li>
        ))}
      </ul>

      {project.links && project.links.length > 0 && (
        <div className="project-card__links">
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className={project.featured ? 'btn btn--small btn--primary' : 'btn btn--small btn--outline'}
            >
              {link.label}
              {link.external && <ExternalIcon />}
            </a>
          ))}
        </div>
      )}
    </article>
  )
}

export function Projects() {
  return (
    <section id="projects" className="section">
      <div className="container">
        <Reveal>
          <div className="section__heading">
            <span className="section__eyebrow">Projects</span>
            <h2 className="section__title">作品集</h2>
            <p className="section__sub">从后端到前端的完整全栈项目实践</p>
          </div>
        </Reveal>

        <div className="projects">
          {PROJECTS.map((project: Project, index: number) => (
            <Reveal
              key={project.id}
              delay={project.featured ? 0 : (index % 3) * 80}
              className={project.featured ? 'projects__reveal projects__reveal--featured' : 'projects__reveal'}
            >
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
