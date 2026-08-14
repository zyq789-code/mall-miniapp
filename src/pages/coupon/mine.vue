<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import type { UserCoupon } from '../../models/coupon'
import { getCoupons } from '../../api/userAssets.api'
import { useUserStore } from '../../stores/user'
import { storage, KEYS } from '../../utils/storage'
import { formatTime } from '../../utils/format'
import EmptyView from '../../components/ui/EmptyView.vue'

const list = ref<UserCoupon[]>([])
const selectMode = ref(false)
const userStore = useUserStore()
const loggedIn = computed(() => userStore.isLogin())
onLoad((q) => { selectMode.value = q?.select === '1' })
onShow(async () => {
  if (!userStore.isLogin()) { list.value = []; return }
  try { list.value = await getCoupons() } catch { list.value = [] }
})

interface StatusInfo { key: 'unused' | 'used' | 'expired'; label: string; usable: boolean }
function statusOf(c: UserCoupon): StatusInfo {
  if (c.endAt < Date.now() || c.status === 'expired') return { key: 'expired', label: '已过期', usable: false }
  if (c.status === 'used') return { key: 'used', label: '已使用', usable: false }
  return { key: 'unused', label: '未使用', usable: true }
}
const view = computed(() => list.value.map(c => ({ ...c, st: statusOf(c) })))
function desc(c: UserCoupon): string {
  return c.type === 'reduce' ? `满${c.threshold / 100}减${c.discount / 100}` : `全场${c.discount / 10}折`
}

function onTap(c: UserCoupon) {
  if (!selectMode.value) return
  if (!statusOf(c).usable) return uni.showToast({ title: '该券不可用', icon: 'none' })
  storage.set(KEYS.selectedCoupon, c.id)
  uni.navigateBack()
}
const goLogin = () => uni.navigateTo({ url: '/pages/user/login' })
</script>
<template>
  <view class="page">
    <template v-if="!loggedIn">
      <EmptyView text="请先登录" />
      <view class="login-btn" @tap="goLogin">去登录</view>
    </template>
    <template v-else>
      <EmptyView v-if="!view.length" text="还没有优惠券，去领券中心看看吧" />
      <view v-for="c in view" :key="c.id" class="card cp" :class="{ dim: !c.st.usable, pickable: selectMode }" @tap="onTap(c)">
        <view class="row">
          <text class="name">{{ c.name }}</text>
          <text class="st" :class="c.st.key">{{ c.st.label }}</text>
        </view>
        <view class="sub">{{ desc(c) }}</view>
        <view class="time">有效期至 {{ formatTime(c.endAt) }}</view>
      </view>
      <view v-if="selectMode" class="tip">点击选择一张优惠券</view>
    </template>
  </view>
</template>
<style scoped lang="scss">
.page { padding: 24rpx; }
.cp { padding: 24rpx; margin-bottom: 16rpx; }
.row { display: flex; align-items: center; }
.name { font-size: 30rpx; font-weight: 600; color: $text; }
.st { margin-left: auto; font-size: 24rpx; padding: 4rpx 16rpx; border-radius: 20rpx; }
.st.unused { background: $brand-soft; color: $brand; }
.st.used, .st.expired { background: $line; color: $text3; }
.sub { color: $price; font-size: 26rpx; margin-top: 8rpx; }
.time { color: $text3; font-size: 22rpx; margin-top: 8rpx; }
.cp.dim { opacity: .6; }
.cp.pickable { border: 1rpx solid $brand; }
.tip { text-align: center; color: $text3; font-size: 24rpx; padding: 24rpx 0; }
.login-btn { width: 320rpx; margin: 0 auto; background: $brand; color: #fff; text-align: center; padding: 24rpx 0; border-radius: $radius; font-size: 30rpx; }
</style>
