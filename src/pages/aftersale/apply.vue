<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Order } from '../../models/order'
import type { AfterSaleType } from '../../models/aftersale'
import { getOrder } from '../../api/order.api'
import { createAfterSale } from '../../api/userExtras.api'
import { formatPrice } from '../../utils/format'
import { canApplyAfterSale } from '../../services/order.service'
import EmptyView from '../../components/ui/EmptyView.vue'

const TYPES: { value: AfterSaleType; label: string }[] = [
  { value: 'refund', label: '仅退款' },
  { value: 'return', label: '退货退款' },
]

const order = ref<Order | null>(null)
const type = ref<AfterSaleType>('refund')
const reason = ref('')
const eligible = ref(true)
const submitting = ref(false)

const ineligibleReason = computed(() => {
  const o = order.value
  if (!o) return ''
  if (o.status !== 'pending_receive' && o.status !== 'completed') return '当前订单状态不支持申请售后'
  return '已超过 7 天售后时效，无法申请'
})
const canSubmit = computed(() => !!order.value && eligible.value && !!reason.value.trim())

onLoad(async (q) => {
  const orderId = typeof q?.orderId === 'string' ? q?.orderId : ''
  order.value = (await getOrder(orderId)) ?? null
  if (order.value) eligible.value = canApplyAfterSale(order.value, Date.now())
})

async function submit() {
  const o = order.value
  if (!o || !eligible.value || submitting.value) return
  if (!reason.value.trim()) return uni.showToast({ title: '请填写退款原因', icon: 'none' })
  submitting.value = true
  try {
    await createAfterSale({ orderId: o.id, type: type.value, reason: reason.value.trim() })
    uni.showToast({ title: '已提交，等待商家处理', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 600)
  } catch (e) {
    submitting.value = false
    uni.showToast({ title: e instanceof Error ? e.message : '提交失败', icon: 'none' })
  }
}
</script>
<template>
  <view class="page">
    <EmptyView v-if="!order" text="订单不存在" />
    <template v-else>
      <view class="card">
        <view class="row"><text>订单号</text><text>{{ order.orderNo }}</text></view>
        <view class="row"><text>申请金额</text><text class="price">{{ formatPrice(order.payAmount) }}</text></view>
      </view>
      <view v-if="!eligible" class="card tip">{{ ineligibleReason }}</view>
      <view class="card form">
        <view class="type-row">
          <view v-for="t in TYPES" :key="t.value" class="type" :class="{ on: type === t.value }" @tap="type = t.value">{{ t.label }}</view>
        </view>
        <view class="field">
          <text class="label">退款原因</text>
          <textarea v-model="reason" placeholder="请描述您遇到的问题" maxlength="200" />
        </view>
      </view>
      <view class="btn" :class="{ disabled: !canSubmit || submitting }" @tap="submit">{{ submitting ? '提交中…' : '提交申请' }}</view>
    </template>
  </view>
</template>
<style scoped lang="scss">
.page { padding: 24rpx; padding-bottom: 160rpx; }
.card { background: $card; border-radius: $radius; padding: 24rpx; margin-bottom: 16rpx; }
.row { display: flex; justify-content: space-between; color: $text2; font-size: 28rpx; padding: 8rpx 0; }
.price { color: $price; font-weight: 700; }
.tip { color: $warn; font-size: 26rpx; }
.form { padding: 8rpx 24rpx; }
.type-row { display: flex; gap: 20rpx; padding: 20rpx 0; }
.type { padding: 12rpx 32rpx; border: 1rpx solid $line; border-radius: $radius; color: $text2; font-size: 28rpx; }
.type.on { border-color: $brand; color: $brand; background: $brand-soft; }
.field { padding: 20rpx 0; }
.label { color: $text; font-size: 28rpx; display: block; margin-bottom: 12rpx; }
.field textarea { width: 100%; min-height: 160rpx; font-size: 28rpx; background: $bg; border-radius: $radius; padding: 16rpx; box-sizing: border-box; }
.btn { background: $brand; color: #fff; text-align: center; padding: 24rpx 0; border-radius: $radius; font-size: 32rpx; }
.btn.disabled { background: $text3; }
</style>
