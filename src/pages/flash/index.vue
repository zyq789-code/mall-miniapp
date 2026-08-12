<script setup lang="ts">
import { ref } from 'vue'
import { onUnload } from '@dcloudio/uni-app'
import type { FlashSale } from '../../models/flash'
import type { Goods } from '../../models/goods'
import { flashSales } from '../../mock/flash'
import { goodsRepo } from '../../api/repository'
import { canPurchase, isFlashActive } from '../../services/flash.service'
import { formatPrice } from '../../utils/format'
import { storage, KEYS } from '../../utils/storage'
import { useCartStore } from '../../stores/cart'
import EmptyView from '../../components/ui/EmptyView.vue'

interface FlashItem { sale: FlashSale; goods?: Goods }
const items: FlashItem[] = flashSales.map(f => ({ sale: f, goods: goodsRepo.get(f.goodsId) }))

const now = ref(Date.now())
const timer = setInterval(() => { now.value = Date.now() }, 1000)
onUnload(() => clearInterval(timer))

const cart = useCartStore()

function countdown(f: FlashSale): string {
  const ms = f.endTime - now.value
  const total = Math.max(0, Math.floor(ms / 1000))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(total / 3600))}:${p(Math.floor((total % 3600) / 60))}:${p(total % 60)}`
}
function statusText(f: FlashSale): string {
  if (now.value < f.startTime) return '未开始'
  if (now.value > f.endTime) return '已结束'
  return '立即抢购'
}
function purchasedCount(f: FlashSale): number {
  return storage.get<Record<string, number>>(KEYS.flashPurchased, {})[f.goodsId] ?? 0
}

function onBuy(f: FlashSale): void {
  if (!isFlashActive(f, now.value)) return
  const goods = items.find(it => it.sale.id === f.id)?.goods
  if (!goods || !goods.skus.length) return
  if (!canPurchase(f, purchasedCount(f))) {
    uni.showToast({ title: '已达限购', icon: 'none' })
    return
  }
  cart.add({ goodsId: f.goodsId, skuId: goods.skus[0].id, quantity: 1, checked: true, addedAt: Date.now() })
  storage.set(KEYS.flashPurchased, {
    ...storage.get<Record<string, number>>(KEYS.flashPurchased, {}),
    [f.goodsId]: purchasedCount(f) + 1,
  })
  uni.showToast({ title: '已加入购物车', icon: 'success' })
  setTimeout(() => uni.switchTab({ url: '/pages/cart/index' }), 600)
}
</script>
<template>
  <view class="page">
    <EmptyView v-if="!items.length" text="暂无秒杀活动" />
    <view v-for="it in items" :key="it.sale.id" class="card flash">
      <image class="cover" :src="it.goods?.cover" mode="aspectFill" />
      <view class="info">
        <view class="name">{{ it.goods?.name ?? '商品已下架' }}</view>
        <view class="price-row">
          <text class="price">{{ formatPrice(it.sale.price) }}</text>
          <text class="orig">{{ formatPrice(it.sale.originalPrice) }}</text>
        </view>
        <view class="meta">
          <text class="limit">限购 {{ it.sale.limitPerUser }} 件</text>
          <text class="cd">⏱ {{ countdown(it.sale) }}</text>
        </view>
      </view>
      <view
        class="btn"
        :class="{ disabled: !isFlashActive(it.sale, now) }"
        @tap="onBuy(it.sale)"
      >{{ statusText(it.sale) }}</view>
    </view>
  </view>
</template>
<style scoped lang="scss">
.page {
  padding: 24rpx;
}
.flash {
  display: flex;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 16rpx;
}
.cover {
  width: 180rpx;
  height: 180rpx;
  border-radius: $radius;
  background: #f5f5f7;
  flex-shrink: 0;
}
.info {
  flex: 1;
  margin-left: 20rpx;
  min-width: 0;
}
.name {
  font-size: 28rpx;
  color: $text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.price-row {
  margin-top: 10rpx;
  display: flex;
  align-items: baseline;
}
.price {
  color: $price;
  font-weight: 700;
  font-size: 36rpx;
}
.orig {
  color: $text3;
  text-decoration: line-through;
  font-size: 24rpx;
  margin-left: 12rpx;
}
.meta {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.limit {
  color: $text2;
  font-size: 22rpx;
}
.cd {
  color: $brand;
  font-size: 22rpx;
  font-weight: 600;
}
.btn {
  flex-shrink: 0;
  background: $price;
  color: #fff;
  padding: 14rpx 30rpx;
  border-radius: $radius;
  font-size: 26rpx;
  margin-left: 16rpx;
}
.btn.disabled {
  background: $line;
  color: $text3;
}
</style>
