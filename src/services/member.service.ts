import { LEVEL_THRESHOLDS, LEVEL_NAMES, LEVEL_RATES } from '../models/member'

export function levelOf(totalSpent: number): number {
  let lvl = 0
  LEVEL_THRESHOLDS.forEach((t, i) => { if (totalSpent >= t) lvl = i })
  return lvl
}
export function levelName(level: number): string { return LEVEL_NAMES[level] ?? LEVEL_NAMES[0] }
export function pointsRate(level: number): number { return LEVEL_RATES[level] ?? 1 }
