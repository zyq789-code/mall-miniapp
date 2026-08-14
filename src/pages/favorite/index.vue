<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { Goods } from '../../models/goods'
import { goodsRepo } from '../../api/repository'
import { getFavorites, removeFavorite } from '../../api/userAssets.api'
import { useUserStore } from '../../stores/user'
import { formatPrice } from '../../utils/format'
import EmptyView from '../../components/ui/EmptyView.vue'

const list = ref<Goods[]>([])
const userStore = useUserStore()
const loggedIn = computed(() => userStore.isLogin())

async function load(): Promise<void> {
  if (!userStore.isLogin()) { list.value = []; return }
  const ids = await getFavorites()
  const goods = await Promise.all(ids.map(id => goodsRepo.get(id)))
  list.value = goods.filter((g): g is Goods => !!g)
}

onShow(async () => {
  try { await load() } catch { list.value = [] }
})

async function onRemove(id: string): Promise<void> {
  try {
    await removeFavorite(id)
    await load()
    uni.showToast({ title: '已取消收藏', icon: 'none' })
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
    <EmptyView v-else-if="!list.length" text="还没有收藏" />
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
.login-btn { width: 320rpx; margin: 0 auto; background: $brand; color: #fff; text-align: center; padding: 24rpx 0; border-radius: $radius; font-size: 30rpx; }
</style>
