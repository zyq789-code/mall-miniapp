<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Goods } from '../../models/goods'
import { goodsRepo } from '../../api/repository'
import GoodsCard from '../../components/ui/GoodsCard.vue'
import EmptyView from '../../components/ui/EmptyView.vue'

type Sort = 'sales' | 'priceAsc' | 'priceDesc'
interface SortTab { key: Sort | ''; label: string }
const sortTabs: SortTab[] = [
  { key: '', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'priceAsc', label: '价格↑' },
  { key: 'priceDesc', label: '价格↓' },
]

const keyword = ref('')
const categoryId = ref('')
const input = ref('')
const sort = ref<Sort | ''>('')
const list = ref<Goods[]>([])
const isSearch = computed(() => keyword.value !== '')

onLoad((q) => {
  keyword.value = q?.keyword ?? ''
  categoryId.value = q?.categoryId ?? ''
  input.value = keyword.value
  load()
})

function load(): void {
  const s: Sort | undefined = sort.value === '' ? undefined : sort.value
  list.value = keyword.value
    ? goodsRepo.search(keyword.value)
    : goodsRepo.list({ categoryId: categoryId.value, sort: s })
}

function onSearch(): void {
  keyword.value = input.value.trim()
  categoryId.value = ''
  load()
}

function setSort(key: Sort | ''): void {
  if (isSearch.value) return
  sort.value = key
  load()
}

const goDetail = (id: string) => uni.navigateTo({ url: `/pages/goods/detail?id=${id}` })
</script>
<template>
  <view class="page">
    <view class="search-bar">
      <input
        v-model="input"
        class="search-input"
        placeholder="搜索商品"
        confirm-type="search"
        @confirm="onSearch"
      />
      <view class="search-btn" @tap="onSearch">搜索</view>
    </view>
    <view class="sort-bar">
      <view
        v-for="t in sortTabs"
        :key="t.label"
        class="sort-tab"
        :class="{ active: !isSearch && sort === t.key, disabled: isSearch }"
        @tap="setSort(t.key)"
      >{{ t.label }}</view>
    </view>
    <EmptyView v-if="!list.length" text="没有找到相关商品" />
    <view v-else class="grid">
      <GoodsCard v-for="g in list" :key="g.id" :goods="g" @tap="goDetail" />
    </view>
  </view>
</template>
<style scoped lang="scss">
.page {
  padding: 16rpx;
}
.search-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.search-input {
  flex: 1;
  background: $card;
  border-radius: 40rpx;
  padding: 16rpx 30rpx;
  font-size: 26rpx;
}
.search-btn {
  background: $brand;
  color: #fff;
  border-radius: 40rpx;
  padding: 14rpx 30rpx;
  font-size: 26rpx;
}
.sort-bar {
  display: flex;
  background: $card;
  border-radius: $radius;
  margin-bottom: 16rpx;
}
.sort-tab {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 26rpx;
  color: $text2;
}
.sort-tab.active {
  color: $brand;
  font-weight: 600;
}
.sort-tab.disabled {
  color: $text3;
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
