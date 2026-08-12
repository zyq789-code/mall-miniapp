const BASE_URL = '/api'

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

interface ApiEnvelope<T> {
  success?: boolean
  data?: T
  message?: string
}

/**
 * Minimal fetch wrapper for the mall backend.
 * - baseURL 固定为 '/api'，由 vite dev server 代理到后端。
 * - 自动从 localStorage 带上 `Authorization: Bearer <token>`。
 * - 非 2xx 抛错，错误信息优先读取响应体的 `message`。
 * - 成功时解包后端统一信封 `{ success, data }`，返回 `data`。
 */
export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new Error('网络错误，请检查后端服务是否已启动')
  }

  let payload: ApiEnvelope<T> | null = null
  try {
    payload = (await res.json()) as ApiEnvelope<T>
  } catch {
    payload = null
  }

  if (!res.ok) {
    throw new Error(payload?.message ?? `请求失败（HTTP ${res.status}）`)
  }

  return payload?.data ?? (payload as unknown as T)
}
