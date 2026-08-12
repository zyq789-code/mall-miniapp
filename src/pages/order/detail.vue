<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Order } from '../../models/order'
import { goodsRepo } from '../../api/repository'
import { getOrder } from '../../api/order.api'
import { formatPrice, formatTime } from '../../utils/format'
import { useOrderStore } from '../../stores/order'
import EmptyView from '../../components/ui/EmptyView.vue'

// 商品封面映射：onLoad 时异步拉取订单涉及商品，模板从 Map 同步取值
const coverMap = ref<Record<string, string>>({})
async function loadCovers() {
  const o = order.value
  if (!o) return
  const ids = [...new Set(o.items.map(i => i.goodsId))]
  const rows = await Promise.all(ids.map(async (gid) => [gid, await goodsRepo.get(gid)] as const))
  const map: Record<string, string> = {}
  rows.forEach(([gid, g]) => { if (g) map[gid] = g.cover })
  coverMap.value = map
}

const STATUS_TEXT: Record<string, string> = {
  pending_pay: '待付款', pending_ship: '待发货', pending_receive: '待收货', completed: '已完成', canceled: '已取消',
}
const HINT_TEXT: Record<string, string> = {
  pending_pay: '等待买家付款', pending_ship: '付款成功，等待卖家发货', pending_receive: '卖家已发货，等待确认收货', completed: '交易已完成，感谢您的购买', canceled: '订单已取消',
}

const orderStore = useOrderStore()
const order = ref<Order | null>(null)
const id = ref('')

onLoad(async (q) => {
  id.value = typeof q?.id === 'string' ? q?.id : ''
  order.value = (await getOrder(id.value)) ?? null
  await loadCovers()
})
async function reload() { order.value = (await getOrder(id.value)) ?? null }
async function act(updater: (o: Order) => Promise<unknown>) {
  const o = order.value
  if (!o) return
  try {
    await updater(o)
    await reload()
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
  }
}
const onPay = () => uni.navigateTo({ url: `/pages/order/pay?id=${id.value}` })
const onCancel = () => act(o => orderStore.doCancel(o))
const onShip = () => act(o => orderStore.doShip(o))
const onReceive = () => act(o => orderStore.doReceive(o))
const goWriteReview = () => uni.navigateTo({ url: `/pages/review/write?orderId=${id.value}` })
const goApplyAfterSale = () => uni.navigateTo({ url: `/pages/aftersale/apply?orderId=${id.value}` })
const goLogistics = () => uni.navigateTo({ url: `/pages/logistics/index?orderId=${id.value}` })
</script>
<template>
  <view class="page">
    <template v-if="order">
      <view class="banner">
        <view class="status">{{ STATUS_TEXT[order.status] }}</view>
        <view class="hint">{{ HINT_TEXT[order.status] }}</view>
      </view>
      <view class="card row"><text>订单号</text><text>{{ order.orderNo }}</text></view>
      <view class="card addr">
        <view class="row"><text class="name">{{ order.address.name }}</text><text>{{ order.address.phone }}</text></view>
        <view class="detail">{{ order.address.region }} {{ order.address.detail }}</view>
      </view>
      <view class="card">
        <view v-for="it in order.items" :key="it.goodsId + it.skuId" class="item">
          <image :src="coverMap[it.goodsId] ?? it.image" class="pic" mode="aspectFill" />
          <view class="mid">
            <view class="name">{{ it.name }}</view>
            <view class="spec">{{ it.spec }}</view>
          </view>
          <view class="right">
            <view class="price">{{ formatPrice(it.price) }}</view>
            <view class="qty">×{{ it.quantity }}</view>
          </view>
        </view>
      </view>
      <view class="card amounts">
        <view><text>商品总额</text><text>{{ formatPrice(order.totalAmount) }}</text></view>
        <view v-if="order.couponDeduction"><text>优惠券 −</text><text>{{ formatPrice(order.couponDeduction) }}</text></view>
        <view v-if="order.pointsDeduction"><text>积分 −</text><text>{{ formatPrice(order.pointsDeduction) }}</text></view>
        <view><text>运费</text><text>{{ order.freight === 0 ? '免邮' : formatPrice(order.freight) }}</text></view>
        <view class="pay"><text>实付</text><text class="price">{{ formatPrice(order.payAmount) }}</text></view>
      </view>
      <view class="card times">
        <view><text>下单时间</text><text>{{ formatTime(order.createTime) }}</text></view>
        <view v-if="order.payTime"><text>支付时间</text><text>{{ formatTime(order.payTime) }}</text></view>
      </view>
      <view class="actions">
        <template v-if="order.status === 'pending_pay'">
          <view class="btn ghost" @tap="onCancel">取消订单</view>
          <view class="btn" @tap="onPay">去支付</view>
        </template>
        <view v-else-if="order.status === 'pending_ship'" class="btn" @tap="onShip">模拟发货</view>
        <view v-else-if="order.status === 'pending_receive'" class="btn" @tap="onReceive">确认收货</view>
        <template v-else-if="order.status === 'completed'">
          <view class="btn ghost" @tap="goWriteReview">写评价</view>
          <view class="btn ghost" @tap="goApplyAfterSale">申请售后</view>
          <view class="btn ghost" @tap="goLogistics">查看物流</view>
        </template>
      </view>
    </template>
    <EmptyView v-else text="订单不存在" />
  </view>
</template>
<style scoped lang="scss">
.page { padding: 24rpx; }
.banner { background: $brand; color: #fff; border-radius: $radius; padding: 40rpx 32rpx; margin-bottom: 16rpx; }
.banner .status { font-size: 40rpx; font-weight: 700; }
.banner .hint { font-size: 26rpx; opacity: .85; margin-top: 8rpx; }
.card { background: $card; border-radius: $radius; padding: 24rpx; margin-bottom: 16rpx; }
.row { display: flex; justify-content: space-between; color: $text2; font-size: 26rpx; }
.addr .name { color: $text; font-weight: 600; }
.addr .detail { color: $text3; font-size: 24rpx; margin-top: 8rpx; }
.item { display: flex; align-items: center; padding: 12rpx 0; }
.pic { width: 120rpx; height: 120rpx; border-radius: 12rpx; margin-right: 16rpx; }
.mid { flex: 1; }
.mid .name { font-size: 28rpx; }
.mid .spec { color: $text3; font-size: 24rpx; margin-top: 8rpx; }
.right { text-align: right; }
.right .price { color: $price; font-weight: 700; }
.right .qty { color: $text3; font-size: 24rpx; margin-top: 8rpx; }
.amounts view { display: flex; justify-content: space-between; color: $text2; font-size: 26rpx; margin: 10rpx 0; }
.amounts .pay { font-weight: 700; color: $text; }
.amounts .price { color: $price; }
.times view { display: flex; justify-content: space-between; color: $text2; font-size: 24rpx; margin: 8rpx 0; }
.actions { display: flex; justify-content: flex-end; gap: 16rpx; margin-top: 24rpx; }
.btn { background: $brand; color: #fff; padding: 16rpx 40rpx; border-radius: $radius; font-size: 28rpx; }
.btn.ghost { background: $card; color: $text2; border: 1rpx solid $line; }
</style>
