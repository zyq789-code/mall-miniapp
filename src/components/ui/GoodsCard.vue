<script setup lang="ts">
import type { Goods } from '../../models/goods'
import PriceTag from './PriceTag.vue'
import { formatPrice } from '../../utils/format'
defineProps<{ goods: Goods; salePrice?: number | null }>()
const emit = defineEmits<{ (e: 'tap', id: string): void }>()
</script>
<template>
  <view class="card goods" @tap="emit('tap', goods.id)">
    <image class="cover" :src="goods.cover" mode="aspectFill" lazy-load />
    <text v-if="salePrice" class="flash-badge">秒杀</text>
    <view class="name">{{ goods.name }}</view>
    <view class="tags">
      <text v-for="t in goods.tags" :key="t" class="tag">{{ t }}</text>
    </view>
    <view v-if="salePrice" class="sale-price">
      <text class="sale-cur">{{ formatPrice(salePrice) }}</text>
      <text class="sale-orig">{{ formatPrice(goods.price) }}</text>
    </view>
    <PriceTag v-else :price="goods.price" :original-price="goods.originalPrice" size="sm" />
  </view>
</template>
<style scoped lang="scss">
.goods {
  position: relative;
  overflow: hidden;
}
.flash-badge {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  background: $price;
  color: #fff;
  font-size: 20rpx;
  line-height: 1.4;
  padding: 6rpx 16rpx;
  border-bottom-right-radius: 12rpx;
}
.sale-price {
  display: flex;
  align-items: baseline;
}
.sale-cur {
  color: $price;
  font-weight: 700;
  font-size: 30rpx;
}
.sale-orig {
  color: $text3;
  text-decoration: line-through;
  font-size: 22rpx;
  margin-left: 12rpx;
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
