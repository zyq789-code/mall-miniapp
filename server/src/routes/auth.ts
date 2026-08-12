import { Router } from 'express'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { JWT_SECRET } from '../config.js'

const router = Router()

interface UserRow {
  id: string
  username: string
  password: string
  nickname: string
}

/**
 * Admin login. Body: `{ username, password }`.
 * Success → `{ token, username, nickname }`; failure → 401.
 */
router.post('/login', (req, res) => {
  try {
    const body = req.body as Record<string, unknown>
    const username = typeof body.username === 'string' ? body.username.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!username || !password) {
      res.status(400).json({ success: false, message: '用户名和密码不能为空' })
      return
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined

    // Demo: plaintext comparison. Production must store and compare password hashes (e.g. bcrypt/argon2).
    if (!user || user.password !== password) {
      res.status(401).json({ success: false, message: '用户名或密码错误' })
      return
    }

    const token = jwt.sign({ username: user.username, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ success: true, data: { token, username: user.username, nickname: user.nickname } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

export default router
