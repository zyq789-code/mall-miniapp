<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { AfterSale } from '../../models/aftersale'
import { getOrder } from '../../api/order.api'
import { storage, KEYS } from '../../utils/storage'
import { formatTime } from '../../utils/format'
import { approve, refund, reject } from '../../services/aftersale.service'
import EmptyView from '../../components/ui/EmptyView.vue'

const STATUS_TEXT: Record<string, string> = {
  pending: '待处理', approved: '已同意', refunded: '已退款', rejected: '已拒绝',
}
const TYPE_TEXT: Record<string, string> = {
  refund: '仅退款', return: '退货退款',
}

const list = ref<AfterSale[]>([])
const load = () => {
  const all = storage.get<AfterSale[]>(KEYS.aftersales, [])
  list.value = [...all].sort((a, b) => b.applyTime - a.applyTime)
}
onShow(load)

function update(id: string, updater: (a: AfterSale) => AfterSale) {
  const all = storage.get<AfterSale[]>(KEYS.aftersales, [])
  storage.set(KEYS.aftersales, all.map(x => (x.id === id ? updater(x) : x)))
  load()
}
function run(a: AfterSale, updater: (x: AfterSale) => AfterSale) {
  try {
    update(a.id, updater)
    uni.showToast({ title: '操作成功', icon: 'none' })
  } catch {
    uni.showToast({ title: '当前状态不可操作', icon: 'none' })
  }
}
const onApprove = (a: AfterSale) => run(a, approve)
const onRefund = (a: AfterSale) => run(a, refund)
const onReject = (a: AfterSale) => run(a, reject)
const onReappeal = (a: AfterSale) => update(a.id, x => ({ ...x, status: 'pending', applyTime: Date.now() }))
const orderNoOf = (orderId: string) => getOrder(orderId)?.orderNo ?? '—'
</script>
<template>
  <view class="page">
    <EmptyView v-if="!list.length" text="暂无售后记录" />
    <view v-for="a in list" :key="a.id" class="card">
      <view class="head">
        <text class="no">订单 {{ orderNoOf(a.orderId) }}</text>
        <text class="status" :class="a.status">{{ STATUS_TEXT[a.status] }}</text>
      </view>
      <view class="body">
        <view class="row"><text>类型</text><text>{{ TYPE_TEXT[a.type] }}</text></view>
        <view class="row"><text>申请时间</text><text>{{ formatTime(a.applyTime) }}</text></view>
        <view class="reason"><text class="label">原因：</text><text>{{ a.reason }}</text></view>
      </view>
      <view class="foot">
        <template v-if="a.status === 'pending'">
          <view class="btn ghost" @tap="onReject(a)">拒绝</view>
          <view class="btn" @tap="onApprove(a)">同意</view>
        </template>
        <view v-else-if="a.status === 'approved'" class="btn" @tap="onRefund(a)">退款</view>
        <view v-else-if="a.status === 'rejected'" class="btn" @tap="onReappeal(a)">再申诉</view>
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
.foot { display: flex; justify-content: flex-end; gap: 16rpx; border-top: 1rpx solid $line; padding-top: 20rpx; }
.btn { background: $brand; color: #fff; padding: 14rpx 36rpx; border-radius: $radius; font-size: 26rpx; }
.btn.ghost { background: $card; color: $text2; border: 1rpx solid $line; }
</style>
