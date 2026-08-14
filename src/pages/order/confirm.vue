<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onShow } from '@dcloudio/uni-app'
import type { Goods } from '../../models/goods'
import type { OrderItem, Address } from '../../models/order'
import type { UserCoupon } from '../../models/coupon'
import { goodsRepo } from '../../api/repository'
import { getAddresses } from '../../api/address.api'
import { getCoupons, saveCoupons } from '../../api/coupon.api'
import { storage, KEYS } from '../../utils/storage'
import { formatPrice } from '../../utils/format'
import { useCartStore } from '../../stores/cart'
import { useOrderStore } from '../../stores/order'
import { useUserStore } from '../../stores/user'
import { calcCouponDiscount, getUsableCoupons } from '../../services/coupon.service'
import { calcPointsDeduction } from '../../services/points.service'
import { calcOrderAmounts, genOrderNo } from '../../services/order.service'

const cart = useCartStore()
const orderStore = useOrderStore()
const userStore = useUserStore()
const { list: cartList } = storeToRefs(cart)
const { member } = storeToRefs(userStore)

// 商品映射：onShow 时异步拉取已选结算商品，模板/computed 从 Map 同步取值
const goodsMap = ref<Record<string, Goods>>({})
async function loadGoods() {
  const ids = [...new Set(cartList.value.filter(i => i.checked).map(i => i.goodsId))]
  const rows = await Promise.all(ids.map(async (id) => [id, await goodsRepo.get(id)] as const))
  const map: Record<string, Goods> = {}
  rows.forEach(([id, g]) => { if (g) map[id] = g })
  goodsMap.value = map
}
const goodsOf = (id: string) => goodsMap.value[id]

const items = computed<OrderItem[]>(() =>
  cartList.value.filter(i => i.checked).map(i => {
    const g = goodsOf(i.goodsId)
    if (!g) return null
    const sku = g.skus.find(s => s.id === i.skuId)
    if (!sku) return null
    return { goodsId: g.id, skuId: sku.id, name: g.name, image: g.cover, spec: Object.values(sku.attrs).join(' / '), price: sku.price, quantity: i.quantity }
  }).filter((x): x is OrderItem => x !== null),
)
const userCoupons = ref<UserCoupon[]>([])
const selectedCoupon = ref('')
const usePoints = ref(true)
const points = computed(() => member.value.points)
const submitting = ref(false)
const addressList = ref<Address[]>([])
const address = computed<Address | undefined>(() => addressList.value.find(a => a.isDefault))

onShow(async () => {
  // 购物车从后端拉（未登录/token 失效则保持空，提交时再拦）
  try { await cart.sync() } catch { cart.clear() }
  userStore.fetchProfile()
  await loadGoods()
  // 收货地址从后端拉（按用户隔离）
  try { addressList.value = await getAddresses() } catch { addressList.value = [] }
  userCoupons.value = getCoupons()
  // 一次性回传：券列表选择后写入 selectedCoupon
  const sel = storage.get<string>(KEYS.selectedCoupon, '')
  if (sel) { selectedCoupon.value = sel; storage.remove(KEYS.selectedCoupon) }
})

const total = computed(() => items.value.reduce((s, i) => s + i.price * i.quantity, 0))
const categoryIds = computed(() => items.value.map(i => goodsOf(i.goodsId)?.categoryId ?? ''))
const usableCoupons = computed(() => getUsableCoupons(userCoupons.value, total.value, categoryIds.value, Date.now()))
const coupon = computed(() => usableCoupons.value.find(c => c.id === selectedCoupon.value) ?? null)
const couponDeduction = computed(() => (coupon.value ? calcCouponDiscount(coupon.value, total.value) : 0))
const pointsDeduction = computed(() => (usePoints.value ? calcPointsDeduction(points.value, total.value - couponDeduction.value) : 0))
const amounts = computed(() => calcOrderAmounts(items.value, couponDeduction.value, pointsDeduction.value))

interface SwitchChangeEvent { detail: { value: boolean } }
function onUsePoints(e: Event) { usePoints.value = (e as unknown as SwitchChangeEvent).detail.value }
const goAddress = () => uni.navigateTo({ url: '/pages/address/list?select=1' })
const goCoupon = () => uni.navigateTo({ url: '/pages/coupon/mine?select=1' })

async function submit() {
  if (submitting.value) return            // 防重复提交：狂点只产一单
  if (!userStore.isLogin()) return uni.showToast({ title: '请先登录', icon: 'none' })
  if (!address.value) return uni.showToast({ title: '请先添加地址', icon: 'none' })
  if (!items.value.length) return uni.showToast({ title: '没有要结算的商品', icon: 'none' })
  submitting.value = true
  const now = Date.now()
  const order = {
    id: `o${now}`, orderNo: genOrderNo(now), status: 'pending_pay' as const, items: items.value,
    totalAmount: amounts.value.totalAmount, couponDeduction: couponDeduction.value, pointsDeduction: pointsDeduction.value,
    freight: amounts.value.freight, payAmount: amounts.value.payAmount, address: address.value, createTime: now,
  }
  try {
    await orderStore.create(order)
    // 下单成功后才消费本地资源：用券标记已用
    const usedCoupon = coupon.value
    if (usedCoupon) {
      saveCoupons(getCoupons().map(c => (c.id === usedCoupon.id ? { ...c, status: 'used' as const } : c)))
    }
    // 扣积分（积分与分 1:1，pointsDeduction 单位分 = 消耗积分数量）。
    // 扣积分尚无后端接口，本地乐观扣减；待 U-C 把积分完整搬到后端后移除。
    if (pointsDeduction.value > 0) userStore.deductPoints(pointsDeduction.value)
    // 清后端购物车结算项（失败不阻断去支付）
    try { await cart.clearChecked() } catch { /* ignore */ }
    uni.redirectTo({
      url: `/pages/order/pay?id=${order.id}`,
      fail: () => { submitting.value = false },
    })
  } catch (e) {
    submitting.value = false
    uni.showToast({ title: e instanceof Error ? e.message : '提交订单失败', icon: 'none' })
  }
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
