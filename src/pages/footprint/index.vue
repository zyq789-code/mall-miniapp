<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { Goods, FootprintItem } from '../../models/goods'
import { goodsRepo } from '../../api/repository'
import { storage, KEYS } from '../../utils/storage'
import { formatPrice, formatTime } from '../../utils/format'
import EmptyView from '../../components/ui/EmptyView.vue'

interface Row { item: FootprintItem; goods: Goods }
const list = ref<Row[]>([])

function load(): void {
  const raw = storage.get<FootprintItem[]>(KEYS.footprints, [])
  list.value = [...raw]
    .sort((a, b) => b.time - a.time)
    .map(item => ({ item, goods: goodsRepo.get(item.goodsId) }))
    .filter((r): r is Row => !!r.goods)
}

onShow(load)

function onClear(): void {
  storage.set(KEYS.footprints, [])
  list.value = []
  uni.showToast({ title: '已清空', icon: 'none' })
}
const goDetail = (id: string) => uni.navigateTo({ url: `/pages/goods/detail?id=${id}` })
</script>
<template>
  <view class="page">
    <view class="bar">
      <text class="count">共 {{ list.length }} 条</text>
      <text v-if="list.length" class="clear" @tap="onClear">清空足迹</text>
    </view>
    <EmptyView v-if="!list.length" text="还没有浏览记录" />
    <view v-for="r in list" :key="r.item.goodsId" class="card item">
      <image :src="r.goods.cover" class="pic" mode="aspectFill" @tap="goDetail(r.goods.id)" />
      <view class="mid" @tap="goDetail(r.goods.id)">
        <view class="name">{{ r.goods.name }}</view>
        <view class="time">浏览于 {{ formatTime(r.item.time) }}</view>
        <view class="price">{{ formatPrice(r.goods.price) }}</view>
      </view>
    </view>
  </view>
</template>
<style scoped lang="scss">
.page {
  padding: 24rpx 0 40rpx;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx 16rpx;
}
.count {
  color: $text3;
  font-size: 24rpx;
}
.clear {
  color: $text2;
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border: 1rpx solid $line;
  border-radius: 28rpx;
}
.item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  margin: 0 24rpx 16rpx;
}
.pic {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background: #f5f5f7;
  flex-shrink: 0;
}
.mid {
  flex: 1;
  margin-left: 20rpx;
  overflow: hidden;
}
.name {
  font-size: 28rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.time {
  color: $text3;
  font-size: 22rpx;
  margin: 8rpx 0;
}
.price {
  color: $price;
  font-weight: 700;
  font-size: 30rpx;
}
</style>
