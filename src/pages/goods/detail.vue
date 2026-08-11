<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Goods, Sku, FootprintItem } from '../../models/goods'
import { goodsRepo } from '../../api/repository'
import { useCartStore } from '../../stores/cart'
import { storage, KEYS } from '../../utils/storage'
import PriceTag from '../../components/ui/PriceTag.vue'
import SkuPopup from '../../components/ui/SkuPopup.vue'

const id = ref('')
const goods = ref<Goods>()
const showSku = ref(false)
const fav = ref(false)
const cartStore = useCartStore()

onLoad((q) => {
  id.value = q?.id ?? ''
  goods.value = goodsRepo.get(id.value)
  if (!goods.value) return
  recordFootprint(id.value)
  fav.value = storage.get<string[]>(KEYS.favorites, []).includes(id.value)
})

function recordFootprint(goodsId: string): void {
  const list = storage.get<FootprintItem[]>(KEYS.footprints, [])
  const next = [{ goodsId, time: Date.now() }, ...list.filter(x => x.goodsId !== goodsId)].slice(0, 50)
  storage.set(KEYS.footprints, next)
}

function toggleFav(): void {
  const list = storage.get<string[]>(KEYS.favorites, [])
  const next = fav.value ? list.filter(x => x !== id.value) : [...list, id.value]
  storage.set(KEYS.favorites, next)
  fav.value = !fav.value
  uni.showToast({ title: fav.value ? '已收藏' : '已取消收藏', icon: 'none' })
}

function onConfirm(sku: Sku, quantity: number) {
  cartStore.add({ goodsId: goods.value!.id, skuId: sku.id, quantity, checked: true, addedAt: Date.now() })
  uni.showToast({ title: '已加入购物车', icon: 'success' })
  showSku.value = false
}
function buy() {
  if (!goods.value?.skus.length) return
  const sku = goods.value.skus[0]
  cartStore.add({ goodsId: goods.value.id, skuId: sku.id, quantity: 1, checked: true, addedAt: Date.now() })
  uni.navigateTo({ url: '/pages/order/confirm' })
}
const goReviews = () => uni.navigateTo({ url: `/pages/review/list?goodsId=${id.value}` })
</script>
<template>
  <view v-if="goods" class="page">
    <swiper class="gallery" circular indicator-dots>
      <swiper-item v-for="(img, i) in goods.images" :key="i"><image :src="img" class="gallery-img" mode="aspectFill" /></swiper-item>
    </swiper>
    <view class="info">
      <PriceTag :price="goods.price" :original-price="goods.originalPrice" />
      <view class="name">{{ goods.name }}</view>
      <view class="sub">{{ goods.subtitle }}</view>
      <view class="meta"><text>已售 {{ goods.sales }}</text><text>库存 {{ goods.stock }}</text></view>
    </view>
    <view class="review-link" @tap="goReviews">商品评价 ›</view>
    <view class="section-t">商品详情</view>
    <view class="desc">{{ goods.desc }}</view>
    <view class="bottom-bar">
      <view class="fav" @tap="toggleFav"><text class="heart" :class="{ on: fav }">{{ fav ? '❤' : '♡' }}</text><text class="fav-t">收藏</text></view>
      <view class="b-item" @tap="showSku = true">加入购物车</view>
      <view class="b-item primary" @tap="buy">立即购买</view>
    </view>
    <SkuPopup :goods="goods" :show="showSku" @update:show="v => showSku = v" @confirm="onConfirm" />
  </view>
</template>
<style scoped lang="scss">
.gallery { height: 750rpx; }
.gallery-img { width: 100%; height: 100%; }
.info { background: #fff; padding: 24rpx; }
.name { font-size: 36rpx; font-weight: 700; margin: 12rpx 0; }
.sub { color: $text2; }
.meta { color: $text3; font-size: 24rpx; margin-top: 12rpx; }
.review-link { background: #fff; margin-top: 16rpx; padding: 20rpx 24rpx; color: $brand; font-size: 28rpx; }
.desc { padding: 24rpx; color: $text2; }
.section-t { font-weight: 700; padding: 24rpx 24rpx 0; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; background: #fff; padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)); }
.fav { display: flex; flex-direction: column; align-items: center; width: 88rpx; margin-right: 16rpx; color: $text3; }
.heart { font-size: 44rpx; line-height: 1; }
.heart.on { color: $price; }
.fav-t { font-size: 20rpx; margin-top: 4rpx; }
.b-item { flex: 1; text-align: center; padding: 20rpx 0; border-radius: $radius; background: $brand-soft; color: $brand; }
.b-item.primary { background: $brand; color: #fff; margin-left: 16rpx; }
</style>
