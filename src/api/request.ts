import { API_BASE_URL } from '../utils/config'

/** 后端返回的统一信封。 */
interface ApiEnvelope<T> { success?: boolean; data?: T; message?: string }

/** 后端返回非 2xx / success:false 时抛出的错误，statusCode 便于页面区分。 */
export class ApiError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = 'ApiError'
  }
}

/** uni.request Promise 封装：按后端 `{ success, data, message }` 信封解包。 */
export function request<T>(path: string, options?: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; data?: unknown }): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${path}`,
      method: options?.method ?? 'GET',
      data: options?.data as Record<string, unknown> | undefined,
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
