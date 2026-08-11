<template>
  <view class="sk">
    <view v-for="i in 6" :key="i" class="sk-item">
      <view class="sk-pic" /><view class="sk-line" />
    </view>
  </view>
</template>
<style scoped>
.sk {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 24rpx;
}
.sk-item {
  width: 48%;
  margin-bottom: 24rpx;
}
.sk-pic,
.sk-line {
  background: linear-gradient(90deg, #f0f1f3 25%, #e5e7eb 37%, #f0f1f3 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 12rpx;
}
.sk-pic {
  height: 300rpx;
}
.sk-line {
  height: 28rpx;
  margin-top: 16rpx;
  width: 80%;
}
@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>
