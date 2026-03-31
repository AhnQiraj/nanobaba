# Nanobaba

一个部署在 VPS 上的私有中文生图站点，基于 Next.js、Gemini 代理接口、本地文件存储和 SQLite 历史记录。

## Run locally

1. 复制环境变量：`cp .env.example .env`
2. 填写 `APP_PASSWORD`、`SESSION_SECRET`、`GEMINI_PROXY_BASE_URL`、`GEMINI_PROXY_API_KEY`、`GEMINI_IMAGE_MODEL`
3. 安装依赖：`npm install`
4. 启动开发服务器：`npm run dev`

## Verify

- 单元测试：`npm test`
- E2E 测试：`npm run test:e2e`
- 清理任务：`npm run cleanup`

## Environment variables

- `APP_PASSWORD`: 登录密码
- `SESSION_SECRET`: 至少 32 字节的会话密钥
- `GEMINI_PROXY_BASE_URL`: Gemini 兼容代理地址
- `GEMINI_PROXY_API_KEY`: Gemini 兼容代理密钥
- `GEMINI_IMAGE_MODEL`: 生图模型名
- `DATABASE_URL`: SQLite 数据库路径，使用 `file:` 前缀
- `IMAGE_STORAGE_DIR`: 图片本地存储目录

## Deploy on VPS

1. 安装 Node.js 22+ 和项目依赖：`npm install`
2. 构建应用：`npm run build`
3. 启动服务：`npm run start`
4. 使用 Nginx 或 Caddy 反向代理并启用 HTTPS
5. 用 `cron` 或 `systemd timer` 每天执行一次 `npm run cleanup`
