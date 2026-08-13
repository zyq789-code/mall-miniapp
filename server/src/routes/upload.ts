import { Router } from 'express'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
// 上传目录：环境变量 UPLOAD_DIR 覆盖（Nginx 通过 /uploads 静态服务）
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads')
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// POST /api/upload —— 管理员上传图片（base64）
// body: { data: "data:image/png;base64,..." }  → 返回 { url: "/uploads/mall/xxx.png" }
router.post('/', requireAuth, (req, res) => {
  const { data } = (req.body ?? {}) as { data?: unknown }
  if (typeof data !== 'string' || !data) {
    return res.status(400).json({ success: false, message: '缺少图片数据' })
  }
  const match = /^data:image\/(\w+);base64,(.+)$/.exec(data)
  if (!match) {
    return res.status(400).json({ success: false, message: '仅支持 image/png、image/jpeg 等图片格式' })
  }
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
  const buf = Buffer.from(match[2], 'base64')
  if (!buf.length || buf.length > MAX_SIZE) {
    return res.status(400).json({ success: false, message: '图片数据无效或超过 5MB 限制' })
  }
  const dir = join(UPLOAD_DIR, 'mall')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const filename = `${Date.now()}.${ext}`
  writeFileSync(join(dir, filename), buf)
  res.json({ success: true, data: { url: `/uploads/mall/${filename}` } })
})

export default router
