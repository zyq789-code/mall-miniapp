<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { Goods, FootprintItem } from '../../models/goods'
import { goodsRepo } from '../../api/repository'
import { getFootprints, clearFootprints } from '../../api/userAssets.api'
import { useUserStore } from '../../stores/user'
import { formatPrice, formatTime } from '../../utils/format'
import EmptyView from '../../components/ui/EmptyView.vue'

interface Row { item: FootprintItem; goods: Goods }
const list = ref<Row[]>([])
const userStore = useUserStore()
const loggedIn = computed(() => userStore.isLogin())

async function load(): Promise<void> {
  if (!userStore.isLogin()) { list.value = []; return }
  const sorted = await getFootprints() // 后端已倒序 + 去重 + 限 50
  const goods = await Promise.all(sorted.map(item => goodsRepo.get(item.goodsId)))
  list.value = sorted
    .map((item, i) => ({ item, goods: goods[i] }))
    .filter((r): r is Row => !!r.goods)
}

onShow(async () => {
  try { await load() } catch { list.value = [] }
})

async function onClear(): Promise<void> {
  try {
    await clearFootprints()
    list.value = []
    uni.showToast({ title: '已清空', icon: 'none' })
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
  }
}
const goDetail = (id: string) => uni.navigateTo({ url: `/pages/goods/detail?id=${id}` })
const goLogin = () => uni.navigateTo({ url: '/pages/user/login' })
</script>
<template>
  <view class="page">
    <template v-if="!loggedIn">
      <EmptyView text="请先登录" />
      <view class="login-btn" @tap="goLogin">去登录</view>
    </template>
    <template v-else>
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
    </template>
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
.login-btn { width: 320rpx; margin: 0 auto; background: $brand; color: #fff; text-align: center; padding: 24rpx 0; border-radius: $radius; font-size: 30rpx; }
</style>
