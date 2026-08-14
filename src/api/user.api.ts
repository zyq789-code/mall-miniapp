import type { Member } from '../models/member'
import { request } from './request'

/** 后端用户 DTO（/api/user/* 的原始返回）。 */
export interface UserProfile {
  id: string
  username: string
  nickname: string | null
  avatar: string | null
  points: number
  totalSpent: number
  lastSignIn: string | null
}

/** 登录/注册成功返回：JWT + 用户资料。 */
export interface AuthResult { token: string; user: Member }

/** 签到成功返回：最新积分与今日签到日期。 */
export interface SigninResult { points: number; lastSignIn: string }

/** 后端 DTO → 前端 Member（null → 默认值）。 */
export function toMember(u: UserProfile): Member {
  return {
    id: u.id,
    username: u.username,
    nickname: u.nickname || u.username,
    avatar: u.avatar || '',
    points: u.points ?? 0,
    totalSpent: u.totalSpent ?? 0,
    lastSignIn: u.lastSignIn ?? null,
  }
}

/** 注册新用户 → POST /api/user/register，成功后直接登录。 */
export async function register(username: string, password: string, nickname?: string): Promise<AuthResult> {
  const data = await request<{ token: string; user: UserProfile }>('/user/register', {
    method: 'POST',
    data: { username, password, nickname },
  })
  return { token: data.token, user: toMember(data.user) }
}

/** 登录 → POST /api/user/login。 */
export async function login(username: string, password: string): Promise<AuthResult> {
  const data = await request<{ token: string; user: UserProfile }>('/user/login', {
    method: 'POST',
    data: { username, password },
  })
  return { token: data.token, user: toMember(data.user) }
}

/** 当前用户资料 → GET /api/user/profile（带用户 token）。 */
export async function getProfile(): Promise<Member> {
  const data = await request<UserProfile>('/user/profile')
  return toMember(data)
}

/** 更新昵称/头像 → PUT /api/user/profile。 */
export async function updateProfile(patch: { nickname?: string; avatar?: string }): Promise<Member> {
  const data = await request<UserProfile>('/user/profile', { method: 'PUT', data: patch })
  return toMember(data)
}

/** 每日签到 +10 积分 → POST /api/user/signin（带用户 token）。 */
export function signin(): Promise<SigninResult> {
  return request<SigninResult>('/user/signin', { method: 'POST' })
}
