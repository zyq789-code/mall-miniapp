import { Router } from 'express'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { JWT_SECRET } from '../config.js'
import { requireUser, type UserPayload } from '../middleware/userAuth.js'

const router = Router()

interface UserRow {
  id: string
  username: string
  password: string
  nickname: string | null
  avatar: string | null
  points: number
  total_spent: number
  last_sign_in: string | null
}

interface UserDto {
  id: string
  username: string
  nickname: string | null
  avatar: string | null
  points: number
  totalSpent: number
  lastSignIn: string | null
}

function toDTO(row: UserRow): UserDto {
  return {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    avatar: row.avatar,
    points: row.points,
    totalSpent: row.total_spent,
    lastSignIn: row.last_sign_in,
  }
}

function getUserByUsername(username: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined
}

function getUserById(id: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
}

/** Sign a user JWT. Role 'user' keeps it distinct from the admin token. */
function signToken(user: UserRow): string {
  return jwt.sign({ username: user.username, role: 'user', userId: user.id }, JWT_SECRET, {
    expiresIn: '30d',
  })
}

/** Local date key 'YYYY-MM-DD' (server timezone), used for daily sign-in. */
function todayKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Register a normal user. Body: `{ username, password, nickname? }`.
 * Success → 201 `{ token, user }`.
 */
router.post('/register', (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const username = typeof body.username === 'string' ? body.username.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const nickname =
      typeof body.nickname === 'string' && body.nickname.trim() ? body.nickname.trim() : username

    if (username.length < 3) {
      res.status(400).json({ success: false, message: '用户名至少 3 个字符' })
      return
    }
    if (password.length < 6) {
      res.status(400).json({ success: false, message: '密码至少 6 个字符' })
      return
    }
    if (getUserByUsername(username)) {
      res.status(400).json({ success: false, message: '用户名已存在' })
      return
    }

    const id = `u${Date.now()}`
    // Demo: plaintext password. Production must store and compare password hashes (e.g. bcrypt/argon2).
    db.prepare(
      'INSERT INTO users (id, username, password, nickname, avatar, points, total_spent, last_sign_in) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(id, username, password, nickname, null, 0, 0, null)

    const user = getUserById(id) as UserRow
    const token = signToken(user)
    res.status(201).json({ success: true, data: { token, user: toDTO(user) } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/**
 * User login. Body: `{ username, password }`.
 * Success → `{ token, user }`; failure → 401.
 */
router.post('/login', (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const username = typeof body.username === 'string' ? body.username.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!username || !password) {
      res.status(400).json({ success: false, message: '用户名和密码不能为空' })
      return
    }

    const user = getUserByUsername(username)
    // Demo: plaintext comparison. Production must store and compare password hashes (e.g. bcrypt/argon2).
    if (!user || user.password !== password) {
      res.status(401).json({ success: false, message: '用户名或密码错误' })
      return
    }

    const token = signToken(user)
    res.json({ success: true, data: { token, user: toDTO(user) } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** Current user's profile. */
router.get('/profile', requireUser, (req, res) => {
  try {
    const payload = res.locals.user as UserPayload
    const user = getUserById(payload.userId)
    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' })
      return
    }
    res.json({ success: true, data: toDTO(user) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** Update nickname/avatar. Body may include either field. */
router.put('/profile', requireUser, (req, res) => {
  try {
    const payload = res.locals.user as UserPayload
    const user = getUserById(payload.userId)
    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' })
      return
    }

    const body = (req.body ?? {}) as Record<string, unknown>
    const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : user.nickname
    const avatar = typeof body.avatar === 'string' ? body.avatar.trim() : user.avatar

    db.prepare('UPDATE users SET nickname = ?, avatar = ? WHERE id = ?').run(nickname, avatar, user.id)
    res.json({ success: true, data: toDTO(getUserById(user.id) as UserRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** Daily sign-in: +10 points once per local calendar day. */
router.post('/signin', requireUser, (req, res) => {
  try {
    const payload = res.locals.user as UserPayload
    const user = getUserById(payload.userId)
    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' })
      return
    }

    const today = todayKey()
    if (user.last_sign_in === today) {
      res.status(400).json({ success: false, message: '今日已签到' })
      return
    }

    const points = (user.points ?? 0) + 10
    db.prepare('UPDATE users SET points = ?, last_sign_in = ? WHERE id = ?').run(points, today, user.id)
    res.json({ success: true, data: { points, lastSignIn: today } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

export default router
