import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

/** 受保护路由守卫：无 token 时跳转登录页。 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
