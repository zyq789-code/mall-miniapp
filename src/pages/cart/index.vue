<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { onShow } from '@dcloudio/uni-app'
import { useCartStore } from '../../stores/cart'
import { goodsRepo } from '../../api/repository'
import { formatPrice } from '../../utils/format'
import { calcCheckedAmount, countChecked } from '../../services/cart.service'
import Stepper from '../../components/ui/Stepper.vue'
import EmptyView from '../../components/ui/EmptyView.vue'

const cart = useCartStore()
const { list } = storeToRefs(cart)
onShow(cart.sync)

const goodsOf = (goodsId: string) => goodsRepo.get(goodsId)
const skuPrice = (goodsId: string, skuId: string) => goodsOf(goodsId)?.skus.find(s => s.id === skuId)?.price ?? 0
const checkedAmount = computed(() => calcCheckedAmount(list.value, skuPrice))
const allChecked = computed(() => countChecked(list.value) === list.value.length && list.value.length > 0)
const onToggleAll = () => cart.toggleAll(!allChecked.value)
const onToggle = (gid: string, sid: string) => cart.toggle(gid, sid)
const onQty = (gid: string, sid: string, q: number) => cart.setQty(gid, sid, q)
const onRemove = (gid: string, sid: string) => cart.remove(gid, sid)
const checkout = () => {
  if (!countChecked(list.value)) return uni.showToast({ title: '请选择商品', icon: 'none' })
  uni.navigateTo({ url: '/pages/order/confirm' })
}
</script>
<template>
  <view class="page">
    <EmptyView v-if="!list.length" text="购物车还是空的" />
    <template v-else>
      <view v-for="it in list" :key="it.goodsId + it.skuId" class="item card">
        <view class="check" :class="{ on: it.checked }" @tap="onToggle(it.goodsId, it.skuId)">{{ it.checked ? '✓' : '' }}</view>
        <image :src="goodsOf(it.goodsId)?.cover" class="pic" mode="aspectFill" />
        <view class="mid">
          <view class="name">{{ goodsOf(it.goodsId)?.name }}</view>
          <view class="spec">{{ goodsOf(it.goodsId)?.skus.find(s => s.id === it.skuId)?.spec }}</view>
          <view class="row"><text class="price">{{ formatPrice(skuPrice(it.goodsId, it.skuId)) }}</text><Stepper :model-value="it.quantity" :max="goodsOf(it.goodsId)?.skus.find(s => s.id === it.skuId)?.stock || 99" @update:model-value="q => onQty(it.goodsId, it.skuId, q)" /></view>
        </view>
        <view class="del" @tap="onRemove(it.goodsId, it.skuId)">删除</view>
      </view>
      <view class="bar">
        <view class="check-all" :class="{ on: allChecked }" @tap="onToggleAll">✓ 全选</view>
        <view class="total">合计 {{ formatPrice(checkedAmount) }}</view>
        <view class="checkout" @tap="checkout">结算</view>
      </view>
    </template>
  </view>
</template>
<style scoped lang="scss">
.page { padding-bottom: 140rpx; }
.item { display: flex; align-items: center; padding: 20rpx; margin: 16rpx; }
.check { width: 44rpx; height: 44rpx; border-radius: 50%; border: 2rpx solid $text3; margin-right: 16rpx; text-align: center; line-height: 40rpx; color: #fff; }
.check.on { background: $brand; border-color: $brand; }
.pic { width: 160rpx; height: 160rpx; border-radius: 12rpx; }
.mid { flex: 1; margin-left: 16rpx; }
.name { font-size: 28rpx; }
.spec { color: $text3; font-size: 24rpx; margin: 8rpx 0; }
.row { display: flex; justify-content: space-between; align-items: center; }
.price { color: $price; font-weight: 700; }
.del { color: $text3; font-size: 24rpx; padding: 8rpx 0 8rpx 16rpx; }
.bar { position: fixed; bottom: 0; left: 0; right: 0; background: $card; display: flex; align-items: center; padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom)); }
.check-all.on { color: $brand; font-weight: 600; }
.checkout { background: $brand; color: #fff; padding: 20rpx 60rpx; border-radius: $radius; }
.total { flex: 1; text-align: right; margin-right: 20rpx; color: $price; font-weight: 700; }
</style>
