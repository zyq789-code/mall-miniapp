<script setup lang="ts">
defineProps<{ text?: string }>()
</script>
<template>
  <view class="empty">
    <view class="icon">◌</view>
    <text>{{ text || '暂无数据' }}</text>
  </view>
</template>
<style scoped lang="scss">
.empty {
  padding: 120rpx 0;
  text-align: center;
  color: $text3;
}
.icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}
</style>
