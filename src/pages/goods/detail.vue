<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Goods, Sku } from '../../models/goods'
import type { Review } from '../../models/review'
import { goodsRepo } from '../../api/repository'
import { getFavorites, addFavorite, removeFavorite, recordFootprint as apiRecordFootprint } from '../../api/userAssets.api'
import { getReviewsByGoods } from '../../api/userExtras.api'
import { useCartStore } from '../../stores/cart'
import { useUserStore } from '../../stores/user'
import { formatPrice, formatTime } from '../../utils/format'
import { flashSales } from '../../mock/flash'
import { isFlashActive } from '../../services/flash.service'
import { getPriceRange } from '../../services/sku.service'
import PriceTag from '../../components/ui/PriceTag.vue'
import SkuPopup from '../../components/ui/SkuPopup.vue'

const id = ref('')
const goods = ref<Goods>()
const loading = ref(true)
const showSku = ref(false)
const action = ref<'cart' | 'buy'>('cart')
const fav = ref(false)
const cartStore = useCartStore()
const userStore = useUserStore()

onLoad(async (q) => {
  id.value = q?.id ?? ''
  goods.value = await goodsRepo.get(id.value)
  loading.value = false
  await loadReviews()
  if (!goods.value) return
  if (userStore.isLogin()) {
    recordFootprint(id.value)
    try {
      fav.value = (await getFavorites()).includes(id.value)
    } catch {
      // 拉收藏失败时默认未收藏（不阻塞商品浏览）
    }
  }
})

/** 浏览足迹写到后端（需登录；未登录跳过，不影响浏览）。 */
function recordFootprint(goodsId: string): void {
  if (!userStore.isLogin()) return
  apiRecordFootprint(goodsId).catch(() => {
    // 足迹记录失败不阻塞浏览
  })
}

