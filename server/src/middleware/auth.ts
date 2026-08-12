import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config.js'

/** Payload embedded in admin JWTs at login. */
export interface AdminPayload {
  username: string
  role: 'admin'
}

/**
 * Express middleware guarding admin write operations.
 * Expects `Authorization: Bearer <token>`; verifies the JWT and stashes
 * the payload on `res.locals.admin`. Missing/invalid token → 401.
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

  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & AdminPayload
    res.locals.admin = payload
    next()
  } catch {
    res.status(401).json({ success: false, message: '未授权' })
  }
}
