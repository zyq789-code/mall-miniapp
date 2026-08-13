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
  /* 底部导航栏：显式 left/right:0 + 固定宽 + margin:auto 居中（对齐手机框）
     uni-app 的 tabbar 内外两层都是 position:fixed，两层都要处理 */
  .uni-tabbar-bottom,
  .uni-tabbar-top,
  .uni-tabbar-bottom .uni-tabbar,
  .uni-tabbar-top .uni-tabbar {
    left: 0 !important;
    right: 0 !important;
    width: 390px !important;
    margin: 0 auto !important;
  }
}
</style>
