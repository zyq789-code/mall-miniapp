<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { Member } from '../../models/member'
import { LEVEL_THRESHOLDS } from '../../models/member'
import { levelOf, levelName } from '../../services/member.service'
import { storage, KEYS } from '../../utils/storage'
import { formatPrice } from '../../utils/format'

const user = ref<Member>()
onShow(() => { user.value = storage.get<Member | null>(KEYS.user, null) ?? undefined })

const isLoggedIn = computed(() => !!user.value)
const avatarText = computed(() => user.value?.avatar || user.value?.nickname.charAt(0) || '😀')
const level = computed(() => levelOf(user.value?.totalSpent ?? 0))
const levelLabel = computed(() => levelName(level.value))
const nextExists = computed(() => level.value < LEVEL_THRESHOLDS.length - 1)

interface ProgressInfo { pct: number; label: string }
const progress = computed<ProgressInfo>(() => {
  const spent = user.value?.totalSpent ?? 0
  if (!nextExists.value) return { pct: 100, label: '已是最高等级' }
  const cur = LEVEL_THRESHOLDS[level.value]
  const next = LEVEL_THRESHOLDS[level.value + 1]
  const pct = Math.min(100, Math.floor(((spent - cur) / (next - cur)) * 100))
  return { pct, label: spent >= next ? '即将升级' : `再消费 ${formatPrice(next - spent)} 升级` }
})

interface Entry { label: string; icon: string; url: string }
const entries: Entry[] = [
  { label: '我的订单', icon: '🧾', url: '/pages/order/list' },
  { label: '领券中心', icon: '🎫', url: '/pages/coupon/center' },
  { label: '我的收藏', icon: '❤️', url: '/pages/favorite/index' },
  { label: '浏览足迹', icon: '👣', url: '/pages/footprint/index' },
  { label: '每日签到', icon: '📅', url: '/pages/member/signin' },
  { label: '收货地址', icon: '📍', url: '/pages/address/list' },
  { label: '我的积分', icon: '⭐', url: '/pages/member/points' },
  { label: '会员等级', icon: '🏅', url: '/pages/member/level' },
]

function onHeaderTap(): void {
  if (!isLoggedIn.value) uni.navigateTo({ url: '/pages/user/login' })
}
const go = (url: string) => uni.navigateTo({ url })
</script>
<template>
  <view class="page">
    <view class="header" @tap="onHeaderTap">
      <view class="avatar" :class="{ idle: !isLoggedIn }">{{ avatarText }}</view>
      <view class="who">
        <view v-if="isLoggedIn" class="name">{{ user?.nickname }}</view>
        <view v-else class="name">点击登录</view>
        <view v-if="isLoggedIn" class="badge">{{ levelLabel }}</view>
      </view>
      <view class="chev" v-if="!isLoggedIn">›</view>
    </view>

    <view v-if="isLoggedIn" class="member-card">
      <view class="m-row">
        <view class="m-cell">
          <view class="m-num">{{ user?.points ?? 0 }}</view>
          <view class="m-label">当前积分</view>
        </view>
        <view class="m-cell">
          <view class="m-num">{{ formatPrice(user?.totalSpent ?? 0) }}</view>
          <view class="m-label">累计消费</view>
        </view>
        <view class="m-cell">
          <view class="m-num">{{ levelLabel }}</view>
          <view class="m-label">会员等级</view>
        </view>
      </view>
      <view class="m-progress">
        <view class="m-bar"><view class="m-bar-in" :style="{ width: progress.pct + '%' }" /></view>
        <view class="m-bar-tip">{{ progress.label }}</view>
      </view>
    </view>

    <view class="grid">
      <view v-for="e in entries" :key="e.url" class="cell" @tap="go(e.url)">
        <view class="icon">{{ e.icon }}</view>
        <view class="label">{{ e.label }}</view>
      </view>
    </view>
  </view>
</template>
<style scoped lang="scss">
.page {
  padding-bottom: 40rpx;
}
.header {
  display: flex;
  align-items: center;
  background: $brand;
  padding: 60rpx 40rpx 120rpx;
  color: #fff;
}
.avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  font-size: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 28rpx;
  flex-shrink: 0;
}
.avatar.idle {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
}
.who {
  flex: 1;
}
.name {
  font-size: 36rpx;
  font-weight: 700;
}
.badge {
  display: inline-block;
  margin-top: 12rpx;
  font-size: 22rpx;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 24rpx;
  padding: 4rpx 20rpx;
}
.chev {
  font-size: 44rpx;
  color: rgba(255, 255, 255, 0.8);
}
.member-card {
  margin: -80rpx 24rpx 24rpx;
  background: $card;
  border-radius: $radius;
  padding: 32rpx;
}
.m-row {
  display: flex;
}
.m-cell {
  flex: 1;
  text-align: center;
}
.m-num {
  font-size: 34rpx;
  font-weight: 700;
  color: $text;
}
.m-label {
  font-size: 22rpx;
  color: $text3;
  margin-top: 8rpx;
}
.m-progress {
  margin-top: 28rpx;
  border-top: 1rpx solid $line;
  padding-top: 24rpx;
}
.m-bar {
  height: 14rpx;
  background: $brand-soft;
  border-radius: 8rpx;
  overflow: hidden;
}
.m-bar-in {
  height: 100%;
  background: $brand;
  border-radius: 8rpx;
  transition: width 0.3s;
}
.m-bar-tip {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: $text2;
  text-align: right;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  background: $card;
  margin: 0 24rpx;
  border-radius: $radius;
  padding: 16rpx 0;
}
.cell {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0;
}
.icon {
  font-size: 48rpx;
  line-height: 1;
}
.label {
  font-size: 24rpx;
  color: $text2;
  margin-top: 12rpx;
}
</style>
