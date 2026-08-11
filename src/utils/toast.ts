// src/utils/toast.ts —— BusinessError → 页面 toast；其他错误继续抛
import { BusinessError } from './errors'

export function tryRun(fn: () => void) {
  try { fn() }
  catch (e) {
    if (e instanceof BusinessError) uni.showToast({ title: e.message, icon: 'none' })
    else throw e
  }
}

export const toast = (title: string) => uni.showToast({ title, icon: 'none' })
