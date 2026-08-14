<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { Address } from '../../models/order'
import { getAddresses, createAddress, updateAddress } from '../../api/address.api'

interface SwitchChangeEvent { detail: { value: boolean } }

const form = ref<Address>({ id: '', name: '', phone: '', region: '', detail: '', isDefault: false })
const editingId = ref('')
const saving = ref(false)

onLoad(async (q) => {
  const id = q?.id
  editingId.value = typeof id === 'string' ? id : ''
  if (editingId.value) {
    try {
      const found = (await getAddresses()).find(a => a.id === editingId.value)
      if (found) form.value = { ...found }
    } catch {
      // 拉取失败则保持空白表单
    }
  }
})

const onDefault = (e: Event) => {
  const checked = (e as unknown as SwitchChangeEvent).detail.value
  form.value = { ...form.value, isDefault: checked }
}

async function save() {
  const f = form.value
  if (!f.name.trim()) return uni.showToast({ title: '请填写姓名', icon: 'none' })
  if (!/^\d{11}$/.test(f.phone.trim())) return uni.showToast({ title: '请填写11位手机号', icon: 'none' })
  if (!f.detail.trim()) return uni.showToast({ title: '请填写详细地址', icon: 'none' })
  if (saving.value) return
  saving.value = true
  try {
    const name = f.name.trim()
    const phone = f.phone.trim()
    const region = f.region.trim()
    const detail = f.detail.trim()
    if (editingId.value) {
      // 编辑时若取消唯一默认地址则强制保留默认，避免没有默认地址
      const list = await getAddresses()
      const original = list.find(a => a.id === editingId.value)
      const keepDefault = original?.isDefault && !f.isDefault && !list.some(a => a.id !== editingId.value && a.isDefault)
      const isDefault = keepDefault ? true : f.isDefault
      await updateAddress(editingId.value, { name, phone, region, detail, isDefault })
    } else {
      await createAddress({ name, phone, region, detail, isDefault: f.isDefault })
    }
    uni.navigateBack()
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
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
    <view class="btn" @tap="save">{{ saving ? '保存中…' : '保存' }}</view>
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
