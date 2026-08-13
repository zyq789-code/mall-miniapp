import { PROFILE } from '../data/site'
import { Reveal } from './Reveal'

export function About() {
  return (
    <section id="about" className="section">
      <div className="container">
        <Reveal>
          <div className="section__heading">
            <span className="section__eyebrow">About</span>
            <h2 className="section__title">关于我</h2>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="about">
            <p className="about__text">{PROFILE.about}</p>
            <div className="about__highlights">
              <div className="about__item">
                <span className="about__num">26</span>
                <span className="about__label">电商小程序页面</span>
              </div>
              <div className="about__item">
                <span className="about__num">59</span>
                <span className="about__label">单元测试用例</span>
              </div>
              <div className="about__item">
                <span className="about__num">99%</span>
                <span className="about__label">测试覆盖率</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
