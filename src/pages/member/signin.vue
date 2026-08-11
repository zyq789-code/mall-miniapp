<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onShow } from '@dcloudio/uni-app'
import type { Member } from '../../models/member'
import { canSignIn } from '../../services/points.service'
import { storage, KEYS } from '../../utils/storage'
import { todayKey } from '../../utils/format'
import { useUserStore } from '../../stores/user'
import { tryRun } from '../../utils/toast'

const SIGN_POINTS = 10
const userStore = useUserStore()
const { member } = storeToRefs(userStore)
const user = computed<Member | undefined>(() => (member.value.id ? member.value : undefined))
const lastDay = ref('')
const today = ref(todayKey(Date.now()))
onShow(() => {
  today.value = todayKey(Date.now())
  userStore.sync()
  lastDay.value = storage.get<string>(KEYS.lastSignDay, '')
})

const signed = computed(() => !!user.value && !canSignIn(lastDay.value, today.value))

function onSign(): void {
  if (!user.value) {
    uni.navigateTo({ url: '/pages/user/login' })
    return
  }
  if (!canSignIn(lastDay.value, today.value)) return
  tryRun(() => {
    userStore.addPoints(SIGN_POINTS)
    storage.set(KEYS.lastSignDay, today.value)
    lastDay.value = today.value
    uni.showToast({ title: `签到成功 +${SIGN_POINTS}`, icon: 'success' })
  })
}
</script>
<template>
  <view class="page">
    <view class="hero card">
      <view class="emoji">📅</view>
      <view v-if="signed" class="sign done">今日已签 +{{ SIGN_POINTS }}</view>
      <view v-else-if="user" class="sign" @tap="onSign">签到 +{{ SIGN_POINTS }}</view>
      <view v-else class="sign ghost" @tap="onSign">登录后签到</view>
      <view class="sub">每天签到可得 {{ SIGN_POINTS }} 积分</view>
    </view>

    <view class="card info">
      <view class="row"><text>当前积分</text><text class="num">{{ user?.points ?? 0 }}</text></view>
      <view class="row"><text>今日日期</text><text>{{ today }}</text></view>
    </view>

    <view class="note">积分 100 = 1 元，下单时可抵扣，单笔上限 20%。</view>
  </view>
</template>
<style scoped lang="scss">
.page {
  padding: 24rpx;
}
.hero {
  text-align: center;
  padding: 56rpx 24rpx 48rpx;
}
.emoji {
  font-size: 96rpx;
  line-height: 1;
}
.sign {
  display: inline-block;
  margin: 36rpx 0 20rpx;
  background: $brand;
  color: #fff;
  font-size: 32rpx;
  padding: 20rpx 64rpx;
  border-radius: 44rpx;
}
.sign.done {
  background: $line;
  color: $text3;
}
.sign.ghost {
  background: $card;
  color: $text2;
  border: 1rpx solid $line;
}
.sub {
  color: $text3;
  font-size: 24rpx;
}
.info {
  padding: 8rpx 28rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: $text2;
  border-bottom: 1rpx solid $line;
}
.row:last-child {
  border-bottom: none;
}
.num {
  color: $brand;
  font-weight: 700;
  font-size: 30rpx;
}
.note {
  color: $text3;
  font-size: 22rpx;
  text-align: center;
  padding: 24rpx 0 40rpx;
}
</style>
