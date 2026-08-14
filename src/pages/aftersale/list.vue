<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { AfterSale } from '../../models/aftersale'
import { getOrders } from '../../api/order.api'
import { getAfterSales } from '../../api/userExtras.api'
import { formatTime } from '../../utils/format'
import EmptyView from '../../components/ui/EmptyView.vue'

const STATUS_TEXT: Record<string, string> = {
  pending: '待处理', approved: '已同意', refunded: '已退款', rejected: '已拒绝',
}
const TYPE_TEXT: Record<string, string> = {
  refund: '仅退款', return: '退货退款',
}

const list = ref<AfterSale[]>([])
const orderNoMap = ref<Record<string, string>>({})
const load = async () => {
  // 当前用户自己的售后记录（需登录；未登录/token 失效则置空）
  try {
    list.value = await getAfterSales()
  } catch {
    list.value = []
  }
  // 订单号从后端"我的订单"拉取后建映射（失败不阻断列表展示）
  const map: Record<string, string> = {}
  try {
    const allOrders = await getOrders()
    allOrders.forEach(o => { map[o.id] = o.orderNo })
  } catch {
    /* ignore */
  }
  orderNoMap.value = map
}
onShow(load)
</script>
<template>
  <view class="page">
    <EmptyView v-if="!list.length" text="暂无售后记录" />
    <view v-for="a in list" :key="a.id" class="card">
      <view class="head">
        <text class="no">订单 {{ orderNoMap[a.orderId] ?? '—' }}</text>
        <text class="status" :class="a.status">{{ STATUS_TEXT[a.status] }}</text>
      </view>
      <view class="body">
        <view class="row"><text>类型</text><text>{{ TYPE_TEXT[a.type] }}</text></view>
        <view class="row"><text>申请时间</text><text>{{ formatTime(a.applyTime) }}</text></view>
        <view class="reason"><text class="label">原因：</text><text>{{ a.reason }}</text></view>
      </view>
    </view>
  </view>
</template>
<style scoped lang="scss">
.page { padding-bottom: 40rpx; }
.card { background: $card; margin: 16rpx; border-radius: $radius; padding: 24rpx; }
.head { display: flex; justify-content: space-between; font-size: 24rpx; color: $text2; border-bottom: 1rpx solid $line; padding-bottom: 16rpx; }
.status { font-weight: 600; }
.status.pending { color: $warn; }
.status.approved { color: $brand; }
.status.refunded { color: $success; }
.status.rejected { color: $text3; }
.body { padding: 16rpx 0; }
.row { display: flex; justify-content: space-between; color: $text2; font-size: 26rpx; padding: 8rpx 0; }
.reason { display: flex; margin-top: 8rpx; font-size: 26rpx; color: $text; }
.reason .label { color: $text2; flex-shrink: 0; }
</style>
