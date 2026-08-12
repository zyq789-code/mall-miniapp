<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Review } from '../../models/review'
import { goodsRepo } from '../../api/repository'
import { storage, KEYS } from '../../utils/storage'
import { formatTime } from '../../utils/format'
import EmptyView from '../../components/ui/EmptyView.vue'

const goodsId = ref('')
const list = ref<Review[]>([])
const goodsName = ref('')

onLoad(async (q) => {
  goodsId.value = typeof q?.goodsId === 'string' ? q?.goodsId : ''
  const g = await goodsRepo.get(goodsId.value)
  goodsName.value = g?.name ?? ''
  list.value = storage.get<Review[]>(KEYS.reviews, [])
    .filter(r => r.goodsId === goodsId.value)
    .sort((a, b) => b.time - a.time)
})

const starText = (s: number) => '★'.repeat(s) + '☆'.repeat(5 - s)
</script>
<template>
  <view class="page">
    <view v-if="goodsName" class="goods-name">{{ goodsName }}</view>
    <EmptyView v-if="!list.length" text="暂无评价" />
    <view v-for="r in list" :key="r.id" class="card">
      <view class="head">
        <view class="stars">{{ starText(r.stars) }}</view>
        <text class="who">{{ r.anonymous ? '匿名用户' : '用户' }}</text>
      </view>
      <view class="content">{{ r.content }}</view>
      <view class="time">{{ formatTime(r.time) }}</view>
    </view>
  </view>
</template>
<style scoped lang="scss">
.page { padding: 24rpx; padding-bottom: 40rpx; }
.goods-name { padding: 0 8rpx 16rpx; font-size: 28rpx; color: $text; }
.card { background: $card; border-radius: $radius; padding: 24rpx; margin-bottom: 16rpx; }
.head { display: flex; justify-content: space-between; align-items: center; }
.stars { color: $warn; font-size: 30rpx; }
.who { color: $text3; font-size: 24rpx; }
.content { font-size: 28rpx; color: $text; margin: 12rpx 0; line-height: 1.6; }
.time { color: $text3; font-size: 24rpx; }
</style>
