import { request } from './client'

export interface LoginResult {
  token: string
  username: string
  nickname: string
}

/** 管理后台登录：POST /api/auth/login → { token, username, nickname } */
export function login(username: string, password: string): Promise<LoginResult> {
  return request<LoginResult>('/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}
