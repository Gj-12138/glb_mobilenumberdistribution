# 云服务器 Docker 部署方案

目标：把本服务（Next.js + Prisma + SQLite）部署到腾讯云 `175.27.247.9`（OpenCloudOS Server 9，4C8G）。

## 0. 现状确认（已核实）

- 代码已推送 GitHub：`git@github.com:Gj-12138/glb_mobilenumberdistribution.git`，远端 `main` = `b7f635c`，本地与远端完全同步。
- 容器化四件套 `Dockerfile` / `docker-compose.yml` / `docker-entrypoint.sh` / `.dockerignore` 均已修正并在本地验证可用（本地部署 healthy，`admin/admin123` 登录成功）。
- 镜像基础为 `node:20`（本地拉不到 alpine 才改用，云端网络正常可改回 `node:20-alpine` 减小体积，见 Dockerfile 顶部三行）。

## 1. 服务器一次性准备：安装 Docker

```bash
# SSH 登录（用你已有的密钥/密码，如 root@175.27.247.9）
ssh root@175.27.247.9

# 安装依赖与 Docker（OpenCloudOS 9 兼容 RHEL 9 源）
dnf install -y yum-utils device-mapper-persistent-data lvm2 git
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker

# 验证
docker --version
docker compose version
```

> 若 `download.docker.com` 拉取慢，换腾讯云镜像源：
> ```bash
> dnf config-manager --add-repo https://mirrors.cloud.tencent.com/docker-ce/linux/centos/docker-ce.repo
> ```

## 2. 获取代码

```bash
cd /root
git clone https://github.com/Gj-12138/glb_mobilenumberdistribution.git
cd glb_mobilenumberdistribution
# 或 SSH 方式（需先在服务器配置 GitHub SSH key）：
# git clone git@github.com:Gj-12138/glb_mobilenumberdistribution.git
```

## 3. 构建并启动

```bash
docker compose up -d --build
docker ps --filter name=phone-data-app
docker logs -f phone-data-app   # 看到 [entrypoint] Seed data created. 与 Ready 即成功
```

首次启动自动完成：`prisma db push` 建表 + seed 初始账号（`admin/admin123`、`user01-03/123456`）+ 20 条演示数据。
数据持久化在卷 `phone-data-db`（容器内 `/data/custom.db`），以后更新代码不丢数据。

## 4. 腾讯云放行端口

控制台 → 云服务器 → 防火墙/安全组 → 添加入站规则：

- TCP `3000`，来源 `0.0.0.0/0`（先用 http 验证部署）
- 启用 HTTPS 时再加 TCP `80` / `443`

## 5. 访问

浏览器打开 `http://175.27.247.9:3000`，`admin/admin123` 登录。

## 6.（可选）域名 + HTTPS

前提：把域名的 A 记录解析到 `175.27.247.9`（DNSPod/腾讯云 DNS 控制台操作）。

在服务器项目目录创建 `Caddyfile.cloud`（把 `your-domain.com` 换成你的域名）：

```
your-domain.com {
	reverse_proxy 127.0.0.1:3000
}
```

启动 Caddy 容器（自动申请 Let's Encrypt 证书，HTTP 自动跳 HTTPS）：

```bash
docker run -d --name caddy --restart unless-stopped \
  -p 80:80 -p 443:443 \
  -v $PWD/Caddyfile.cloud:/etc/caddy/Caddyfile \
  -v caddy-data:/data -v caddy-config:/config \
  caddy:2
```

之后访问 `https://your-domain.com`。

> 本项目根目录的 `Caddyfile` 是本地开发用的（`:81` 动态端口转发），**不要**直接用于云端。

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

# 停止 / 重启
docker compose down        # 不带 -v，数据不丢
docker compose restart
```

## 8. 注意事项

- `db/custom.db`（本地开发数据库，含演示手机号）已被 git 追踪，clone 会带到服务器；容器使用独立卷 `/data` 不受影响。若仓库非私有，建议后续执行 `git rm --cached db/custom.db` 并提交（`.gitignore` 已有 `/db/` 规则）。
- 默认 `JWT_SECRET` 写在 `docker-compose.yml` 中，更换后需 `docker compose up -d` 重建，已登录用户需重新登录。
- 对外开放后建议尽快启用第 6 节 HTTPS。
