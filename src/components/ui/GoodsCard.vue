<script setup lang="ts">
import type { Goods } from '../../models/goods'
import PriceTag from './PriceTag.vue'
defineProps<{ goods: Goods }>()
const emit = defineEmits<{ (e: 'tap', id: string): void }>()
</script>
<template>
  <view class="card goods" @tap="emit('tap', goods.id)">
    <image class="cover" :src="goods.cover" mode="aspectFill" lazy-load />
    <view class="name">{{ goods.name }}</view>
    <view class="tags">
      <text v-for="t in goods.tags" :key="t" class="tag">{{ t }}</text>
    </view>
    <PriceTag :price="goods.price" :original-price="goods.originalPrice" size="sm" />
  </view>
</template>
<style scoped lang="scss">
.goods {
  overflow: hidden;
}
.cover {
  width: 100%;
  height: 340rpx;
  background: #f5f5f7;
}
.name {
  font-size: 28rpx;
  margin: 12rpx 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.tags {
  margin: 0 16rpx 8rpx;
}
.tag {
  font-size: 20rpx;
  color: $brand;
  background: $brand-soft;
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
  margin-right: 8rpx;
}
</style>
