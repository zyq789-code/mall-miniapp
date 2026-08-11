<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Order } from '../../models/order'
import { getOrder } from '../../api/order.api'
import { formatTime } from '../../utils/format'
import EmptyView from '../../components/ui/EmptyView.vue'

interface TraceNode { label: string; time: number; desc: string; active: boolean }

const STATUS_TEXT: Record<string, string> = {
  pending_pay: '待付款', pending_ship: '待发货', pending_receive: '待收货', completed: '已完成', canceled: '已取消',
}

const order = ref<Order | null>(null)
onLoad((q) => {
  const orderId = typeof q?.orderId === 'string' ? q?.orderId : ''
  order.value = getOrder(orderId) ?? null
})

const trace = computed<TraceNode[]>(() => {
  const o = order.value
  if (!o) return []
  const base = o.shipTime ?? o.createTime
  if (o.status === 'pending_ship') {
    return [{ label: '商家已接单', time: base, desc: '等待卖家发货', active: true }]
  }
  const H = 3600 * 1000
  const received = o.status === 'completed'
  const signTime = received ? (o.receiveTime ?? base + 12 * H) : base + 12 * H
  return [
    { label: '已签收', time: signTime, desc: '包裹已签收，感谢您的购物', active: received },
    { label: '派送中', time: base + 8 * H, desc: '快递员正在派送，请保持电话畅通', active: true },
    { label: '运输中', time: base + 4 * H, desc: '包裹正在运输途中', active: true },
    { label: '已揽收', time: base, desc: '卖家已发货，快递已揽收', active: true },
  ]
})
</script>
<template>
  <view class="page">
    <EmptyView v-if="!order" text="暂无物流信息" />
    <template v-else>
      <view class="head-card">
        <view class="status">{{ STATUS_TEXT[order.status] }}</view>
        <view class="no">订单号 {{ order.orderNo }}</view>
      </view>
      <view class="card timeline">
        <view v-for="(n, i) in trace" :key="n.label" class="node">
          <view class="left">
            <view class="dot" :class="{ on: n.active }" />
            <view v-if="i < trace.length - 1" class="line" :class="{ on: n.active }" />
          </view>
          <view class="content">
            <view class="label" :class="{ on: n.active }">{{ n.label }}</view>
            <view class="desc">{{ n.desc }}</view>
            <view class="time">{{ formatTime(n.time) }}</view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>
<style scoped lang="scss">
.page { padding: 24rpx; }
.head-card { background: $brand; color: #fff; border-radius: $radius; padding: 40rpx 32rpx; margin-bottom: 16rpx; }
.head-card .status { font-size: 40rpx; font-weight: 700; }
.head-card .no { font-size: 24rpx; opacity: .85; margin-top: 8rpx; }
.card { background: $card; border-radius: $radius; padding: 24rpx; }
.timeline { padding: 32rpx 24rpx; }
.node { display: flex; }
.left { display: flex; flex-direction: column; align-items: center; width: 32rpx; margin-right: 20rpx; }
.dot { width: 20rpx; height: 20rpx; border-radius: 50%; background: $line; margin-top: 8rpx; flex-shrink: 0; }
.dot.on { background: $brand; }
.line { width: 2rpx; flex: 1; background: $line; min-height: 80rpx; margin: 6rpx 0; }
.line.on { background: $brand; }
.content { flex: 1; padding-bottom: 32rpx; }
.node:last-child .content { padding-bottom: 0; }
.label { font-size: 30rpx; color: $text3; }
.label.on { color: $text; font-weight: 700; }
.desc { font-size: 24rpx; color: $text3; margin-top: 6rpx; }
.time { font-size: 24rpx; color: $text3; margin-top: 4rpx; }
</style>
