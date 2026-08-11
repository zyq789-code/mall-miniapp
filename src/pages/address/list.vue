<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import type { Address } from '../../models/order'
import { storage, KEYS } from '../../utils/storage'
import EmptyView from '../../components/ui/EmptyView.vue'

const list = ref<Address[]>([])
const selectMode = ref(false)

onLoad((q) => { selectMode.value = q?.select === '1' })
onShow(() => { list.value = storage.get<Address[]>(KEYS.addresses, []) })

function goEdit(id?: string) {
  uni.navigateTo({ url: id ? `/pages/address/edit?id=${id}` : '/pages/address/edit' })
}

function onTap(a: Address) {
  if (!selectMode.value) return goEdit(a.id)
  // 选择模式：设为默认并回传确认订单页
  const next = list.value.map(x => ({ ...x, isDefault: x.id === a.id }))
  storage.set(KEYS.addresses, next)
  uni.navigateBack()
}
</script>
<template>
  <view class="page">
    <EmptyView v-if="!list.length" text="还没有收货地址" />
    <view v-for="a in list" :key="a.id" class="addr card" @tap="onTap(a)">
      <view class="row">
        <text class="name">{{ a.name }}</text>
        <text class="phone">{{ a.phone }}</text>
        <text v-if="a.isDefault" class="tag">默认</text>
        <text v-if="selectMode" class="pick">选择</text>
      </view>
      <view class="detail">{{ a.region }} {{ a.detail }}</view>
      <view class="edit" @tap.stop="goEdit(a.id)">编辑</view>
    </view>
    <view class="btn" @tap="goEdit()">新增地址</view>
  </view>
</template>
<style scoped lang="scss">
.page { padding: 24rpx; padding-bottom: 140rpx; }
.addr { position: relative; padding: 24rpx; margin-bottom: 16rpx; }
.row { display: flex; align-items: center; }
.name { font-size: 30rpx; font-weight: 600; color: $text; }
.phone { color: $text2; font-size: 26rpx; margin-left: 16rpx; }
.tag { margin-left: auto; background: $brand-soft; color: $brand; font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 20rpx; }
.pick { margin-left: auto; color: $brand; font-size: 24rpx; }
.detail { color: $text2; font-size: 26rpx; margin-top: 12rpx; }
.edit { position: absolute; right: 24rpx; bottom: 20rpx; color: $text3; font-size: 24rpx; }
.btn { position: fixed; bottom: 0; left: 0; right: 0; background: $brand; color: #fff; text-align: center; padding: 28rpx 0 calc(28rpx + env(safe-area-inset-bottom)); font-size: 32rpx; }
</style>
