import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { verifyToken } from './auth.js'

/** Payload embedded in user JWTs at register/login. */
export interface UserPayload {
  username: string
  role: 'user'
  userId: string
}

/**
 * Express middleware guarding user-only endpoints.
 * Expects `Authorization: Bearer <token>`; verifies the JWT carries
 * `role: 'user'` and stashes the payload on `res.locals.user`.
 * Missing/invalid/admin token → 401.
 */
export function requireUser(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: '未授权' })
    return
  }

  const token = header.slice('Bearer '.length).trim()
  if (!token) {
    res.status(401).json({ success: false, message: '未授权' })
    return
  }

  const payload = verifyToken(token)
  if (!payload || payload.role !== 'user') {
    res.status(401).json({ success: false, message: '未授权' })
    return
  }

  res.locals.user = payload as jwt.JwtPayload & UserPayload
  next()
}
