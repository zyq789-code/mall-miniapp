import { describe, expect, it } from 'vitest'
import { calcPointsDeduction, earnBySpend, canSignIn } from '../src/services/points.service'
import { levelOf, levelName, pointsRate } from '../src/services/member.service'

describe('points', () => {
  it('100积分抵1元，单笔上限20%', () => {
    expect(calcPointsDeduction(1000, 10000)).toBe(1000)      // 10元抵扣上限=2000，积分抵10元
    expect(calcPointsDeduction(3000, 10000)).toBe(2000)      // 积分够但上限20%
    expect(calcPointsDeduction(50, 10000)).toBe(0)           // 积分不足100不抵
    expect(calcPointsDeduction(500, 500)).toBe(100)          // 20%上限=100，不超实付
  })
  it('按实付返积分', () => { expect(earnBySpend(12345, 1)).toBe(123) })
  it('小数返积比例取整', () => { expect(earnBySpend(12345, 1.5)).toBe(185) })
  it('签到当天幂等', () => {
    expect(canSignIn('2026-08-11', '2026-08-11')).toBe(false)
    expect(canSignIn('2026-08-10', '2026-08-11')).toBe(true)
  })
})
describe('member', () => {
  it('等级阈值判定', () => {
    expect(levelOf(0)).toBe(0); expect(levelOf(999)).toBe(0)
    expect(levelOf(1000)).toBe(1); expect(levelOf(5000)).toBe(2); expect(levelOf(20000)).toBe(3)
  })
  it('等级名称与返积倍数', () => {
    expect(levelName(2)).toBe('银牌会员')
    expect(pointsRate(3)).toBe(2)
  })
})
