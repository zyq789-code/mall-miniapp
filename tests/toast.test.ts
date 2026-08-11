import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BusinessError, ERR } from '../src/utils/errors'
import { tryRun, toast } from '../src/utils/toast'

const showToast = vi.fn()

beforeEach(() => {
  showToast.mockReset()
  ;(globalThis as unknown as { uni: { showToast: typeof showToast } }).uni = { showToast }
})

describe('toast', () => {
  it('tryRun 捕获 BusinessError 并 toast 其消息', () => {
    tryRun(() => { throw new BusinessError(ERR.OUT_OF_STOCK, '库存不足') })
    expect(showToast).toHaveBeenCalledWith({ title: '库存不足', icon: 'none' })
  })

  it('tryRun 正常执行不弹 toast', () => {
    const fn = vi.fn()
    tryRun(fn)
    expect(fn).toHaveBeenCalled()
    expect(showToast).not.toHaveBeenCalled()
  })

  it('tryRun 非业务错误继续抛出', () => {
    expect(() => tryRun(() => { throw new Error('boom') })).toThrow('boom')
    expect(showToast).not.toHaveBeenCalled()
  })

  it('toast 快捷函数', () => {
    toast('提示文案')
    expect(showToast).toHaveBeenCalledWith({ title: '提示文案', icon: 'none' })
  })
})
