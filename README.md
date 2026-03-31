# Nanobaba

一个部署在 VPS 上的私有中文生图站点，基于 Next.js、Gemini 代理接口、本地文件存储和 SQLite 历史记录。

## Docker Deploy

推荐直接用 Docker 跑，容器内固定监听 `3000`，对外端口通过映射决定。

### 1. 最短启动命令

```bash
docker run -d \
  --name nanobaba \
  --restart unless-stopped \
  -p 8888:3000 \
  -v $(pwd)/data:/app/data \
  -e APP_PASSWORD='replace-with-your-password' \
  -e SESSION_SECRET='replace-with-32-byte-random-string' \
  -e GEMINI_PROXY_BASE_URL='https://mytoken.online' \
  -e GEMINI_PROXY_API_KEY='replace-with-your-api-key' \
  -e GEMINI_IMAGE_MODEL='gemini-3.1-flash-image' \
  -e DATABASE_URL='file:./data/app.db' \
  -e IMAGE_STORAGE_DIR='./data/images' \
  ahnqiraj/nanobanana:latest
```

启动后访问：

`http://<你的服务器IP>:8888/login`

### 2. 必填环境变量

- `APP_PASSWORD`: 登录密码
- `SESSION_SECRET`: 至少 32 字节的随机字符串
- `GEMINI_PROXY_BASE_URL`: Gemini 兼容代理地址
- `GEMINI_PROXY_API_KEY`: Gemini 兼容代理密钥
- `GEMINI_IMAGE_MODEL`: 生图模型名，默认可用 `gemini-3.1-flash-image`
