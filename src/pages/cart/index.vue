<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onShow } from '@dcloudio/uni-app'
import type { Goods, Sku } from '../../models/goods'
import { useCartStore } from '../../stores/cart'
import { useUserStore } from '../../stores/user'
import { ApiError } from '../../api/request'
import { goodsRepo } from '../../api/repository'
import { formatPrice } from '../../utils/format'
import { calcCheckedAmount, countChecked } from '../../services/cart.service'
import Stepper from '../../components/ui/Stepper.vue'
import EmptyView from '../../components/ui/EmptyView.vue'

const cart = useCartStore()
const userStore = useUserStore()
const { list } = storeToRefs(cart)
const loggedIn = computed(() => userStore.isLogin())
const loading = ref(false)

const toastError = (e: unknown) => uni.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })

// 商品映射：onShow 时异步拉取购物车涉及的每个商品，模板从 Map 同步取值
const goodsMap = ref<Record<string, Goods>>({})
async function loadGoods() {
  const ids = [...new Set(list.value.map(i => i.goodsId))]
  const rows = await Promise.all(ids.map(async (id) => [id, await goodsRepo.get(id)] as const))
  const map: Record<string, Goods> = {}
  rows.forEach(([id, g]) => { if (g) map[id] = g })
  goodsMap.value = map
}

onShow(async () => {
  if (!loggedIn.value) { cart.clear(); goodsMap.value = {}; return }
  loading.value = true
  try {
    await cart.sync()
    await loadGoods()
  } catch (e) {
    // token 失效：退出登录并清空本地快照
    if (e instanceof ApiError && e.statusCode === 401) {
      userStore.logout()
      cart.clear()
    } else {
      toastError(e)
    }
  } finally {
    loading.value = false
  }
})

const goodsOf = (goodsId: string) => goodsMap.value[goodsId]
const skuOf = (goodsId: string, skuId: string) => goodsOf(goodsId)?.skus.find(s => s.id === skuId)
const skuPrice = (goodsId: string, skuId: string) => skuOf(goodsId, skuId)?.price ?? 0
const specText = (sku: Sku | undefined): string => (sku ? Object.values(sku.attrs).join(' / ') : '')
const checkedAmount = computed(() => calcCheckedAmount(list.value, skuPrice))
const allChecked = computed(() => countChecked(list.value) === list.value.length && list.value.length > 0)
const onToggleAll = async () => { try { await cart.toggleAll(!allChecked.value) } catch (e) { toastError(e) } }
const onToggle = async (gid: string, sid: string) => { try { await cart.toggle(gid, sid) } catch (e) { toastError(e) } }
const onQty = async (gid: string, sid: string, q: number) => { try { await cart.setQty(gid, sid, q) } catch (e) { toastError(e) } }
const onRemove = async (gid: string, sid: string) => { try { await cart.remove(gid, sid) } catch (e) { toastError(e) } }
const goLogin = () => uni.navigateTo({ url: '/pages/user/login' })
const checkout = () => {
  if (!countChecked(list.value)) return uni.showToast({ title: '请选择商品', icon: 'none' })
  uni.navigateTo({ url: '/pages/order/confirm' })
}
</script>
<template>
  <view class="page">
    <template v-if="!loggedIn">
      <EmptyView text="请先登录" />
      <view class="login-btn" @tap="goLogin">去登录</view>
    </template>
    <view v-else-if="loading" class="loading">加载中…</view>
    <template v-else>
      <EmptyView v-if="!list.length" text="购物车还是空的" />
      <template v-else>
        <view v-for="it in list" :key="it.goodsId + it.skuId" class="item card">
          <view class="check" :class="{ on: it.checked }" @tap="onToggle(it.goodsId, it.skuId)">{{ it.checked ? '✓' : '' }}</view>
          <image :src="goodsOf(it.goodsId)?.cover" class="pic" mode="aspectFill" />
          <view class="mid">
            <view class="name">{{ goodsOf(it.goodsId)?.name }}</view>
            <view class="spec">{{ specText(skuOf(it.goodsId, it.skuId)) }}</view>
            <view class="row"><text class="price">{{ formatPrice(skuPrice(it.goodsId, it.skuId)) }}</text><Stepper :model-value="it.quantity" :max="skuOf(it.goodsId, it.skuId)?.stock || 99" @update:model-value="q => onQty(it.goodsId, it.skuId, q)" /></view>
          </view>
          <view class="del" @tap="onRemove(it.goodsId, it.skuId)">删除</view>
        </view>
        <view class="bar">
          <view class="check-all" :class="{ on: allChecked }" @tap="onToggleAll">✓ 全选</view>
          <view class="total">合计 {{ formatPrice(checkedAmount) }}</view>
          <view class="checkout" @tap="checkout">结算</view>
        </view>
      </template>
    </template>
  </view>
</template>
<style scoped lang="scss">
.page { padding-bottom: 140rpx; }
.loading { padding: 120rpx 0; text-align: center; color: $text3; }
.login-btn { width: 320rpx; margin: 0 auto; background: $brand; color: #fff; text-align: center; padding: 24rpx 0; border-radius: $radius; font-size: 30rpx; }
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
