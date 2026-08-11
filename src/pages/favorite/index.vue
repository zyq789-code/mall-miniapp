<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { Goods } from '../../models/goods'
import { goodsRepo } from '../../api/repository'
import { storage, KEYS } from '../../utils/storage'
import { formatPrice } from '../../utils/format'
import EmptyView from '../../components/ui/EmptyView.vue'

const list = ref<Goods[]>([])

function load(): void {
  const ids = storage.get<string[]>(KEYS.favorites, [])
  list.value = ids
    .map(id => goodsRepo.get(id))
    .filter((g): g is Goods => !!g)
}

onShow(load)

function onRemove(id: string): void {
  const next = storage.get<string[]>(KEYS.favorites, []).filter(x => x !== id)
  storage.set(KEYS.favorites, next)
  load()
  uni.showToast({ title: '已取消收藏', icon: 'none' })
}
const goDetail = (id: string) => uni.navigateTo({ url: `/pages/goods/detail?id=${id}` })
</script>
<template>
  <view class="page">
    <EmptyView v-if="!list.length" text="还没有收藏" />
    <view v-for="g in list" :key="g.id" class="card item">
      <image :src="g.cover" class="pic" mode="aspectFill" @tap="goDetail(g.id)" />
      <view class="mid" @tap="goDetail(g.id)">
        <view class="name">{{ g.name }}</view>
        <view class="sub">{{ g.subtitle }}</view>
        <view class="price">{{ formatPrice(g.price) }}</view>
      </view>
      <view class="heart on" @tap="onRemove(g.id)">♥</view>
    </view>
  </view>
</template>
<style scoped lang="scss">
.page {
  padding: 24rpx 0 40rpx;
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
.sub {
  color: $text3;
  font-size: 22rpx;
  margin: 8rpx 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.price {
  color: $price;
  font-weight: 700;
  font-size: 30rpx;
}
.heart {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: $brand-soft;
  color: $brand;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16rpx;
  flex-shrink: 0;
}
.heart.on {
  color: $price;
}
</style>
