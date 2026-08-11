<script setup lang="ts">
import { formatPrice } from '../../utils/format'
const props = defineProps<{ price: number; originalPrice?: number; size?: 'sm' | 'md' }>()
</script>
<template>
  <view class="price-tag">
    <text class="cur" :class="size">{{ formatPrice(props.price) }}</text>
    <text v-if="props.originalPrice && props.originalPrice > props.price" class="orig">{{ formatPrice(props.originalPrice) }}</text>
  </view>
</template>
<style scoped lang="scss">
.cur {
  color: $price;
  font-weight: 700;
  font-size: 32rpx;
}
.cur.sm {
  font-size: 26rpx;
}
.orig {
  color: $text3;
  text-decoration: line-through;
  margin-left: 12rpx;
  font-size: 24rpx;
}
</style>
