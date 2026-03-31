# Nanobaba

一个部署在 VPS 上的私有中文生图站点，基于 Next.js、Gemini 代理接口和本地文件存储。

## 开发

1. 安装依赖：`npm install`
2. 复制环境变量：`cp .env.example .env`
3. 启动开发服务器：`npm run dev`

## 环境变量

- `APP_PASSWORD`: 登录密码
- `SESSION_SECRET`: 至少 32 字节的会话密钥
- `GEMINI_PROXY_BASE_URL`: Gemini 兼容代理地址
- `GEMINI_PROXY_API_KEY`: Gemini 兼容代理密钥
- `GEMINI_IMAGE_MODEL`: 生图模型名
- `DATABASE_URL`: SQLite 数据库路径，使用 `file:` 前缀
- `IMAGE_STORAGE_DIR`: 图片本地存储目录
