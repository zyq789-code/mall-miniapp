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

/* 桌面端：逼真手机框——手机宽度居中 + 黑色设备边框 + 桌面渐变背景 */
@media (min-width: 600px) {
  body {
    background: linear-gradient(135deg, #e2e6ec 0%, #b6bfcc 100%);
  }
  /* 手机屏幕外框 */
  #app {
    width: 390px;
    margin: 0 auto;
    min-height: 100vh;
    box-shadow: 0 0 0 10px #20242c, 0 24px 60px rgba(0, 0, 0, 0.35);
  }
  /* 底部导航栏：与手机框对齐居中（fixed 元素相对视口，需单独处理） */
  .uni-tabbar-bottom,
  .uni-tabbar-top {
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%);
    width: 390px !important;
  }
}
</style>
