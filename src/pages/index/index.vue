<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onUnload, onPullDownRefresh } from '@dcloudio/uni-app'
import type { Goods } from '../../models/goods'
import { goodsRepo } from '../../api/repository'
import { banners, categories } from '../../mock/goods'
import { flashSales } from '../../mock/flash'
import EmptyView from '../../components/ui/EmptyView.vue'

const loading = ref(true)
const list = ref<Goods[]>([])
const flashActive = ref(true)

const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval> | undefined

onLoad(() => {
  setTimeout(() => { list.value = goodsRepo.list(); loading.value = false }, 400)
  ticker = setInterval(() => { now.value = Date.now() }, 1000)
})
onUnload(() => { if (ticker) clearInterval(ticker) })
onPullDownRefresh(async () => { list.value = goodsRepo.list(); loading.value = false; uni.stopPullDownRefresh() })

const goSearch = () => uni.navigateTo({ url: '/pages/goods/list' })
const goList = (categoryId: string) => uni.navigateTo({ url: `/pages/goods/list?categoryId=${categoryId}` })
const goDetail = (id: string) => uni.navigateTo({ url: `/pages/goods/detail?id=${id}` })
const goCoupon = () => uni.navigateTo({ url: '/pages/coupon/center' })
const goFlash = () => uni.navigateTo({ url: '/pages/flash/index' })

const CATEGORY_ICONS: Record<string, string> = {
  c1: '📱', c2: '👕', c3: '🍜', c4: '💄', c5: '🏠', c6: '🏃',
}
interface NavItem { id: string; icon: string; label: string; action: () => void }
const navItems: NavItem[] = [
  ...categories.map(c => ({ id: c.id, icon: CATEGORY_ICONS[c.id] ?? '🛍️', label: c.name, action: () => goList(c.id) })),
  { id: 'coupon', icon: '🎫', label: '领券中心', action: goCoupon },
  { id: 'flash', icon: '⚡', label: '限时秒杀', action: goFlash },
]

const bannerList = banners.map(b => ({
  ...b,
  title: b.goodsId ? (goodsRepo.get(b.goodsId)?.name ?? '') : '',
}))

const flashThumb = goodsRepo.get(flashSales[0]?.goodsId ?? '')?.cover ?? ''

function countdown(): string {
  const nextHour = Math.ceil(now.value / 3600000) * 3600000
  const total = Math.max(0, Math.floor((nextHour - now.value) / 1000))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(total / 3600))}:${p(Math.floor((total % 3600) / 60))}:${p(total % 60)}`
}
</script>
<template>
  <view class="page">
    <view class="search" @tap="goSearch">
      <text class="search-icon">🔍</text>
      <text class="ph">搜索商品</text>
    </view>

    <swiper class="banner" autoplay circular indicator-dots>
      <swiper-item v-for="b in bannerList" :key="b.id" @tap="b.goodsId && goDetail(b.goodsId)">
        <view class="banner-slide">
          <image :src="b.image" mode="aspectFill" class="banner-img" />
          <view v-if="b.title" class="banner-caption">
            <text class="banner-tag">限时特惠</text>
            <text class="banner-name">{{ b.title }}</text>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <view class="nav-card">
      <view v-for="n in navItems" :key="n.id" class="nav-item" @tap="n.action">
        <view class="nav-icon"><text>{{ n.icon }}</text></view>
        <text class="nav-label">{{ n.label }}</text>
      </view>
    </view>

    <view v-if="flashActive" class="flash" @tap="goFlash">
      <view class="flash-left">
        <view class="flash-title">⚡ 限时秒杀</view>
        <view class="flash-sub">全场低至5折 · 距整点 {{ countdown() }}</view>
      </view>
      <view class="flash-right">
        <image class="flash-thumb" :src="flashThumb" mode="aspectFill" />
        <view class="flash-go">去抢购</view>
      </view>
    </view>

    <view class="section-t">
      <text class="bar" />
      <text class="title">为你推荐</text>
      <text class="more" @tap="goList('')">更多 ›</text>
    </view>

    <Skeleton v-if="loading" />
    <EmptyView v-else-if="!list.length" text="暂无商品" />
    <view v-else class="grid">
      <GoodsCard v-for="g in list" :key="g.id" :goods="g" @tap="goDetail" />
    </view>
  </view>
</template>
<style scoped lang="scss">
.page { padding: 16rpx; }

/* 搜索栏：品牌浅色圆角底 + 放大镜 */
.search {
  display: flex;
  align-items: center;
  background: $brand-soft;
  border-radius: 40rpx;
  padding: 20rpx 30rpx;
  margin-bottom: 16rpx;
}
.search-icon { margin-right: 12rpx; font-size: 26rpx; }
.ph { color: $text3; }

/* Banner 轮播：促销副文案浮层 + 品牌色指示点 */
.banner {
  height: 300rpx;
  border-radius: $radius;
  overflow: hidden;
  margin-bottom: 16rpx;
}
.banner-slide { position: relative; width: 100%; height: 100%; }
.banner-img { width: 100%; height: 100%; }
.banner-caption {
  position: absolute;
  left: 24rpx;
  bottom: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 70%;
}
.banner-tag {
  background: $price;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  margin-bottom: 10rpx;
}
.banner-name {
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
  padding: 6rpx 14rpx;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0));
  border-radius: 12rpx;
}
.banner :deep(.uni-swiper-dot) {
  width: 12rpx;
  height: 12rpx;
  border-radius: 6rpx;
  background: rgba(255, 255, 255, 0.6);
}
.banner :deep(.uni-swiper-dot-active) {
  width: 30rpx;
  background: $brand;
}

/* 金刚区：图标 + 文字宫格（2 行 × 4） */
.nav-card {
  background: $card;
  border-radius: $radius;
  padding: 28rpx 8rpx 8rpx;
  margin-bottom: 16rpx;
  display: flex;
  flex-wrap: wrap;
}
.nav-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24rpx;
}
.nav-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: $brand-soft;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  margin-bottom: 12rpx;
}
.nav-label { font-size: 22rpx; color: $text2; }

/* 秒杀条：红色渐变块 + 倒计时 + 商品缩略图 */
.flash {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  margin-bottom: 16rpx;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0) 45%), $price;
  border-radius: $radius;
  overflow: hidden;
}
.flash-left { display: flex; flex-direction: column; }
.flash-title { color: #fff; font-size: 32rpx; font-weight: 700; }
.flash-sub { color: rgba(255, 255, 255, 0.85); font-size: 22rpx; margin-top: 8rpx; }
.flash-right { display: flex; align-items: center; }
.flash-thumb {
  width: 88rpx;
  height: 88rpx;
  border-radius: 16rpx;
  background: #fff;
  margin-right: 16rpx;
}
.flash-go {
  background: #fff;
  color: $price;
  font-size: 24rpx;
  font-weight: 600;
  padding: 12rpx 24rpx;
  border-radius: 32rpx;
}

/* 分区标题：品牌竖条 + 加粗 + 右侧更多 */
.section-t {
  display: flex;
  align-items: center;
  margin: 28rpx 8rpx 20rpx;
}
.bar {
  width: 8rpx;
  height: 32rpx;
  border-radius: 4rpx;
  background: $brand;
  margin-right: 14rpx;
}
.title { font-size: 32rpx; font-weight: 700; color: $text; flex: 1; }
.more { color: $text3; font-size: 24rpx; }

/* 为你推荐网格 */
.grid { display: flex; flex-wrap: wrap; justify-content: space-between; }
.grid :deep(.goods) { width: 48.5%; margin-bottom: 16rpx; }
</style>
