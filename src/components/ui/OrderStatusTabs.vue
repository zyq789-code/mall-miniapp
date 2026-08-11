<script setup lang="ts">
defineProps<{ tabs: { key: string; label: string }[]; active: string }>()
const emit = defineEmits<{ (e: 'change', key: string): void }>()
</script>
<template>
  <scroll-view scroll-x class="tabs">
    <view v-for="t in tabs" :key="t.key" class="tab" :class="{ on: active === t.key }" @tap="emit('change', t.key)">
      {{ t.label }}
    </view>
  </scroll-view>
</template>
<style scoped lang="scss">
.tabs { white-space: nowrap; background: $card; }
.tab { display: inline-block; padding: 20rpx 32rpx; font-size: 26rpx; color: $text2; }
.tab.on { color: $brand; font-weight: 700; border-bottom: 4rpx solid $brand; }
</style>
