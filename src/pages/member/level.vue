<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { Member } from '../../models/member'
import { LEVEL_THRESHOLDS, LEVEL_NAMES } from '../../models/member'
import { levelOf } from '../../services/member.service'
import { storage, KEYS } from '../../utils/storage'
import { formatPrice } from '../../utils/format'

const user = ref<Member>()
onShow(() => { user.value = storage.get<Member | null>(KEYS.user, null) ?? undefined })

const spent = computed(() => user.value?.totalSpent ?? 0)
const current = computed(() => levelOf(spent.value))
const nextExists = computed(() => current.value < LEVEL_NAMES.length - 1)

interface LevelRow { index: number; name: string; threshold: number }
const rows = computed<LevelRow[]>(() =>
  LEVEL_NAMES.map((name, i) => ({ index: i, name, threshold: LEVEL_THRESHOLDS[i] })),
)

const progress = computed(() => {
  if (!nextExists.value) return { pct: 100, label: '已达成最高等级' }
  const cur = LEVEL_THRESHOLDS[current.value]
  const next = LEVEL_THRESHOLDS[current.value + 1]
  const pct = Math.min(100, Math.floor(((spent.value - cur) / (next - cur)) * 100))
  return { pct, label: `再消费 ${formatPrice(next - spent.value)} 即可升级` }
})
</script>
<template>
  <view class="page">
    <view class="card top">
      <view class="cur">当前等级：<text class="strong">{{ LEVEL_NAMES[current] }}</text></view>
      <view class="bar"><view class="bar-in" :style="{ width: progress.pct + '%' }" /></view>
      <view class="tip">{{ progress.label }}</view>
    </view>

    <view v-for="r in rows" :key="r.index" class="card row" :class="{ active: r.index === current, passed: r.index < current }">
      <view class="ring">{{ r.index + 1 }}</view>
      <view class="meta">
        <view class="r-name">{{ r.name }}</view>
        <view class="r-th">累计消费 {{ formatPrice(r.threshold) }} 解锁</view>
      </view>
      <view v-if="r.index === current" class="tag">当前</view>
      <view v-else-if="r.index < current" class="tag ok">已解锁</view>
    </view>

    <view class="note">注：等级按累计消费金额自动成长，下单即返积分。</view>
  </view>
</template>
<style scoped lang="scss">
.page {
  padding: 24rpx;
}
.card {
  background: $card;
  border-radius: $radius;
  margin-bottom: 20rpx;
  padding: 28rpx;
}
.top {
  padding: 32rpx 28rpx;
}
.cur {
  font-size: 30rpx;
  color: $text2;
}
.strong {
  color: $brand;
  font-weight: 700;
  font-size: 34rpx;
}
.bar {
  height: 16rpx;
  background: $brand-soft;
  border-radius: 8rpx;
  overflow: hidden;
  margin-top: 24rpx;
}
.bar-in {
  height: 100%;
  background: $brand;
  border-radius: 8rpx;
  transition: width 0.3s;
}
.tip {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: $text3;
}
.row {
  display: flex;
  align-items: center;
}
.row.active {
  border: 2rpx solid $brand;
}
.ring {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: $line;
  color: $text3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}
.row.active .ring {
  background: $brand;
  color: #fff;
}
.meta {
  flex: 1;
}
.r-name {
  font-size: 32rpx;
  font-weight: 600;
}
.row.passed .r-name {
  color: $text2;
}
.r-th {
  font-size: 24rpx;
  color: $text3;
  margin-top: 6rpx;
}
.tag {
  font-size: 22rpx;
  background: $brand-soft;
  color: $brand;
  padding: 4rpx 20rpx;
  border-radius: 24rpx;
}
.tag.ok {
  background: $success;
  color: #fff;
}
.note {
  text-align: center;
  color: $text3;
  font-size: 22rpx;
  padding: 12rpx 0 40rpx;
}
</style>
