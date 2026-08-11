<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import type { Order } from '../../models/order'
import { useOrderStore } from '../../stores/order'
import { useUserStore } from '../../stores/user'
import { formatPrice, formatTime } from '../../utils/format'
import { earnBySpend } from '../../services/points.service'
import { pointsRate } from '../../services/member.service'
import EmptyView from '../../components/ui/EmptyView.vue'

const orderStore = useOrderStore()
const userStore = useUserStore()
const order = ref<Order | null>(null)
const paying = ref(false)
const id = ref('')
let timer: ReturnType<typeof setTimeout> | null = null

onLoad((q) => {
  id.value = typeof q?.id === 'string' ? q?.id : ''
  order.value = orderStore.orders.find(o => o.id === id.value) ?? null
})
onUnload(() => {
  if (timer) { clearTimeout(timer); timer = null }
  uni.hideLoading()
})

function doPay() {
  const o = order.value
  if (!o || paying.value) return
  paying.value = true
  uni.showLoading({ title: '支付中' })
  timer = setTimeout(() => {
    timer = null
    try {
      const next = orderStore.doPay(o)
      // 返积分（按会员等级倍数）+ 累计消费（登录后才有会员数据可累计）
      if (userStore.isLogin()) {
        userStore.addPoints(earnBySpend(next.payAmount, pointsRate(userStore.level())))
        userStore.addSpend(next.payAmount)
      }
      uni.hideLoading()
      uni.redirectTo({ url: `/pages/order/detail?id=${next.id}`, fail: () => { paying.value = false } })
    } catch {
      uni.hideLoading()
      paying.value = false
      uni.showToast({ title: '支付失败', icon: 'none' })
    }
  }, 1500)
}
</script>
<template>
  <view class="page">
    <view v-if="order" class="card main">
      <view class="label">应付金额</view>
      <view class="amount">{{ formatPrice(order.payAmount) }}</view>
      <view class="row"><text>订单号</text><text>{{ order.orderNo }}</text></view>
      <view class="row"><text>下单时间</text><text>{{ formatTime(order.createTime) }}</text></view>
    </view>
    <view v-else class="card main"><EmptyView text="订单不存在" /></view>
    <view v-if="order" class="pay-btn" @tap="doPay">{{ paying ? '支付中…' : '立即支付' }}</view>
  </view>
</template>
<style scoped lang="scss">
.page { padding: 24rpx; }
.main { padding: 48rpx 32rpx; text-align: center; }
.label { color: $text2; font-size: 28rpx; }
.amount { font-size: 72rpx; font-weight: 700; color: $price; margin: 24rpx 0 40rpx; }
.row { display: flex; justify-content: space-between; color: $text2; font-size: 26rpx; margin: 12rpx 0; }
.pay-btn { background: $brand; color: #fff; text-align: center; padding: 26rpx 0; border-radius: $radius; margin-top: 40rpx; font-size: 32rpx; }
</style>
