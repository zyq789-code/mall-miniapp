<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { Member } from '../../models/member'
import { levelOf, pointsRate } from '../../services/member.service'
import { storage, KEYS } from '../../utils/storage'
import { formatTime } from '../../utils/format'

const user = ref<Member>()
onShow(() => { user.value = storage.get<Member | null>(KEYS.user, null) ?? undefined })

const balance = computed(() => user.value?.points ?? 0)
const today = Date.now()
const day = 24 * 60 * 60 * 1000

interface PointItem { id: string; title: string; change: number; time: number }
const items = computed<PointItem[]>(() => [
  { id: 'd1', title: '每日签到', change: 10, time: today - day },
  { id: 'd2', title: '下单返积分（演示）', change: 186, time: today - 3 * day },
  { id: 'd3', title: '下单返积分（演示）', change: 68, time: today - 6 * day },
  { id: 'd4', title: '每日签到', change: 10, time: today - 9 * day },
])

// 演示数据里的下单返积分按会员倍数示意
const rateTip = computed(() => `（当前等级返积分 ×${pointsRate(levelOf(user.value?.totalSpent ?? 0))}）`)
</script>
<template>
  <view class="page">
    <view class="card balance">
      <view class="b-label">当前积分</view>
      <view class="b-num">{{ balance }}</view>
      <view class="b-tip">积分可在下单时抵扣现金，1 积分抵扣 1 分钱</view>
    </view>

    <view class="sec">积分明细</view>
    <view v-for="it in items" :key="it.id" class="card item">
      <view class="i-meta">
        <view class="i-title">{{ it.title }}</view>
        <view class="i-time">{{ formatTime(it.time) }}</view>
      </view>
      <view class="i-change" :class="{ plus: it.change > 0 }">+{{ it.change }}</view>
    </view>

    <view class="note">
      说明：100 积分 = 1 元，单笔订单最多抵扣 20%。以上明细为演示数据{{ rateTip }}，正式数据上线后替换。
    </view>
  </view>
</template>
<style scoped lang="scss">
.page {
  padding: 24rpx;
}
.balance {
  text-align: center;
  padding: 48rpx 24rpx;
}
.b-label {
  font-size: 26rpx;
  color: $text2;
}
.b-num {
  font-size: 72rpx;
  font-weight: 700;
  color: $brand;
  margin: 12rpx 0;
}
.b-tip {
  font-size: 22rpx;
  color: $text3;
}
.sec {
  font-size: 28rpx;
  font-weight: 600;
  color: $text2;
  margin: 8rpx 8rpx 16rpx;
}
.item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 16rpx;
}
.i-meta {
  flex: 1;
}
.i-title {
  font-size: 28rpx;
  color: $text;
}
.i-time {
  font-size: 22rpx;
  color: $text3;
  margin-top: 8rpx;
}
.i-change {
  font-size: 32rpx;
  font-weight: 700;
  color: $text;
}
.i-change.plus {
  color: $success;
}
.note {
  color: $text3;
  font-size: 22rpx;
  line-height: 1.6;
  padding: 16rpx 8rpx 40rpx;
}
</style>
