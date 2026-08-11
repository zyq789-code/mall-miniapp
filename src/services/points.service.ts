export const POINTS_TO_YUAN = 100
export function calcPointsDeduction(points: number, payAmount: number, maxRatio = 0.2): number {
  const maxDeduct = Math.floor(payAmount * maxRatio)
  const byPoints = Math.floor(points / POINTS_TO_YUAN) * 100
  return Math.max(0, Math.min(byPoints, maxDeduct, payAmount))
}
export function earnBySpend(payAmount: number, pointsPerYuan = 1): number {
  return Math.floor((payAmount / 100) * pointsPerYuan)
}
export function canSignIn(lastDay: string, today: string): boolean {
  return lastDay !== today
}
