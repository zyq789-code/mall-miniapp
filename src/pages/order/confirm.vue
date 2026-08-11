<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { OrderItem, Address } from '../../models/order'
import type { UserCoupon } from '../../models/coupon'
import type { Member } from '../../models/member'
import { goodsRepo } from '../../api/repository'
import { getCart, saveCart } from '../../api/cart.api'
import { getCoupons } from '../../api/coupon.api'
import { upsertOrder } from '../../api/order.api'
import { storage, KEYS } from '../../utils/storage'
import { formatPrice } from '../../utils/format'
import { calcCouponDiscount, getUsableCoupons } from '../../services/coupon.service'
import { calcPointsDeduction } from '../../services/points.service'
import { calcOrderAmounts, genOrderNo } from '../../services/order.service'

const items = ref<OrderItem[]>([])
const userCoupons = ref<UserCoupon[]>([])
const selectedCoupon = ref('')
const usePoints = ref(true)
const points = ref(0)
const submitting = ref(false)
const address = computed<Address | undefined>(() => storage.get<Address[]>(KEYS.addresses, []).find(a => a.isDefault))

onShow(() => {
  const cart = getCart().filter(i => i.checked)
  items.value = cart.map(i => {
    const g = goodsRepo.get(i.goodsId)
    if (!g) return null
    const sku = g.skus.find(s => s.id === i.skuId)
    if (!sku) return null
    return { goodsId: g.id, skuId: sku.id, name: g.name, image: g.cover, spec: sku.spec, price: sku.price, quantity: i.quantity }
  }).filter((x): x is OrderItem => x !== null)
  userCoupons.value = getCoupons()
  points.value = storage.get<Member | null>(KEYS.user, null)?.points ?? 0
})

const total = computed(() => items.value.reduce((s, i) => s + i.price * i.quantity, 0))
const categoryIds = computed(() => items.value.map(i => goodsRepo.get(i.goodsId)?.categoryId ?? ''))
const usableCoupons = computed(() => getUsableCoupons(userCoupons.value, total.value, categoryIds.value, Date.now()))
const coupon = computed(() => usableCoupons.value.find(c => c.id === selectedCoupon.value) ?? null)
const couponDeduction = computed(() => (coupon.value ? calcCouponDiscount(coupon.value, total.value) : 0))
const pointsDeduction = computed(() => (usePoints.value ? calcPointsDeduction(points.value, total.value - couponDeduction.value) : 0))
const amounts = computed(() => calcOrderAmounts(items.value, couponDeduction.value, pointsDeduction.value))

interface SwitchChangeEvent { detail: { value: boolean } }
function onUsePoints(e: Event) { usePoints.value = (e as unknown as SwitchChangeEvent).detail.value }
const goAddress = () => uni.navigateTo({ url: '/pages/address/list' })
const goCoupon = () => uni.navigateTo({ url: '/pages/coupon/mine?select=1' })

function submit() {
  if (submitting.value) return            // 防重复提交：狂点只产一单
  if (!address.value) return uni.showToast({ title: '请先添加地址', icon: 'none' })
  if (!items.value.length) return uni.showToast({ title: '没有要结算的商品', icon: 'none' })
  submitting.value = true
  const now = Date.now()
  const order = {
    id: `o${now}`, orderNo: genOrderNo(now), status: 'pending_pay' as const, items: items.value,
    totalAmount: amounts.value.totalAmount, couponDeduction: couponDeduction.value, pointsDeduction: pointsDeduction.value,
    freight: amounts.value.freight, payAmount: amounts.value.payAmount, address: address.value, createTime: now,
  }
  upsertOrder(order)
  saveCart(getCart().filter(x => !items.value.some(i => i.goodsId === x.goodsId && i.skuId === x.skuId)))
  uni.redirectTo({
    url: `/pages/order/pay?id=${order.id}`,
    fail: () => { submitting.value = false },
  })
}
</script>
<template>
  <view class="page">
    <view class="card addr" @tap="goAddress">
      <text v-if="address">{{ address.name }} {{ address.phone }}</text>
      <text v-else class="muted">请选择收货地址</text>
    </view>
    <view v-for="i in items" :key="i.goodsId + i.skuId" class="card item">
      <image :src="i.image" class="pic" mode="aspectFill" />
      <view class="mid"><view>{{ i.name }}</view><view class="spec">{{ i.spec }} × {{ i.quantity }}</view></view>
    </view>
    <view class="card row"><text>优惠券</text>
      <view class="link" @tap="goCoupon">
        {{ coupon ? coupon.name : (usableCoupons.length ? `${usableCoupons.length} 张可用` : '无可用券') }}
      </view>
    </view>
    <view class="card row"><text>积分抵扣（{{ points }}）</text><switch :checked="usePoints" @change="onUsePoints" /></view>
    <view class="card amounts">
      <view><text>商品总额</text><text>{{ formatPrice(total) }}</text></view>
      <view v-if="couponDeduction"><text>优惠券 −</text><text>{{ formatPrice(couponDeduction) }}</text></view>
      <view v-if="pointsDeduction"><text>积分 −</text><text>{{ formatPrice(pointsDeduction) }}</text></view>
      <view><text>运费</text><text>{{ amounts.freight === 0 ? '免邮' : formatPrice(amounts.freight) }}</text></view>
      <view class="pay"><text>实付</text><text class="price">{{ formatPrice(amounts.payAmount) }}</text></view>
    </view>
    <view class="submit" @tap="submit">提交订单</view>
  </view>
</template>
<style scoped lang="scss">
.addr { padding: 24rpx; margin: 16rpx; }
.muted { color: $text3; }
.item { display: flex; padding: 20rpx; margin: 16rpx; }
.pic { width: 120rpx; height: 120rpx; border-radius: 12rpx; margin-right: 16rpx; }
.spec { color: $text3; font-size: 24rpx; }
.row { display: flex; justify-content: space-between; padding: 24rpx; margin: 16rpx; }
.link { color: $brand; }
.amounts { padding: 24rpx; margin: 16rpx; }
.amounts view { display: flex; justify-content: space-between; margin: 8rpx 0; color: $text2; }
.pay { font-weight: 700; color: $text; }
.price { color: $price; }
.submit { background: $brand; color: #fff; text-align: center; padding: 24rpx; border-radius: $radius; margin: 24rpx 16rpx; }
</style>
