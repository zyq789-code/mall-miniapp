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

/* 修复 H5 端 tabBar 偏移：让页面在 uni-page-wrapper 内部滚动，窗口不滚动 */
html,
body,
uni-app,
#app {
  height: 100%;
  overflow: hidden;
}
uni-page-wrapper {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
/* 修复 uni-app H5 tabBar 定位偏差：把它的下边对齐视口底部 */
.uni-tabbar-bottom,
.uni-tabbar-top {
  bottom: 0 !important;
  top: auto !important;
}
</style>
