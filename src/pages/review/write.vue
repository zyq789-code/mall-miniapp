<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Order } from '../../models/order'
import type { Review } from '../../models/review'
import { getOrder } from '../../api/order.api'
import { goodsRepo } from '../../api/repository'
import { storage, KEYS } from '../../utils/storage'
import { validateReview } from '../../services/review.service'
import EmptyView from '../../components/ui/EmptyView.vue'

interface SwitchChangeEvent { detail: { value: boolean } }

const orderId = ref('')
const goodsId = ref('')
const order = ref<Order | null>(null)
const stars = ref(0)
const content = ref('')
const anonymous = ref(false)
const duplicated = ref(false)

const goodsName = ref('')

onLoad(async (q) => {
  orderId.value = typeof q?.orderId === 'string' ? q?.orderId : ''
  goodsId.value = typeof q?.goodsId === 'string' ? q?.goodsId : ''
  order.value = (await getOrder(orderId.value)) ?? null
  if (!goodsId.value) goodsId.value = order.value?.items[0]?.goodsId ?? ''
  const g = await goodsRepo.get(goodsId.value)
  goodsName.value = g?.name ?? ''
  duplicated.value = storage.get<Review[]>(KEYS.reviews, []).some(r => r.orderId === orderId.value && r.goodsId === goodsId.value)
})

const onAnonymous = (e: Event) => {
  anonymous.value = (e as unknown as SwitchChangeEvent).detail.value
}

function submit() {
  if (duplicated.value) return uni.showToast({ title: '该商品已评价，不能重复评价', icon: 'none' })
  if (!stars.value) return uni.showToast({ title: '请选择星级', icon: 'none' })
  if (!content.value.trim()) return uni.showToast({ title: '请填写评价内容', icon: 'none' })
  const err = validateReview({ stars: stars.value, content: content.value })
  if (err) return uni.showToast({ title: err, icon: 'none' })
  const review: Review = {
    id: `r${Date.now()}`, orderId: orderId.value, goodsId: goodsId.value,
    stars: stars.value, content: content.value.trim(), anonymous: anonymous.value, time: Date.now(),
  }
  storage.set(KEYS.reviews, [...storage.get<Review[]>(KEYS.reviews, []), review])
  uni.showToast({ title: '评价成功', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 600)
}
</script>
<template>
  <view class="page">
    <EmptyView v-if="!order || !goodsId" text="订单不存在" />
    <template v-else>
      <view v-if="goodsName" class="goods-name">{{ goodsName }}</view>
      <view class="card">
        <view class="field">
          <text class="label">商品评分</text>
          <view class="stars">
            <text v-for="n in 5" :key="n" class="star" :class="{ on: n <= stars }" @tap="stars = n">★</text>
          </view>
        </view>
        <view class="field">
          <text class="label">评价内容</text>
          <textarea v-model="content" placeholder="分享您的使用体验" maxlength="500" />
        </view>
        <view class="field row">
          <text class="label">匿名评价</text>
          <switch :checked="anonymous" color="#1379ff" @change="onAnonymous" />
        </view>
      </view>
      <view v-if="duplicated" class="dup-tip">该商品已评价，不能重复评价</view>
      <view class="btn" :class="{ disabled: duplicated }" @tap="submit">提交评价</view>
    </template>
  </view>
</template>
<style scoped lang="scss">
.page { padding: 24rpx; padding-bottom: 160rpx; }
.goods-name { padding: 0 8rpx 16rpx; font-size: 28rpx; color: $text; }
.card { background: $card; border-radius: $radius; padding: 8rpx 24rpx; }
.field { padding: 24rpx 0; border-bottom: 1rpx solid $line; }
.field:last-child { border-bottom: none; }
.label { color: $text; font-size: 28rpx; display: block; margin-bottom: 16rpx; }
.field.row { display: flex; align-items: center; justify-content: space-between; }
.field.row .label { margin-bottom: 0; }
.stars { display: flex; gap: 16rpx; }
.star { font-size: 56rpx; color: $line; }
.star.on { color: $warn; }
.field textarea { width: 100%; min-height: 180rpx; font-size: 28rpx; }
.dup-tip { color: $warn; font-size: 26rpx; padding: 16rpx 8rpx; }
.btn { background: $brand; color: #fff; text-align: center; padding: 24rpx 0; border-radius: $radius; font-size: 32rpx; margin-top: 24rpx; }
.btn.disabled { background: $text3; }
</style>
