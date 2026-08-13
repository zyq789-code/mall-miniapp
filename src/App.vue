<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
onLaunch(() => {})
</script>
<style lang="scss">
page {
  background: $bg;
  color: $text;
  font-size: 28rpx;
}
.card {
  background: $card;
  border-radius: $radius;
}
.btn-primary {
  background: $brand;
  color: #fff;
  border-radius: $radius;
}

/* 桌面端：手机宽度居中显示，避免拉伸（模拟手机外框） */
@media (min-width: 600px) {
  #app {
    max-width: 540px;
    margin: 0 auto;
    min-height: 100vh;
    box-shadow: 0 0 40px rgba(31, 41, 55, 0.1);
    background: $card;
  }
  body {
    background: #eef1f5;
  }
  /* 底部导航栏同样限宽居中（fixed 元素不受 #app 约束，需单独处理）
     正确选择器是 .uni-tabbar-bottom / .uni-tabbar-top（position:fixed + left/right: var(--window-*)） */
  .uni-tabbar-bottom,
  .uni-tabbar-top {
    max-width: 540px;
    margin: 0 auto;
  }
}
</style>
