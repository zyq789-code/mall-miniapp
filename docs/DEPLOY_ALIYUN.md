# 阿里云部署指南（全栈版）

把后端 + 管理后台部署到阿里云轻量应用服务器，让微信体验版跑真数据。

## 路线图

| 步骤 | 内容 | 成本 | 周期 |
|---|---|---|---|
| 1 | 注册阿里云 + 实名认证 | 免费 | 当天 |
| 2 | 购买轻量应用服务器（2核2G） | ¥34-50/月 | 当天 |
| 3 | 购买域名（.cn） | ¥30-50/年 | 当天 |
| 4 | ICP 备案 | 免费 | 1-2 周 |
| 5 | SSH 连接 + 安装 Docker | 免费 | 半天 |
| 6 | 部署后端（Docker） | 免费 | 半天 |
| 7 | Nginx 反代 + HTTPS 证书 | 免费 | 半天 |
| 8 | 微信配置 request 合法域名 + 小程序改地址 | 免费 | 半天 |

---

## 步骤 1：阿里云账号

1. 打开 `https://www.aliyun.com` → 注册
2. 完成**实名认证**（支付宝/身份证，个人即可）
3. 控制台 → 右上角头像 → 确认已实名

## 步骤 2：购买轻量应用服务器

1. 搜索"**轻量应用服务器**" → 立即购买
2. 配置：
   - **地域**：选国内（如 华东1 杭州 / 华东2 上海）
   - **镜像**：选 **Ubuntu 22.04**（系统镜像）
   - **套餐**：2核2G（最便宜的够用，约 ¥34-50/月）
   - 时长：按月（先买 1 个月试跑）
3. 付款后，在"轻量服务器列表"里看到实例

## 步骤 3：购买域名

1. 阿里云搜索"**域名注册**" → 查询选一个便宜域名（如 `mallmymall.cn`）
2. 购买 + 实名（域名实名认证，1-2 天）
3. 记下域名

## 步骤 4：ICP 备案

> 微信 request 合法域名**必须备案**，这是绕不开的一步。

1. 阿里云控制台搜索"**ICP 备案**" → 开始备案
2. 用刚买的轻量服务器做备案服务器
3. 按引导填：网站名称、域名、负责人信息（个人实名）
4. 可能需要**人脸核验**；提交后等管局审核（1-2 周）
5. 备案通过后会收到通知，域名即可正式使用

## 步骤 5：连接服务器

1. 轻量服务器控制台 → 实例 → 点 **"远程连接"**（网页终端）或复制公网 IP
2. 本机 SSH（Git Bash 里）：
   ```bash
   ssh root@<你的公网IP>
   ```
   密码在轻量服务器控制台可以重置/查看

3. 安装 Docker：
   ```bash
   curl -fsSL https://get.docker.com | sh
   systemctl enable --now docker
   docker --version
   ```

## 步骤 6：部署后端（Docker）

在服务器上：
```bash
mkdir -p /opt/mall && cd /opt/mall
git clone https://github.com/zyq789-code/mall-miniapp.git .
cd server
# 建数据目录
mkdir -p /data/mall
# 构建 + 运行
docker build -t mall-server .
docker run -d --name mall-server \
  -p 3000:3000 \
  -e JWT_SECRET='<随机长字符串，必改>' \
  -e DB_PATH=/data/mall.db \
  -v /data/mall:/data \
  --restart unless-stopped \
  mall-server
# 验证
curl http://localhost:3000/api/health
curl http://localhost:3000/api/products
```

## 步骤 7：Nginx 反代 + HTTPS

用阿里云**免费 SSL 证书**（或 acme.sh/Let's Encrypt）：

1. 控制台 → 数字证书管理服务 → 免费证书 → 申请（绑定你的域名）
2. 按提示做 DNS 解析验证，下载 Nginx 证书（pem/key）
3. 安装 Nginx：
   ```bash
   apt install -y nginx
   ```
4. 配置 `/etc/nginx/sites-available/mall`：
   ```nginx
   server {
     listen 80;
     server_name api.你的域名.com;
     location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; }
   }
   ```
5. 上传证书到 `/etc/nginx/ssl/`，加 443 配置（HTTPS）
6. `nginx -t && systemctl enable --now nginx`

## 步骤 8：微信配置 + 小程序改地址

1. **微信后台**（mp.weixin.qq.com）→ 开发 → 开发管理 → 开发设置 → **服务器域名**
   - **request 合法域名**：填 `https://api.你的域名.com`
2. **小程序改后端地址**：`src/utils/config.ts`
   ```ts
   export const API_BASE_URL = 'https://api.你的域名.com/api'
   ```
3. 重新 `npm run build:mp-weixin` → 微信开发者工具上传 → 设体验版
4. 手机上扫码，商品/订单数据来自你的服务器 ✅

## 管理后台部署（可选）

管理后台（admin/）构建后是静态文件，可放到同一台服务器由 Nginx 托管：
```bash
cd admin && npm run build   # 产物 dist/
# 把 dist/ 拷到服务器 /var/www/mall-admin/，Nginx 加个 server 或 location 指向它
```
后台地址如 `https://admin.你的域名.com`，登录 admin/admin123。

## 常见问题

- **备案期间**：域名不能正常用，可以先直接用服务器 IP + 非 443 端口临时验证
- **SQLite 数据**：Docker 里挂了 `/data` 卷，重启/重建容器数据保留；备份直接拷 `mall.db`
- **换 JWT_SECRET**：改环境变量后 `docker rm -f mall-server && docker run ...` 重建
- **国内访问**：阿里云国内节点访问快；不用备案的 H5 演示可暂时用 IP 访问（浏览器会告警非 HTTPS）
