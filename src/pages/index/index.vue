<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import type { Goods } from '../../models/goods'
import { goodsRepo } from '../../api/repository'
import { banners, categories } from '../../mock/goods'
import GoodsCard from '../../components/ui/GoodsCard.vue'
import EmptyView from '../../components/ui/EmptyView.vue'

const loading = ref(true)
const list = ref<Goods[]>([])
const flashActive = ref(true)

onLoad(() => { setTimeout(() => { list.value = goodsRepo.list(); loading.value = false }, 400) })
onPullDownRefresh(async () => { list.value = goodsRepo.list(); loading.value = false; uni.stopPullDownRefresh() })

const goSearch = () => uni.navigateTo({ url: '/pages/goods/list' })
const goList = (categoryId: string) => uni.navigateTo({ url: `/pages/goods/list?categoryId=${categoryId}` })
const goDetail = (id: string) => uni.navigateTo({ url: `/pages/goods/detail?id=${id}` })
const goCoupon = () => uni.navigateTo({ url: '/pages/coupon/center' })
const goFlash = () => uni.navigateTo({ url: '/pages/flash/index' })
</script>
<template>
  <view class="page">
    <view class="search" @tap="goSearch"><text class="ph">🔍 搜索商品</text></view>
    <swiper class="banner" autoplay circular indicator-dots>
      <swiper-item v-for="b in banners" :key="b.id" @tap="b.goodsId && goDetail(b.goodsId)">
        <image :src="b.image" mode="aspectFill" class="banner-img" />
      </swiper-item>
    </swiper>
    <view class="chip-row">
      <view v-for="c in categories" :key="c.id" class="chip" @tap="goList(c.id)">
        <text>{{ c.name }}</text>
      </view>
      <view class="chip" @tap="goCoupon"><text>领券</text></view>
      <view class="chip" @tap="goFlash"><text>秒杀</text></view>
    </view>
    <view v-if="flashActive" class="card flash" @tap="goFlash">
      <text class="flash-t">⚡ 限时秒杀</text><text class="flash-go">去抢购 →</text>
    </view>
    <view class="section-t">为你推荐</view>
    <Skeleton v-if="loading" />
    <EmptyView v-else-if="!list.length" text="暂无商品" />
    <view v-else class="grid">
      <GoodsCard v-for="g in list" :key="g.id" :goods="g" @tap="goDetail" />
    </view>
  </view>
</template>
<style scoped lang="scss">
.page { padding: 16rpx; }
.search { background: $card; border-radius: 40rpx; padding: 18rpx 30rpx; margin-bottom: 16rpx; }
.ph { color: $text3; }
.banner { height: 300rpx; border-radius: $radius; overflow: hidden; margin-bottom: 16rpx; }
.banner-img { width: 100%; height: 100%; }
.chip-row { display: flex; gap: 20rpx; flex-wrap: wrap; margin-bottom: 16rpx; }
.chip { flex: 1; min-width: 120rpx; background: $card; border-radius: $radius; text-align: center; padding: 24rpx 0; }
.flash { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; margin-bottom: 16rpx; }
.flash-t { color: $price; font-weight: 700; }
.flash-go { color: $text3; }
.section-t { font-weight: 700; margin: 20rpx 8rpx; }
.grid { display: flex; flex-wrap: wrap; justify-content: space-between; }
.grid :deep(.goods) { width: 48.5%; margin-bottom: 16rpx; }
</style>
