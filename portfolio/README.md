# 赵永淇 · 个人作品集

JAVA 后端工程师，求职前端 / 全栈方向。本站为个人作品集站点，同时作为前端作品展示 CSS 功底与工程化能力。

## 技术栈

- **Vite + React + TypeScript**（严格模式，无 `any`）
- 纯 CSS 手写样式：CSS 变量 + Flex/Grid，无 UI 框架
- 单页应用，锚点导航，IntersectionObserver 滚动渐显
- 响应式：桌面 3 列网格 → 移动端单列

## 本地开发

```bash
npm install
npm run dev      # 开发
npm run build    # 类型检查 + 构建，产物在 dist/
npm run preview  # 预览构建产物
```

## 结构

```
src/
  components/   # Navbar / Hero / About / Skills / Projects / Contact / Footer / Reveal
  data/site.ts  # 站点数据（技能、作品、联系方式）
  index.css     # 全局样式（CSS 变量 + 布局 + 响应式）
```
