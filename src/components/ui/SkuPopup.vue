<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Goods, Sku } from '../../models/goods'
import Stepper from './Stepper.vue'

const props = defineProps<{ goods: Goods; show: boolean }>()
const emit = defineEmits<{ (e: 'update:show', v: boolean): void; (e: 'confirm', sku: Sku, quantity: number): void }>()
const skuId = ref('')
const quantity = ref(1)
watch(() => props.show, s => { if (s && props.goods.skus.length) { skuId.value = props.goods.skus[0].id; quantity.value = 1 } })
const sku = computed(() => props.goods.skus.find(s => s.id === skuId.value))
const outOfStock = (s: Sku) => s.stock <= 0
const close = () => emit('update:show', false)
</script>
<template>
  <view v-if="show" class="mask" @tap="close">
    <view class="panel" @tap.stop>
      <image :src="goods.cover" class="thumb" mode="aspectFill" />
      <view class="title">{{ goods.name }}</view>
      <view class="specs">
        <view v-for="s in goods.skus" :key="s.id"
          class="spec" :class="{ on: s.id === skuId, disabled: outOfStock(s) }"
          @tap="!outOfStock(s) && (skuId = s.id)">
          {{ s.spec }}
        </view>
      </view>
      <view class="row"><text>数量</text><Stepper v-model="quantity" :max="sku?.stock || 99" /></view>
      <view class="actions">
        <view class="btn" @tap="close">取消</view>
        <view class="btn primary" @tap="emit('confirm', sku!, quantity)">加入购物车</view>
      </view>
    </view>
  </view>
</template>
<style scoped lang="scss">
.mask { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 99; display: flex; align-items: flex-end; }
.panel { width: 100%; background: #fff; border-radius: 32rpx 32rpx 0 0; padding: 40rpx; }
.thumb { width: 160rpx; height: 160rpx; border-radius: 16rpx; margin-bottom: 20rpx; }
.title { font-weight: 700; margin-bottom: 24rpx; }
.specs { display: flex; flex-wrap: wrap; gap: 16rpx; margin-bottom: 24rpx; }
.spec { padding: 12rpx 28rpx; border-radius: 12rpx; background: $bg; }
.spec.on { background: $brand-soft; color: $brand; }
.spec.disabled { color: $text3; text-decoration: line-through; }
.row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.actions { display: flex; gap: 20rpx; }
.btn { flex: 1; text-align: center; padding: 20rpx 0; border-radius: $radius; border: 1rpx solid $line; }
.btn.primary { background: $brand; color: #fff; border: none; }
</style>
