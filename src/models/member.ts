export interface Member { id: string; nickname: string; avatar: string; level: number; points: number; totalSpent: number }
export const LEVEL_THRESHOLDS = [0, 1000, 5000, 20000]
export const LEVEL_NAMES = ['普通会员', '铜牌会员', '银牌会员', '金牌会员']
export const LEVEL_RATES = [1, 1.2, 1.5, 2]   // 返积分倍数
