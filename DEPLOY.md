# 云服务器 Docker 部署方案（接入现有 nginx / /phone-data 子路径）

目标：把手机号管理服务（Next.js + Prisma + SQLite）部署到腾讯云 `175.27.247.9`，通过你服务器上**已装的系统 nginx（宿主机服务，非容器）**，以子路径 `https://weirunjob.cn/phone-data/` 对外提供。

## 0. 现状已确认（核实结论）

- 代码已推送 GitHub `git@github.com:Gj-12138/glb_mobilenumberdistribution.git`，远端 `main` 与本地一致。
- 代码已改造为子路径模式：
  - `next.config.ts`：`basePath: "/phone-data"` + `env.NEXT_PUBLIC_BASE_PATH = "/phone-data"`
  - `src/api/client.ts`：请求前缀 `${NEXT_PUBLIC_BASE_PATH || ""}/api`
  - 因此容器内所有路径都挂在 `/phone-data` 之下，`/` 不再是本应用。
- `docker-compose.yml`：端口已改为 `127.0.0.1:3000:3000`（**只本机监听，不暴露公网**）；healthcheck 指向 `/phone-data/`。
- 这些改动已在本地 docker 验证：容器内 `GET /phone-data/` → 200 HTML，`POST /phone-data/api/auth/login`（admin/admin123）→ 200 code:0，healthcheck healthy。

## 1. 服务器一次性准备：安装 Docker（若未装）

```bash
ssh root@175.27.247.9

# OpenCloudOS 9 兼容 RHEL 9 源
dnf install -y yum-utils device-mapper-persistent-data lvm2 git
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker
docker --version && docker compose version
```

> 拉取慢就换腾讯云镜像源：`dnf config-manager --add-repo https://mirrors.cloud.tencent.com/docker-ce/linux/centos/docker-ce.repo`

> 注意：你服务器上已有**系统级 nginx** 在跑（宿主机服务）。安装 Docker 不会动它；本服务独立容器 `phone-data-app`，互不冲突，只占本机端口 3000，nginx 反代进来即可。

## 2. 获取代码

```bash
cd /root
git clone --branch main https://github.com/Gj-12138/glb_mobilenumberdistribution.git
cd glb_mobilenumberdistribution
```

## 3. 构建并启动本服务容器

```bash
docker compose up -d --build
docker ps --filter name=phone-data-app
docker logs -f phone-data-app   # 看到 [entrypoint] Seed data created. 与 Ready 即成功
```

首次启动自动完成：`prisma db push` 建表 + seed 初始账号（`admin/admin123`、`user01-03/123456`）+ 20 条演示数据。
数据持久化在卷 `phone-data-db`（容器内 `/data/custom.db`）。

本机自检（应返回 HTTP 200）：
```bash
curl -s "http://127.0.0.1:3000/phone-data/" -o /dev/null -w "%{http_code}\n"
```

## 4. nginx（服务器系统级，非容器）加一个反代 location

你的 nginx 是装在服务器本机上的系统服务（不在 Docker 里）。就在你现有 HTTPS server 块里（即贴给我的那份 `/etc/nginx/conf.d/` 配置的 `server { listen 443 ssl; ... }`），在 `location /api/` 之后、`location /` （根路径）**之前**新增：

```nginx
# ==========================================
# 手机号管理服务 - 通过 /phone-data/ 访问
# 注意：必须放在 location / (根路径) 之前
# ==========================================
location /phone-data/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Port $server_port;
}
```

关键点：
- `proxy_pass http://127.0.0.1:3000;` 末**不带**路径，保留 `/phone-data/...` 完整 URI 原样转给后端（与后端 basePath 对应）。
- nginx 是宿主机上装的系统服务，`127.0.0.1:3000` 直接就指向宿主机本机的 3000 —— 也就是手机号服务的 Docker 容器映射出来的端口（`127.0.0.1:3000:3000`），可直接连通，无需任何额外网络配置。

先校验配置再重载 nginx：
```bash
nginx -t                          # 测试配置是否有误
systemctl reload nginx            # 或 nginx -s reload
```

## 5. 端口/安全组

- 3000 只在本机监听，**不需要**在腾讯云安全组开放 3000。
- 450 服务走 nginx 的 443（你已有证书 `weirunjob.cn`），无需新增。

## 6. 访问

浏览器打开 `https://weirunjob.cn/phone-data/`，用 `admin/admin123` 登录。
（不带尾斜杠的 `https://weirunjob.cn/phone-data` 会 308 自动补齐尾斜杠。）

## 7. 日常运维

```bash
# 状态 / 日志
docker ps --filter name=phone-data-app
docker logs -f phone-data-app

# 更新部署（拉新代码 + 重建）
cd /root/glb_mobilenumberdistribution
git pull
docker compose up -d --build

# 数据备份（卷里的 SQLite）
docker run --rm -v phone-data-db:/data -v $PWD:/backup \
  alpine tar czf /backup/custom-db-backup-$(date +%F).tar.gz -C /data custom.db

# 停止 / 重启（数据不丢）
docker compose down
docker compose restart
```

## 8. 注意事项

- `db/custom.db`（本地开发数据库，含演示手机号）已被 git 追踪，clone 会带到服务器；容器用独立卷 `/data` 不受影响。若仓库非私有，建议 `git rm --cached db/custom.db` 并提交（`.gitignore` 已有 `/db/` 规则）。
- 根目录 `Caddyfile` 是本地开发用（`:81`），与云端 nginx 无关。
- 默认 `JWT_SECRET` 在 `docker-compose.yml` 中，更换后重建并重新登录。
- 本地开发时访问路径也变成了 `http://localhost:3000/phone-data/`（basePath 全局生效）。
