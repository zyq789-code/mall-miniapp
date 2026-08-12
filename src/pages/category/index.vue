<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Goods } from '../../models/goods'
import { categories } from '../../mock/goods'
import { goodsRepo } from '../../api/repository'
import { getFlashPrice } from '../../mock/flash'
import GoodsCard from '../../components/ui/GoodsCard.vue'
import EmptyView from '../../components/ui/EmptyView.vue'

const activeId = ref(categories[0]?.id ?? '')

const goods = computed<Goods[]>(() => goodsRepo.list({ categoryId: activeId.value }))

const goDetail = (id: string) => uni.navigateTo({ url: `/pages/goods/detail?id=${id}` })
</script>
<template>
  <view class="page">
    <scroll-view scroll-y class="side">
      <view
        v-for="c in categories"
        :key="c.id"
        class="cat"
        :class="{ active: c.id === activeId }"
        @tap="activeId = c.id"
      >{{ c.name }}</view>
    </scroll-view>
    <scroll-view scroll-y class="main">
      <view v-if="!goods.length" class="wrap"><EmptyView text="该分类暂无商品" /></view>
      <view v-else class="grid">
        <GoodsCard v-for="g in goods" :key="g.id" :goods="g" :sale-price="getFlashPrice(g.id)" @tap="goDetail" />
      </view>
    </scroll-view>
  </view>
</template>
<style scoped lang="scss">
.page {
  display: flex;
  height: 100vh;
}
.side {
  width: 180rpx;
  flex-shrink: 0;
  background: $bg;
}
.cat {
  padding: 30rpx 16rpx;
  font-size: 26rpx;
  color: $text2;
  border-left: 6rpx solid transparent;
}
.cat.active {
  color: $brand;
  font-weight: 600;
  background: $card;
  border-left-color: $brand;
}
.main {
  flex: 1;
  padding: 16rpx;
  box-sizing: border-box;
}
.wrap {
  padding-top: 120rpx;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.grid :deep(.goods) {
  width: 48.5%;
  margin-bottom: 16rpx;
}
</style>
