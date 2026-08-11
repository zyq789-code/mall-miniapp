<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Member } from '../../models/member'
import { storage, KEYS } from '../../utils/storage'

const nickname = ref('')
const trimmed = computed(() => nickname.value.trim())
const avatarText = computed(() => trimmed.value.charAt(0).toUpperCase() || '😀')

function onLogin(): void {
  if (!trimmed.value) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  const user: Member = {
    id: 'u' + Date.now(),
    nickname: trimmed.value,
    avatar: avatarText.value,
    level: 0,
    points: 0,
    totalSpent: 0,
  }
  storage.set(KEYS.user, user)
  uni.showToast({ title: '登录成功', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 400)
}
</script>
<template>
  <view class="page">
    <view class="avatar" :class="{ idle: !trimmed }">{{ avatarText }}</view>
    <view class="tip">模拟登录，无需密码</view>
    <view class="field">
      <input v-model="nickname" class="input" placeholder="请输入昵称" maxlength="12" />
    </view>
    <view class="btn-primary login" @tap="onLogin">登 录</view>
  </view>
</template>
<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 48rpx 0;
}
.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: $brand;
  color: #fff;
  font-size: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar.idle {
  background: $line;
  color: $text3;
}
.tip {
  color: $text3;
  font-size: 24rpx;
  margin: 24rpx 0 48rpx;
}
.field {
  width: 100%;
}
.input {
  background: $card;
  border-radius: $radius;
  padding: 24rpx 30rpx;
  font-size: 30rpx;
}
.login {
  margin-top: 48rpx;
  width: 100%;
  text-align: center;
  padding: 24rpx 0;
  font-size: 30rpx;
}
</style>
