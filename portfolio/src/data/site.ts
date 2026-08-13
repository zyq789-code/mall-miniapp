export interface SkillGroup {
  id: string
  title: string
  icon: string
  accent: string
  skills: string[]
}

export interface ProjectLink {
  label: string
  href: string
  external?: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  tags: string[]
  links?: ProjectLink[]
  featured?: boolean
}

export const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: '#about', label: '关于' },
  { href: '#skills', label: '技能' },
  { href: '#projects', label: '作品' },
  { href: '#contact', label: '联系' },
]

export const PROFILE = {
  name: '赵永淇',
  role: 'JAVA后端工程师',
  tagline:
    '后端出身，亲手从零交付了完整的前端全栈项目——从设计、开发到阿里云部署。',
  about:
    '热爱编程，JAVA 后端基础扎实，同时具备独立交付前端项目的能力（Vue / React / TS + Node 后端 + 部署）。学习能力强，乐于拥抱新技术，正在求职前端 / 全栈方向。',
}

export const SKILL_GROUPS: SkillGroup[] = [
  {
    id: 'backend',
    title: '后端',
    icon: 'backend',
    accent: '#1379ff',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Python FastAPI', 'Node.js Express'],
  },
  {
    id: 'frontend',
    title: '前端',
    icon: 'frontend',
    accent: '#7c5cff',
    skills: ['Vue3', 'uni-app', 'React', 'TypeScript', 'HTML', 'CSS'],
  },
  {
    id: 'engineering',
    title: '工程',
    icon: 'engineering',
    accent: '#0ea5a4',
    skills: ['Git', 'Docker', 'Nginx', 'Linux', '阿里云部署', '单元测试（TDD，59 tests，99% 覆盖率）'],
  },
]

export const PROJECTS: Project[] = [
  {
    id: 'mall-miniapp',
    name: '商城购物小程序',
    description:
      '专业级电商商城，26 个页面（商品 / 购物车 / 优惠券 / 积分 / 订单 / 售后），uni-app + Node/Express + SQLite + React 管理后台，全栈公网部署。',
    tags: ['uni-app', 'Vue3', 'TypeScript', 'Node.js', 'Express', 'SQLite', 'React'],
    links: [
      { label: '在线访问', href: 'http://8.163.34.25', external: true },
      { label: 'GitHub', href: 'https://github.com/zyq789-code/mall-miniapp', external: true },
    ],
    featured: true,
  },
  {
    id: 'ai-shopping-guide',
    name: '电商 AI 智能导购系统',
    description: 'AI 客服自动处理查单 / 退换货，FastAPI + Next.js，Docker + CI 高可用架构。',
    tags: ['Python', 'FastAPI', 'Next.js', 'Docker', 'CI/CD'],
  },
  {
    id: 'rag-knowledge',
    name: 'RAG 知识库系统',
    description: '基于检索增强生成（RAG）的知识库问答系统。',
    tags: ['RAG', 'Python', 'LLM', '向量检索'],
  },
  {
    id: 'data-dashboard',
    name: '智能数据看板',
    description: '数据可视化分析看板，直观呈现业务核心指标。',
    tags: ['Vue3', 'ECharts', 'Node.js'],
  },
  {
    id: 'score-management',
    name: '学生成绩管理系统',
    description: '学生成绩信息管理，覆盖录入、查询、统计与分析。',
    tags: ['Spring Boot', 'Java', 'MySQL'],
  },
]

export const CONTACT_LINKS: Array<{ label: string; value: string; href: string }> = [
  { label: 'GitHub', value: 'github.com/zyq789-code', href: 'https://github.com/zyq789-code' },
  { label: '邮箱', value: '1417714697@qq.com', href: 'mailto:1417714697@qq.com' },
]
