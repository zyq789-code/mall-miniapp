<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import type { Address } from '../../models/order'
import { getAddresses, updateAddress, deleteAddress } from '../../api/address.api'
import { useUserStore } from '../../stores/user'
import EmptyView from '../../components/ui/EmptyView.vue'

const list = ref<Address[]>([])
const selectMode = ref(false)
const userStore = useUserStore()
const loggedIn = computed(() => userStore.isLogin())

const toastError = (e: unknown) => uni.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })

onLoad((q) => { selectMode.value = q?.select === '1' })
onShow(async () => {
  if (!loggedIn.value) { list.value = []; return }
  try {
    list.value = await getAddresses()
  } catch (e) {
    toastError(e)
    list.value = []
  }
})

function goEdit(id?: string) {
  uni.navigateTo({ url: id ? `/pages/address/edit?id=${id}` : '/pages/address/edit' })
}
const goLogin = () => uni.navigateTo({ url: '/pages/user/login' })

async function onTap(a: Address) {
  if (!selectMode.value) return goEdit(a.id)
  // 选择模式：把该地址设为默认（后端会清其他默认），然后回传确认订单页
  try {
    await updateAddress(a.id, { isDefault: true })
    uni.navigateBack()
  } catch (e) {
    toastError(e)
  }
}

function onDelete(a: Address) {
  uni.showModal({
    title: '提示',
    content: '确定删除该地址吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await deleteAddress(a.id)
        list.value = await getAddresses()
      } catch (e) {
        toastError(e)
      }
    },
  })
}
</script>
<template>
  <view class="page">
    <template v-if="!loggedIn">
      <EmptyView text="请先登录" />
      <view class="login-btn" @tap="goLogin">去登录</view>
    </template>
    <template v-else>
      <EmptyView v-if="!list.length" text="还没有收货地址" />
      <view v-for="a in list" :key="a.id" class="addr card" @tap="onTap(a)">
        <view class="row">
          <text class="name">{{ a.name }}</text>
          <text class="phone">{{ a.phone }}</text>
          <text v-if="a.isDefault" class="tag">默认</text>
          <text v-if="selectMode" class="pick">选择</text>
        </view>
        <view class="detail">{{ a.region }} {{ a.detail }}</view>
        <view class="actions">
          <view class="act" @tap.stop="goEdit(a.id)">编辑</view>
          <view class="act danger" @tap.stop="onDelete(a)">删除</view>
        </view>
      </view>
      <view class="btn" @tap="goEdit()">新增地址</view>
    </template>
  </view>
</template>
<style scoped lang="scss">
.page { padding: 24rpx; padding-bottom: 140rpx; }
.addr { position: relative; padding: 24rpx; margin-bottom: 16rpx; }
.row { display: flex; align-items: center; }
.name { font-size: 30rpx; font-weight: 600; color: $text; }
.phone { color: $text2; font-size: 26rpx; margin-left: 16rpx; }
.tag { margin-left: auto; background: $brand-soft; color: $brand; font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 20rpx; }
.pick { margin-left: auto; color: $brand; font-size: 24rpx; }
.detail { color: $text2; font-size: 26rpx; margin-top: 12rpx; }
.actions { display: flex; justify-content: flex-end; gap: 32rpx; margin-top: 16rpx; }
.act { color: $text3; font-size: 24rpx; }
.act.danger { color: $price; }
.login-btn { width: 320rpx; margin: 0 auto; background: $brand; color: #fff; text-align: center; padding: 24rpx 0; border-radius: $radius; font-size: 30rpx; }
.btn { position: fixed; bottom: 0; left: 0; right: 0; background: $brand; color: #fff; text-align: center; padding: 28rpx 0 calc(28rpx + env(safe-area-inset-bottom)); font-size: 32rpx; }
</style>
