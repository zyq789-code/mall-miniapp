<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Goods, Sku } from '../../models/goods'
import { getGoods } from '../../mock/goods'
import { addToCart } from '../../services/cart.service'
import { getCart, saveCart } from '../../api/cart.api'
import PriceTag from '../../components/ui/PriceTag.vue'
import SkuPopup from '../../components/ui/SkuPopup.vue'

const id = ref('')
const goods = ref<Goods>()
const showSku = ref(false)
onLoad((q) => { id.value = q?.id ?? ''; goods.value = getGoods(id.value) })

function onConfirm(sku: Sku, quantity: number) {
  saveCart(addToCart(getCart(), { goodsId: goods.value!.id, skuId: sku.id, quantity, checked: true, addedAt: Date.now() }))
  uni.showToast({ title: '已加入购物车', icon: 'success' })
  showSku.value = false
}
function buy() {
  if (!goods.value?.skus.length) return
  const sku = goods.value.skus[0]
  saveCart(addToCart(getCart(), { goodsId: goods.value.id, skuId: sku.id, quantity: 1, checked: true, addedAt: Date.now() }))
  uni.navigateTo({ url: '/pages/order/confirm' })
}
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
    <view class="section-t">商品详情</view>
    <view class="desc">{{ goods.desc }}</view>
    <view class="bottom-bar">
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
.desc { padding: 24rpx; color: $text2; }
.section-t { font-weight: 700; padding: 24rpx 24rpx 0; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; background: #fff; padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)); }
.b-item { flex: 1; text-align: center; padding: 20rpx 0; border-radius: $radius; background: $brand-soft; color: $brand; }
.b-item.primary { background: $brand; color: #fff; margin-left: 16rpx; }
</style>
