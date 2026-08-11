<script setup lang="ts">
const props = withDefaults(defineProps<{ modelValue: number; min?: number; max?: number }>(), { min: 1, max: 99 })
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()
const dec = () => { if (props.modelValue > props.min) emit('update:modelValue', props.modelValue - 1) }
const inc = () => { if (props.modelValue < props.max) emit('update:modelValue', props.modelValue + 1) }
</script>
<template>
  <view class="stepper">
    <view class="btn" @tap="dec">−</view>
    <text class="num">{{ modelValue }}</text>
    <view class="btn" @tap="inc">+</view>
  </view>
</template>
<style scoped lang="scss">
.stepper { display: flex; align-items: center; gap: 20rpx; }
.btn { width: 56rpx; height: 56rpx; border-radius: 12rpx; background: $brand-soft; color: $brand; text-align: center; line-height: 56rpx; }
.num { min-width: 60rpx; text-align: center; }
</style>
