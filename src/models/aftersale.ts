export type AfterSaleStatus = 'pending' | 'approved' | 'refunded' | 'rejected'
export type AfterSaleType = 'refund' | 'return'
export interface AfterSale { id: string; orderId: string; type: AfterSaleType; status: AfterSaleStatus; reason: string; applyTime: number }