/** 收藏/取消收藏（登录才可收藏；未登录跳登录）。 */
async function toggleFav(): Promise<void> {
  if (!userStore.isLogin()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    uni.navigateTo({ url: '/pages/user/login' })
    return
  }
  try {
    if (fav.value) {
      await removeFavorite(id.value)
      fav.value = false
      uni.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      await addFavorite(id.value)
      fav.value = true
      uni.showToast({ title: '已收藏', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
  }
}

async function onConfirm(sku: Sku, quantity: number) {
  if (!userStore.isLogin()) {
    showSku.value = false
    uni.showToast({ title: '请先登录', icon: 'none' })
    uni.navigateTo({ url: '/pages/user/login' })
    return
  }
  try {
    await cartStore.add({ goodsId: goods.value!.id, skuId: sku.id, quantity, checked: true, addedAt: Date.now() })
    showSku.value = false
    if (action.value === 'buy') {
      uni.navigateTo({ url: '/pages/order/confirm' })
    } else {
      uni.showToast({ title: '已加入购物车', icon: 'success' })
    }
  } catch (e) {
    showSku.value = false
    uni.showToast({ title: e instanceof Error ? e.message : '加入失败', icon: 'none' })
  }
}
function openSku(mode: 'cart' | 'buy'): void {
  action.value = mode
  showSku.value = true
}
const goReviews = () => uni.navigateTo({ url: `/pages/review/list?goodsId=${id.value}` })

// —— 商品评价（公开，按 goodsId 从后端拉取）——
const reviews = ref<Review[]>([])
async function loadReviews() {
  try {
    reviews.value = await getReviewsByGoods(id.value)
  } catch {
    reviews.value = []
  }
}
const avgStars = computed(() => {
  if (!reviews.value.length) return 0
  return Math.round(reviews.value.reduce((sum, r) => sum + r.stars, 0) / reviews.value.length)
})
const recentReviews = computed(() => reviews.value.slice(0, 3))
const starText = (s: number) => '★'.repeat(s) + '☆'.repeat(5 - s)

// —— 限时折扣价 ——
const salePrice = computed<number | null>(() => {
  const f = flashSales.find(x => x.goodsId === id.value)
  return f && isFlashActive(f, Date.now()) ? f.price : null
})

// —— SKU 价格区间（min 起；多档价格时加"起"）——
const priceRange = computed(() => (goods.value ? getPriceRange(goods.value) : null))
const showFrom = computed(() => priceRange.value !== null && priceRange.value.min < priceRange.value.max)
</script>
<template>
  <Skeleton v-if="loading" />
  <EmptyView v-else-if="!goods" text="商品不存在或已下架" />
  <view v-else class="page">
    <swiper class="gallery" circular indicator-dots>
      <swiper-item v-for="(img, i) in goods.images" :key="i"><image :src="img" class="gallery-img" mode="aspectFill" /></swiper-item>
    </swiper>

    <view class="info">
      <view class="price-row">
        <template v-if="salePrice != null">
          <text class="sale-flag">秒杀</text>
          <text class="sale-price">{{ formatPrice(salePrice) }}</text>
          <text class="orig-price">{{ formatPrice(goods.originalPrice) }}</text>
        </template>
        <PriceTag v-else :price="priceRange?.min ?? goods.price" :original-price="goods.originalPrice" :suffix="showFrom ? '起' : ''" />
      </view>
      <view class="name">{{ goods.name }}</view>
      <view class="sub">{{ goods.subtitle }}</view>
      <view class="meta">
        <view class="pill">已售 {{ goods.sales }}</view>
        <view class="pill">库存 {{ goods.stock }}</view>
      </view>
    </view>

    <view class="card review-sec">
      <view class="review-head">
        <text class="review-title">商品评价</text>
        <view class="review-summary">
          <text class="stars">{{ starText(avgStars) }}</text>
          <text class="count">{{ reviews.length }} 条</text>
        </view>
      </view>
      <template v-if="reviews.length">
        <view v-for="r in recentReviews" :key="r.id" class="review-item">
          <view class="review-top">
            <text class="stars">{{ starText(r.stars) }}</text>
            <text class="who">{{ r.anonymous ? '匿名用户' : '用户' }}</text>
            <text class="time">{{ formatTime(r.time) }}</text>
          </view>
          <view class="review-content">{{ r.content }}</view>
        </view>
        <view class="review-more" @tap="goReviews">查看全部 {{ reviews.length }} 条 ›</view>
      </template>
      <view v-else class="review-empty">暂无评价，快来评价吧</view>
    </view>

    <view class="card desc-card">
      <view class="section-t">商品详情</view>
      <view class="desc">{{ goods.desc }}</view>
    </view>

    <view class="bottom-bar">
      <view class="fav" @tap="toggleFav"><text class="heart" :class="{ on: fav }">{{ fav ? '❤' : '♡' }}</text><text class="fav-t">收藏</text></view>
      <view class="b-item" @tap="openSku('cart')">加入购物车</view>
      <view class="b-item primary" @tap="openSku('buy')">立即购买</view>
    </view>
    <SkuPopup :goods="goods" :show="showSku" @update:show="v => showSku = v" @confirm="onConfirm" />
  </view>
</template>
<style scoped lang="scss">
.gallery { height: 750rpx; }
.gallery-img { width: 100%; height: 100%; }
.info { background: #fff; padding: 24rpx; }
.price-row { display: flex; align-items: baseline; }
.sale-flag { align-self: center; background: $price; color: #fff; font-size: 22rpx; padding: 2rpx 12rpx; border-radius: 6rpx; margin-right: 12rpx; flex-shrink: 0; }
.sale-price { color: $price; font-weight: 700; font-size: 40rpx; }
.orig-price { color: $text3; text-decoration: line-through; font-size: 24rpx; margin-left: 12rpx; }
.name { font-size: 36rpx; font-weight: 700; margin: 12rpx 0; }
.sub { color: $text2; }
.meta { display: flex; gap: 12rpx; margin-top: 12rpx; }
.pill { background: $brand-soft; color: $brand; font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 999rpx; }
.card { background: $card; border-radius: $radius; margin-top: 16rpx; }
.review-sec { padding: 24rpx; }
.review-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.review-title { font-weight: 700; font-size: 30rpx; }
.review-summary { display: flex; align-items: center; }
.stars { color: $warn; font-size: 26rpx; }
.count { color: $text3; font-size: 24rpx; margin-left: 12rpx; }
.review-item { border-top: 1px solid $line; padding-top: 16rpx; margin-top: 16rpx; }
.review-top { display: flex; align-items: center; }
.who { color: $text2; font-size: 24rpx; margin-left: 12rpx; }
.time { color: $text3; font-size: 22rpx; margin-left: auto; }
.review-content { font-size: 26rpx; color: $text; line-height: 1.6; margin-top: 8rpx; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
.review-more { color: $brand; font-size: 26rpx; text-align: center; padding-top: 20rpx; margin-top: 16rpx; border-top: 1px solid $line; }
.review-empty { color: $text3; font-size: 26rpx; text-align: center; padding: 40rpx 0; }
.desc-card { padding: 24rpx; }
.section-t { font-weight: 700; font-size: 30rpx; }
.desc { color: $text2; font-size: 26rpx; line-height: 1.8; margin-top: 16rpx; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; align-items: center; background: #fff; padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)); }
.fav { display: flex; flex-direction: column; align-items: center; width: 88rpx; margin-right: 16rpx; color: $text3; }
.heart { font-size: 44rpx; line-height: 1; }
.heart.on { color: $price; }
.fav-t { font-size: 20rpx; margin-top: 4rpx; }
.b-item { flex: 1; text-align: center; padding: 20rpx 0; border-radius: $radius; background: $brand-soft; color: $brand; }
.b-item.primary { background: $brand; color: #fff; margin-left: 16rpx; }
</style>
