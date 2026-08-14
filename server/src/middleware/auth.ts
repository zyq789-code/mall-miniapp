import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config.js'

/** Payload embedded in admin JWTs at login. */
export interface AdminPayload {
  username: string
  role: 'admin'
}

/** Verify a JWT and return its payload, or null when invalid/expired. Shared by admin/user auth. */
export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
  } catch {
    return null
  }
}

/**
 * Express middleware guarding admin write operations.
 * Expects `Authorization: Bearer <token>`; verifies the JWT carries
 * `role: 'admin'` and stashes the payload on `res.locals.admin`.
 * Missing/invalid/non-admin token → 401.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
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
  if (!payload || payload.role !== 'admin') {
    res.status(401).json({ success: false, message: '未授权' })
    return
  }

  res.locals.admin = payload as jwt.JwtPayload & AdminPayload
  next()
}
