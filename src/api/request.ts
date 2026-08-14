import { API_BASE_URL } from '../utils/config'
import { storage, KEYS } from '../utils/storage'

/** 后端返回的统一信封。 */
interface ApiEnvelope<T> { success?: boolean; data?: T; message?: string }

/** 后端返回非 2xx / success:false 时抛出的错误，statusCode 便于页面区分。 */
export class ApiError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = 'ApiError'
  }
}

/** 读取当前登录用户 token（无则空串）。 */
export function getUserToken(): string {
  return storage.get<string>(KEYS.userToken, '')
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: unknown
  /** 显式传入的用户 token；不传时自动从统一存储读取。 */
  token?: string
}

/**
 * uni.request Promise 封装：按后端 `{ success, data, message }` 信封解包。
 * 带用户 token 的接口自动附加 `Authorization: Bearer <token>`。
 */
export function request<T>(path: string, options?: RequestOptions): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const token = options?.token ?? getUserToken()
    const header: Record<string, string> = {}
    if (token) header.Authorization = `Bearer ${token}`
    uni.request({
      url: `${API_BASE_URL}${path}`,
      method: options?.method ?? 'GET',
      data: options?.data as Record<string, unknown> | undefined,
      header,
      success: (res) => {
        const body = res.data as ApiEnvelope<T> | undefined
        const ok = typeof res.statusCode === 'number' && res.statusCode >= 200 && res.statusCode < 300
        if (ok && body?.success) resolve(body.data as T)
        else reject(new ApiError(body?.message || '请求失败', res.statusCode))
      },
      fail: () => reject(new ApiError('网络连接失败，请稍后重试', 0)),
    })
  })
}
