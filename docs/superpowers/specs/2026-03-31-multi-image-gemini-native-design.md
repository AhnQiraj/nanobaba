# 多图参考生图与 Gemini 原生接口设计

## 1. 目标

在现有私人生图站点基础上新增“上传最多 3 张参考图参与生成”的能力，并将后端请求从 OpenAI 兼容 `/v1/chat/completions` 切换到 Gemini 官方原生 `generateContent` 格式。

本次设计的明确目标：

- 首页输入区支持上传最多 `3` 张参考图
- 允许格式仅为 `jpg`、`png`、`webp`
- 单张大小限制为 `10MB`
- 参考图只参与当次生成，不入库、不存盘
- 后端改用 Gemini 原生接口组织请求体
- 不上传图片时，纯文字生图仍然可用

不在本次范围内：

- 参考图持久化存档
- 拖拽排序、多图裁剪、缩放编辑
- 单独的上传接口与临时文件管理
- 参考图在历史中回显

## 2. 已验证前提

已经对当前中转站做了直接验证：

- `GET /v1/models` 可用，说明现有 key 和代理地址有效
- `POST /v1beta/models/gemini-2.5-flash:generateContent` 可返回文本
- `POST /v1beta/models/gemini-3.1-flash-image:generateContent` 可返回 `inlineData` 图片

结论：

- 当前中转站支持 Gemini 官方原生 `generateContent` 格式
- 图像模型可通过 Gemini 原生格式直接生成图片

因此这次功能不再继续扩展 OpenAI 兼容格式，而是直接切换到 Gemini 原生请求格式。

## 3. 交互设计

首页提示词输入区扩展为以下结构：

- 一个提示词文本框
- 一个“上传参考图”按钮
- 一段限制说明：最多 3 张，支持 JPG/PNG/WebP
- 已选参考图缩略图区域
- 每张图右上角带删除按钮
- 生成按钮与清空按钮保持现有位置

交互规则：

- 用户可不上传图片，直接按原来的方式纯文字生成
- 用户上传图片后，前端立即显示缩略图预览
- 超过 3 张时，前端立即报错，不发送请求
- 不支持的格式或超出 10MB 时，前端立即报错
- 点击“清空”时，同时清空提示词和已选参考图
- 生成成功后，结果区与历史区照常刷新

## 4. 接口设计

### 4.1 `/api/generate`

`/api/generate` 从 JSON 请求改为 `multipart/form-data`。

字段：

- `prompt`: 字符串
- `referenceImages`: 0 到 3 个文件

服务端处理顺序：

1. 校验登录态
2. 从 `formData()` 读取 `prompt` 和文件列表
3. 校验提示词非空
4. 校验文件数量不超过 3
5. 校验 MIME 类型只允许 `image/jpeg`、`image/png`、`image/webp`
6. 校验单文件大小不超过 `10MB`
7. 把图片文件读成 `ArrayBuffer`
8. 转换为 Gemini `inline_data` 所需的 base64
9. 构造 Gemini 原生 `generateContent` 请求
10. 解析返回的 `inlineData` 图片结果
11. 将最终生成图保存到本地，并写入历史记录

### 4.2 历史接口

`/api/history` 和 `/api/history/[id]/image` 继续保持当前行为。

历史记录中只保留：

- 文字提示词
- 生成结果图片
- 生成时间
- 模型名
- 成功/失败状态

不会新增参考图字段。

## 5. Gemini 原生请求格式

后端不再向代理发送：

- `/v1/chat/completions`

而改为发送：

- `/v1beta/models/${model}:generateContent?key=${apiKey}`

请求头：

- `Content-Type: application/json`

请求体结构：

```json
{
  "contents": [
    {
      "parts": [
        { "text": "用户提示词" },
        {
          "inline_data": {
            "mime_type": "image/png",
            "data": "<base64>"
          }
        }
      ]
    }
  ]
}
```

多图时，`parts` 中追加多个 `inline_data` 项。

返回解析目标：

- `candidates[0].content.parts[*].inlineData` 或兼容变体字段

实现上应做好兼容：

- 优先解析 Gemini 原生 `inlineData`
- 若中转站回传字段大小写或下划线略有差异，集中在一个解析 helper 中处理

## 6. 模块边界

建议新增和调整的职责如下：

### 6.1 `lib/gemini-client.ts`

职责改为：

- 将文本与参考图组装成 Gemini 原生请求体
- 调用 Gemini 原生 `generateContent`
- 解析返回图片

建议拆分 helper：

- `fileToInlineData(file: FileLike)`
- `buildGenerateParts(prompt, referenceImages)`
- `parseGeneratedImage(responseJson)`

### 6.2 `app/api/generate/route.ts`

职责：

- 只处理鉴权、表单解析、校验、调用 client、落盘、写历史
- 不在路由里堆积 Gemini 请求细节

### 6.3 `components/prompt-composer.tsx`

职责：

- 维护提示词
- 维护已选图片列表
- 处理前端校验与上传 UI
- 用 `FormData` 发送请求

## 7. 校验与错误处理

前端错误：

- 超过 3 张：提示“最多上传 3 张参考图”
- 文件类型不支持：提示“仅支持 JPG、PNG、WebP”
- 单张超过 10MB：提示“单张图片不能超过 10MB”

后端错误：

- 未登录：`401`
- 缺少提示词：`400`
- 图片数量超限：`400`
- 格式不支持：`400`
- 文件过大：`400`
- Gemini 调用失败：`502`

后端返回给前端的错误信息应尽量可读，不暴露内部堆栈。

## 8. 测试策略

### 8.1 单元测试

新增测试覆盖：

- 图片文件转 Gemini `inline_data`
- 多图请求体拼装
- 数量/格式/大小校验
- Gemini 原生返回解析

### 8.2 E2E

新增或修改场景：

- 登录后上传 1 张图并生成
- 登录后上传 3 张图并生成
- 上传第 4 张图时前端报错
- 非法格式文件时报错
- 不上传图时，原本纯文字生图流程仍然通过

### 8.3 回归验证

完整验证仍包括：

- `npm test`
- `npm run test:e2e`
- `npm run build`

## 9. 远程开发约束

当前站点运行在云服务器上，通过远程 IP 访问 `next dev`。

Next.js 16 在开发模式下会拦截非本地主机来源的 dev 资源请求，因此需要在 `next.config.ts` 中配置：

- `allowedDevOrigins: ["115.191.25.14"]`

这不是业务功能的一部分，但属于当前开发环境可用性的必要配置，应该纳入代码库而不是只保留在临时运行状态。

## 10. 实施建议

推荐实施顺序：

1. 先写 Gemini 原生 client 的红灯单测
2. 再写前端上传校验相关 E2E 红灯用例
3. 最后改前端 `FormData` 提交和预览 UI

这样可以先稳定后端协议层，再处理交互层，避免前后端同时漂移。
