<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const mode = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const nickname = ref('')
const submitting = ref(false)

const isLoginMode = computed(() => mode.value === 'login')
const submitText = computed(() => (isLoginMode.value ? '登 录' : '注 册'))

function switchMode(m: 'login' | 'register'): void {
  mode.value = m
  confirmPassword.value = ''
}

async function onSubmit(): Promise<void> {
  const u = username.value.trim()
  if (!u) return uni.showToast({ title: '请输入用户名', icon: 'none' })
  if (!password.value) return uni.showToast({ title: '请输入密码', icon: 'none' })
  if (!isLoginMode.value && password.value !== confirmPassword.value) {
    return uni.showToast({ title: '两次密码不一致', icon: 'none' })
  }
  if (submitting.value) return
  submitting.value = true
  try {
    if (isLoginMode.value) {
      await userStore.login(u, password.value)
    } else {
      await userStore.register(u, password.value, nickname.value.trim() || undefined)
    }
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/user/index' }) }), 400)
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>
<template>
  <view class="page">
    <view class="tabs">
      <view class="tab" :class="{ active: isLoginMode }" @tap="switchMode('login')">登录</view>
      <view class="tab" :class="{ active: !isLoginMode }" @tap="switchMode('register')">注册</view>
    </view>

    <view class="field">
      <input v-model="username" class="input" placeholder="用户名" :maxlength="20" />
    </view>
    <view class="field">
      <input v-model="password" class="input" type="password" placeholder="密码" :maxlength="32" />
    </view>
    <view v-if="!isLoginMode" class="field">
      <input v-model="confirmPassword" class="input" type="password" placeholder="确认密码" :maxlength="32" />
    </view>
    <view v-if="!isLoginMode" class="field">
      <input v-model="nickname" class="input" placeholder="昵称（可选，默认用户名）" :maxlength="12" />
    </view>

    <view class="tip">{{ isLoginMode ? '登录后可使用积分、签到、会员等级' : '用户名至少 3 个字符，密码至少 6 个字符' }}</view>
    <view class="btn-primary login" :class="{ disabled: submitting }" @tap="onSubmit">{{ submitText }}</view>
  </view>
</template>
<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  padding: 80rpx 48rpx 0;
}
.tabs {
  display: flex;
  margin-bottom: 48rpx;
  border-bottom: 2rpx solid $line;
}
.tab {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  color: $text3;
  padding: 16rpx 0 20rpx;
}
.tab.active {
  color: $brand;
  font-weight: 700;
  border-bottom: 4rpx solid $brand;
}
.field {
  margin-bottom: 24rpx;
}
.input {
  background: $card;
  border-radius: $radius;
  padding: 24rpx 30rpx;
  font-size: 30rpx;
}
.tip {
  color: $text3;
  font-size: 24rpx;
  margin: 16rpx 0 48rpx;
}
.login {
  width: 100%;
  text-align: center;
  padding: 24rpx 0;
  font-size: 30rpx;
}
.login.disabled {
  opacity: 0.6;
}
</style>
