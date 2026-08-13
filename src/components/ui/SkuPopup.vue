<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Goods, Sku, SpecGroup } from '../../models/goods'
import { findSku, isSkuComplete } from '../../services/sku.service'
import { formatPrice } from '../../utils/format'
import Stepper from './Stepper.vue'

const props = defineProps<{ goods: Goods; show: boolean }>()
const emit = defineEmits<{ (e: 'update:show', v: boolean): void; (e: 'confirm', sku: Sku, quantity: number): void }>()

const selectedAttrs = ref<Record<string, string>>({})
const quantity = ref(1)

// 每次打开重置选择，让用户逐维选取
watch(() => props.show, (s) => {
  if (s) { selectedAttrs.value = {}; quantity.value = 1 }
})

const currentSku = computed<Sku | null>(() => findSku(props.goods.skus, selectedAttrs.value) ?? null)
const complete = computed(() => isSkuComplete(props.goods.specs, selectedAttrs.value))
const missingDims = computed(() => props.goods.specs.filter(g => !selectedAttrs.value[g.name]).map(g => g.name))
const hasStock = computed(() => currentSku.value !== null && currentSku.value.stock > 0)
const canConfirm = computed(() => complete.value && hasStock.value)

/** 某个值在其它维度已选的前提下，凑齐全套对应 SKU 无货/缺失 → 置灰该 chip */
function isUnavailable(group: SpecGroup, value: string): boolean {
  if (props.goods.specs.length === 0) return false
  const trial: Record<string, string> = { ...selectedAttrs.value, [group.name]: value }
  if (!isSkuComplete(props.goods.specs, trial)) return false
  const sku = findSku(props.goods.skus, trial)
  return sku === undefined || sku.stock <= 0
}

function select(name: string, value: string): void {
  const group = props.goods.specs.find(g => g.name === name)
  if (!group || isUnavailable(group, value)) return
  // 已选该值时再次点击取消选中，便于修正选择
  selectedAttrs.value = selectedAttrs.value[name] === value
    ? Object.fromEntries(Object.entries(selectedAttrs.value).filter(([k]) => k !== name))
    : { ...selectedAttrs.value, [name]: value }
  quantity.value = 1
}

function confirm(): void {
  if (!canConfirm.value || !currentSku.value) return
  emit('confirm', currentSku.value, quantity.value)
}
const close = () => emit('update:show', false)
</script>
<template>
  <view v-if="show" class="mask" @tap="close">
    <view class="panel" @tap.stop>
      <view class="head">
        <image :src="goods.cover" class="thumb" mode="aspectFill" />
        <view class="head-info">
          <template v-if="complete && currentSku">
            <view class="price">{{ formatPrice(currentSku.price) }}</view>
            <view v-if="currentSku.stock > 0" class="stock">库存 {{ currentSku.stock }} 件</view>
            <view v-else class="stock out">该规格暂无库存</view>
          </template>
          <view v-else class="hint">{{ complete ? '该商品暂无规格' : `请选择：${missingDims.join(' / ')}` }}</view>
          <view class="title">{{ goods.name }}</view>
        </view>
        <view class="close" @tap="close">✕</view>
      </view>

      <scroll-view scroll-y class="body">
        <view v-for="group in goods.specs" :key="group.name" class="dim">
          <view class="dim-name">{{ group.name }}</view>
          <view class="chips">
            <view
              v-for="v in group.values"
              :key="v"
              class="chip"
              :class="{ on: selectedAttrs[group.name] === v, off: isUnavailable(group, v) }"
              @tap="select(group.name, v)"
            >{{ v }}</view>
          </view>
        </view>
      </scroll-view>

      <view class="row"><text>数量</text><Stepper v-model="quantity" :max="Math.max(currentSku?.stock ?? 1, 1)" /></view>
      <view class="actions">
        <view class="btn" @tap="close">取消</view>
        <view class="btn primary" :class="{ disabled: !canConfirm }" @tap="confirm">加入购物车</view>
      </view>
    </view>
  </view>
</template>
<style scoped lang="scss">
.mask {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 99;
  display: flex; align-items: flex-end;
  animation: fade-in 0.25s ease-out;
}
.panel {
  width: 100%; background: $card; border-radius: 32rpx 32rpx 0 0; padding: 32rpx 40rpx calc(32rpx + env(safe-area-inset-bottom));
  animation: slide-up 0.28s ease-out;
}
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-up { from { transform: translateY(40%); opacity: 0.5; } to { transform: translateY(0); opacity: 1; } }

.head { display: flex; align-items: flex-start; }
.thumb { width: 160rpx; height: 160rpx; border-radius: 16rpx; margin-right: 24rpx; flex-shrink: 0; background: $bg; }
.head-info { flex: 1; min-width: 0; }
.price { color: $price; font-weight: 700; font-size: 40rpx; }
.hint { color: $text2; font-size: 26rpx; margin: 8rpx 0 4rpx; }
.stock { color: $success; font-size: 24rpx; margin: 4rpx 0; }
.stock.out { color: $price; }
.title { font-size: 28rpx; font-weight: 600; color: $text; margin-top: 8rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.close {
  width: 56rpx; height: 56rpx; border-radius: 50%; background: $bg; color: $text3;
  text-align: center; line-height: 56rpx; font-size: 28rpx; flex-shrink: 0; margin-left: 16rpx;
}

.body { max-height: 420rpx; margin-top: 24rpx; }
.dim { margin-bottom: 24rpx; }
.dim-name { font-size: 26rpx; font-weight: 600; color: $text; margin-bottom: 16rpx; }
.chips { display: flex; flex-wrap: wrap; gap: 16rpx; }
.chip {
  padding: 14rpx 32rpx; border-radius: 12rpx; background: $bg; color: $text2; font-size: 26rpx;
  border: 2rpx solid transparent;
}
.chip.on { background: $brand-soft; color: $brand; border-color: $brand; font-weight: 600; }
.chip.off { color: $text3; text-decoration: line-through; }

.row { display: flex; justify-content: space-between; align-items: center; margin: 24rpx 0; }
.actions { display: flex; gap: 20rpx; }
.btn { flex: 1; text-align: center; padding: 22rpx 0; border-radius: $radius; border: 1rpx solid $line; color: $text2; font-size: 28rpx; }
.btn.primary { background: $brand; color: #fff; border: none; }
.btn.primary.disabled { background: $brand-soft; color: $text3; }
</style>
