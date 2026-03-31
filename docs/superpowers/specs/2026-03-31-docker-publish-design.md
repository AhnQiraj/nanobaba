# Docker 镜像与 Git Tag 自动发布设计

## 1. 目标

为 `nanobaba` 增加生产可用的 Docker 镜像构建能力，并在 GitHub 上实现“推送 `v*` tag 时自动发布到 Docker Hub”。

本次设计目标：

- 提供生产可用的 `Dockerfile`
- 提供 `.dockerignore`
- 提供 `docker-compose.yml`，便于本地和服务器运行
- 提供 GitHub Actions workflow
- 仅在推送 `v*` tag 时触发发布
- 每次发布两个 Docker 标签：
  - `ahnqiraj/nanobanana:<git-tag>`
  - `ahnqiraj/nanobanana:latest`

不在本次范围内：

- 自动部署到 VPS
- 多架构镜像优化
- Helm / Kubernetes
- GitHub Release 自动生成说明

## 2. 约束与前提

当前项目特点：

- Next.js 16 应用
- 使用 `better-sqlite3`
- 图片保存在本地目录
- 通过 `.env` 注入运行配置

这意味着镜像设计必须满足：

- 使用兼容 `better-sqlite3` 的基础镜像
- 避免 `alpine` 带来的原生模块编译风险
- 数据库和图片目录通过宿主机卷持久化

推荐基础镜像：

- `node:22-bookworm-slim`

## 3. 镜像设计

采用多阶段构建：

### 3.1 Builder 阶段

职责：

- 安装完整依赖
- 拷贝源码
- 执行 `npm run build`

### 3.2 Runner 阶段

职责：

- 只保留运行时依赖
- 拷贝构建产物
- 通过 `npm run start` 启动

运行容器暴露端口：

- `3000`

运行时数据目录：

- `/app/data`

其中包括：

- `/app/data/app.db`
- `/app/data/images`

## 4. `docker-compose` 设计

`docker-compose.yml` 只做单服务部署，不额外引入数据库或反向代理容器。

服务设计：

- 构建来源：当前仓库根目录
- 容器端口：`3000`
- 宿主机端口：`3000`
- 使用 `.env`
- 挂载卷：
  - `./data:/app/data`

这样本地与服务器运行方式一致。

## 5. GitHub Actions 发布设计

workflow 触发条件：

- `push.tags: ['v*']`

发布目标：

- `ahnqiraj/nanobanana:${tag}`
- `ahnqiraj/nanobanana:latest`

GitHub Actions 依赖两个仓库 secrets：

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

发布流程：

1. checkout 代码
2. 登录 Docker Hub
3. 提取 tag 名
4. 构建镜像
5. 推送 `${tag}` 和 `latest`

普通 `master` push 不会触发发布。

## 6. README 更新

README 需要补充：

- 本地 Docker 构建方式
- 本地运行方式
- `docker compose up -d` 用法
- Docker Hub 发布方式
- 打 tag 发布说明：

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 7. 验收标准

完成后应满足：

- `docker build -t ahnqiraj/nanobanana:local .` 成功
- `docker compose up -d` 后服务可访问
- 容器内可写 `data/app.db` 与 `data/images`
- GitHub Actions 在 `v*` tag 下成功发布
- Docker Hub 上同时出现：
  - 版本 tag
  - `latest`

## 8. 风险与处理

### 8.1 `better-sqlite3` 原生模块问题

风险：

- 在轻量基础镜像中可能缺少原生依赖导致构建失败

处理：

- 使用 `node:22-bookworm-slim`

### 8.2 容器内路径与 `.env` 不一致

风险：

- 若 `DATABASE_URL` 和 `IMAGE_STORAGE_DIR` 使用了宿主路径，将导致容器内不可用

处理：

- README 和 compose 默认使用容器内路径语义
- 推荐：
  - `DATABASE_URL=file:./data/app.db`
  - `IMAGE_STORAGE_DIR=./data/images`

### 8.3 发布成功但运行失败

风险：

- CI 只验证构建，不代表容器启动一定正常

处理：

- 实现阶段增加本地容器启动验证

