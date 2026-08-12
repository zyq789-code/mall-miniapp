<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onHide, onShow, onUnload } from '@dcloudio/uni-app'
import type { Order } from '../../models/order'
import { goodsRepo } from '../../api/repository'
import { formatPrice, formatTime } from '../../utils/format'
import { isExpired, ORDER_TIMEOUT_MS } from '../../services/order.service'
import { useOrderStore } from '../../stores/order'
import OrderStatusTabs from '../../components/ui/OrderStatusTabs.vue'
import EmptyView from '../../components/ui/EmptyView.vue'
import Skeleton from '../../components/ui/Skeleton.vue'

const STATUS_TEXT: Record<string, string> = {
  pending_pay: '待付款', pending_ship: '待发货', pending_receive: '待收货', completed: '已完成', canceled: '已取消',
}
const TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending_pay', label: '待付款' },
  { key: 'pending_ship', label: '待发货' },
  { key: 'pending_receive', label: '待收货' },
  { key: 'completed', label: '已完成' },
]

const orderStore = useOrderStore()
const { orders } = storeToRefs(orderStore)
const active = ref('all')
const now = ref(Date.now())
const loading = ref(true)
let loadTimer: ReturnType<typeof setTimeout> | null = null
let timer: ReturnType<typeof setInterval> | null = null

// 商品封面映射：异步拉取订单首件商品，列表模板从 Map 同步取值
const coverMap = ref<Record<string, string>>({})
async function loadCovers() {
  const ids = [...new Set(orders.value.map(o => o.items[0]?.goodsId).filter((id): id is string => !!id))]
  const rows = await Promise.all(ids.map(async (gid) => [gid, await goodsRepo.get(gid)] as const))
  const map: Record<string, string> = {}
  rows.forEach(([gid, g]) => { if (g) map[gid] = g.cover })
  coverMap.value = map
}

const load = () => {
  loading.value = true
  if (loadTimer) clearTimeout(loadTimer)
  loadTimer = setTimeout(async () => {
    loadTimer = null
    await orderStore.sync()
    await loadCovers()
    loading.value = false
  }, 300)
}
const filtered = computed(() => (active.value === 'all' ? orders.value : orders.value.filter(o => o.status === active.value)))
const toastError = (e: unknown) => uni.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
const autoCancel = () => {
  const expired = orders.value.filter(o => isExpired(o, now.value))
  if (!expired.length) return
  expired.forEach(o => { void orderStore.doCancel(o).catch(toastError) })
}
const startTick = () => {
  if (timer) return
  timer = setInterval(() => {
    now.value = Date.now()
    autoCancel()
  }, 1000)
}
const stopTick = () => { if (timer) { clearInterval(timer); timer = null } }
onShow(() => { load(); startTick() })
onHide(stopTick)
onUnload(() => { stopTick(); if (loadTimer) { clearTimeout(loadTimer); loadTimer = null } })

const onTab = (key: string) => { active.value = key }
const totalCount = (o: Order) => o.items.reduce((s, i) => s + i.quantity, 0)
const remaining = (o: Order) => Math.max(0, o.createTime + ORDER_TIMEOUT_MS - now.value)
const mmss = (ms: number) => {
  const s = Math.ceil(ms / 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 60))}:${p(s % 60)}`
}
const coverOf = (o: Order) => coverMap.value[o.items[0]?.goodsId] ?? o.items[0]?.image ?? ''
const goDetail = (o: Order) => uni.navigateTo({ url: `/pages/order/detail?id=${o.id}` })
const goPay = (o: Order) => uni.navigateTo({ url: `/pages/order/pay?id=${o.id}` })

const onCancel = async (o: Order) => { try { await orderStore.doCancel(o) } catch (e) { toastError(e) } }
const onShip = async (o: Order) => { try { await orderStore.doShip(o) } catch (e) { toastError(e) } }
const onReceive = async (o: Order) => { try { await orderStore.doReceive(o) } catch (e) { toastError(e) } }
</script>
<template>
  <view class="page">
    <OrderStatusTabs :tabs="TABS" :active="active" @change="onTab" />
    <Skeleton v-if="loading" />
    <EmptyView v-else-if="!filtered.length" text="暂无订单" />
    <view v-for="o in filtered" :key="o.id" class="card" @tap="goDetail(o)">
      <view class="head">
        <text class="no">订单号 {{ o.orderNo }}</text>
        <text class="status">{{ STATUS_TEXT[o.status] }}</text>
      </view>
      <view class="body">
        <image :src="coverOf(o)" class="thumb" mode="aspectFill" />
        <view class="meta">
          <view class="count">共 {{ totalCount(o) }} 件</view>
          <view class="pay">实付 <text class="price">{{ formatPrice(o.payAmount) }}</text></view>
          <view v-if="o.status === 'pending_pay'" class="countdown">
            <text>剩 </text><text class="time">{{ mmss(remaining(o)) }}</text><text> 后自动取消</text>
          </view>
          <view class="time">{{ formatTime(o.createTime) }}</view>
        </view>
      </view>
      <view class="foot">
        <template v-if="o.status === 'pending_pay'">
          <view class="btn ghost" @tap.stop="onCancel(o)">取消订单</view>
          <view class="btn" @tap.stop="goPay(o)">去支付</view>
        </template>
        <view v-else-if="o.status === 'pending_ship'" class="btn" @tap.stop="onShip(o)">模拟发货</view>
        <view v-else-if="o.status === 'pending_receive'" class="btn" @tap.stop="onReceive(o)">确认收货</view>
      </view>
    </view>
  </view>
</template>
<style scoped lang="scss">
.page { padding-bottom: 40rpx; }
.card { background: $card; margin: 16rpx; border-radius: $radius; padding: 24rpx; }
.head { display: flex; justify-content: space-between; font-size: 24rpx; color: $text2; border-bottom: 1rpx solid $line; padding-bottom: 16rpx; }
.status { color: $brand; font-weight: 600; }
.body { display: flex; padding: 20rpx 0; }
.thumb { width: 140rpx; height: 140rpx; border-radius: 12rpx; margin-right: 20rpx; }
.meta { flex: 1; }
.count { color: $text2; font-size: 26rpx; }
.pay { margin: 8rpx 0; font-size: 26rpx; color: $text2; }
.price { color: $price; font-weight: 700; font-size: 30rpx; }
.countdown { font-size: 24rpx; color: $warn; }
.time { font-weight: 700; }
.foot { display: flex; justify-content: flex-end; gap: 16rpx; border-top: 1rpx solid $line; padding-top: 20rpx; }
.btn { background: $brand; color: #fff; padding: 14rpx 36rpx; border-radius: $radius; font-size: 26rpx; }
.btn.ghost { background: $card; color: $text2; border: 1rpx solid $line; }
</style>
