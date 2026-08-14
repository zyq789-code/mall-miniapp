<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { Coupon, UserCoupon } from '../../models/coupon'
import { couponSeeds } from '../../mock/coupons'
import { getCoupons, claimCoupon } from '../../api/userAssets.api'
import { useUserStore } from '../../stores/user'
import { formatTime } from '../../utils/format'

const mine = ref<UserCoupon[]>([])
const userStore = useUserStore()
const loggedIn = computed(() => userStore.isLogin())

onShow(async () => {
  if (!userStore.isLogin()) { mine.value = []; return }
  try { mine.value = await getCoupons() } catch { mine.value = [] }
})

/** 已领取判断按后端已领券的 couponId（种子 id）匹配。 */
const claimed = (id: string) => mine.value.some(c => c.couponId === id)
function desc(c: Coupon): string {
  return c.type === 'reduce' ? `满${c.threshold / 100}减${c.discount / 100}` : `全场${c.discount / 10}折`
}
const scopeText = (c: Coupon) => (c.scope === 'all' ? '全场通用' : '部分分类可用')

async function claim(c: Coupon): Promise<void> {
  if (claimed(c.id)) return
  if (!userStore.isLogin()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    uni.navigateTo({ url: '/pages/user/login' })
    return
  }
  try {
    await claimCoupon(c.id)
    uni.showToast({ title: '领取成功', icon: 'none' })
    mine.value = await getCoupons()
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '领取失败', icon: 'none' })
  }
}
</script>
<template>
  <view class="page">
    <view v-for="c in couponSeeds" :key="c.id" class="card cp">
      <view class="left">
        <view class="name">{{ c.name }}</view>
        <view class="sub">{{ desc(c) }} · {{ scopeText(c) }}</view>
        <view class="time">有效期至 {{ formatTime(c.endAt) }}</view>
      </view>
      <view class="btn" :class="{ done: claimed(c.id) }" @tap="claim(c)">{{ claimed(c.id) ? '已领取' : '领取' }}</view>
    </view>
  </view>
</template>
<style scoped lang="scss">
.page { padding: 24rpx; }
.cp { display: flex; align-items: center; padding: 24rpx; margin-bottom: 16rpx; }
.left { flex: 1; }
.name { font-size: 30rpx; font-weight: 600; color: $text; }
.sub { color: $price; font-size: 26rpx; margin-top: 8rpx; }
.time { color: $text3; font-size: 22rpx; margin-top: 8rpx; }
.btn { background: $brand; color: #fff; padding: 14rpx 40rpx; border-radius: $radius; font-size: 26rpx; }
.btn.done { background: $line; color: $text3; }
</style>
