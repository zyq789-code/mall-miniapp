<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Address } from '../../models/order'
import { storage, KEYS } from '../../utils/storage'

interface SwitchChangeEvent { detail: { value: boolean } }

const form = ref<Address>({ id: '', name: '', phone: '', region: '', detail: '', isDefault: false })

onLoad((q) => {
  const id = q?.id
  if (id) {
    const found = storage.get<Address[]>(KEYS.addresses, []).find(a => a.id === id)
    if (found) form.value = { ...found }
  }
})

const onDefault = (e: Event) => {
  const checked = (e as unknown as SwitchChangeEvent).detail.value
  form.value = { ...form.value, isDefault: checked }
}

function save() {
  const f = form.value
  if (!f.name.trim()) return uni.showToast({ title: '请填写姓名', icon: 'none' })
  if (!/^\d{11}$/.test(f.phone.trim())) return uni.showToast({ title: '请填写11位手机号', icon: 'none' })
  if (!f.detail.trim()) return uni.showToast({ title: '请填写详细地址', icon: 'none' })
  const list = storage.get<Address[]>(KEYS.addresses, [])
  if (f.id) {
    const next = list.map(a => {
      if (a.id !== f.id) return f.isDefault ? { ...a, isDefault: false } : a
      return { ...f, phone: f.phone.trim(), region: f.region.trim(), detail: f.detail.trim() }
    })
    storage.set(KEYS.addresses, next)
  } else {
    const isDefault = list.length === 0 || f.isDefault
    const fresh: Address = {
      id: `a${Date.now()}`, name: f.name.trim(), phone: f.phone.trim(),
      region: f.region.trim(), detail: f.detail.trim(), isDefault,
    }
    const base = isDefault ? list.map(a => ({ ...a, isDefault: false })) : list
    storage.set(KEYS.addresses, [...base, fresh])
  }
  uni.navigateBack()
}
</script>
<template>
  <view class="page">
    <view class="card form">
      <view class="field"><text class="label">姓名</text><input v-model="form.name" placeholder="收货人姓名" /></view>
      <view class="field"><text class="label">手机号</text><input v-model="form.phone" type="number" maxlength="11" placeholder="11位手机号" /></view>
      <view class="field"><text class="label">省市区</text><input v-model="form.region" placeholder="省 市 区" /></view>
      <view class="field area"><text class="label">详细地址</text><textarea v-model="form.detail" placeholder="街道、楼牌号等" auto-height /></view>
      <view class="field"><text class="label">设为默认</text><switch :checked="form.isDefault" color="#1379ff" @change="onDefault" /></view>
    </view>
    <view class="btn" @tap="save">保存</view>
  </view>
</template>
<style scoped lang="scss">
.page { padding: 24rpx; padding-bottom: 140rpx; }
.form { padding: 8rpx 24rpx; }
.field { display: flex; align-items: center; padding: 24rpx 0; border-bottom: 1rpx solid $line; }
.field:last-child { border-bottom: none; }
.label { width: 160rpx; color: $text; font-size: 28rpx; }
.field input { flex: 1; font-size: 28rpx; }
.field.area { align-items: flex-start; }
.field textarea { flex: 1; min-height: 120rpx; font-size: 28rpx; width: 100%; }
.btn { position: fixed; bottom: 0; left: 0; right: 0; background: $brand; color: #fff; text-align: center; padding: 28rpx 0 calc(28rpx + env(safe-area-inset-bottom)); font-size: 32rpx; }
</style>
